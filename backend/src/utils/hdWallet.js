const { ethers } = require('ethers');

let masterNode;

function walletConfigError(message, code) {
  const err = new Error(message);
  err.code = code || 'WALLET_CONFIG_ERROR';
  return err;
}

function getMasterNode() {
  const mnemonicRaw = process.env.MASTER_WALLET_MNEMONIC;
  const mnemonic = String(mnemonicRaw || '').trim().replace(/\s+/g, ' ');
  if (!mnemonic) {
    throw walletConfigError('MASTER_WALLET_MNEMONIC is not configured', 'MASTER_WALLET_MNEMONIC_MISSING');
  }

  if (!ethers.utils.isValidMnemonic(mnemonic)) {
    throw walletConfigError('MASTER_WALLET_MNEMONIC is invalid (check your 12/24 words)', 'MASTER_WALLET_MNEMONIC_INVALID');
  }
  if (!masterNode) {
    masterNode = ethers.utils.HDNode.fromMnemonic(mnemonic);
  }
  return masterNode;
}

function deriveChildWallet(index) {
  const root = getMasterNode();
  const path = `m/44'/60'/0'/0/${index}`;
  const child = root.derivePath(path);
  const wallet = new ethers.Wallet(child.privateKey);
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    path,
  };
}

module.exports = {
  deriveChildWallet,
};
