const { DataTypes } = require('sequelize');
const db = require('../config/db');

const UserRankConfig = db.define(
  'UserRankConfig',
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    rank_name: {
      type: DataTypes.STRING(4),
      allowNull: false,
      field: 'rank_name',
      unique: true,
    },
    min_balance: {
      type: DataTypes.DECIMAL(18, 8),
      allowNull: false,
      defaultValue: 0,
      field: 'min_balance',
    },
  },
  {
    tableName: 'user_ranks_config',
    freezeTableName: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [{ name: 'idx_user_ranks_config_rank_name', fields: ['rank_name'], unique: true }],
  }
);

module.exports = UserRankConfig;
