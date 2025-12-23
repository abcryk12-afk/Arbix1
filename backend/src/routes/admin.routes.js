const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { requireAdminUser } = require('../middleware/adminUserMiddleware');
const {
  checkAccess,
  createUser,
  listUsers,
  listWallets,
  deposit,
  withdraw,
  runDailyProfit,
  getAdminStats,
  listRecentTransactions,
  listWithdrawalRequests,
  updateWithdrawalRequestStatus,
} = require('../controllers/adminController');

router.get('/check', protect, requireAdminUser, checkAccess);
router.get('/users', protect, requireAdminUser, listUsers);
router.get('/wallets', protect, requireAdminUser, listWallets);
router.post('/users', protect, requireAdminUser, createUser);
router.post('/deposit', protect, requireAdminUser, deposit);
router.post('/withdraw', protect, requireAdminUser, withdraw);
router.post('/run-daily-profit', protect, requireAdminUser, runDailyProfit);
router.get('/stats', protect, requireAdminUser, getAdminStats);
router.get('/recent-transactions', protect, requireAdminUser, listRecentTransactions);
router.get('/withdrawal-requests', protect, requireAdminUser, listWithdrawalRequests);
router.post('/withdrawal-requests/update', protect, requireAdminUser, updateWithdrawalRequestStatus);

module.exports = router;
