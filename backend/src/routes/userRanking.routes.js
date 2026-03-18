const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { rateLimit } = require('../middleware/rateLimitMiddleware');

const { getMyRank, markMyRankSeen } = require('../controllers/userRankingController');
const { getTeamActiveCapital, getRankBonus } = require('../controllers/teamDashboardEnhancementsController');

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

router.get(
  '/team-active-capital',
  rateLimit({ windowMs: 60000, max: 30, keyPrefix: 'user_team_active_capital' }),
  protect,
  getTeamActiveCapital
);

router.get(
  '/rank-bonus',
  rateLimit({ windowMs: 60000, max: 30, keyPrefix: 'user_rank_bonus' }),
  protect,
  getRankBonus
);

module.exports = router;
