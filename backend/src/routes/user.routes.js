const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { getSummary, getFooterStats, getReferrals, getReferralEarnings } = require('../controllers/userController');

router.get('/summary', protect, getSummary);
router.get('/footer-stats', protect, getFooterStats);
router.get('/referrals', protect, getReferrals);
router.get('/referral-earnings', protect, getReferralEarnings);

module.exports = router;
