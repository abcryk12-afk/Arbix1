const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const {
  getSummary,
  getActivity,
  listNotifications,
  markNotificationsRead,
  updateProfile,
  getThemePreference,
  setThemePreference,
  getFooterStats,
  getFooterDemoStats,
  getReferrals,
  getReferralEarnings,
  activatePackage,
  getPackages,
  requestWithdrawal,
  listWithdrawalRequests,
  requestDeposit,
  listDepositRequests,
  getDailyCheckinStatus,
  claimDailyCheckin,
} = require('../controllers/userController');

router.get('/summary', protect, getSummary);
router.get('/activity', protect, getActivity);
router.get('/notifications', protect, listNotifications);
router.post('/notifications/read', protect, markNotificationsRead);
router.put('/notifications/read', protect, markNotificationsRead);
router.put('/profile', protect, updateProfile);
router.get('/theme', protect, getThemePreference);
router.put('/theme', protect, setThemePreference);
router.get('/footer-stats', protect, getFooterStats);
router.get('/footer-demo-stats', protect, getFooterDemoStats);
router.get('/referrals', protect, getReferrals);
router.get('/referral-earnings', protect, getReferralEarnings);
router.post('/activate-package', protect, activatePackage);
router.get('/packages', protect, getPackages);
router.post('/withdraw', protect, requestWithdrawal);
router.get('/withdrawal-requests', protect, listWithdrawalRequests);

router.post('/deposit-requests', protect, requestDeposit);
router.get('/deposit-requests', protect, listDepositRequests);

router.post('/deposit_requests', protect, requestDeposit);
router.get('/deposit_requests', protect, listDepositRequests);

router.get('/daily-checkin/status', protect, getDailyCheckinStatus);
router.post('/daily-checkin/claim', protect, claimDailyCheckin);

module.exports = router;
