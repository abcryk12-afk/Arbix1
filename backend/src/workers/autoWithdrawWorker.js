const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env'), override: true });

const { ethers } = require('ethers');
const { Op } = require('sequelize');

const models = require('../models');

const { reportAutoWithdrawWorker, appendAutoWithdrawWorkerEvent } = require('../services/adminLogService');

const { sequelize, Wallet, Transaction, WithdrawalRequest, SiteSetting } = models;

function nowIso() {
  return new Date().toISOString();
}

async function reportWorkerPatch(patch) {
  try {
    await reportAutoWithdrawWorker({
      ...(patch && typeof patch === 'object' ? patch : {}),
      lastSeenAt: nowIso(),
      pid: process.pid,
    });
  } catch {}
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureWithdrawalSchema() {
  try {
    const [colsRaw] = await sequelize.query('SHOW COLUMNS FROM withdrawal_requests');
    const cols = Array.isArray(colsRaw) ? colsRaw : [];
    const colSet = new Set(cols.map((c) => String(c.Field || '').toLowerCase()).filter(Boolean));

    if (!colSet.has('network')) {
      await sequelize.query("ALTER TABLE withdrawal_requests ADD COLUMN network VARCHAR(50) NOT NULL DEFAULT 'BSC'");
    }
    if (!colSet.has('token')) {
      await sequelize.query("ALTER TABLE withdrawal_requests ADD COLUMN token VARCHAR(50) NOT NULL DEFAULT 'USDT'");
    }
    if (!colSet.has('auto_withdraw_enabled')) {
      await sequelize.query('ALTER TABLE withdrawal_requests ADD COLUMN auto_withdraw_enabled TINYINT(1) NULL');
    }

    const [statusRows] = await sequelize.query("SHOW COLUMNS FROM withdrawal_requests LIKE 'status'");
    const statusRow = Array.isArray(statusRows) && statusRows.length ? statusRows[0] : null;
    const rawType = statusRow?.Type ? String(statusRow.Type) : '';

    const existingValues = rawType.startsWith('enum(')
      ? rawType
          .slice(5, -1)
          .split(',')
          .map((s) => s.trim())
          .map((s) => s.replace(/^'/, '').replace(/'$/, ''))
          .filter(Boolean)
      : [];

    const desiredValues = ['pending', 'processing', 'completed', 'failed', 'approved', 'rejected'];
    const merged = Array.from(new Set([...existingValues, ...desiredValues]));

    if (merged.length && desiredValues.some((v) => !existingValues.includes(v))) {
      const enumSql = merged.map((v) => `'${v.replace(/'/g, "''")}'`).join(',');
      await sequelize.query(`ALTER TABLE withdrawal_requests MODIFY COLUMN status ENUM(${enumSql}) NOT NULL DEFAULT 'pending'`);
    }
  } catch {}
}

async function recoverStuckProcessingWithoutTx() {
  const staleMinutes = getStaleTxMinutes();
  const cutoff = new Date(Date.now() - staleMinutes * 60 * 1000);

  const rows = await WithdrawalRequest.findAll({
    where: {
      status: 'processing',
      tx_hash: { [Op.is]: null },
      [Op.and]: [sequelize.where(sequelize.col('updated_at'), { [Op.lt]: cutoff })],
    },
    order: [[sequelize.col('updated_at'), 'ASC']],
    limit: 25,
    raw: true,
  });

  if (!rows.length) return 0;

  let recovered = 0;
  for (const r of rows) {
    const id = Number(r.id);
    if (!Number.isFinite(id) || id <= 0) continue;
    await markFailed({ id, note: `Processing timed out (no tx hash after ${staleMinutes} minutes)` });
    recovered += 1;
  }

  return recovered;
}

function isEnabledEnvFlag(name, defaultValue = false) {
  const raw = process.env[name];
  if (raw == null) return defaultValue;
  return ['1', 'true', 'yes', 'on'].includes(String(raw).trim().toLowerCase());
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
  return Number.isFinite(n) && n >= 0 && n <= 77 ? Math.floor(n) : 18;
}

function getWithdrawConfirmations() {
  const raw = process.env.WITHDRAW_CONFIRMATIONS;
  const n = raw == null ? 3 : Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 3;
}

function getStaleTxMinutes() {
  const raw = process.env.WITHDRAW_TX_STALE_MINUTES;
  const n = raw == null ? 60 : Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 60;
}

function getLoopMs() {
  const raw = process.env.WITHDRAW_WORKER_LOOP_MS;
  const n = raw == null ? 15000 : Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 15000;
}

function getIdlePollMs() {
  const raw = process.env.WITHDRAW_WORKER_IDLE_POLL_MS;
  const n = raw == null ? 60000 : Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 60000;
}

function getMinBnbGasBufferWei() {
  const raw = process.env.WITHDRAW_MIN_BNB_GAS;
  const n = raw == null ? 0.003 : Number(raw);
  if (!Number.isFinite(n) || n <= 0) return ethers.utils.parseEther('0.003');
  try {
    return ethers.utils.parseEther(String(n));
  } catch {
    return ethers.utils.parseEther('0.003');
  }
}

async function getAutoWithdrawEnabled() {
  try {
    await SiteSetting.sync();
  } catch {}

  try {
    const row = await SiteSetting.findOne({ where: { key: 'auto_withdraw_enabled' }, raw: true });
    const raw = String(row?.value || '').trim().toLowerCase();
    return ['1', 'true', 'yes', 'on'].includes(raw);
  } catch {
    return false;
  }
}

function getWithdrawalWalletSigner(provider) {
  const mnemonicRaw = process.env.WITHDRAWAL_HD_MNEMONIC;
  const mnemonic = String(mnemonicRaw || '').trim().replace(/\s+/g, ' ');
  if (!mnemonic) {
    const err = new Error('WITHDRAWAL_HD_MNEMONIC is not configured');
    err.code = 'WITHDRAWAL_HD_MNEMONIC_MISSING';
    throw err;
  }

  if (!ethers.utils.isValidMnemonic(mnemonic)) {
    const err = new Error('WITHDRAWAL_HD_MNEMONIC is invalid (check your 12/24 words)');
    err.code = 'WITHDRAWAL_HD_MNEMONIC_INVALID';
    throw err;
  }

  const pathRaw = process.env.WITHDRAWAL_HD_DERIVATION_PATH;
  const derivationPath = String(pathRaw || "m/44'/60'/0'/0/0").trim();

  let wallet;
  try {
    const root = ethers.utils.HDNode.fromMnemonic(mnemonic);
    const child = root.derivePath(derivationPath);
    wallet = new ethers.Wallet(child.privateKey, provider);
  } catch (e) {
    const err = new Error('Failed to derive withdrawal wallet from mnemonic/derivation path');
    err.code = 'WITHDRAWAL_WALLET_DERIVE_FAILED';
    err.original = e;
    throw err;
  }

  const configuredAddress = String(process.env.WITHDRAWAL_WALLET_ADDRESS || '').trim();
  if (configuredAddress) {
    if (!ethers.utils.isAddress(configuredAddress)) {
      const err = new Error('WITHDRAWAL_WALLET_ADDRESS is invalid');
      err.code = 'WITHDRAWAL_WALLET_ADDRESS_INVALID';
      throw err;
    }

    const expected = ethers.utils.getAddress(configuredAddress);
    if (wallet.address !== expected) {
      const err = new Error('WITHDRAWAL_WALLET_ADDRESS does not match derived address from WITHDRAWAL_HD_MNEMONIC');
      err.code = 'WITHDRAWAL_WALLET_ADDRESS_MISMATCH';
      throw err;
    }
  }

  const network = String(process.env.WITHDRAWAL_NETWORK || 'BSC').trim().toUpperCase();
  if (network !== 'BSC') {
    const err = new Error('WITHDRAWAL_NETWORK must be BSC');
    err.code = 'WITHDRAWAL_NETWORK_UNSUPPORTED';
    throw err;
  }

  return wallet;
}

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 value) returns (bool)',
];

async function markFailed({ id, note }) {
  await sequelize.transaction(async (t) => {
    const reqRow = await WithdrawalRequest.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!reqRow) return;

    if (String(reqRow.status || '') !== 'processing' && String(reqRow.status || '') !== 'pending') {
      return;
    }

    reqRow.status = 'failed';
    if (!reqRow.admin_note) {
      reqRow.admin_note = String(note || 'Auto withdrawal failed');
    }
    await reqRow.save({ transaction: t });
  });
}

async function finalizeProcessing({ provider, confirmations }) {
  const rows = await WithdrawalRequest.findAll({
    where: {
      status: 'processing',
      tx_hash: { [Op.ne]: null },
    },
    order: [[sequelize.col('created_at'), 'ASC']],
    limit: 25,
    raw: true,
  });

  if (!rows.length) return 0;

  let finalized = 0;

  for (const r of rows) {
    const id = Number(r.id);
    const txHash = String(r.tx_hash || '').trim();
    if (!Number.isFinite(id) || id <= 0 || !txHash) continue;

    const token = String(r.token || 'USDT').toUpperCase();
    const network = String(r.network || 'BSC').toUpperCase();
    if (token !== 'USDT' || network !== 'BSC') {
      await markFailed({ id, note: 'Unsupported token/network for auto withdrawal' });
      finalized += 1;
      continue;
    }

    try {
      const receipt = await provider.getTransactionReceipt(txHash);
      if (!receipt) {
        const tx = await provider.getTransaction(txHash);
        if (tx) continue;

        const updatedAtMs = r.updated_at ? new Date(r.updated_at).getTime() : 0;
        const staleMinutes = getStaleTxMinutes();
        if (updatedAtMs && Date.now() - updatedAtMs > staleMinutes * 60 * 1000) {
          await markFailed({ id, note: `Broadcast not found after ${staleMinutes} minutes` });
          finalized += 1;
        }
        continue;
      }
      if (confirmations > 0 && Number(receipt.confirmations || 0) < confirmations) continue;

      if (receipt.status !== 1) {
        await markFailed({ id, note: 'On-chain withdrawal transaction failed' });
        finalized += 1;
        continue;
      }

      await sequelize.transaction(async (t) => {
        const reqRow = await WithdrawalRequest.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
        if (!reqRow) return;
        if (String(reqRow.status || '') !== 'processing') return;
        if (String(reqRow.tx_hash || '').trim() !== txHash) return;

        const userId = Number(reqRow.user_id);
        const amount = Number(reqRow.amount || 0);
        if (!Number.isFinite(userId) || userId <= 0) return;
        if (!Number.isFinite(amount) || amount <= 0) return;

        let wallet = await Wallet.findOne({ where: { user_id: userId }, transaction: t, lock: t.LOCK.UPDATE });
        if (!wallet) {
          wallet = await Wallet.create({ user_id: userId, balance: 0 }, { transaction: t });
          wallet = await Wallet.findOne({ where: { user_id: userId }, transaction: t, lock: t.LOCK.UPDATE });
        }

        const currentBalance = Number(wallet.balance || 0);
        if (!Number.isFinite(currentBalance) || currentBalance < amount) {
          reqRow.status = 'failed';
          if (!reqRow.admin_note) {
            reqRow.admin_note = 'User wallet insufficient at settlement time';
          }
          await reqRow.save({ transaction: t });
          return;
        }

        wallet.balance = currentBalance - amount;
        await wallet.save({ transaction: t });

        await Transaction.create(
          {
            user_id: userId,
            type: 'withdraw',
            amount,
            created_by: 'auto_withdraw',
            note: `Auto withdrawal completed (Request #${reqRow.id})`,
          },
          { transaction: t },
        );

        reqRow.status = 'completed';
        if (!reqRow.admin_note) {
          reqRow.admin_note = 'Auto withdrawal completed';
        }
        await reqRow.save({ transaction: t });
      });

      finalized += 1;
    } catch (e) {
      // ignore transient provider errors
    }
  }

  return finalized;
}

async function processOnePending({ provider, signer, contract, confirmations, id }) {
  const autoEnabled = await getAutoWithdrawEnabled();
  if (!autoEnabled) return { didWork: false };

  const lockResult = await sequelize.transaction(async (t) => {
    const reqRow = await WithdrawalRequest.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!reqRow) return { ok: false, reason: 'missing' };

    if (String(reqRow.status || '') !== 'pending') return { ok: false, reason: 'not_pending' };
    if (reqRow.tx_hash) return { ok: false, reason: 'has_tx' };

    const token = String(reqRow.token || 'USDT').toUpperCase();
    const network = String(reqRow.network || 'BSC').toUpperCase();
    if (token !== 'USDT' || network !== 'BSC') {
      reqRow.status = 'failed';
      if (!reqRow.admin_note) reqRow.admin_note = 'Unsupported token/network for auto withdrawal';
      await reqRow.save({ transaction: t });
      return { ok: false, reason: 'unsupported' };
    }

    if (reqRow.auto_withdraw_enabled !== true) {
      return { ok: false, reason: 'auto_disabled_at_request' };
    }

    const toAddress = String(reqRow.address || '').trim();
    if (!ethers.utils.isAddress(toAddress)) {
      reqRow.status = 'failed';
      if (!reqRow.admin_note) reqRow.admin_note = 'Invalid withdrawal address';
      await reqRow.save({ transaction: t });
      return { ok: false, reason: 'invalid_address' };
    }

    const amount = Number(reqRow.amount || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      reqRow.status = 'failed';
      if (!reqRow.admin_note) reqRow.admin_note = 'Invalid withdrawal amount';
      await reqRow.save({ transaction: t });
      return { ok: false, reason: 'invalid_amount' };
    }

    reqRow.status = 'processing';
    if (!reqRow.admin_note) {
      reqRow.admin_note = 'Auto withdrawal processing';
    }
    await reqRow.save({ transaction: t });

    return {
      ok: true,
      toAddress,
      amount,
    };
  });

  if (!lockResult.ok) return { didWork: false };

  const { toAddress, amount } = lockResult;

  try {
    const decimals = getTokenDecimals();
    const amountUnits = ethers.utils.parseUnits(Number(amount).toFixed(8), decimals);

    const fromAddress = await signer.getAddress();

    const [bnbBalanceWei, tokenBalanceUnits] = await Promise.all([
      provider.getBalance(fromAddress),
      contract.balanceOf(fromAddress),
    ]);

    if (tokenBalanceUnits.lt(amountUnits)) {
      await markFailed({ id, note: 'Withdrawal wallet has insufficient USDT balance' });
      return { didWork: true };
    }

    const minGasWei = getMinBnbGasBufferWei();
    if (bnbBalanceWei.lt(minGasWei)) {
      await markFailed({ id, note: 'Withdrawal wallet has insufficient BNB for gas' });
      return { didWork: true };
    }

    const txRequest = await contract.populateTransaction.transfer(toAddress, amountUnits);
    const [network, nonce, gasPrice, gasEstimate] = await Promise.all([
      provider.getNetwork(),
      provider.getTransactionCount(fromAddress, 'pending'),
      provider.getGasPrice(),
      contract.estimateGas.transfer(toAddress, amountUnits).catch(() => ethers.BigNumber.from(200000)),
    ]);

    const gasLimit = ethers.BigNumber.from(gasEstimate).mul(120).div(100);

    const signedTx = await signer.signTransaction({
      ...txRequest,
      chainId: network.chainId,
      nonce,
      gasPrice,
      gasLimit,
    });
    const txHash = ethers.utils.keccak256(signedTx);

    await sequelize.transaction(async (t) => {
      const reqRow = await WithdrawalRequest.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
      if (!reqRow) return;
      if (String(reqRow.status || '') !== 'processing') return;
      if (reqRow.tx_hash) return;

      reqRow.tx_hash = txHash;
      await reqRow.save({ transaction: t });
    });

    try {
      await provider.sendTransaction(signedTx);
    } catch (e) {
      // If we can't confirm broadcast, keep request in processing with tx_hash.
    }

    try {
      const receipt = await provider.waitForTransaction(txHash, confirmations);
      if (!receipt || receipt.status !== 1) {
        await markFailed({ id, note: 'On-chain withdrawal transaction failed' });
        return { didWork: true };
      }

      await sequelize.transaction(async (t) => {
        const reqRow = await WithdrawalRequest.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
        if (!reqRow) return;
        if (String(reqRow.status || '') !== 'processing') return;
        if (String(reqRow.tx_hash || '').trim() !== txHash) return;

        const userId = Number(reqRow.user_id);
        const amountNum = Number(reqRow.amount || 0);
        if (!Number.isFinite(userId) || userId <= 0) return;
        if (!Number.isFinite(amountNum) || amountNum <= 0) return;

        let wallet = await Wallet.findOne({ where: { user_id: userId }, transaction: t, lock: t.LOCK.UPDATE });
        if (!wallet) {
          wallet = await Wallet.create({ user_id: userId, balance: 0 }, { transaction: t });
          wallet = await Wallet.findOne({ where: { user_id: userId }, transaction: t, lock: t.LOCK.UPDATE });
        }

        const currentBalance = Number(wallet.balance || 0);
        if (!Number.isFinite(currentBalance) || currentBalance < amountNum) {
          reqRow.status = 'failed';
          if (!reqRow.admin_note) {
            reqRow.admin_note = 'User wallet insufficient at settlement time';
          }
          await reqRow.save({ transaction: t });
          return;
        }

        wallet.balance = currentBalance - amountNum;
        await wallet.save({ transaction: t });

        await Transaction.create(
          {
            user_id: userId,
            type: 'withdraw',
            amount: amountNum,
            created_by: 'auto_withdraw',
            note: `Auto withdrawal completed (Request #${reqRow.id})`,
          },
          { transaction: t },
        );

        reqRow.status = 'completed';
        if (!reqRow.admin_note) {
          reqRow.admin_note = 'Auto withdrawal completed';
        }
        await reqRow.save({ transaction: t });
      });

      return { didWork: true };
    } catch (e) {
      // If we already broadcasted and saved tx_hash, do not mark failed here.
      // We'll finalize after confirmations in a later pass.
      return { didWork: true };
    }
  } catch (e) {
    await markFailed({ id, note: `Auto withdrawal failed: ${String(e?.message || e)}` });
    return { didWork: true };
  }
}

async function processPendingWithdrawals({ provider, signer, contract, confirmations }) {
  const autoEnabled = await getAutoWithdrawEnabled();
  if (!autoEnabled) return { processed: 0, skipped: true };

  const candidates = await WithdrawalRequest.findAll({
    where: {
      status: 'pending',
      tx_hash: { [Op.is]: null },
      token: 'USDT',
      network: 'BSC',
      auto_withdraw_enabled: true,
    },
    order: [[sequelize.col('created_at'), 'ASC']],
    limit: 10,
    raw: true,
  });

  if (!candidates.length) return { processed: 0, skipped: false };

  let processed = 0;
  for (const r of candidates) {
    const id = Number(r.id);
    if (!Number.isFinite(id) || id <= 0) continue;
    const res = await processOnePending({ provider, signer, contract, confirmations, id });
    if (res?.didWork) processed += 1;
  }

  return { processed, skipped: false };
}

async function main() {
  await sequelize.sync();
  await ensureWithdrawalSchema();

  const provider = getBscProvider();
  const net = await provider.getNetwork();
  if (Number(net?.chainId) !== 56) {
    throw new Error(`BSC provider chainId must be 56, got ${String(net?.chainId)}`);
  }
  const signer = getWithdrawalWalletSigner(provider);

  const tokenAddress = getUsdtContractAddress();
  const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);

  const confirmations = getWithdrawConfirmations();
  const loopMs = getLoopMs();
  const idleMs = getIdlePollMs();

  await reportWorkerPatch({
    startedAt: nowIso(),
    withdrawalAddress: signer.address,
    tokenContract: tokenAddress,
    confirmations,
    loopMs,
    idleMs,
    lastError: null,
  });

  await appendAutoWithdrawWorkerEvent('info', 'auto-withdraw worker started', {
    withdrawalAddress: signer.address,
    tokenContract: tokenAddress,
    confirmations,
    loopMs,
    idleMs,
  }).catch(() => {});

  if (isEnabledEnvFlag('WITHDRAW_DEBUG', false)) {
    console.log('[auto-withdraw] worker started', {
      withdrawalAddress: signer.address,
      token: 'USDT',
      network: 'BSC',
      tokenContract: tokenAddress,
      confirmations,
      loopMs,
      idleMs,
    });
  }

  while (true) {
    let didWork = false;

    await reportWorkerPatch(null);

    try {
      const recovered = await recoverStuckProcessingWithoutTx();
      if (recovered) didWork = true;
      if (recovered) {
        await appendAutoWithdrawWorkerEvent('warn', `Recovered ${recovered} stuck processing withdrawals (no tx hash)`).catch(() => {});
      }
    } catch (e) {
      console.error('Auto-withdraw recovery failed:', e?.message || e);
      await appendAutoWithdrawWorkerEvent('error', `Auto-withdraw recovery failed: ${String(e?.message || e)}`).catch(() => {});
    }

    try {
      const finalized = await finalizeProcessing({ provider, confirmations });
      if (finalized) didWork = true;
      if (finalized) {
        await appendAutoWithdrawWorkerEvent('info', `Finalized ${finalized} auto-withdrawals`).catch(() => {});
      }
    } catch (e) {
      console.error('Auto-withdraw finalize failed:', e?.message || e);
      await appendAutoWithdrawWorkerEvent('error', `Auto-withdraw finalize failed: ${String(e?.message || e)}`).catch(() => {});
    }

    try {
      const pendingRes = await processPendingWithdrawals({ provider, signer, contract, confirmations });
      if (pendingRes?.processed) didWork = true;
      if (pendingRes?.processed) {
        await appendAutoWithdrawWorkerEvent('info', `Processed ${Number(pendingRes.processed || 0)} pending auto-withdrawals`).catch(() => {});
      }
    } catch (e) {
      console.error('Auto-withdraw processing failed:', e?.message || e);
      await appendAutoWithdrawWorkerEvent('error', `Auto-withdraw processing failed: ${String(e?.message || e)}`).catch(() => {});
    }

    const sleepMs = didWork ? loopMs : idleMs;
    await sleep(sleepMs);
  }
}

main().catch((err) => {
  console.error('autoWithdrawWorker fatal:', err);
  process.exit(1);
});
