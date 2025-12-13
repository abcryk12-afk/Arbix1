const { ethers } = require('ethers');

let masterNode;

function getMasterNode() {
  const mnemonic = process.env.MASTER_WALLET_MNEMONIC;
  if (!mnemonic) {
    throw new Error('MASTER_WALLET_MNEMONIC is not configured');
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
