const sequelize = require('../config/db');
const User = require('./User');
const Wallet = require('./Wallet');
const Transaction = require('./Transaction');
const WalletKey = require('./WalletKey');
const UserPackage = require('./UserPackage');
const WithdrawalRequest = require('./WithdrawalRequest');
const SiteSetting = require('./SiteSetting');
const DepositRequest = require('./DepositRequest');
const Notification = require('./Notification');
const ChainDepositEvent = require('./ChainDepositEvent');
const DepositScanLog = require('./DepositScanLog');

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

User.hasMany(DepositRequest, { foreignKey: 'user_id', as: 'depositRequests' });
DepositRequest.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(ChainDepositEvent, { foreignKey: 'user_id', as: 'chainDepositEvents' });
ChainDepositEvent.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(DepositScanLog, { foreignKey: 'user_id', as: 'depositScanLogs' });
DepositScanLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  sequelize,
  User,
  Wallet,
  Transaction,
  WalletKey,
  UserPackage,
  WithdrawalRequest,
  SiteSetting,
  DepositRequest,
  Notification,
  ChainDepositEvent,
  DepositScanLog,
};
