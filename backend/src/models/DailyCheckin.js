const { DataTypes } = require('sequelize');
const db = require('../config/db');

const DailyCheckin = db.define(
  'DailyCheckin',
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
      field: 'user_id',
    },
    streak_day: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'streak_day',
    },
    last_claimed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_claimed_at',
    },
  },
  {
    tableName: 'daily_checkins',
    freezeTableName: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = DailyCheckin;
