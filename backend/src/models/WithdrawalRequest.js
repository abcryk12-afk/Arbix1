const { DataTypes } = require('sequelize');
const db = require('../config/db');

const WithdrawalRequest = db.define(
  'WithdrawalRequest',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
    },
    amount: {
      type: DataTypes.DECIMAL(18, 8),
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    network: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'BSC',
    },
    token: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'USDT',
    },
    auto_withdraw_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: 'auto_withdraw_enabled',
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    },
    tx_hash: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'tx_hash',
    },
    user_note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    admin_note: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'admin_note',
    },
  },
  {
    tableName: 'withdrawal_requests',
    freezeTableName: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = WithdrawalRequest;
