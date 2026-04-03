const { DataTypes } = require('sequelize');
const db = require('../config/db');

const AutoSweepLog = db.define(
  'AutoSweepLog',
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    wallet: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    path_index: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'path_index',
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('success', 'pending', 'failed'),
      allowNull: false,
      defaultValue: 'pending',
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    source: {
      type: DataTypes.STRING(30),
      allowNull: true,
      defaultValue: 'worker',
    },
  },
  {
    tableName: 'auto_sweep_logs',
    freezeTableName: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['wallet'] },
      { fields: ['status'] },
      { fields: ['action'] },
      { fields: ['created_at'] },
    ],
  },
);

module.exports = AutoSweepLog;
