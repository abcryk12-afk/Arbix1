const { DataTypes } = require('sequelize');
const db = require('../config/db');

const SiteSetting = db.define(
  'SiteSetting',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    value: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
    },
  },
  {
    tableName: 'site_settings',
    freezeTableName: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
);

module.exports = SiteSetting;
