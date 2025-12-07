const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  verifyEmail, 
  forgotPassword, 
  resetPassword, 
  getMe 
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes (require authentication)
router.get('/me', protect, getMe);

module.exports = router;
