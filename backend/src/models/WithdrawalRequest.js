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
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'processing', 'failed'),
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
