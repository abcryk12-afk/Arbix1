const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env'), override: true });

const { ethers } = require('ethers');
const { Op } = require('sequelize');

const models = require('../models');
const { addAddressesToStream } = require('../services/moralisStreamsService');
const { getWalletErc20Transfers } = require('../services/moralisEvmApiService');

const {
  sequelize,
  User,
  Wallet,
  Transaction,
  ChainDepositEvent,
  SiteSetting,
} = models;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getSettingString(key, defaultValue = '') {
  try {
    await SiteSetting.sync();
  } catch {}

  const row = await SiteSetting.findOne({ where: { key }, raw: true });
  const raw = row?.value;
  if (raw == null) return defaultValue;
  return String(raw);
}

async function setSettingString(key, value) {
  const v = value == null || String(value).trim() === '' ? null : String(value);
  await SiteSetting.upsert({ key, value: v });
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

function parseEvmApiInt(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.floor(n);
}

function parseEvmApiAmount({ value, decimals }) {
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

async function syncMoralisStreamAddresses() {
  const apiKey = String(process.env.MORALIS_API_KEY || '').trim();
  const streamId = String(process.env.MORALIS_STREAM_ID || '').trim();
  if (!apiKey || !streamId) return;

  const checkpointKey = 'moralis_stream_last_user_id';
  const lastId = await getSettingInt(checkpointKey, 0);

  const users = await User.findAll({
    where: {
      id: { [Op.gt]: lastId },
      wallet_public_address: { [Op.ne]: null },
    },
    attributes: ['id', 'wallet_public_address'],
    order: [['id', 'ASC']],
    limit: 200,
    raw: true,
  });

  if (!users.length) return;

  const addresses = users
    .map((u) => String(u.wallet_public_address || '').trim())
    .filter(Boolean);

  if (!addresses.length) {
    const maxId = Math.max(...users.map((u) => Number(u.id || 0)));
    if (Number.isFinite(maxId) && maxId > lastId) {
      await setSettingInt(checkpointKey, maxId);
    }
    return;
  }

  await addAddressesToStream({ streamId, addresses, apiKey });

  const maxId = Math.max(...users.map((u) => Number(u.id || 0)));
  if (Number.isFinite(maxId) && maxId > lastId) {
    await setSettingInt(checkpointKey, maxId);
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
        created_by: 'moralis',
        note: `Deposit ${String(event.tx_hash || '').trim()}`,
      },
      { transaction: t },
    );

    event.credited = true;
    event.credited_at = new Date();
    await event.save({ transaction: t });
  });
}

async function processPendingCredits({ provider }) {
  const confirmations = Number(process.env.DEPOSIT_CONFIRMATIONS || 12);
  const minDeposit = Number(process.env.MIN_DEPOSIT_USDT || 9);

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

  for (const row of pending) {
    try {
      await creditDepositEvent(row.id);
    } catch (e) {
      console.error('Deposit credit failed:', row?.id, e?.message || e);
    }
  }
}

async function pollMoralisFallback({ provider }) {
  const enabled = String(process.env.MORALIS_POLLING_ENABLED || '').trim().toLowerCase();
  if (!['1', 'true', 'yes', 'on'].includes(enabled)) return;

  const apiKey = String(process.env.MORALIS_API_KEY || '').trim();
  if (!apiKey) return;

  const usdt = String(process.env.USDT_BSC_ADDRESS || '0x55d398326f99059ff775485246999027b3197955').trim();
  const minDeposit = Number(process.env.MIN_DEPOSIT_USDT || 9);
  const confirmations = Number(process.env.DEPOSIT_CONFIRMATIONS || 12);
  const lookback = Number(process.env.MORALIS_POLL_LOOKBACK_BLOCKS || 20000);
  const batchSize = Math.min(Math.max(Number(process.env.MORALIS_POLL_BATCH_SIZE || 20), 1), 100);

  const latest = await provider.getBlockNumber();
  const safeToBlock = Math.max(0, latest - confirmations);

  const checkpointKey = 'moralis_poll_last_user_id';
  let lastUserId = await getSettingInt(checkpointKey, 0);

  let users = await User.findAll({
    where: {
      id: { [Op.gt]: lastUserId },
      wallet_public_address: { [Op.ne]: null },
    },
    attributes: ['id', 'wallet_public_address'],
    order: [['id', 'ASC']],
    limit: batchSize,
    raw: true,
  });

  if (!users.length) {
    lastUserId = 0;
    users = await User.findAll({
      where: {
        id: { [Op.gt]: 0 },
        wallet_public_address: { [Op.ne]: null },
      },
      attributes: ['id', 'wallet_public_address'],
      order: [['id', 'ASC']],
      limit: batchSize,
      raw: true,
    });
  }

  if (!users.length) return;

  for (const u of users) {
    const userId = Number(u.id);
    const addr = String(u.wallet_public_address || '').trim();
    if (!userId || !addr) continue;

    const addrLower = addr.toLowerCase();
    const addrKey = `moralis_poll_last_block_bsc_usdt_${addrLower}`;
    let lastProcessedBlock = await getSettingInt(addrKey, -1);
    if (lastProcessedBlock < 0) {
      const initial = safeToBlock - (Number.isFinite(lookback) ? Math.floor(lookback) : 20000);
      lastProcessedBlock = Math.max(0, initial);
    }

    const cursorKey = `moralis_poll_cursor_bsc_usdt_${addrLower}`;
    const cursorToBlockKey = `moralis_poll_cursor_to_block_bsc_usdt_${addrLower}`;

    let cursor = (await getSettingString(cursorKey, '')).trim() || null;
    let cursorToBlock = parseEvmApiInt(await getSettingString(cursorToBlockKey, ''));

    const fromBlock = lastProcessedBlock + 1;
    let toBlock = safeToBlock;
    if (cursor) {
      if (cursorToBlock == null) {
        cursor = null;
        await setSettingString(cursorKey, null);
        await setSettingString(cursorToBlockKey, null);
      } else {
        toBlock = Math.min(safeToBlock, cursorToBlock);
      }
    }

    if (!cursor) {
      cursorToBlock = toBlock;
      await setSettingString(cursorToBlockKey, String(cursorToBlock));
    }

    if (fromBlock > toBlock) {
      await setSettingInt(addrKey, toBlock);
      await setSettingString(cursorKey, null);
      await setSettingString(cursorToBlockKey, null);
      if (userId > lastUserId) lastUserId = userId;
      continue;
    }

    let hadError = false;
    for (let page = 0; page < 5; page++) {
      let data;
      try {
        data = await getWalletErc20Transfers({
          address: addr,
          apiKey,
          chain: 'bsc',
          fromBlock,
          toBlock,
          cursor,
          limit: 100,
          contractAddresses: usdt,
        });
      } catch (e) {
        if (e?.status === 429) {
          hadError = true;
          await sleep(3000);
          continue;
        }
        hadError = true;
        console.error('Moralis polling error:', addrLower, e?.message || e);
        break;
      }

      const results = Array.isArray(data?.result) ? data.result : [];

      for (const r of results) {
        const to = String(r?.to_address || r?.toAddress || '').toLowerCase();
        if (to !== addrLower) continue;

        const tokenAddress = String(r?.address || r?.token_address || r?.tokenAddress || '').toLowerCase();
        if (!tokenAddress) continue;
        if (tokenAddress !== String(usdt).toLowerCase()) continue;

        const txHash = String(r?.transaction_hash || r?.transactionHash || '').trim();
        const logIndex = parseEvmApiInt(r?.log_index ?? r?.logIndex);
        const blockNumber = parseEvmApiInt(r?.block_number ?? r?.blockNumber);
        if (!txHash || logIndex == null || blockNumber == null) continue;
        if (blockNumber > toBlock) continue;

        const amount = parseEvmApiAmount({ value: r?.value, decimals: r?.token_decimals ?? r?.tokenDecimals });
        if (amount == null || amount < minDeposit) continue;

        try {
          const [row, created] = await ChainDepositEvent.findOrCreate({
            where: {
              tx_hash: txHash,
              log_index: logIndex,
            },
            defaults: {
              chain: 'BSC',
              token: 'USDT',
              user_id: userId,
              address: addrLower,
              amount,
              tx_hash: txHash,
              log_index: logIndex,
              block_number: blockNumber,
              credited: false,
              credited_at: null,
            },
          });

          if (!created && !row.user_id) {
            row.user_id = userId;
            row.address = addrLower;
            await row.save();
          }
        } catch (e) {
          console.error('Moralis polling store failed:', txHash, e?.message || e);
        }
      }

      cursor = data?.cursor || null;
      if (!cursor) break;
    }

    if (cursor) {
      await setSettingString(cursorKey, cursor);
      await setSettingString(cursorToBlockKey, String(cursorToBlock || toBlock));
    } else if (!hadError) {
      await setSettingInt(addrKey, toBlock);
      await setSettingString(cursorKey, null);
      await setSettingString(cursorToBlockKey, null);
    }

    if (userId > lastUserId) lastUserId = userId;
  }

  await setSettingInt(checkpointKey, lastUserId);
}

async function main() {
  await sequelize.sync();

  const provider = getBscProvider();
  const loopMs = Number(process.env.DEPOSIT_WORKER_LOOP_MS || 10000);

  while (true) {
    try {
      await syncMoralisStreamAddresses();
    } catch (e) {
      console.error('Moralis stream address sync failed:', e?.message || e);
    }

    try {
      await pollMoralisFallback({ provider });
    } catch (e) {
      console.error('Moralis fallback polling failed:', e?.message || e);
    }

    try {
      await processPendingCredits({ provider });
    } catch (e) {
      console.error('Deposit processing failed:', e?.message || e);
    }

    await sleep(Number.isFinite(loopMs) && loopMs > 0 ? Math.floor(loopMs) : 10000);
  }
}

main().catch((err) => {
  console.error('moralisDepositWorker fatal:', err);
  process.exit(1);
});
