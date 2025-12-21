const { DataTypes } = require('sequelize');
const db = require('../config/db');

const Transaction = db.define(
  'Transaction',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id'
    },
    type: {
      type: DataTypes.ENUM(
        'deposit',
        'withdraw',
        'package_purchase',
        'profit',
        'referral_profit',
        'referral_bonus'
      ),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(18, 8),
      allowNull: false,
    },
    created_by: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'created_by'
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'transactions',
    freezeTableName: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = Transaction;
