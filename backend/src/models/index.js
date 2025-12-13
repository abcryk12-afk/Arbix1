const sequelize = require('../config/db');
const User = require('./User');
const Wallet = require('./Wallet');
const Transaction = require('./Transaction');
const WalletKey = require('./WalletKey');

User.hasOne(Wallet, { foreignKey: 'userId', as: 'wallet' });
Wallet.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions' });
Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasOne(WalletKey, { foreignKey: 'userId', as: 'walletKey' });
WalletKey.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  sequelize,
  User,
  Wallet,
  Transaction,
  WalletKey,
};
