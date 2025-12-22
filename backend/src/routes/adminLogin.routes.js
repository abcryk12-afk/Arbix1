const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Simple admin login route - email only
router.post('/login', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if email is the admin email
    if (email !== 'wanum01234@gmail.com') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
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

module.exports = router;
