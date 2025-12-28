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

let detectedLogRangeLimit = null;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isEnabledEnvFlag(name, defaultValue = false) {
  const raw = process.env[name];
  if (raw == null) return defaultValue;
  return ['1', 'true', 'yes', 'on'].includes(String(raw).trim().toLowerCase());
}

function getDepositRequestTtlMinutes() {
  const raw = process.env.DEPOSIT_REQUEST_TTL_MINUTES;
  const n = raw == null ? 30 : Number(raw);
  if (!Number.isFinite(n)) return 30;
  return Math.min(Math.max(Math.floor(n), 1), 24 * 60);
}

function getDepositAmountTolerance() {
  const raw = process.env.DEPOSIT_AMOUNT_TOLERANCE;
  const n = raw == null ? 0.1 : Number(raw);
  if (!Number.isFinite(n) || n < 0) return 0.1;
  return n;
}

async function expirePendingDepositRequests() {
  const ttlMinutes = getDepositRequestTtlMinutes();
  const cutoff = new Date(Date.now() - ttlMinutes * 60 * 1000);

  const rows = await DepositRequest.findAll({
    where: {
      status: 'pending',
      tx_hash: { [Op.is]: null },
      [Op.and]: [sequelize.where(sequelize.col('created_at'), { [Op.lt]: cutoff })],
    },
    order: [[DepositRequest.sequelize.col('created_at'), 'ASC']],
    limit: 500,
  });

  if (!rows.length) return 0;

  let updated = 0;
  for (const row of rows) {
    row.status = 'rejected';
    if (!row.admin_note) {
      row.admin_note = `Expired after ${ttlMinutes} minutes`;
    }
    await row.save();
    updated += 1;
  }

  return updated;
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

function extractLogRangeLimit(err) {
  const msg = String(err?.message || err || '');
  const m = msg.match(/limited to a\s*(\d+)\s*range/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
}

function getMaxWindowsPerAddress() {
  const raw = process.env.QUICKNODE_MAX_WINDOWS_PER_ADDRESS;
  const n = raw == null ? 60 : Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 60;
}

function getEffectiveLookback({ desiredLookback, detectedLimit }) {
  const lb = Number(desiredLookback);
  if (!Number.isFinite(lb) || lb <= 0) return 0;

  const limit = Number(detectedLimit);
  if (!Number.isFinite(limit) || limit <= 0) return lb;

  if (limit <= 10) {
    const cap = Math.max(50, limit * getMaxWindowsPerAddress());
    return Math.min(lb, cap);
  }

  return lb;
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
  const limit = Math.min(Math.max(Number(process.env.QUICKNODE_USER_SCAN_LIMIT || 50), 1), 1000);
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

function toMatchUnits(value) {
  try {
    if (value == null) return null;
    const n = typeof value === 'string' ? Number(value) : Number(value);
    if (!Number.isFinite(n)) return null;
    return ethers.utils.parseUnits(n.toFixed(8), 8);
  } catch {
    return null;
  }
}

function pickBestDepositRequest({ requests, depositedUnits, toleranceUnits }) {
  if (!Array.isArray(requests) || !requests.length) return null;
  if (!depositedUnits || !toleranceUnits) return null;

  let best = null;
  let bestDiff = null;

  for (const req of requests) {
    const requestedUnits = toMatchUnits(req?.amount);
    if (!requestedUnits) continue;

    const isUnder = requestedUnits.gt(depositedUnits);
    if (isUnder) {
      const diffUnder = requestedUnits.sub(depositedUnits);
      if (diffUnder.gt(toleranceUnits)) {
        continue;
      }
    }

    const diff = requestedUnits.gt(depositedUnits)
      ? requestedUnits.sub(depositedUnits)
      : depositedUnits.sub(requestedUnits);

    if (!best || diff.lt(bestDiff)) {
      best = req;
      bestDiff = diff;
      continue;
    }

    if (diff.eq(bestDiff)) {
      const a = new Date(req?.created_at || req?.createdAt || 0).getTime();
      const b = new Date(best?.created_at || best?.createdAt || 0).getTime();
      if (Number.isFinite(a) && Number.isFinite(b) && a > b) {
        best = req;
        bestDiff = diff;
      }
    }
  }

  return best;
}

function pickClosestDepositRequestAny({ requests, depositedUnits }) {
  if (!Array.isArray(requests) || !requests.length) return null;
  if (!depositedUnits) return null;

  let best = null;
  let bestDiff = null;

  for (const req of requests) {
    const requestedUnits = toMatchUnits(req?.amount);
    if (!requestedUnits) continue;

    const diff = requestedUnits.gt(depositedUnits)
      ? requestedUnits.sub(depositedUnits)
      : depositedUnits.sub(requestedUnits);

    if (!best || diff.lt(bestDiff)) {
      best = req;
      bestDiff = diff;
      continue;
    }

    if (diff.eq(bestDiff)) {
      const a = new Date(req?.created_at || req?.createdAt || 0).getTime();
      const b = new Date(best?.created_at || best?.createdAt || 0).getTime();
      if (Number.isFinite(a) && Number.isFinite(b) && a > b) {
        best = req;
        bestDiff = diff;
      }
    }
  }

  return best;
}

async function attachTxHashToLatestPendingDepositRequest({ userId, addressLower, txHash, createdAfter, depositedAmount }) {
  if (!userId || !addressLower || !txHash) return;

  const depositedUnits = toMatchUnits(depositedAmount);
  const toleranceUnits = toMatchUnits(getDepositAmountTolerance());
  if (!depositedUnits || !toleranceUnits) return;

  try {
    const andClauses = [
      sequelize.where(
        sequelize.fn('LOWER', sequelize.col('address')),
        addressLower,
      ),
    ];

    if (createdAfter) {
      andClauses.push(sequelize.where(sequelize.col('created_at'), { [Op.gte]: createdAfter }));
    }

    const requests = await DepositRequest.findAll({
      where: {
        user_id: userId,
        status: 'pending',
        tx_hash: { [Op.is]: null },
        [Op.and]: andClauses,
      },
      order: [[DepositRequest.sequelize.col('created_at'), 'DESC']],
      limit: 25,
    });

    const best = pickBestDepositRequest({ requests, depositedUnits, toleranceUnits });
    if (!best) return;
    best.tx_hash = txHash;
    await best.save();
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
  const minDeposit = Math.max(10, Number(process.env.MIN_DEPOSIT_USDT || 10));
  const maxBlocksPerScan = Math.min(Math.max(Number(process.env.QUICKNODE_MAX_BLOCKS_PER_SCAN || 2000), 100), 20000);
  const lookback = Math.min(Math.max(Number(process.env.QUICKNODE_LOOKBACK_BLOCKS || 20000), 1000), 500000);
  const userLookback = Math.min(Math.max(Number(process.env.QUICKNODE_USER_LOOKBACK_BLOCKS || 2000), 200), 500000);

  const ttlMinutes = getDepositRequestTtlMinutes();
  const activeCutoff = new Date(Date.now() - ttlMinutes * 60 * 1000);
  const includeUserWallets = isEnabledEnvFlag('QUICKNODE_SCAN_USER_WALLETS', false);

  const usdt = getUsdtContractAddress();
  const decimals = getTokenDecimals();

  const pendingRaw = await DepositRequest.findAll({
    where: {
      status: 'pending',
      tx_hash: { [Op.is]: null },
    },
    raw: true,
    attributes: ['id', 'user_id', 'address', 'tx_hash', [sequelize.col('created_at'), 'createdAt']],
    order: [[sequelize.col('created_at'), 'DESC']],
    limit: 500,
  });

  const pending = (pendingRaw || []).filter((p) => {
    if (!p?.createdAt) return false;
    const t = new Date(p.createdAt).getTime();
    return Number.isFinite(t) && t >= activeCutoff.getTime();
  });

  if (!pending.length && !includeUserWallets) {
    if (isDebugEnabled()) {
      console.log('[quicknode] scan skipped (idle)');
    }
    return;
  }

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
      detectedLogRangeLimit: detectedLogRangeLimit || null,
      lookback,
      userLookback,
      ttlMinutes,
      includeUserWallets,
    });
  }

  const userBatch = includeUserWallets ? await loadUserAddressBatch() : { users: [], maxId: 0 };

  const unique = new Map();
  for (const p of pending) {
    const userId = Number(p.user_id);
    const address = String(p.address || '').trim();
    const addrLower = address ? address.toLowerCase() : '';
    if (!userId || !addrLower) continue;
    unique.set(`${userId}:${addrLower}`, { userId, addrLower, source: 'pending_request' });
  }

  for (const u of userBatch.users || []) {
    const userId = Number(u.id);
    const addr = String(u.wallet_public_address || '').trim();
    const addrLower = addr ? addr.toLowerCase() : '';
    if (!userId || !addrLower) continue;
    const key = `${userId}:${addrLower}`;
    const existing = unique.get(key);
    if (existing && existing.source === 'pending_request') continue;
    unique.set(key, { userId, addrLower, source: 'user_wallet' });
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
      const lb = item.source === 'pending_request' ? lookback : userLookback;
      const effectiveLookback = getEffectiveLookback({ desiredLookback: lb, detectedLimit: detectedLogRangeLimit });
      cursor = Math.max(0, scanToBlock - effectiveLookback);
      await setSettingInt(cursorKey, cursor);
    } else {
      const lb = item.source === 'pending_request' ? lookback : userLookback;
      const effectiveLookback = getEffectiveLookback({ desiredLookback: lb, detectedLimit: detectedLogRangeLimit });
      const minCursor = Math.max(0, scanToBlock - effectiveLookback);
      if (effectiveLookback > 0 && cursor < minCursor) {
        cursor = minCursor;
        await setSettingInt(cursorKey, cursor);
        if (debug) {
          console.log('[quicknode] cursor fast-forward', {
            userId: item.userId,
            address: item.addrLower,
            source: item.source,
            cursor,
            scanToBlock,
            effectiveLookback,
          });
        }
      }
    }

    let fromBlock = cursor + 1;
    if (fromBlock > scanToBlock) {
      await setSettingInt(cursorKey, scanToBlock);
      continue;
    }

    const toTopic = ethers.utils.hexZeroPad(item.addrLower, 32);

    let totalLogs = 0;
    let stored = 0;

    const maxWindows = getMaxWindowsPerAddress();
    let windows = 0;

    while (fromBlock <= scanToBlock) {
      const effectiveSpan = Math.max(1, Math.min(maxBlocksPerScan, detectedLogRangeLimit || maxBlocksPerScan));
      const toBlock = Math.min(scanToBlock, fromBlock + effectiveSpan - 1);
      let logs = [];
      try {
        logs = await provider.getLogs({
          address: usdt,
          fromBlock,
          toBlock,
          topics: [topic0, null, toTopic],
        });
      } catch (e) {
        const limit = extractLogRangeLimit(e);
        if (limit && (!detectedLogRangeLimit || limit < detectedLogRangeLimit)) {
          detectedLogRangeLimit = limit;
          try {
            await setSettingInt('quicknode_detected_log_range_limit', detectedLogRangeLimit);
          } catch {}
          if (debug) {
            console.warn('[quicknode] detected eth_getLogs range limit, will retry with smaller windows', {
              detectedLogRangeLimit,
              userId: item.userId,
              address: item.addrLower,
            });
          }
          continue;
        }

        console.error('QuickNode log scan failed:', item.userId, item.addrLower, e?.message || e);
        await sleep(1000);
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

          if (!row.credited) {
            await attachTxHashToLatestPendingDepositRequest({
              userId: item.userId,
              addressLower: item.addrLower,
              txHash,
              createdAfter: activeCutoff,
              depositedAmount: amount,
            });
          }
        } catch (e) {
          console.error('QuickNode store failed:', txHash, e?.message || e);
        }
      }

      await setSettingInt(cursorKey, toBlock);
      fromBlock = toBlock + 1;

      windows += 1;
      if (windows >= maxWindows) {
        if (debug) {
          console.log('[quicknode] scan window cap reached', {
            userId: item.userId,
            address: item.addrLower,
            source: item.source,
            windows,
            maxWindows,
            cursorAfter: toBlock,
            scanToBlock,
          });
        }
        break;
      }
    }

    if (debug) {
      console.log('[quicknode] scan address done', {
        userId: item.userId,
        address: item.addrLower,
        source: item.source,
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
    const addressLower = String(event.address || '').trim().toLowerCase();
    const ttlMinutes = getDepositRequestTtlMinutes();
    const activeCutoff = new Date(Date.now() - ttlMinutes * 60 * 1000);
    const depositedUnits = toMatchUnits(amount);
    const toleranceUnits = toMatchUnits(getDepositAmountTolerance());

    if (txHash && addressLower && depositedUnits && toleranceUnits) {
      const andClauses = [
        sequelize.where(
          sequelize.fn('LOWER', sequelize.col('address')),
          addressLower,
        ),
      ];

      const allRequests = await DepositRequest.findAll({
        where: {
          user_id: userId,
          status: 'pending',
          [Op.or]: [{ tx_hash: { [Op.is]: null } }, { tx_hash: txHash }],
          [Op.and]: andClauses,
        },
        order: [[DepositRequest.sequelize.col('created_at'), 'DESC']],
        limit: 50,
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      const eligibleRequests = (allRequests || []).filter((r) => {
        const th = r?.tx_hash ? String(r.tx_hash).trim() : null;
        if (th && th !== txHash) return false;
        if (!th) {
          const t0 = new Date(r?.created_at || r?.createdAt || 0).getTime();
          if (!Number.isFinite(t0)) return false;
          if (t0 < activeCutoff.getTime()) return false;
        }
        return true;
      });

      const best = pickBestDepositRequest({ requests: eligibleRequests, depositedUnits, toleranceUnits });

      if (best) {
        for (const r of allRequests || []) {
          if (!r) continue;
          const th = r?.tx_hash ? String(r.tx_hash).trim() : null;
          if (th === txHash && Number(r.id) !== Number(best.id)) {
            r.tx_hash = null;
            if (!r.admin_note) {
              r.admin_note = 'Auto-detected deposit did not match this request; tx unlocked.';
            }
            await r.save({ transaction: t });
          }
        }

        best.tx_hash = txHash;
        best.status = 'approved';
        if (!best.admin_note) {
          best.admin_note = 'Auto-approved after blockchain confirmation';
        }
        await best.save({ transaction: t });
      } else {
        const closest = pickClosestDepositRequestAny({ requests: eligibleRequests, depositedUnits });

        for (const r of allRequests || []) {
          if (!r) continue;
          const th = r?.tx_hash ? String(r.tx_hash).trim() : null;

          if (closest && Number(r.id) === Number(closest.id)) {
            r.tx_hash = txHash;
            r.status = 'rejected';
            if (!r.admin_note) {
              r.admin_note = `Underpaid deposit detected. Expected ${Number(r.amount || 0)} USDT, received ${amount} USDT.`;
            }
            await r.save({ transaction: t });
            continue;
          }

          if (th === txHash) {
            r.tx_hash = null;
            if (!r.admin_note) {
              r.admin_note = 'Auto-detected deposit did not match this request; tx unlocked.';
            }
            await r.save({ transaction: t });
          }
        }
      }
    }

    event.credited = true;
    event.credited_at = new Date();
    await event.save({ transaction: t });
  });
}

async function processPendingCredits({ provider }) {
  const confirmations = Number(process.env.DEPOSIT_CONFIRMATIONS || 12);
  const minDeposit = Math.max(10, Number(process.env.MIN_DEPOSIT_USDT || 10));

  const debug = isDebugEnabled();

  const pendingTotal = await ChainDepositEvent.count({
    where: {
      credited: false,
      chain: 'BSC',
      token: 'USDT',
      amount: { [Op.gte]: minDeposit },
    },
  });

  if (!Number(pendingTotal || 0)) return { pendingTotal: 0, candidates: 0, creditedAttempts: 0 };

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

  return { pendingTotal: Number(pendingTotal || 0), candidates: pending.length, creditedAttempts: pending.length };
}

async function main() {
  await sequelize.sync();

  const provider = getBscProvider();
  const loopMs = Number(process.env.DEPOSIT_WORKER_LOOP_MS || 15000);
  const idlePollMs = Number(process.env.DEPOSIT_WORKER_IDLE_POLL_MS || 60000);
  const includeUserWallets = isEnabledEnvFlag('QUICKNODE_SCAN_USER_WALLETS', false);

  if (isDebugEnabled()) {
    console.log('[quicknode] worker started', {
      rpcHost: safeRpcHost(),
      loopMs,
      idlePollMs,
      confirmations: Number(process.env.DEPOSIT_CONFIRMATIONS || 12),
      minDeposit: Math.max(10, Number(process.env.MIN_DEPOSIT_USDT || 10)),
      depositRequestTtlMinutes: getDepositRequestTtlMinutes(),
      depositAmountTolerance: getDepositAmountTolerance(),
      includeUserWallets,
    });
  }

  while (true) {
    let didWork = false;

    try {
      const expired = await expirePendingDepositRequests();
      if (expired) didWork = true;
    } catch (e) {
      console.error('Deposit request expiry failed:', e?.message || e);
    }

    try {
      const pendingRequests = await DepositRequest.count({
        where: {
          status: 'pending',
          tx_hash: { [Op.is]: null },
        },
      });

      if (includeUserWallets || Number(pendingRequests || 0) > 0) {
        await scanPendingDepositAddresses({ provider });
        didWork = true;
      }
    } catch (e) {
      console.error('QuickNode scan failed:', e?.message || e);
    }

    try {
      const creditResult = await processPendingCredits({ provider });
      if (creditResult?.pendingTotal || creditResult?.candidates) {
        didWork = true;
      }
    } catch (e) {
      console.error('Deposit processing failed:', e?.message || e);
    }

    const sleepMs = didWork
      ? (Number.isFinite(loopMs) && loopMs > 0 ? Math.floor(loopMs) : 15000)
      : (Number.isFinite(idlePollMs) && idlePollMs > 0 ? Math.floor(idlePollMs) : 60000);

    await sleep(sleepMs);
  }
}

main().catch((err) => {
  console.error('quicknodeDepositWorker fatal:', err);
  process.exit(1);
});
