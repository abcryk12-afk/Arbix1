const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { rateLimit } = require('../middleware/rateLimitMiddleware');

const { getMyRank } = require('../controllers/userRankingController');

router.get(
  '/rank',
  rateLimit({ windowMs: 60000, max: 60, keyPrefix: 'user_rank' }),
  protect,
  getMyRank
);

module.exports = router;
