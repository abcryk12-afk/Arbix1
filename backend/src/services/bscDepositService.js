const https = require('https');
const { ethers } = require('ethers');

let provider;

const latestBlockCache = {
  value: null,
  fetchedAt: 0,
};

function getScanMode() {
  const raw = String(process.env.DEPOSIT_SCAN_MODE || 'explorer').trim().toLowerCase();
  return raw === 'rpc' ? 'rpc' : 'explorer';
}

function getExplorerBaseUrl() {
  const raw = String(process.env.EXPLORER_API_BASE_URL || 'https://api.bscscan.com/v2/api').trim();
  return raw || 'https://api.bscscan.com/v2/api';
}

function explorerUsesChainId(baseUrl) {
  try {
    const u = new URL(String(baseUrl || '').trim());
    return u.pathname.includes('/v2/');
  } catch {
    return true;
  }
}

function getExplorerApiKey() {
  const baseUrl = getExplorerBaseUrl();
  let host = '';
  try {
    host = new URL(baseUrl).host.toLowerCase();
  } catch {}

  const bscKey = String(process.env.BSCSCAN_API_KEY || '').trim();
  const explorerKey = String(process.env.EXPLORER_API_KEY || '').trim();

  const raw = host.includes('bscscan.com') ? bscKey || explorerKey : explorerKey || bscKey;
  if (!raw) {
    const err = new Error('EXPLORER_API_KEY is not configured');
    err.code = 'EXPLORER_API_KEY_MISSING';
    throw err;
  }
  return raw;
}

function getExplorerChainId() {
  const raw = process.env.BSC_CHAIN_ID;
  const n = raw == null ? 56 : Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 56;
}

function getLatestBlockCacheMs() {
  const raw = process.env.EXPLORER_LATEST_BLOCK_CACHE_MS;
  const n = raw == null ? 8000 : Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 8000;
}

function httpGetJson(url, redirectsLeft = 2) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      const status = Number(res.statusCode || 0);

      if ((status === 301 || status === 302 || status === 307 || status === 308) && redirectsLeft > 0) {
        const loc = res.headers.location;
        if (loc) {
          res.resume();
          return resolve(httpGetJson(loc, redirectsLeft - 1));
        }
      }

      let raw = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        raw += chunk;
      });
      res.on('end', () => {
        try {
          const data = JSON.parse(raw || '{}');
          if (status >= 400) {
            const err = new Error(data?.result || data?.message || `HTTP ${status}`);
            err.code = 'EXPLORER_HTTP_ERROR';
            reject(err);
            return;
          }
          resolve(data);
        } catch (e) {
          const err = new Error(`Failed to parse explorer response (HTTP ${status})`);
          err.code = 'EXPLORER_PARSE_ERROR';
          reject(err);
        }
      });
    });

    req.on('error', (e) => {
      const err = new Error(e?.message || 'Explorer request failed');
      err.code = e?.code || 'EXPLORER_REQUEST_FAILED';
      reject(err);
    });
  });
}

const explorerThrottle = {
  lastRequestAt: 0,
  chain: Promise.resolve(),
};

function getExplorerMinRequestIntervalMs() {
  const raw = process.env.EXPLORER_MIN_REQUEST_INTERVAL_MS;
  const n = raw == null ? 250 : Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 250;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function explorerRequest(params) {
  const baseUrl = getExplorerBaseUrl();
  const apiKey = getExplorerApiKey();
  const chainid = getExplorerChainId();

  const u = new URL(baseUrl);
  if (explorerUsesChainId(baseUrl)) {
    u.searchParams.set('chainid', String(chainid));
  }
  u.searchParams.set('apikey', apiKey);
  for (const [k, v] of Object.entries(params || {})) {
    if (v === undefined || v === null || v === '') continue;
    u.searchParams.set(k, String(v));
  }

  const run = async () => {
    const minGap = getExplorerMinRequestIntervalMs();
    const now = Date.now();
    const wait = Math.max(0, explorerThrottle.lastRequestAt + minGap - now);
    if (wait > 0) {
      await sleep(wait);
    }
    explorerThrottle.lastRequestAt = Date.now();
    return httpGetJson(u.toString());
  };

  const task = explorerThrottle.chain.then(run, run);
  explorerThrottle.chain = task.catch(() => {});

  const data = await task;

  if (data && typeof data === 'object' && data.status === '0') {
    const msg = String(data.result || data.message || 'Explorer NOTOK');
    const msgLower = msg.toLowerCase();

    const result = data.result;
    if (Array.isArray(result) && result.length === 0) {
      return data;
    }

    if (msgLower.includes('no records') || msgLower.includes('no transactions')) {
      return data;
    }

    const err = new Error(String(result || msg));
    if (msgLower.includes('deprecated v1 endpoint') || msgLower.includes('switch to etherscan api v2') || msgLower.includes('v2-migration')) {
      err.code = 'EXPLORER_DEPRECATED_V1';
    } else if (msgLower.includes('free api access is not supported for this chain')) err.code = 'EXPLORER_FREE_TIER_UNSUPPORTED_CHAIN';
    else if (msgLower.includes('missing or unsupported chainid')) err.code = 'EXPLORER_UNSUPPORTED_CHAIN';
    else if (msgLower.includes('rate limit') || msgLower.includes('max rate')) err.code = 'EXPLORER_RATE_LIMIT';
    else if (msgLower.includes('too many') || msgLower.includes('query returned more than')) err.code = 'EXPLORER_TOO_MANY_RESULTS';
    else err.code = 'EXPLORER_NOTOK';
    throw err;
  }

  return data;
}

async function explorerGetLatestBlockNumber() {
  const now = Date.now();
  const ttl = getLatestBlockCacheMs();
  if (latestBlockCache.value && now - latestBlockCache.fetchedAt < ttl) {
    return latestBlockCache.value;
  }

  const data = await explorerRequest({ module: 'proxy', action: 'eth_blockNumber' });
  const hex = data?.result;
  const n = typeof hex === 'string' ? parseInt(hex, 16) : NaN;
  if (!Number.isFinite(n) || n <= 0) {
    const err = new Error('Failed to fetch latest block number from explorer');
    err.code = 'EXPLORER_LATEST_BLOCK_FAILED';
    throw err;
  }

  latestBlockCache.value = n;
  latestBlockCache.fetchedAt = now;
  return n;
}

async function explorerGetTransferLogs({ token, fromBlock, toBlock, toTopic }) {
  const data = await explorerRequest({
    module: 'logs',
    action: 'getLogs',
    address: token,
    fromBlock,
    toBlock,
    topic0: ethers.utils.id('Transfer(address,address,uint256)'),
    topic0_2_opr: 'and',
    topic2: toTopic,
    page: 1,
    offset: 1000,
  });

  const result = data?.result;
  return Array.isArray(result) ? result : [];
}

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
  const { sequelize, SiteSetting, Wallet, Transaction, DepositRequest, ChainDepositEvent, DepositScanLog } = models;

  if (!userId || !address) return { scanned: false, reason: 'missing_params' };

  const last = scanState.lastScanAtByUserId.get(userId) || 0;
  const now = Date.now();
  if (now - last < getMinScanIntervalMs()) {
    try {
      if (DepositScanLog) {
        await DepositScanLog.create({
          user_id: userId,
          address: String(address),
          reason: reason || null,
          status: 'skipped',
          error_code: 'LOCAL_RATE_LIMITED',
          error_message: 'Scan skipped due to cooldown',
        });
      }
    } catch {}
    return { scanned: false, reason: 'rate_limited' };
  }
  scanState.lastScanAtByUserId.set(userId, now);

  const startedAt = Date.now();
  const logBase = {
    user_id: userId,
    address: String(address),
    reason: reason || null,
    chain: 'BSC',
    token: 'USDT',
  };

  const scanMode = getScanMode();

  let provider;
  let token;
  let decimals;
  let confirmations;
  let maxBlocks;

  try {
    if (scanMode === 'rpc') {
      provider = getProvider();
    } else {
      getExplorerApiKey();
    }
    token = getUsdtContract();
    decimals = getTokenDecimals();
    confirmations = getConfirmations();
    maxBlocks = getMaxBlocksPerScan();
  } catch (e) {
    try {
      if (DepositScanLog) {
        await DepositScanLog.create({
          ...logBase,
          status: 'error',
          duration_ms: Date.now() - startedAt,
          error_code: e?.code || 'SCAN_CONFIG_ERROR',
          error_message: e?.message || String(e),
        });
      }
    } catch {}
    throw e;
  }

  const normalizedTo = ethers.utils.getAddress(address);
  const topic0 = ethers.utils.id('Transfer(address,address,uint256)');
  const topicTo = ethers.utils.hexZeroPad(normalizedTo, 32);

  let latest;
  let safeToBlock;
  try {
    latest = scanMode === 'rpc' ? await provider.getBlockNumber() : await explorerGetLatestBlockNumber();
    safeToBlock = Math.max(0, latest - confirmations);
  } catch (e) {
    try {
      if (DepositScanLog) {
        await DepositScanLog.create({
          ...logBase,
          status: 'error',
          confirmations,
          duration_ms: Date.now() - startedAt,
          error_code: e?.code || (scanMode === 'rpc' ? 'RPC_ERROR' : 'EXPLORER_ERROR'),
          error_message: e?.message || String(e),
        });
      }
    } catch {}
    throw e;
  }

  const rounds = Number.isFinite(maxRounds) && maxRounds > 0 ? Math.floor(maxRounds) : 1;

  let cursor = await getAddressCursor({ SiteSetting, address: normalizedTo });
  if (cursor == null) {
    cursor = Math.max(0, safeToBlock - maxBlocks * rounds);
  }

  let fromBlock = Math.max(0, cursor + 1);
  if (fromBlock > safeToBlock) {
    await setAddressCursor({ SiteSetting, address: normalizedTo, blockNumber: safeToBlock });
    try {
      if (DepositScanLog) {
        await DepositScanLog.create({
          ...logBase,
          status: 'up_to_date',
          latest_block: latest,
          confirmations,
          safe_to_block: safeToBlock,
          cursor_before: cursor,
          cursor_after: safeToBlock,
          from_block: fromBlock,
          to_block: safeToBlock,
          rounds: 0,
          logs_found: 0,
          credited_events: 0,
          duration_ms: Date.now() - startedAt,
        });
      }
    } catch {}
    return { scanned: true, credited: 0, reason: 'up_to_date' };
  }

  let creditedCount = 0;
  let currentFrom = fromBlock;
  let logsFound = 0;
  let cursorAfter = cursor;
  let lastToBlock = null;

  for (let i = 0; i < rounds; i++) {
    const currentTo = Math.min(safeToBlock, currentFrom + maxBlocks - 1);

    lastToBlock = currentTo;

    let logs;
    try {
      if (scanMode === 'rpc') {
        logs = await provider.getLogs({
          address: token,
          fromBlock: currentFrom,
          toBlock: currentTo,
          topics: [topic0, null, topicTo],
        });
      } else {
        logs = await explorerGetTransferLogs({ token, fromBlock: currentFrom, toBlock: currentTo, toTopic: topicTo });
      }
    } catch (e) {
      try {
        if (DepositScanLog) {
          await DepositScanLog.create({
            ...logBase,
            status: 'error',
            latest_block: latest,
            confirmations,
            safe_to_block: safeToBlock,
            cursor_before: cursor,
            cursor_after: cursorAfter,
            from_block: currentFrom,
            to_block: currentTo,
            rounds: i + 1,
            logs_found: logsFound,
            credited_events: creditedCount,
            duration_ms: Date.now() - startedAt,
            error_code: e?.code || (scanMode === 'rpc' ? 'RPC_GETLOGS_ERROR' : 'EXPLORER_GETLOGS_ERROR'),
            error_message: e?.message || String(e),
          });
        }
      } catch {}
      throw e;
    }

    logsFound += Array.isArray(logs) ? logs.length : 0;

    for (const log of logs) {
      const txHash = log.transactionHash;
      const logIndexRaw = typeof log.logIndex === 'string' ? parseInt(log.logIndex, 16) : log.logIndex;
      const logIndex = Number.isFinite(logIndexRaw) ? logIndexRaw : 0;

      const blockNumberRaw = typeof log.blockNumber === 'string' ? parseInt(log.blockNumber, 16) : log.blockNumber;
      const blockNumber = Number.isFinite(blockNumberRaw) ? blockNumberRaw : null;
      const dataField = log.data;

      if (!txHash || !blockNumber || !Number.isFinite(blockNumber)) continue;

      let parsed;
      try {
        parsed = ethers.utils.defaultAbiCoder.decode(['uint256'], dataField);
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

    cursorAfter = currentTo;

    if (currentTo >= safeToBlock) break;
    currentFrom = currentTo + 1;
  }

  try {
    if (DepositScanLog) {
      await DepositScanLog.create({
        ...logBase,
        status: 'success',
        latest_block: latest,
        confirmations,
        safe_to_block: safeToBlock,
        cursor_before: cursor,
        cursor_after: cursorAfter,
        from_block: fromBlock,
        to_block: lastToBlock,
        rounds,
        logs_found: logsFound,
        credited_events: creditedCount,
        duration_ms: Date.now() - startedAt,
      });
    }
  } catch {}

  return { scanned: true, credited: creditedCount, logsFound, reason: reason || 'manual' };
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
  scanAndCreditUserUsdtDeposits: async () => {
    const err = new Error('Legacy deposit scanner is disabled (migrated to Moralis Streams).');
    err.code = 'DEPOSIT_SCANNER_DISABLED';
    throw err;
  },
  startBscDepositScannerScheduler: () => {},
};
