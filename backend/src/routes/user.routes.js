const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const {
  getSummary,
  getFooterStats,
  getReferrals,
  getReferralEarnings,
  activatePackage,
  getPackages,
} = require('../controllers/userController');

router.get('/summary', protect, getSummary);
router.get('/footer-stats', protect, getFooterStats);
router.get('/referrals', protect, getReferrals);
router.get('/referral-earnings', protect, getReferralEarnings);
router.post('/activate-package', protect, activatePackage);
router.get('/packages', protect, getPackages);

module.exports = router;
