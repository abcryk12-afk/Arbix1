const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const {
  getSummary,
  getActivity,
  listNotifications,
  updateProfile,
  getFooterStats,
  getReferrals,
  getReferralEarnings,
  activatePackage,
  getPackages,
  requestWithdrawal,
  listWithdrawalRequests,
  requestDeposit,
  listDepositRequests,
} = require('../controllers/userController');

router.get('/summary', protect, getSummary);
router.get('/activity', protect, getActivity);
router.get('/notifications', protect, listNotifications);
router.put('/profile', protect, updateProfile);
router.get('/footer-stats', protect, getFooterStats);
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

module.exports = router;
