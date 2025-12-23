const sequelize = require('../config/db');
const User = require('./User');
const Wallet = require('./Wallet');
const Transaction = require('./Transaction');
const WalletKey = require('./WalletKey');
const UserPackage = require('./UserPackage');
const WithdrawalRequest = require('./WithdrawalRequest');
const SiteSetting = require('./SiteSetting');

User.hasOne(Wallet, { foreignKey: 'user_id', as: 'wallet' });
Wallet.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Transaction, { foreignKey: 'user_id', as: 'transactions' });
Transaction.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasOne(WalletKey, { foreignKey: 'user_id', as: 'walletKey' });
WalletKey.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(UserPackage, { foreignKey: 'user_id', as: 'packages' });
UserPackage.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(WithdrawalRequest, { foreignKey: 'user_id', as: 'withdrawalRequests' });
WithdrawalRequest.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  sequelize,
  User,
  Wallet,
  Transaction,
  WalletKey,
  UserPackage,
  WithdrawalRequest,
  SiteSetting,
};
