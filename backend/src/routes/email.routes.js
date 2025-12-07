const express = require('express');
const router = express.Router();
const {
  sendOTP,
  sendPasswordReset,
  sendWelcome,
  sendWithdrawalNotificationEmail,
  testEmail
} = require('../controllers/emailController');

/**
 * @route   POST /api/email/send-otp
 * @desc    Send OTP for email verification
 * @access  Public
 */
router.post('/send-otp', sendOTP);

/**
 * @route   POST /api/email/password-reset
 * @desc    Send password reset email
 * @access  Public
 */
router.post('/password-reset', sendPasswordReset);

/**
 * @route   POST /api/email/welcome
 * @desc    Send welcome email
 * @access  Public
 */
router.post('/welcome', sendWelcome);

/**
 * @route   POST /api/email/withdrawal-notification
 * @desc    Send withdrawal notification
 * @access  Public
 */
router.post('/withdrawal-notification', sendWithdrawalNotificationEmail);

/**
 * @route   POST /api/email/test
 * @desc    Test email functionality
 * @access  Public
 */
router.post('/test', testEmail);

module.exports = router;
