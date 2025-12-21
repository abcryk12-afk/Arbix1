const { DataTypes } = require('sequelize');
const db = require('../config/db');

const UserPackage = db.define(
  'UserPackage',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
    },
    package_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'package_id',
    },
    package_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'package_name',
    },
    capital: {
      type: DataTypes.DECIMAL(18, 8),
      allowNull: false,
    },
    daily_roi: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false,
      field: 'daily_roi',
    },
    duration_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'duration_days',
    },
    total_earned: {
      type: DataTypes.DECIMAL(18, 8),
      allowNull: false,
      defaultValue: 0,
      field: 'total_earned',
    },
    start_at: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'start_at',
    },
    end_at: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'end_at',
    },
    status: {
      type: DataTypes.ENUM('active', 'completed'),
      allowNull: false,
      defaultValue: 'active',
    },
    last_profit_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_profit_at',
    },
  },
  {
    tableName: 'user_packages',
    freezeTableName: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = UserPackage;
