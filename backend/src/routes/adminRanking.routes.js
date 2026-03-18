const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { requireAdminUser } = require('../middleware/adminUserMiddleware');
const { requireAdminKey } = require('../middleware/adminKeyMiddleware');
const { auditAdminAction } = require('../middleware/adminAuditMiddleware');
const { rateLimit } = require('../middleware/rateLimitMiddleware');

const { getRankingConfig, updateRankingConfig } = require('../controllers/adminRankingController');

router.use(requireAdminKey);

router.get(
  '/config',
  rateLimit({ windowMs: 60000, max: 60, keyPrefix: 'admin_ranking' }),
  protect,
  requireAdminUser,
  getRankingConfig
);

router.put(
  '/config',
  rateLimit({ windowMs: 60000, max: 30, keyPrefix: 'admin_ranking' }),
  protect,
  requireAdminUser,
  auditAdminAction('ranking_config.update', { entity: 'user_ranks_config' }),
  updateRankingConfig
);

module.exports = router;
