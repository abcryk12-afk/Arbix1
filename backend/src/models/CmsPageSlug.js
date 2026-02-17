const { DataTypes } = require('sequelize');
const db = require('../config/db');

const CmsPageSlug = db.define(
  'CmsPageSlug',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    page_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(180),
      allowNull: false,
      unique: true,
    },
    is_current: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 1,
    },
  },
  {
    tableName: 'cms_page_slugs',
    freezeTableName: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['slug'], unique: true },
      { fields: ['page_id'] },
      { fields: ['page_id', 'is_current'] },
    ],
  },
);

module.exports = CmsPageSlug;
