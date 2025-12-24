const { Wallet, WalletKey, User } = require('../models');
const { deriveChildWallet } = require('../utils/hdWallet');
const { encrypt } = require('../utils/encryption');

const isSchemaError = (err) => {
  const code = err?.original?.code || err?.parent?.code || err?.code;
  const msg = String(err?.original?.message || err?.message || '');
  return (
    code === 'ER_NO_SUCH_TABLE' ||
    code === 'ER_BAD_FIELD_ERROR' ||
    msg.toLowerCase().includes('unknown column')
  );
};

async function ensureWalletForUser(user, options = {}) {
  if (!user) {
    throw new Error('User is required');
  }

  const transaction = options.transaction;

  const syncWalletSchema = async () => {
    await Promise.all([
      User.sync({ alter: true }),
      Wallet.sync({ alter: true }),
      WalletKey.sync({ alter: true }),
    ]);
  };

  // If user already has an address, just ensure wallet row exists
  if (user.wallet_public_address) {
    await Wallet.findOrCreate({
      where: { user_id: user.id },
      defaults: { user_id: user.id, balance: 0 },
      transaction,
    });
    return user.wallet_public_address;
  }

  // Check if wallet key already exists
  let existingKey;
  try {
    existingKey = await WalletKey.findOne({ where: { user_id: user.id }, transaction });
  } catch (err) {
    if (isSchemaError(err)) {
      await syncWalletSchema();
      existingKey = await WalletKey.findOne({ where: { user_id: user.id }, transaction });
    } else {
      throw err;
    }
  }
  if (existingKey) {
    if (!user.wallet_public_address) {
      user.wallet_public_address = existingKey.address;
      await user.save({ transaction });
    }
    await Wallet.findOrCreate({
      where: { user_id: user.id },
      defaults: { user_id: user.id, balance: 0 },
      transaction,
    });
    return existingKey.address;
  }

  // Generate next index (start from 0) with basic retry to reduce race issues
  for (let attempt = 0; attempt < 5; attempt++) {
    let maxIndex;
    try {
      maxIndex = await WalletKey.max('pathIndex', { transaction });
    } catch (err) {
      if (isSchemaError(err)) {
        await syncWalletSchema();
        maxIndex = await WalletKey.max('pathIndex', { transaction });
      } else {
        throw err;
      }
    }
    const nextIndex = Number.isFinite(maxIndex) && maxIndex !== null ? Number(maxIndex) + 1 : 0;

    // Derive child wallet from master
    let address;
    let privateKey;
    try {
      ({ address, privateKey } = deriveChildWallet(nextIndex));
    } catch (err) {
      err.code = err.code || 'WALLET_DERIVATION_FAILED';
      throw err;
    }

    let privateKeyEncrypted;
    try {
      privateKeyEncrypted = encrypt(privateKey);
    } catch (err) {
      err.code = err.code || 'WALLET_ENCRYPTION_FAILED';
      throw err;
    }

    // Ensure wallet row exists
    await Wallet.findOrCreate({
      where: { user_id: user.id },
      defaults: { user_id: user.id, balance: 0 },
      transaction,
    });

    try {
      // Save wallet key
      await WalletKey.create({
        user_id: user.id,
        pathIndex: nextIndex,
        address,
        privateKeyEncrypted,
      }, { transaction });

      user.wallet_public_address = address;
      await user.save({ transaction });

      return address;
    } catch (err) {
      // If unique constraint hit due to concurrent signup, retry
      if (err && (err.name === 'SequelizeUniqueConstraintError' || err.name === 'SequelizeValidationError')) {
        continue;
      }

      if (isSchemaError(err)) {
        await syncWalletSchema();
        continue;
      }
      throw err;
    }
  }

  throw new Error('Failed to generate wallet keys after retries');
}

module.exports = {
  ensureWalletForUser,
};
