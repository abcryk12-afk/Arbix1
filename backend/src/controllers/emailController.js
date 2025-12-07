const { sendOTPEmail, sendPasswordResetEmail, sendWelcomeEmail, sendWithdrawalNotification } = require('../config/email');

/**
 * Send OTP for email verification
 */
const sendOTP = async (req, res) => {
  try {
    const { email, otp, userName } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    await sendOTPEmail(email, otp, userName);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully'
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      error: error.message
    });
  }
};

/**
 * Send password reset email
 */
const sendPasswordReset = async (req, res) => {
  try {
    const { email, resetLink, userName } = req.body;

    if (!email || !resetLink) {
      return res.status(400).json({
        success: false,
        message: 'Email and reset link are required'
      });
    }

    await sendPasswordResetEmail(email, resetLink, userName);

    res.status(200).json({
      success: true,
      message: 'Password reset email sent successfully'
    });
  } catch (error) {
    console.error('Error sending password reset:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send password reset email',
      error: error.message
    });
  }
};

/**
 * Send welcome email
 */
const sendWelcome = async (req, res) => {
  try {
    const { email, userName, referralCode } = req.body;

    if (!email || !userName || !referralCode) {
      return res.status(400).json({
        success: false,
        message: 'Email, user name, and referral code are required'
      });
    }

    await sendWelcomeEmail(email, userName, referralCode);

    res.status(200).json({
      success: true,
      message: 'Welcome email sent successfully'
    });
  } catch (error) {
    console.error('Error sending welcome email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send welcome email',
      error: error.message
    });
  }
};

/**
 * Send withdrawal notification
 */
const sendWithdrawalNotificationEmail = async (req, res) => {
  try {
    const { email, userName, amount, status, reason } = req.body;

    if (!email || !userName || !amount || !status) {
      return res.status(400).json({
        success: false,
        message: 'Email, user name, amount, and status are required'
      });
    }

    await sendWithdrawalNotification(email, userName, amount, status, reason);

    res.status(200).json({
      success: true,
      message: 'Withdrawal notification sent successfully'
    });
  } catch (error) {
    console.error('Error sending withdrawal notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send withdrawal notification',
      error: error.message
    });
  }
};

/**
 * Test email functionality
 */
const testEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    await sendOTPEmail(email, '123456', 'Test User');

    res.status(200).json({
      success: true,
      message: 'Test email sent successfully'
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
};

module.exports = {
  sendOTP,
  sendPasswordReset,
  sendWelcome,
  sendWithdrawalNotificationEmail,
  testEmail
};
