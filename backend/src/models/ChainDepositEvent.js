const { DataTypes } = require('sequelize');
const db = require('../config/db');

const ChainDepositEvent = db.define(
  'ChainDepositEvent',
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
      allowNull: true,
      field: 'user_id',
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(18, 8),
      allowNull: false,
    },
    tx_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'tx_hash',
    },
    log_index: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'log_index',
    },
    block_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'block_number',
    },
    credited: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    credited_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'credited_at',
    },
  },
  {
    tableName: 'chain_deposit_events',
    freezeTableName: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { unique: true, fields: ['tx_hash', 'log_index'] },
      { fields: ['user_id'] },
      { fields: ['address'] },
    ],
  },
);

module.exports = ChainDepositEvent;
