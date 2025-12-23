const { DataTypes } = require('sequelize');
const db = require('../config/db');

const DepositRequest = db.define(
  'DepositRequest',
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
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
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
    tableName: 'deposit_requests',
    freezeTableName: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
);

module.exports = DepositRequest;
