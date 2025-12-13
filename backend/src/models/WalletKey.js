const { DataTypes } = require('sequelize');
const db = require('../config/db');

const WalletKey = db.define(
  'WalletKey',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      field: 'user_id'
    },
    pathIndex: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      field: 'pathIndex'
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    privateKeyEncrypted: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'privateKeyEncrypted'
    },
  },
  {
    tableName: 'wallet_keys',
    freezeTableName: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = WalletKey;
