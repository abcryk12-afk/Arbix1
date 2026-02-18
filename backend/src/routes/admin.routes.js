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
  setUserWithdrawalHold,
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
  listBalanceRecords,
} = require('../controllers/adminController');

const {
  getAdminBranding,
  setLogo,
  removeLogo,
} = require('../controllers/brandingController');

const {
  getAdminSiteAssets,
  uploadAdminSiteAsset,
  deleteAdminSiteAsset,
} = require('../controllers/siteAssetsController');

const {
  exportDatabase,
  importDatabase,
} = require('../controllers/dbBackupController');

const {
  getAdminSeoSettings,
  updateAdminSeoSettings,
  listAdminRouteSeo,
  upsertAdminRouteSeo,
  deleteAdminRouteSeo,
} = require('../controllers/seoSettingsController');

const {
  getAdminSiteTheme,
  setAdminSiteTheme,
} = require('../controllers/siteThemeController');

const {
  getAdminAuroraTheme,
  setAdminAuroraTheme,
} = require('../controllers/auroraThemeController');

const {
  listAdminCmsPages,
  getAdminCmsPage,
  createAdminCmsPage,
  updateAdminCmsPage,
  deleteAdminCmsPage,
} = require('../controllers/cmsPagesController');

const {
  getAdminAdminLoginTheme,
  setAdminAdminLoginTheme,
} = require('../controllers/adminLoginThemeController');

const {
  getAdminUiTheme,
  setAdminUiTheme,
} = require('../controllers/uiThemeController');

const {
  getAdminPackageDeactivationSettings,
  setAdminPackageDeactivationSettings,
} = require('../controllers/packageDeactivationSettingsController');

const {
  getAdminWithdrawalLimits,
  setAdminWithdrawalLimits,
} = require('../controllers/withdrawalLimitsSettingsController');

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
router.get('/aurora-theme', protect, requireAdminUser, getAdminAuroraTheme);
router.put('/aurora-theme', protect, requireAdminUser, auditAdminAction('aurora_theme.update', { entity: 'site_setting' }), setAdminAuroraTheme);
router.get('/admin-login-theme', protect, requireAdminUser, getAdminAdminLoginTheme);
router.put('/admin-login-theme', protect, requireAdminUser, auditAdminAction('admin_login_theme.update', { entity: 'site_setting' }), setAdminAdminLoginTheme);
router.get('/ui-theme', protect, requireAdminUser, getAdminUiTheme);
router.put('/ui-theme', protect, requireAdminUser, auditAdminAction('ui_theme.update', { entity: 'site_setting' }), setAdminUiTheme);
router.get('/package-deactivation-settings', protect, requireAdminUser, getAdminPackageDeactivationSettings);
router.put('/package-deactivation-settings', protect, requireAdminUser, auditAdminAction('package_deactivation_settings.update', { entity: 'site_setting' }), setAdminPackageDeactivationSettings);

router.get('/withdrawal-limits', protect, requireAdminUser, getAdminWithdrawalLimits);
router.put('/withdrawal-limits', protect, requireAdminUser, auditAdminAction('withdrawal_limits.update', { entity: 'site_setting' }), setAdminWithdrawalLimits);
router.get('/users', protect, requireAdminUser, listUsers);
router.get('/users/:id', protect, requireAdminUser, getUserDetails);
router.put('/users/:id/withdrawal-hold', protect, requireAdminUser, auditAdminAction('user.withdrawal_hold', { entity: 'user' }), setUserWithdrawalHold);
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

router.get('/records', protect, requireAdminUser, listBalanceRecords);

router.get('/trade-logs', protect, requireAdminUser, listTradeLogs);

router.post('/notifications', protect, requireAdminUser, auditAdminAction('notifications.send', { entity: 'notification' }), sendNotification);

router.get('/branding', protect, requireAdminUser, getAdminBranding);
router.post('/branding/logo', protect, requireAdminUser, setLogo);
router.delete('/branding/logo', protect, requireAdminUser, removeLogo);
router.post('/branding', protect, requireAdminUser, setLogo);
router.delete('/branding', protect, requireAdminUser, removeLogo);

router.get('/site-assets', protect, requireAdminUser, getAdminSiteAssets);
router.post('/site-assets/:asset', protect, requireAdminUser, auditAdminAction('site_assets.upload', { entity: 'site_setting' }), uploadAdminSiteAsset);
router.delete('/site-assets/:asset', protect, requireAdminUser, auditAdminAction('site_assets.delete', { entity: 'site_setting' }), deleteAdminSiteAsset);

router.get('/db-backup/export', protect, requireAdminUser, auditAdminAction('db_backup.export', { entity: 'database' }), exportDatabase);
router.post('/db-backup/import', protect, requireAdminUser, auditAdminAction('db_backup.import', { entity: 'database' }), importDatabase);

router.get('/seo-settings', protect, requireAdminUser, getAdminSeoSettings);
router.put('/seo-settings', protect, requireAdminUser, auditAdminAction('seo_settings.update', { entity: 'site_setting' }), updateAdminSeoSettings);
router.get('/route-seo', protect, requireAdminUser, listAdminRouteSeo);
router.put('/route-seo', protect, requireAdminUser, auditAdminAction('route_seo.upsert', { entity: 'site_setting' }), upsertAdminRouteSeo);
router.delete('/route-seo', protect, requireAdminUser, auditAdminAction('route_seo.delete', { entity: 'site_setting' }), deleteAdminRouteSeo);

router.get('/cms-pages', protect, requireAdminUser, listAdminCmsPages);
router.post('/cms-pages', protect, requireAdminUser, auditAdminAction('cms_pages.create', { entity: 'cms_page' }), createAdminCmsPage);
router.get('/cms-pages/:id', protect, requireAdminUser, getAdminCmsPage);
router.put('/cms-pages/:id', protect, requireAdminUser, auditAdminAction('cms_pages.update', { entity: 'cms_page' }), updateAdminCmsPage);
router.delete('/cms-pages/:id', protect, requireAdminUser, auditAdminAction('cms_pages.delete', { entity: 'cms_page' }), deleteAdminCmsPage);

module.exports = router;
