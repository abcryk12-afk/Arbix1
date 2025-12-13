const { DataTypes } = require('sequelize');
const db = require('../config/db');
const bcrypt = require('bcryptjs');

const User = db.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
  },
  referralCode: {
    type: DataTypes.STRING,
    unique: true,
  },
  referredBy: {
    type: DataTypes.STRING,
  },
  emailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  emailVerificationToken: {
    type: DataTypes.STRING,
  },
  emailVerificationExpires: {
    type: DataTypes.DATE,
  },
  passwordResetToken: {
    type: DataTypes.STRING,
  },
  passwordResetExpires: {
    type: DataTypes.DATE,
  },
  accountStatus: {
    type: DataTypes.ENUM('active', 'suspended', 'pending_verification'),
    defaultValue: 'pending_verification',
  },
  kycStatus: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
  },
  walletAddress: {
    type: DataTypes.STRING,
  },
  lastLogin: {
    type: DataTypes.DATE,
  },
  twoFactorEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'users',
  freezeTableName: true,
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      // Hash password before saving
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
      
      // Generate referral code if not provided
      if (!user.referralCode) {
        user.referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      }
    },
  },
});

// Method to compare password
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = User;
