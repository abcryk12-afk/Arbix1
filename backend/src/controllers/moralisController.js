const { ethers } = require('ethers');
const { Op } = require('sequelize');
const { User, DepositRequest, ChainDepositEvent, sequelize } = require('../models');

const USDT_BSC_ADDRESS = String(
  process.env.USDT_BSC_ADDRESS || '0x55d398326f99059ff775485246999027b3197955',
).toLowerCase();

function getMoralisSignatureSecrets() {
  const raw = [
    String(process.env.MORALIS_STREAM_SECRET || '').trim(),
    String(process.env.MORALIS_STREAMS_SECRET || '').trim(),
    String(process.env.MORALIS_API_KEY || '').trim(),
  ].filter(Boolean);

  return Array.from(new Set(raw));
}

function getMoralisStreamSecretsOnly() {
  const raw = [
    String(process.env.MORALIS_STREAM_SECRET || '').trim(),
    String(process.env.MORALIS_STREAMS_SECRET || '').trim(),
  ].filter(Boolean);
  return Array.from(new Set(raw));
}

function isBscChainId(chainId) {
  if (chainId == null) return false;
  const raw = String(chainId).trim().toLowerCase();
  if (!raw) return false;
  if (raw.startsWith('0x')) {
    const n = parseInt(raw, 16);
    return Number.isFinite(n) && n === 56;
  }
  const n = Number(raw);
  return Number.isFinite(n) && Math.floor(n) === 56;
}

function verifyMoralisSignature({ rawBody, body, signature, secret }) {
  if (!signature) {
    const err = new Error('Signature not provided');
    err.code = 'MORALIS_SIGNATURE_MISSING';
    throw err;
  }

  const secrets = Array.isArray(secret) ? secret : secret ? [secret] : [];
  if (!secrets.length) {
    const err = new Error('Moralis signature secret is not configured');
    err.code = 'MORALIS_SECRET_MISSING';
    throw err;
  }

  const sigLower = String(signature).toLowerCase();
  const payload = typeof rawBody === 'string' && rawBody.length
    ? rawBody
    : JSON.stringify(body);

  for (const s of secrets) {
    const generated = ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes(`${payload}${s}`),
    );

    if (String(generated).toLowerCase() === sigLower) {
      return;
    }
  }

  const err = new Error('Invalid Moralis signature');
  err.code = 'MORALIS_SIGNATURE_INVALID';
  throw err;
}

function parseBlockNumber(block) {
  const raw = block && typeof block === 'object' ? block.number : null;
  if (raw == null) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return Math.floor(n);
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

async function findUserIdByAddress(addressLower) {
  const user = await User.findOne({
    where: sequelize.where(
      sequelize.fn('LOWER', sequelize.col('wallet_public_address')),
      addressLower,
    ),
    attributes: ['id'],
    raw: true,
  });
  return user?.id ? Number(user.id) : null;
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

exports.moralisWebhook = async (req, res) => {
  try {
    const streamSecrets = getMoralisStreamSecretsOnly();
    const secret = getMoralisSignatureSecrets();
    const signature = req.headers['x-signature'];

    // Bootstrap mode:
    // Moralis verifies your webhook URL *before* you have a stream/secret.
    // During that phase we must return 200 OK.
    if (!Array.isArray(streamSecrets) || !streamSecrets.length) {
      return res.status(200).json({
        success: true,
        ready: true,
        message: 'Moralis webhook endpoint is ready. Set MORALIS_STREAM_SECRET (or MORALIS_STREAMS_SECRET) to enable signature verification and ingestion.',
      });
    }
    if (!signature) {
      return res.status(200).json({ success: true, ready: true, ignored: true });
    }

    verifyMoralisSignature({ rawBody: req.rawBody, body: req.body, signature, secret });

    const payload = req.body || {};

    if (!isBscChainId(payload.chainId)) {
      return res.status(200).json({ success: true, ignored: true });
    }

    const minDeposit = Number(process.env.MIN_DEPOSIT_USDT || 9);

    const transfers = Array.isArray(payload.erc20Transfers) ? payload.erc20Transfers : [];
    const blockNumber = parseBlockNumber(payload.block);

    let stored = 0;
    let skipped = 0;

    for (const t of transfers) {
      const tokenAddress = String(t?.tokenAddress || '').toLowerCase();
      if (!tokenAddress || tokenAddress !== USDT_BSC_ADDRESS) {
        skipped++;
        continue;
      }

      const to = String(t?.to || '').trim();
      const txHash = String(t?.transactionHash || '').trim();
      const logIndexRaw = t?.logIndex;
      const value = t?.value;
      const decimals = t?.tokenDecimals;

      const toLower = to ? to.toLowerCase() : '';
      const logIndex = Number(logIndexRaw);

      if (!toLower || !txHash || !Number.isFinite(logIndex) || logIndex < 0 || blockNumber == null) {
        skipped++;
        continue;
      }

      const amount = formatTokenAmount({ value, decimals });
      if (amount == null || !Number.isFinite(amount) || amount <= 0 || amount < minDeposit) {
        skipped++;
        continue;
      }

      const userId = await findUserIdByAddress(toLower);
      if (!userId) {
        skipped++;
        continue;
      }

      const [row, created] = await ChainDepositEvent.findOrCreate({
        where: {
          tx_hash: txHash,
          log_index: Math.floor(logIndex),
        },
        defaults: {
          chain: 'BSC',
          token: 'USDT',
          user_id: userId,
          address: toLower,
          amount,
          tx_hash: txHash,
          log_index: Math.floor(logIndex),
          block_number: blockNumber,
          credited: false,
          credited_at: null,
        },
      });

      if (!created) {
        if (!row.user_id) {
          row.user_id = userId;
        }
        if (!row.address) {
          row.address = toLower;
        }
        if (!row.block_number && blockNumber != null) {
          row.block_number = blockNumber;
        }
        await row.save();
      }

      await attachTxHashToLatestPendingDepositRequest({
        userId,
        addressLower: toLower,
        txHash,
      });

      stored++;
    }

    return res.status(200).json({ success: true, stored, skipped });
  } catch (error) {
    const code = error?.code;
    if (code === 'MORALIS_SIGNATURE_MISSING' || code === 'MORALIS_SIGNATURE_INVALID') {
      return res.status(401).json({ success: false, message: error.message });
    }

    console.error('Moralis webhook error:', error);
    return res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
};
