const { DataTypes } = require('sequelize');
const db = require('../config/db');

const WalletKey = db.define(
  'WalletKey',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
    },
    pathIndex: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    privateKeyEncrypted: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    tableName: 'wallet_keys',
    freezeTableName: true,
    timestamps: true,
  }
);

module.exports = WalletKey;
