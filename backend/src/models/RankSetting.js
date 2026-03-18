const { DataTypes } = require('sequelize');
const db = require('../config/db');

const RankSetting = db.define(
  'RankSetting',
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    rank_name: {
      type: DataTypes.STRING(4),
      allowNull: false,
      unique: true,
      field: 'rank_name',
    },
    min_team_business: {
      type: DataTypes.DECIMAL(18, 8),
      allowNull: false,
      defaultValue: 0,
      field: 'min_team_business',
    },
    rank_bonus: {
      type: DataTypes.DECIMAL(18, 8),
      allowNull: false,
      defaultValue: 0,
      field: 'rank_bonus',
    },
  },
  {
    tableName: 'rank_settings',
    freezeTableName: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = RankSetting;
