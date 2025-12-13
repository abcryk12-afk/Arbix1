const { Wallet, WalletKey } = require('../models');
const { deriveChildWallet } = require('../utils/hdWallet');
const { encrypt } = require('../utils/encryption');

async function ensureWalletForUser(user) {
  if (!user) {
    throw new Error('User is required');
  }

  // If user already has an address, just ensure wallet row exists
  if (user.walletAddress) {
    await Wallet.findOrCreate({
      where: { userId: user.id },
      defaults: { userId: user.id, balance: 0 },
    });
    return user.walletAddress;
  }

  // Check if wallet key already exists
  const existingKey = await WalletKey.findOne({ where: { userId: user.id } });
  if (existingKey) {
    if (!user.walletAddress) {
      user.walletAddress = existingKey.address;
      await user.save();
    }
    await Wallet.findOrCreate({
      where: { userId: user.id },
      defaults: { userId: user.id, balance: 0 },
    });
    return existingKey.address;
  }

  // Generate next index (start from 0) with basic retry to reduce race issues
  for (let attempt = 0; attempt < 5; attempt++) {
    const maxIndex = await WalletKey.max('pathIndex');
    const nextIndex = Number.isFinite(maxIndex) && maxIndex !== null ? Number(maxIndex) + 1 : 0;

    // Derive child wallet from master
    const { address, privateKey } = deriveChildWallet(nextIndex);
    const privateKeyEncrypted = encrypt(privateKey);

    // Ensure wallet row exists
    await Wallet.findOrCreate({
      where: { userId: user.id },
      defaults: { userId: user.id, balance: 0 },
    });

    try {
      // Save wallet key
      await WalletKey.create({
        userId: user.id,
        pathIndex: nextIndex,
        address,
        privateKeyEncrypted,
      });

      user.walletAddress = address;
      await user.save();

      return address;
    } catch (err) {
      // If unique constraint hit due to concurrent signup, retry
      if (err && (err.name === 'SequelizeUniqueConstraintError' || err.name === 'SequelizeValidationError')) {
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
