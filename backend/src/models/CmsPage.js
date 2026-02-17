const { DataTypes } = require('sequelize');
const db = require('../config/db');

const CmsPage = db.define(
  'CmsPage',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    content_html: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
    },
    is_published: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 0,
    },
    published_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    meta_title: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    meta_description: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
    meta_keywords: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    canonical_url: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
    og_title: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    og_description: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
    og_image_url: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
    twitter_card_type: {
      type: DataTypes.STRING(40),
      allowNull: true,
    },
    robots_index: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 1,
    },
    json_ld: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
    },
  },
  {
    tableName: 'cms_pages',
    freezeTableName: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
);

module.exports = CmsPage;
