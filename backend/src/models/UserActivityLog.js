const { DataTypes } = require('sequelize');
const db = require('../config/db');

const UserActivityLog = db.define(
  'UserActivityLog',
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
    session_id: {
      type: DataTypes.STRING(64),
      allowNull: false,
      field: 'session_id',
    },
    login_time: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'login_time',
    },
    logout_time: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'logout_time',
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
      field: 'ip_address',
    },
    device_info: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'device_info',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
  },
  {
    tableName: 'user_activity_logs',
    freezeTableName: true,
    timestamps: false,
    indexes: [
      { name: 'idx_user_activity_user_time', fields: ['user_id', 'login_time'] },
      { name: 'idx_user_activity_session', fields: ['session_id'] },
      { name: 'idx_user_activity_login_time', fields: ['login_time'] },
      { name: 'idx_user_activity_logout_time', fields: ['logout_time'] },
    ],
  }
);

module.exports = UserActivityLog;
