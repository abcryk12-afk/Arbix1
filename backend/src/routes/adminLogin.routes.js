const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Simple admin login route - email + secret code
router.post('/login', async (req, res) => {
  try {
    const { email, secretCode } = req.body;
    
    // Check if email is the admin email
    if (email !== 'wanum01234@gmail.com') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Check if secret code is correct
    if (secretCode !== '1020') {
      return res.status(401).json({
        success: false,
        message: 'Invalid secret code'
      });
    }
    
    // Create JWT token
    const token = jwt.sign(
      { 
        id: 13, 
        email: email, 
        isAdmin: true 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: 13,
        email: email,
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
    if (decoded.email !== 'wanum01234@gmail.com' || !decoded.isAdmin) {
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
        email: decoded.email
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
