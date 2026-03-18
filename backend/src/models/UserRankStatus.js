const { DataTypes } = require('sequelize');
const db = require('../config/db');

const UserRankStatus = db.define(
  'UserRankStatus',
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
      unique: true,
    },
    rank_name: {
      type: DataTypes.STRING(4),
      allowNull: false,
      field: 'rank_name',
    },
    total_team_active_balance: {
      type: DataTypes.DECIMAL(18, 8),
      allowNull: false,
      defaultValue: 0,
      field: 'total_team_active_balance',
    },
    calculated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'calculated_at',
    },
    last_seen_rank: {
      type: DataTypes.STRING(4),
      allowNull: true,
      field: 'last_seen_rank',
    },
    last_seen_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_seen_at',
    },
  },
  {
    tableName: 'user_rank_status',
    freezeTableName: true,
    timestamps: false,
    indexes: [
      { name: 'idx_user_rank_status_user_id', fields: ['user_id'], unique: true },
      { name: 'idx_user_rank_status_rank_name', fields: ['rank_name'] },
      { name: 'idx_user_rank_status_calculated_at', fields: ['calculated_at'] },
    ],
  }
);

module.exports = UserRankStatus;
