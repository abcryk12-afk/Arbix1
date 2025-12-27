const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);
const ADMIN_LOGIN_CODE = process.env.ADMIN_LOGIN_CODE || '';

// Simple admin login route - email + secret code
router.post('/login', async (req, res) => {
  try {
    const { email, secretCode } = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();

    // Check if email is the admin email (case-insensitive, trimmed)
    if (!normalizedEmail || !ADMIN_EMAILS.includes(normalizedEmail)) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (!ADMIN_LOGIN_CODE) {
      return res.status(503).json({
        success: false,
        message: 'Admin login not configured'
      });
    }

    // Check if secret code is correct
    if (secretCode !== ADMIN_LOGIN_CODE) {
      return res.status(401).json({
        success: false,
        message: 'Invalid secret code'
      });
    }
    
    // Create JWT token
    const token = jwt.sign(
      {
        id: 13,
        email: normalizedEmail,
        isAdmin: true,
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: 13,
        email: normalizedEmail,
        name: 'Admin'
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Simplified admin check route - only requires valid JWT token
router.get('/check', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Check if this is the admin user
    const decodedEmail = String(decoded.email || '').trim().toLowerCase();
    if (!decoded.isAdmin || !decodedEmail || !ADMIN_EMAILS.includes(decodedEmail)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden'
      });
    }

    res.json({
      success: true,
      message: 'Admin authorized',
      user: {
        id: decoded.id,
        email: decodedEmail
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }
    console.error('Admin check error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
