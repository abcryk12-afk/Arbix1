const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - require authentication
exports.protect = async (req, res, next) => {
  let token;

  // Get token from header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // If this is an admin token (issued by /api/admin/login), trust payload directly
      if (decoded && decoded.isAdmin) {
        req.user = {
          id: decoded.id,
          email: decoded.email,
          role: 'admin',
          account_status: 'active',
        };
        return next();
      }

      // For normal users, load user from database
      req.user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password_hash', 'reset_token', 'reset_token_expires_at'] },
      });

      // Check if user exists and account is active or hold
      if (!req.user || !['active', 'hold'].includes(req.user.account_status)) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, account not active or user not found',
        });
      }

      next();
    } catch (error) {
      console.error('Authentication error:', error);
      res.status(401).json({
        success: false,
        message: 'Not authorized, token failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Not authorized, no token',
    });
  }
};

// Role-based authorization
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};
