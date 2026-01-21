const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { requireAdminUser } = require('../middleware/adminUserMiddleware');
const { requireAdminKey } = require('../middleware/adminKeyMiddleware');
const { auditAdminAction } = require('../middleware/adminAuditMiddleware');
const { listLogs } = require('../controllers/adminLogsController');
const {
  checkAccess,
  createUser,
  listUsers,
  getUserDetails,
  updateUserStatus,
  deleteUser,
  getAdminNotificationEmails,
  setAdminNotificationEmails,
  getInvestmentPackagesSetting,
  setInvestmentPackagesSetting,
  getFooterStatsOverridesSetting,
  setFooterStatsOverridesSetting,
  getAutoWithdrawSetting,
  setAutoWithdrawSetting,
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
  listTradeLogs,
  sendNotification,
} = require('../controllers/adminController');

const {
  getAdminBranding,
  setLogo,
  removeLogo,
} = require('../controllers/brandingController');

const {
  getAdminSiteTheme,
  setAdminSiteTheme,
} = require('../controllers/siteThemeController');

router.use(requireAdminKey);

router.get('/check', protect, requireAdminUser, checkAccess);
router.get('/logs', protect, requireAdminUser, listLogs);
router.get('/notification-emails', protect, requireAdminUser, getAdminNotificationEmails);
router.put('/notification-emails', protect, requireAdminUser, auditAdminAction('admin_notification_emails.update', { entity: 'site_setting' }), setAdminNotificationEmails);
router.get('/investment-packages', protect, requireAdminUser, getInvestmentPackagesSetting);
router.put('/investment-packages', protect, requireAdminUser, auditAdminAction('investment_packages.update', { entity: 'site_setting' }), setInvestmentPackagesSetting);
router.get('/footer-stats-overrides', protect, requireAdminUser, getFooterStatsOverridesSetting);
router.put('/footer-stats-overrides', protect, requireAdminUser, auditAdminAction('footer_stats_overrides.update', { entity: 'site_setting' }), setFooterStatsOverridesSetting);
router.get('/auto-withdraw', protect, requireAdminUser, getAutoWithdrawSetting);
router.put('/auto-withdraw', protect, requireAdminUser, auditAdminAction('auto_withdraw.toggle', { entity: 'site_setting' }), setAutoWithdrawSetting);
router.get('/site-theme', protect, requireAdminUser, getAdminSiteTheme);
router.put('/site-theme', protect, requireAdminUser, auditAdminAction('site_theme.update', { entity: 'site_setting' }), setAdminSiteTheme);
router.get('/users', protect, requireAdminUser, listUsers);
router.get('/users/:id', protect, requireAdminUser, getUserDetails);
router.put('/users/:id/status', protect, requireAdminUser, updateUserStatus);
router.post('/users/:id/status', protect, requireAdminUser, updateUserStatus);
router.put('/users/:id', protect, requireAdminUser, updateUserStatus);
router.delete('/users/:id', protect, requireAdminUser, deleteUser);
router.post('/users/:id/delete', protect, requireAdminUser, deleteUser);
router.get('/wallets', protect, requireAdminUser, listWallets);
router.post('/users', protect, requireAdminUser, auditAdminAction('user.create', { entity: 'user' }), createUser);
router.post('/deposit', protect, requireAdminUser, auditAdminAction('wallet.deposit', { entity: 'wallet' }), deposit);
router.post('/withdraw', protect, requireAdminUser, auditAdminAction('wallet.withdraw', { entity: 'wallet' }), withdraw);
router.post('/run-daily-profit', protect, requireAdminUser, auditAdminAction('profit.run_daily', { entity: 'job' }), runDailyProfit);
router.get('/stats', protect, requireAdminUser, getAdminStats);
router.get('/recent-transactions', protect, requireAdminUser, listRecentTransactions);
router.get('/withdrawal-requests', protect, requireAdminUser, listWithdrawalRequests);
router.post('/withdrawal-requests', protect, requireAdminUser, auditAdminAction('withdrawal_request.update', { entity: 'withdrawal_request' }), updateWithdrawalRequestStatus);
router.post('/withdrawal-requests/update', protect, requireAdminUser, auditAdminAction('withdrawal_request.update', { entity: 'withdrawal_request' }), updateWithdrawalRequestStatus);

router.get('/deposit-requests', protect, requireAdminUser, listDepositRequests);
router.post('/deposit-requests', protect, requireAdminUser, auditAdminAction('deposit_request.update', { entity: 'deposit_request' }), updateDepositRequestStatus);
router.post('/deposit-requests/update', protect, requireAdminUser, auditAdminAction('deposit_request.update', { entity: 'deposit_request' }), updateDepositRequestStatus);

router.get('/trade-logs', protect, requireAdminUser, listTradeLogs);

router.post('/notifications', protect, requireAdminUser, auditAdminAction('notifications.send', { entity: 'notification' }), sendNotification);

router.get('/branding', protect, requireAdminUser, getAdminBranding);
router.post('/branding/logo', protect, requireAdminUser, setLogo);
router.delete('/branding/logo', protect, requireAdminUser, removeLogo);
router.post('/branding', protect, requireAdminUser, setLogo);
router.delete('/branding', protect, requireAdminUser, removeLogo);

module.exports = router;
