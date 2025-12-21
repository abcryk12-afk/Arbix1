const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { getSummary, getFooterStats } = require('../controllers/userController');

router.get('/summary', protect, getSummary);
router.get('/footer-stats', protect, getFooterStats);

module.exports = router;
