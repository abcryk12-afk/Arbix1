const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const fs = require('fs');
const fsp = require('fs/promises');
const express = require('express');
const { ethers } = require('ethers');

const PORT = Number(process.env.PORT || 4020);

const ERC20_ABI = [
  'function transfer(address to, uint256 value) returns (bool)',
  'function decimals() view returns (uint8)',
];

function nowIso() {
  return new Date().toISOString();
}

function isEnabled(raw, fallback) {
  const v = String(raw ?? '').trim().toLowerCase();
  if (!v) return Boolean(fallback);
  return ['1', 'true', 'yes', 'on'].includes(v);
}

function requireEnv(name) {
  const v = String(process.env[name] || '').trim();
  if (!v) {
    const err = new Error(`${name} is not configured`);
    err.code = 'ENV_MISSING';
    throw err;
  }
  return v;
}

function toNumberEnv(name, fallback) {
  const raw = process.env[name];
  const n = raw == null ? Number(fallback) : Number(raw);
  return Number.isFinite(n) ? n : Number(fallback);
}

function safeJsonParse(raw, fallback) {
  try {
    if (raw == null) return fallback;
    const s = typeof raw === 'string' ? raw : JSON.stringify(raw);
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}

function normalizeRules(rulesRaw) {
  const rules = Array.isArray(rulesRaw) ? rulesRaw : [];
  const out = [];
  for (const r of rules) {
    const address = String(r?.address || '').trim();
    const percentNum = typeof r?.percent === 'number' ? r.percent : Number(r?.percent);
    if (!ethers.utils.isAddress(address)) continue;
    if (!Number.isFinite(percentNum) || percentNum <= 0) continue;

    const bps = Math.round(percentNum * 100);
    if (!Number.isFinite(bps) || bps <= 0) continue;

    out.push({ address: ethers.utils.getAddress(address), bps, percent: percentNum });
  }
  return out;
}

const stateDir = path.join(__dirname, '..', 'data');
const processedFile = path.join(stateDir, 'processed_txhashes.txt');
const processed = new Set();

async function ensureStateLoaded() {
  try {
    if (!fs.existsSync(stateDir)) {
      await fsp.mkdir(stateDir, { recursive: true });
    }
  } catch {}

  try {
    const txt = await fsp.readFile(processedFile, 'utf8');
    const lines = String(txt || '')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    for (const l of lines) processed.add(l.toLowerCase());
  } catch {}
}

async function markProcessed(txHash) {
  const key = String(txHash || '').trim().toLowerCase();
  if (!key) return;
  if (processed.has(key)) return;
  processed.add(key);
  try {
    await fsp.appendFile(processedFile, `${key}\n`, 'utf8');
  } catch {}
}

function isProcessed(txHash) {
  const key = String(txHash || '').trim().toLowerCase();
  return Boolean(key) && processed.has(key);
}

async function executeSplit({ amountHuman, txHash }) {
  const enabled = isEnabled(process.env.SPLIT_WORKER_ENABLED, false);
  if (!enabled) {
    return { ok: true, skipped: true, reason: 'disabled' };
  }

  const minThreshold = toNumberEnv('MIN_SPLIT_THRESHOLD', 5);
  const amountN = Number(amountHuman);
  if (!Number.isFinite(amountN) || amountN <= 0) {
    return { ok: false, error: 'Invalid amount' };
  }

  if (amountN < minThreshold) {
    return { ok: true, skipped: true, reason: 'below_threshold', amount: amountHuman, minThreshold };
  }

  if (isProcessed(txHash)) {
    return { ok: true, skipped: true, reason: 'duplicate', txHash };
  }

  const rpcUrl = requireEnv('RPC_URL');
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

  const mainWalletAddress = requireEnv('MAIN_WALLET_ADDRESS');
  const mainWalletPrivateKey = requireEnv('MAIN_WALLET_PRIVATE_KEY');
  const usdtContractAddress = requireEnv('USDT_CONTRACT_ADDRESS');

  if (!ethers.utils.isAddress(mainWalletAddress)) {
    const err = new Error('MAIN_WALLET_ADDRESS is invalid');
    err.code = 'MAIN_WALLET_ADDRESS_INVALID';
    throw err;
  }

  if (!ethers.utils.isAddress(usdtContractAddress)) {
    const err = new Error('USDT_CONTRACT_ADDRESS is invalid');
    err.code = 'USDT_CONTRACT_ADDRESS_INVALID';
    throw err;
  }

  const signer = new ethers.Wallet(mainWalletPrivateKey, provider);
  if (ethers.utils.getAddress(mainWalletAddress) !== ethers.utils.getAddress(signer.address)) {
    const err = new Error('MAIN_WALLET_ADDRESS does not match MAIN_WALLET_PRIVATE_KEY');
    err.code = 'MAIN_WALLET_MISMATCH';
    throw err;
  }

  const token = new ethers.Contract(ethers.utils.getAddress(usdtContractAddress), ERC20_ABI, signer);

  let decimals = 6;
  try {
    const d = await token.decimals();
    const n = Number(d);
    if (Number.isFinite(n) && n > 0 && n <= 18) decimals = n;
  } catch {}

  const amountUnits = ethers.utils.parseUnits(String(amountHuman), decimals);
  if (amountUnits.lte(0)) {
    return { ok: false, error: 'Invalid amount units' };
  }

  const rulesRaw = safeJsonParse(process.env.SPLIT_RULES, []);
  const rules = normalizeRules(rulesRaw);
  if (!rules.length) {
    return { ok: true, skipped: true, reason: 'no_rules' };
  }

  const totalBps = rules.reduce((sum, r) => sum + r.bps, 0);
  if (totalBps > 10000) {
    return { ok: false, error: 'Total percent exceeds 100' };
  }

  console.log('[split]', nowIso(), 'start', {
    txHash,
    amountHuman: String(amountHuman),
    decimals,
    rules: rules.map((r) => ({ address: r.address, percent: r.percent })),
  });

  const results = [];
  for (const r of rules) {
    const share = amountUnits.mul(r.bps).div(10000);
    if (share.lte(0)) {
      results.push({ address: r.address, percent: r.percent, skipped: true, reason: 'zero_share' });
      continue;
    }

    try {
      console.log('[split]', nowIso(), 'transfer', {
        to: r.address,
        units: share.toString(),
      });

      const tx = await token.transfer(r.address, share);
      let receipt = null;
      try {
        receipt = await tx.wait(1);
      } catch {
        // do not crash
      }

      results.push({
        address: r.address,
        percent: r.percent,
        units: share.toString(),
        txHash: receipt?.transactionHash || tx?.hash || null,
        ok: true,
      });
    } catch (e) {
      console.error('[split]', nowIso(), 'transfer failed', {
        to: r.address,
        code: e?.code || null,
        message: e?.message || String(e),
      });
      results.push({ address: r.address, percent: r.percent, units: share.toString(), ok: false, error: e?.message || String(e) });
    }
  }

  await markProcessed(txHash);

  console.log('[split]', nowIso(), 'done', {
    txHash,
    results: results.map((r) => ({ address: r.address, ok: r.ok, txHash: r.txHash || null })),
  });

  return { ok: true, txHash, processed: true, results };
}

const app = express();
app.use(express.json({ limit: '32kb' }));

app.post('/split', async (req, res) => {
  const amount = req.body?.amount;
  const txHash = String(req.body?.txHash || '').trim();

  if (!txHash || !/^0x([0-9a-fA-F]{64})$/.test(txHash)) {
    return res.status(400).json({ ok: false, error: 'Invalid txHash' });
  }

  const amountHuman = String(amount || '').trim();
  if (!amountHuman) {
    return res.status(400).json({ ok: false, error: 'amount is required' });
  }

  try {
    const result = await executeSplit({ amountHuman, txHash });
    return res.status(200).json(result);
  } catch (e) {
    console.error('[split]', nowIso(), 'failed', { code: e?.code || null, message: e?.message || String(e) });
    return res.status(500).json({ ok: false, error: e?.message || 'Split failed', code: e?.code || null });
  }
});

app.get('/health', async (req, res) => {
  res.json({ ok: true, service: 'split-worker', time: nowIso() });
});

ensureStateLoaded()
  .then(() => {
    app.listen(PORT, () => {
      console.log('[worker] split-worker listening', { port: PORT });
    });
  })
  .catch((err) => {
    console.error('Failed to initialize split-worker state:', err);
    process.exit(1);
  });
