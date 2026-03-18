const { DataTypes } = require('sequelize');
const db = require('../config/db');

const UserRankBonusLedger = db.define(
  'UserRankBonusLedger',
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
    },
    rank_name: {
      type: DataTypes.STRING(4),
      allowNull: false,
      field: 'rank_name',
    },
    bonus_amount: {
      type: DataTypes.DECIMAL(18, 8),
      allowNull: false,
      defaultValue: 0,
      field: 'bonus_amount',
    },
    awarded_at: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'awarded_at',
    },
  },
  {
    tableName: 'user_rank_bonus_ledger',
    freezeTableName: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { name: 'uk_user_rank_bonus_ledger_user_rank', unique: true, fields: ['user_id', 'rank_name'] },
      { name: 'idx_user_rank_bonus_ledger_user_id', fields: ['user_id'] },
      { name: 'idx_user_rank_bonus_ledger_rank_name', fields: ['rank_name'] },
    ],
  }
);

module.exports = UserRankBonusLedger;
