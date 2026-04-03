const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const { ethers } = require('ethers');

const PORT = Number(process.env.PORT || 4010);

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

function normalizeSeed(raw) {
  const s = String(raw || '').trim().replace(/\s+/g, ' ');
  if (!s) return '';
  return s;
}

function deriveWallet({ mnemonic, index, provider }) {
  const seed = normalizeSeed(mnemonic);
  if (!ethers.utils.isValidMnemonic(seed)) {
    const err = new Error('MASTER_SEED is invalid (expected 12/24-word mnemonic)');
    err.code = 'MASTER_SEED_INVALID';
    throw err;
  }

  const path = `m/44'/60'/0'/0/${index}`;
  const root = ethers.utils.HDNode.fromMnemonic(seed);
  const child = root.derivePath(path);
  return new ethers.Wallet(child.privateKey, provider);
}

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 value) returns (bool)',
  'function decimals() view returns (uint8)',
];

function nowIso() {
  return new Date().toISOString();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function keyFor({ wallet, index }) {
  return `${String(wallet || '').toLowerCase()}:${String(index)}`;
}

const inFlight = new Map();

async function sweep({ wallet, index }) {
  const rpcUrl = requireEnv('RPC_URL');
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

  const mainWalletAddress = requireEnv('MAIN_WALLET_ADDRESS');
  if (!ethers.utils.isAddress(mainWalletAddress)) {
    const err = new Error('MAIN_WALLET_ADDRESS is invalid');
    err.code = 'MAIN_WALLET_ADDRESS_INVALID';
    throw err;
  }

  const gasWalletAddress = requireEnv('GAS_WALLET_ADDRESS');
  const gasWalletPrivateKey = requireEnv('GAS_WALLET_PRIVATE_KEY');
  const usdtContractAddress = requireEnv('USDT_CONTRACT_ADDRESS');

  if (!ethers.utils.isAddress(gasWalletAddress)) {
    const err = new Error('GAS_WALLET_ADDRESS is invalid');
    err.code = 'GAS_WALLET_ADDRESS_INVALID';
    throw err;
  }

  if (!ethers.utils.isAddress(usdtContractAddress)) {
    const err = new Error('USDT_CONTRACT_ADDRESS is invalid');
    err.code = 'USDT_CONTRACT_ADDRESS_INVALID';
    throw err;
  }

  const fixedGasAmountBnb = String(process.env.FIXED_GAS_AMOUNT || '0.001').trim();
  const minUsdtThreshold = toNumberEnv('MIN_USDT_THRESHOLD', 5);

  const derived = deriveWallet({ mnemonic: requireEnv('MASTER_SEED'), index, provider });
  const derivedAddress = derived.address;

  if (ethers.utils.getAddress(wallet) !== ethers.utils.getAddress(derivedAddress)) {
    const err = new Error('Wallet does not match derived address for index');
    err.code = 'WALLET_INDEX_MISMATCH';
    throw err;
  }

  const gasSigner = new ethers.Wallet(gasWalletPrivateKey, provider);
  if (ethers.utils.getAddress(gasWalletAddress) !== ethers.utils.getAddress(gasSigner.address)) {
    const err = new Error('GAS_WALLET_ADDRESS does not match GAS_WALLET_PRIVATE_KEY');
    err.code = 'GAS_WALLET_MISMATCH';
    throw err;
  }

  const token = new ethers.Contract(ethers.utils.getAddress(usdtContractAddress), ERC20_ABI, provider);

  const [bnbBalanceWei, tokenBalanceRaw, decimalsRaw] = await Promise.all([
    provider.getBalance(derivedAddress),
    token.balanceOf(derivedAddress),
    token.decimals().catch(() => 18),
  ]);

  const decimals = Number(decimalsRaw);
  const tokenBalance = ethers.BigNumber.from(tokenBalanceRaw);
  const tokenHuman = Number(ethers.utils.formatUnits(tokenBalance, decimals));

  console.log('[sweep]', nowIso(), 'balances', {
    wallet: derivedAddress,
    index,
    bnb: ethers.utils.formatEther(bnbBalanceWei),
    usdt: Number.isFinite(tokenHuman) ? tokenHuman : null,
  });

  if (!Number.isFinite(tokenHuman) || tokenHuman < minUsdtThreshold) {
    return { ok: true, skipped: true, reason: 'below_threshold', tokenHuman };
  }

  const minGasWei = (() => {
    try {
      return ethers.utils.parseEther(fixedGasAmountBnb);
    } catch {
      return ethers.utils.parseEther('0.001');
    }
  })();

  if (bnbBalanceWei.lt(minGasWei)) {
    console.log('[sweep]', nowIso(), 'topping up gas', {
      to: derivedAddress,
      amount: fixedGasAmountBnb,
    });

    const tx = await gasSigner.sendTransaction({
      to: derivedAddress,
      value: minGasWei,
    });

    try {
      await tx.wait(1);
    } catch {
      await sleep(15000);
    }
  }

  await sleep(12000);

  const tokenWithSigner = token.connect(derived);

  const usdtBalanceUnits = await tokenWithSigner.balanceOf(derivedAddress);
  if (usdtBalanceUnits.isZero()) {
    return { ok: true, skipped: true, reason: 'no_balance_after_wait' };
  }

  console.log('[sweep]', nowIso(), 'sending usdt', {
    from: derivedAddress,
    to: ethers.utils.getAddress(mainWalletAddress),
    units: usdtBalanceUnits.toString(),
  });

  const tx = await tokenWithSigner.transfer(ethers.utils.getAddress(mainWalletAddress), usdtBalanceUnits);
  const receipt = await tx.wait(1);

  return {
    ok: true,
    txHash: receipt?.transactionHash || tx?.hash,
    sweptUnits: usdtBalanceUnits.toString(),
  };
}

const app = express();
app.use(express.json({ limit: '32kb' }));

app.post('/sweep', async (req, res) => {
  const wallet = String(req.body?.wallet || '').trim();
  const indexRaw = req.body?.index;
  const index = Number(indexRaw);

  if (!ethers.utils.isAddress(wallet)) {
    return res.status(400).json({ ok: false, error: 'Invalid wallet address' });
  }

  if (!Number.isFinite(index) || index < 0 || index > 10000000) {
    return res.status(400).json({ ok: false, error: 'Invalid wallet index' });
  }

  const k = keyFor({ wallet, index });
  if (inFlight.has(k)) {
    return res.status(202).json({ ok: true, queued: true, deduped: true });
  }

  const job = (async () => {
    try {
      return await sweep({ wallet, index: Math.floor(index) });
    } finally {
      inFlight.delete(k);
    }
  })();

  inFlight.set(k, job);

  try {
    const result = await job;
    return res.status(200).json(result);
  } catch (e) {
    console.error('[sweep]', nowIso(), 'failed', {
      wallet,
      index,
      code: e?.code,
      message: e?.message || String(e),
    });
    return res.status(500).json({ ok: false, error: e?.message || 'Sweep failed', code: e?.code || null });
  }
});

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'auto-sweep-worker', time: nowIso() });
});

app.listen(PORT, () => {
  console.log('[worker] auto-sweep-worker listening', { port: PORT });
});
