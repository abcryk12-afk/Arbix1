const { DataTypes } = require('sequelize');
const db = require('../config/db');
const bcrypt = require('bcryptjs');

const User = db.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'password_hash'
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  referral_code: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: true,
    field: 'referral_code'
  },
  referred_by_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'referred_by_id'
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user',
    field: 'role'
  },
  cnic_passport: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'cnic_passport'
  },
  kyc_status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
    field: 'kyc_status'
  },
  account_status: {
    type: DataTypes.ENUM('active', 'hold'),
    defaultValue: 'hold', // Use 'hold' instead of 'pending_verification'
    field: 'account_status'
  },
  wallet_public_address: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'wallet_public_address'
  },
  wallet_private_key_encrypted: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'wallet_private_key_encrypted'
  },
  reset_token: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'reset_token'
  },
  reset_token_expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'reset_token_expires_at'
  },
  theme_preference: {
    type: DataTypes.ENUM('light', 'dark', 'colorful', 'aurora'),
    allowNull: true,
    field: 'theme_preference',
  },
  withdrawal_hold_enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'withdrawal_hold_enabled',
  },
  withdrawal_hold_note: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'withdrawal_hold_note',
  },
}, {
  tableName: 'users',
  freezeTableName: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeCreate: async (user) => {
      // Hash password before saving
      if (user.password_hash) {
        const salt = await bcrypt.genSalt(10);
        user.password_hash = await bcrypt.hash(user.password_hash, salt);
      }
      
      // Generate referral code if not provided
      if (!user.referral_code) {
        user.referral_code = Math.random().toString(36).substring(2, 8).toUpperCase();
      }
    },
    beforeUpdate: async (user) => {
      // Hash password if it's being updated
      if (user.changed('password_hash') && user.password_hash) {
        const salt = await bcrypt.genSalt(10);
        user.password_hash = await bcrypt.hash(user.password_hash, salt);
      }
    },
  },
});

// Method to compare password
User.prototype.comparePassword = async function(candidatePassword) {
  // Database only has password_hash field, no password field
  if (!this.password_hash) {
    throw new Error('User password not found - password_hash is null');
  }
  
  // Handle case where password_hash might be an object (due to field mapping issues)
  const hashedPassword = typeof this.password_hash === 'object' 
    ? this.password_hash.password_hash || this.password_hash 
    : this.password_hash;
  
  if (!hashedPassword) {
    throw new Error('Hashed password is empty');
  }
  
  return await bcrypt.compare(candidatePassword, hashedPassword);
};

module.exports = User;
