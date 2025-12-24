const { DataTypes } = require('sequelize');
const db = require('../config/db');

const DepositScanLog = db.define(
  'DepositScanLog',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    chain: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'BSC',
    },
    token: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'USDT',
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    reason: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('success', 'error', 'skipped', 'up_to_date'),
      allowNull: false,
      defaultValue: 'success',
    },
    latest_block: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'latest_block',
    },
    confirmations: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    safe_to_block: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'safe_to_block',
    },
    cursor_before: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'cursor_before',
    },
    cursor_after: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'cursor_after',
    },
    from_block: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'from_block',
    },
    to_block: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'to_block',
    },
    rounds: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    logs_found: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'logs_found',
    },
    credited_events: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'credited_events',
    },
    duration_ms: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'duration_ms',
    },
    error_code: {
      type: DataTypes.STRING(80),
      allowNull: true,
      field: 'error_code',
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'error_message',
    },
  },
  {
    tableName: 'deposit_scan_logs',
    freezeTableName: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [{ fields: ['user_id'] }, { fields: ['address'] }],
  },
);

module.exports = DepositScanLog;
