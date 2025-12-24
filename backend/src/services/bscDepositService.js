const { ethers } = require('ethers');

let provider;

function getProvider() {
  const rpcUrl = String(process.env.BSC_RPC_URL || '').trim();
  if (!rpcUrl) {
    const err = new Error('BSC_RPC_URL is not configured');
    err.code = 'BSC_RPC_URL_MISSING';
    throw err;
  }
  if (!provider) {
    provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  }
  return provider;
}

function getUsdtContract() {
  const address = String(process.env.BSC_USDT_CONTRACT || '0x55d398326f99059ff775485246999027b3197955').trim();
  if (!ethers.utils.isAddress(address)) {
    const err = new Error('BSC_USDT_CONTRACT is invalid');
    err.code = 'BSC_USDT_CONTRACT_INVALID';
    throw err;
  }
  return ethers.utils.getAddress(address);
}

function getTokenDecimals() {
  const raw = process.env.BSC_USDT_DECIMALS;
  const n = raw == null ? 18 : Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 18;
}

function getConfirmations() {
  const raw = process.env.BSC_DEPOSIT_CONFIRMATIONS;
  const n = raw == null ? 12 : Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 12;
}

function getMinScanIntervalMs() {
  const raw = process.env.BSC_DEPOSIT_MIN_SCAN_INTERVAL_SECONDS;
  const n = raw == null ? 60 : Number(raw);
  return (Number.isFinite(n) && n > 0 ? n : 60) * 1000;
}

function getMaxBlocksPerScan() {
  const raw = process.env.BSC_DEPOSIT_MAX_BLOCKS_PER_SCAN;
  const n = raw == null ? 2000 : Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.min(5000, Math.floor(n)) : 2000;
}

const scanState = {
  lastScanAtByUserId: new Map(),
};

async function getCursorKeyForAddress(address) {
  return `bsc_deposit_cursor_${String(address).toLowerCase()}`;
}

async function getAddressCursor({ SiteSetting, address }) {
  const key = await getCursorKeyForAddress(address);
  const row = await SiteSetting.findOne({ where: { key }, raw: true });
  const n = row?.value != null ? Number(row.value) : NaN;
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
}

async function setAddressCursor({ SiteSetting, address, blockNumber }) {
  const key = await getCursorKeyForAddress(address);
  const value = String(Math.max(0, Math.floor(blockNumber)));
  await SiteSetting.upsert({ key, value });
}

async function creditDepositEvent({
  sequelize,
  Wallet,
  Transaction,
  DepositRequest,
  ChainDepositEvent,
  userId,
  address,
  amount,
  txHash,
  logIndex,
  blockNumber,
  createdBy,
}) {
  const [event, created] = await ChainDepositEvent.findOrCreate({
    where: { tx_hash: txHash, log_index: logIndex },
    defaults: {
      chain: 'BSC',
      token: 'USDT',
      user_id: userId,
      address,
      amount,
      tx_hash: txHash,
      log_index: logIndex,
      block_number: blockNumber,
      credited: false,
      credited_at: null,
    },
  });

  if (!created && event.credited) {
    return { credited: false, reason: 'already_credited' };
  }

  await sequelize.transaction(async (t) => {
    const lockedEvent = await ChainDepositEvent.findOne({
      where: { tx_hash: txHash, log_index: logIndex },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!lockedEvent || lockedEvent.credited) {
      return;
    }

    let wallet = await Wallet.findOne({ where: { user_id: userId }, transaction: t, lock: t.LOCK.UPDATE });
    if (!wallet) {
      wallet = await Wallet.create({ user_id: userId, balance: 0 }, { transaction: t });
    }

    const creditAmount = Number(amount);
    wallet.balance = Number(wallet.balance || 0) + creditAmount;
    await wallet.save({ transaction: t });

    let matchedRequest = await DepositRequest.findOne({
      where: {
        user_id: userId,
        address,
        status: 'pending',
      },
      order: [[DepositRequest.sequelize.col('created_at'), 'ASC']],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (matchedRequest) {
      matchedRequest.amount = creditAmount;
      matchedRequest.status = 'approved';
      matchedRequest.tx_hash = matchedRequest.tx_hash || txHash;
      matchedRequest.admin_note = matchedRequest.admin_note || 'Auto-approved (BSC deposit detected)';
      await matchedRequest.save({ transaction: t });
    } else {
      matchedRequest = await DepositRequest.create(
        {
          user_id: userId,
          amount: creditAmount,
          address,
          status: 'approved',
          tx_hash: txHash,
          user_note: 'Auto-detected (BSC deposit)',
          admin_note: 'Auto-approved (BSC deposit detected)',
        },
        { transaction: t },
      );
    }

    await Transaction.create(
      {
        user_id: userId,
        type: 'deposit',
        amount: creditAmount,
        created_by: createdBy || 'system',
        note: `Auto deposit credited (BSC) tx=${txHash} (Request #${matchedRequest.id})`,
      },
      { transaction: t },
    );

    lockedEvent.user_id = userId;
    lockedEvent.address = address;
    lockedEvent.amount = creditAmount;
    lockedEvent.block_number = blockNumber;
    lockedEvent.credited = true;
    lockedEvent.credited_at = new Date();
    await lockedEvent.save({ transaction: t });
  });

  return { credited: true };
}

async function scanAndCreditUserUsdtDeposits({
  models,
  userId,
  address,
  reason,
  maxRounds,
}) {
  const { sequelize, SiteSetting, Wallet, Transaction, DepositRequest, ChainDepositEvent } = models;

  if (!userId || !address) return { scanned: false, reason: 'missing_params' };

  const last = scanState.lastScanAtByUserId.get(userId) || 0;
  const now = Date.now();
  if (now - last < getMinScanIntervalMs()) {
    return { scanned: false, reason: 'rate_limited' };
  }
  scanState.lastScanAtByUserId.set(userId, now);

  const provider = getProvider();
  const token = getUsdtContract();
  const decimals = getTokenDecimals();
  const confirmations = getConfirmations();
  const maxBlocks = getMaxBlocksPerScan();

  const normalizedTo = ethers.utils.getAddress(address);
  const topic0 = ethers.utils.id('Transfer(address,address,uint256)');
  const topicTo = ethers.utils.hexZeroPad(normalizedTo, 32);

  const latest = await provider.getBlockNumber();
  const safeToBlock = Math.max(0, latest - confirmations);

  let cursor = await getAddressCursor({ SiteSetting, address: normalizedTo });
  if (cursor == null) {
    cursor = Math.max(0, safeToBlock - maxBlocks);
  }

  let fromBlock = Math.max(0, cursor + 1);
  if (fromBlock > safeToBlock) {
    await setAddressCursor({ SiteSetting, address: normalizedTo, blockNumber: safeToBlock });
    return { scanned: true, credited: 0, reason: 'up_to_date' };
  }

  const rounds = Number.isFinite(maxRounds) && maxRounds > 0 ? Math.floor(maxRounds) : 1;
  let creditedCount = 0;
  let currentFrom = fromBlock;

  for (let i = 0; i < rounds; i++) {
    const currentTo = Math.min(safeToBlock, currentFrom + maxBlocks - 1);

    const logs = await provider.getLogs({
      address: token,
      fromBlock: currentFrom,
      toBlock: currentTo,
      topics: [topic0, null, topicTo],
    });

    for (const log of logs) {
      const txHash = log.transactionHash;
      const logIndex = log.logIndex;
      const blockNumber = log.blockNumber;

      let parsed;
      try {
        parsed = ethers.utils.defaultAbiCoder.decode(['uint256'], log.data);
      } catch {
        continue;
      }

      const rawValue = parsed?.[0];
      if (rawValue == null) continue;

      const amt = Number(ethers.utils.formatUnits(rawValue, decimals));
      if (!Number.isFinite(amt) || amt <= 0) continue;

      const res = await creditDepositEvent({
        sequelize,
        Wallet,
        Transaction,
        DepositRequest,
        ChainDepositEvent,
        userId,
        address: normalizedTo,
        amount: Number(amt.toFixed(8)),
        txHash,
        logIndex,
        blockNumber,
        createdBy: 'system',
      });

      if (res.credited) creditedCount += 1;
    }

    await setAddressCursor({ SiteSetting, address: normalizedTo, blockNumber: currentTo });

    if (currentTo >= safeToBlock) break;
    currentFrom = currentTo + 1;
  }

  return { scanned: true, credited: creditedCount, reason: reason || 'manual' };
}

function startBscDepositScannerScheduler({ models }) {
  const disabled = String(process.env.DISABLE_SCHEDULERS || '').toLowerCase() === 'true';
  if (disabled) return;

  const scheduleNext = () => {
    const now = new Date();
    const target = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 18, 0, 0, 0));
    const isAfterTargetToday = now.getTime() >= target.getTime();
    if (isAfterTargetToday) {
      target.setUTCDate(target.getUTCDate() + 1);
    }

    const delayMs = Math.max(0, target.getTime() - now.getTime());

    setTimeout(async () => {
      try {
        const pending = await models.DepositRequest.findAll({
          where: { status: 'pending' },
          raw: true,
          attributes: ['user_id', 'address'],
        });

        const unique = new Map();
        for (const p of pending) {
          const uid = Number(p.user_id);
          const addr = String(p.address || '').trim();
          if (!uid || !addr) continue;
          unique.set(`${uid}:${addr.toLowerCase()}`, { userId: uid, address: addr });
        }

        for (const item of unique.values()) {
          try {
            await scanAndCreditUserUsdtDeposits({ models, userId: item.userId, address: item.address, reason: 'daily_job', maxRounds: 10 });
          } catch (e) {
            console.error('BSC deposit scan failed for user', item.userId, e?.message || e);
          }
        }
      } catch (e) {
        console.error('BSC deposit daily job failed:', e?.message || e);
      } finally {
        scheduleNext();
      }
    }, delayMs);
  };

  scheduleNext();
}

module.exports = {
  scanAndCreditUserUsdtDeposits,
  startBscDepositScannerScheduler,
};
