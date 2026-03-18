const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { rateLimit } = require('../middleware/rateLimitMiddleware');

const { getMyRank, markMyRankSeen } = require('../controllers/userRankingController');

router.get(
  '/rank',
  rateLimit({ windowMs: 60000, max: 60, keyPrefix: 'user_rank' }),
  protect,
  getMyRank
);

router.post(
  '/rank/seen',
  rateLimit({ windowMs: 60000, max: 30, keyPrefix: 'user_rank' }),
  protect,
  markMyRankSeen
);

module.exports = router;
