const { DataTypes } = require('sequelize');
const db = require('../config/db');

const Wallet = db.define(
  'Wallet',
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
    balance: {
      type: DataTypes.DECIMAL(18, 8),
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: 'wallets',
    freezeTableName: true,
    timestamps: true,
  }
);

module.exports = Wallet;
