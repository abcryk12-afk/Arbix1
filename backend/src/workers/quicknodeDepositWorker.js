const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env'), override: true });

const { ethers } = require('ethers');
const { Op } = require('sequelize');

const models = require('../models');

const {
  sequelize,
  User,
  Wallet,
  Transaction,
  DepositRequest,
  ChainDepositEvent,
  SiteSetting,
} = models;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isDebugEnabled() {
  return ['1', 'true', 'yes', 'on'].includes(String(process.env.QUICKNODE_DEBUG || '').trim().toLowerCase());
}

function safeRpcHost() {
  try {
    const u = new URL(String(process.env.BSC_RPC_URL || '').trim());
    return u.host;
  } catch {
    return null;
  }
}

function getBscProvider() {
  const url = String(process.env.BSC_RPC_URL || '').trim();
  if (!url) {
    const err = new Error('BSC_RPC_URL is not configured');
    err.code = 'BSC_RPC_URL_MISSING';
    throw err;
  }
  return new ethers.providers.JsonRpcProvider(url);
}

function getUsdtContractAddress() {
  const raw = String(
    process.env.USDT_BSC_ADDRESS ||
      process.env.BSC_USDT_CONTRACT ||
      '0x55d398326f99059ff775485246999027b3197955',
  ).trim();
  if (!ethers.utils.isAddress(raw)) {
    const err = new Error('USDT contract address is invalid');
    err.code = 'USDT_CONTRACT_INVALID';
    throw err;
  }
  return ethers.utils.getAddress(raw);
}

function getTokenDecimals() {
  const raw = process.env.BSC_USDT_DECIMALS;
  const n = raw == null ? 18 : Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 18;
}

async function getSettingInt(key, defaultValue = 0) {
  try {
    await SiteSetting.sync();
  } catch {}

  const row = await SiteSetting.findOne({ where: { key }, raw: true });
  const raw = row?.value;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.floor(n) : defaultValue;
}

async function setSettingInt(key, value) {
  const v = String(Math.floor(Number(value) || 0));
  await SiteSetting.upsert({ key, value: v });
}

async function loadUserAddressBatch() {
  const limit = Math.min(Math.max(Number(process.env.QUICKNODE_USER_SCAN_LIMIT || 200), 1), 1000);
  const checkpointKey = 'quicknode_last_user_id';

  let lastId = await getSettingInt(checkpointKey, 0);

  let users = await User.findAll({
    where: {
      id: { [Op.gt]: lastId },
      wallet_public_address: { [Op.ne]: null },
    },
    attributes: ['id', 'wallet_public_address'],
    order: [['id', 'ASC']],
    limit,
    raw: true,
  });

  if (!users.length) {
    lastId = 0;
    users = await User.findAll({
      where: {
        id: { [Op.gt]: 0 },
        wallet_public_address: { [Op.ne]: null },
      },
      attributes: ['id', 'wallet_public_address'],
      order: [['id', 'ASC']],
      limit,
      raw: true,
    });
  }

  if (!users.length) {
    await setSettingInt(checkpointKey, 0);
    return { users: [], maxId: 0 };
  }

  const maxId = Math.max(...users.map((u) => Number(u.id || 0)).filter((n) => Number.isFinite(n) && n > 0));
  if (Number.isFinite(maxId) && maxId > 0) {
    await setSettingInt(checkpointKey, maxId);
  }

  return { users, maxId };
}

async function attachTxHashToLatestPendingDepositRequest({ userId, addressLower, txHash }) {
  if (!userId || !addressLower || !txHash) return;

  try {
    const request = await DepositRequest.findOne({
      where: {
        user_id: userId,
        status: 'pending',
        tx_hash: { [Op.is]: null },
        [Op.and]: [
          sequelize.where(
            sequelize.fn('LOWER', sequelize.col('address')),
            addressLower,
          ),
        ],
      },
      order: [[DepositRequest.sequelize.col('created_at'), 'DESC']],
    });

    if (!request) return;
    request.tx_hash = txHash;
    await request.save();
  } catch (e) {
    console.error('Failed to attach tx hash to deposit request:', e);
  }
}

function formatTokenAmount({ value, decimals }) {
  try {
    const bn = ethers.BigNumber.from(String(value));
    const d = Number(decimals);
    if (!Number.isFinite(d) || d < 0 || d > 77) return null;
    const s = ethers.utils.formatUnits(bn, d);
    const n = Number(s);
    if (!Number.isFinite(n)) return null;
    return Number(n.toFixed(8));
  } catch {
    return null;
  }
}

async function scanPendingDepositAddresses({ provider }) {
  const confirmations = Number(process.env.DEPOSIT_CONFIRMATIONS || 12);
  const minDeposit = Number(process.env.MIN_DEPOSIT_USDT || 9);
  const maxBlocksPerScan = Math.min(Math.max(Number(process.env.QUICKNODE_MAX_BLOCKS_PER_SCAN || 2000), 100), 20000);
  const lookback = Math.min(Math.max(Number(process.env.QUICKNODE_LOOKBACK_BLOCKS || 20000), 1000), 500000);

  const usdt = getUsdtContractAddress();
  const decimals = getTokenDecimals();

  const latest = await provider.getBlockNumber();
  const safeToBlock = Math.max(0, latest - confirmations);
  const scanToBlock = Math.max(0, latest);

  const debug = isDebugEnabled();
  if (debug) {
    console.log('[quicknode] scan start', {
      rpcHost: safeRpcHost(),
      latest,
      scanToBlock,
      safeToBlock,
      confirmations,
      minDeposit,
      maxBlocksPerScan,
      lookback,
    });
  }

  const pending = await DepositRequest.findAll({
    where: { status: 'pending' },
    raw: true,
    attributes: ['id', 'user_id', 'address', 'tx_hash'],
    order: [[sequelize.col('created_at'), 'DESC']],
    limit: 500,
  });

  const userBatch = await loadUserAddressBatch();

  const unique = new Map();
  for (const p of pending) {
    const userId = Number(p.user_id);
    const address = String(p.address || '').trim();
    const addrLower = address ? address.toLowerCase() : '';
    if (!userId || !addrLower) continue;
    unique.set(`${userId}:${addrLower}`, { userId, addrLower });
  }

  for (const u of userBatch.users || []) {
    const userId = Number(u.id);
    const addr = String(u.wallet_public_address || '').trim();
    const addrLower = addr ? addr.toLowerCase() : '';
    if (!userId || !addrLower) continue;
    unique.set(`${userId}:${addrLower}`, { userId, addrLower });
  }

  if (debug) {
    console.log('[quicknode] scan targets', {
      pendingDepositRequests: pending.length,
      userBatchSize: (userBatch.users || []).length,
      userBatchMaxId: userBatch.maxId || 0,
      uniqueAddresses: unique.size,
    });
  }

  const topic0 = ethers.utils.id('Transfer(address,address,uint256)');

  for (const item of unique.values()) {
    const cursorKey = `quicknode_cursor_bsc_usdt_${item.addrLower}`;
    let cursor = await getSettingInt(cursorKey, -1);
    if (cursor < 0) {
      cursor = Math.max(0, scanToBlock - lookback);
    }

    let fromBlock = cursor + 1;
    if (fromBlock > scanToBlock) {
      await setSettingInt(cursorKey, scanToBlock);
      continue;
    }

    const toTopic = ethers.utils.hexZeroPad(item.addrLower, 32);

    let totalLogs = 0;
    let stored = 0;

    while (fromBlock <= scanToBlock) {
      const toBlock = Math.min(scanToBlock, fromBlock + maxBlocksPerScan - 1);
      let logs = [];
      try {
        logs = await provider.getLogs({
          address: usdt,
          fromBlock,
          toBlock,
          topics: [topic0, null, toTopic],
        });
      } catch (e) {
        console.error('QuickNode log scan failed:', item.userId, item.addrLower, e?.message || e);
        break;
      }

      totalLogs += Array.isArray(logs) ? logs.length : 0;

      for (const log of logs) {
        const txHash = String(log?.transactionHash || '').trim();
        const logIndex = Number(log?.logIndex);
        const blockNumber = Number(log?.blockNumber);
        if (!txHash || !Number.isFinite(logIndex) || logIndex < 0 || !Number.isFinite(blockNumber)) continue;

        const amount = formatTokenAmount({ value: log?.data, decimals });
        if (amount == null || amount < minDeposit) continue;

        try {
          const [row, created] = await ChainDepositEvent.findOrCreate({
            where: {
              tx_hash: txHash,
              log_index: Math.floor(logIndex),
            },
            defaults: {
              chain: 'BSC',
              token: 'USDT',
              user_id: item.userId,
              address: item.addrLower,
              amount,
              tx_hash: txHash,
              log_index: Math.floor(logIndex),
              block_number: Math.floor(blockNumber),
              credited: false,
              credited_at: null,
            },
          });

          if (created) stored += 1;

          if (!created) {
            if (!row.user_id) {
              row.user_id = item.userId;
            }
            if (!row.address) {
              row.address = item.addrLower;
            }
            if (!row.block_number && Number.isFinite(blockNumber)) {
              row.block_number = Math.floor(blockNumber);
            }
            await row.save();
          }

          await attachTxHashToLatestPendingDepositRequest({
            userId: item.userId,
            addressLower: item.addrLower,
            txHash,
          });
        } catch (e) {
          console.error('QuickNode store failed:', txHash, e?.message || e);
        }
      }

      await setSettingInt(cursorKey, toBlock);
      fromBlock = toBlock + 1;
    }

    if (debug) {
      console.log('[quicknode] scan address done', {
        userId: item.userId,
        address: item.addrLower,
        totalLogs,
        stored,
      });
    }
  }
}

async function creditDepositEvent(eventId) {
  await sequelize.transaction(async (t) => {
    const event = await ChainDepositEvent.findByPk(eventId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!event || event.credited) return;

    const userId = Number(event.user_id);
    if (!Number.isFinite(userId) || userId <= 0) return;

    let wallet = await Wallet.findOne({ where: { user_id: userId }, transaction: t, lock: t.LOCK.UPDATE });
    if (!wallet) {
      wallet = await Wallet.create({ user_id: userId, balance: 0 }, { transaction: t });
      wallet = await Wallet.findOne({ where: { user_id: userId }, transaction: t, lock: t.LOCK.UPDATE });
    }

    const amount = Number(event.amount || 0);
    if (!Number.isFinite(amount) || amount <= 0) return;

    const current = Number(wallet.balance || 0);
    wallet.balance = current + amount;
    await wallet.save({ transaction: t });

    await Transaction.create(
      {
        user_id: userId,
        type: 'deposit',
        amount,
        created_by: 'quicknode',
        note: `Deposit ${String(event.tx_hash || '').trim()}`,
      },
      { transaction: t },
    );

    const txHash = String(event.tx_hash || '').trim();
    if (txHash) {
      const reqRow = await DepositRequest.findOne({
        where: {
          user_id: userId,
          status: 'pending',
          tx_hash: txHash,
        },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (reqRow) {
        reqRow.status = 'approved';
        if (!reqRow.admin_note) {
          reqRow.admin_note = 'Auto-approved after blockchain confirmation';
        }
        await reqRow.save({ transaction: t });
      }
    }

    event.credited = true;
    event.credited_at = new Date();
    await event.save({ transaction: t });
  });
}

async function processPendingCredits({ provider }) {
  const confirmations = Number(process.env.DEPOSIT_CONFIRMATIONS || 12);
  const minDeposit = Number(process.env.MIN_DEPOSIT_USDT || 9);

  const debug = isDebugEnabled();

  const latest = await provider.getBlockNumber();
  const safeToBlock = Math.max(0, latest - confirmations);

  const pending = await ChainDepositEvent.findAll({
    where: {
      credited: false,
      chain: 'BSC',
      token: 'USDT',
      amount: { [Op.gte]: minDeposit },
      block_number: { [Op.lte]: safeToBlock },
    },
    order: [['block_number', 'ASC']],
    limit: 50,
    raw: true,
  });

  if (debug) {
    console.log('[quicknode] credit pass', {
      latest,
      safeToBlock,
      confirmations,
      candidates: pending.length,
    });
  }

  for (const row of pending) {
    try {
      await creditDepositEvent(row.id);
    } catch (e) {
      console.error('Deposit credit failed:', row?.id, e?.message || e);
    }
  }
}

async function main() {
  await sequelize.sync();

  const provider = getBscProvider();
  const loopMs = Number(process.env.DEPOSIT_WORKER_LOOP_MS || 15000);

  if (isDebugEnabled()) {
    console.log('[quicknode] worker started', {
      rpcHost: safeRpcHost(),
      loopMs,
      confirmations: Number(process.env.DEPOSIT_CONFIRMATIONS || 12),
      minDeposit: Number(process.env.MIN_DEPOSIT_USDT || 9),
    });
  }

  while (true) {
    try {
      await scanPendingDepositAddresses({ provider });
    } catch (e) {
      console.error('QuickNode scan failed:', e?.message || e);
    }

    try {
      await processPendingCredits({ provider });
    } catch (e) {
      console.error('Deposit processing failed:', e?.message || e);
    }

    await sleep(Number.isFinite(loopMs) && loopMs > 0 ? Math.floor(loopMs) : 15000);
  }
}

main().catch((err) => {
  console.error('quicknodeDepositWorker fatal:', err);
  process.exit(1);
});
