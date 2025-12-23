const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { requireAdminUser } = require('../middleware/adminUserMiddleware');
const {
  checkAccess,
  createUser,
  listUsers,
  getUserDetails,
  listWallets,
  deposit,
  withdraw,
  runDailyProfit,
  getAdminStats,
  listRecentTransactions,
  listWithdrawalRequests,
  updateWithdrawalRequestStatus,
  listDepositRequests,
  updateDepositRequestStatus,
} = require('../controllers/adminController');

const {
  getAdminBranding,
  setLogo,
  removeLogo,
} = require('../controllers/brandingController');

router.get('/check', protect, requireAdminUser, checkAccess);
router.get('/users', protect, requireAdminUser, listUsers);
router.get('/users/:id', protect, requireAdminUser, getUserDetails);
router.get('/wallets', protect, requireAdminUser, listWallets);
router.post('/users', protect, requireAdminUser, createUser);
router.post('/deposit', protect, requireAdminUser, deposit);
router.post('/withdraw', protect, requireAdminUser, withdraw);
router.post('/run-daily-profit', protect, requireAdminUser, runDailyProfit);
router.get('/stats', protect, requireAdminUser, getAdminStats);
router.get('/recent-transactions', protect, requireAdminUser, listRecentTransactions);
router.get('/withdrawal-requests', protect, requireAdminUser, listWithdrawalRequests);
router.post('/withdrawal-requests', protect, requireAdminUser, updateWithdrawalRequestStatus);
router.post('/withdrawal-requests/update', protect, requireAdminUser, updateWithdrawalRequestStatus);

router.get('/deposit-requests', protect, requireAdminUser, listDepositRequests);
router.post('/deposit-requests', protect, requireAdminUser, updateDepositRequestStatus);
router.post('/deposit-requests/update', protect, requireAdminUser, updateDepositRequestStatus);

router.get('/branding', protect, requireAdminUser, getAdminBranding);
router.post('/branding/logo', protect, requireAdminUser, setLogo);
router.delete('/branding/logo', protect, requireAdminUser, removeLogo);
router.post('/branding', protect, requireAdminUser, setLogo);
router.delete('/branding', protect, requireAdminUser, removeLogo);

module.exports = router;
