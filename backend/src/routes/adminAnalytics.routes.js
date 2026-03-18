const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { requireAdminUser } = require('../middleware/adminUserMiddleware');
const { requireAdminKey } = require('../middleware/adminKeyMiddleware');
const { rateLimit } = require('../middleware/rateLimitMiddleware');

const {
  listUsersForAnalytics,
  getUserActivity,
  getAnalyticsSummary,
} = require('../controllers/adminAnalyticsController');

router.use(requireAdminKey);

router.get(
  '/users',
  rateLimit({ windowMs: 60000, max: 60, keyPrefix: 'admin_analytics' }),
  protect,
  requireAdminUser,
  listUsersForAnalytics
);

router.get(
  '/user-activity',
  rateLimit({ windowMs: 60000, max: 30, keyPrefix: 'admin_analytics' }),
  protect,
  requireAdminUser,
  getUserActivity
);

router.get(
  '/summary',
  rateLimit({ windowMs: 60000, max: 30, keyPrefix: 'admin_analytics' }),
  protect,
  requireAdminUser,
  getAnalyticsSummary
);

module.exports = router;
