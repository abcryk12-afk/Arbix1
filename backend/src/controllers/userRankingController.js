const { getOrComputeUserRank, markUserRankSeen } = require('../services/userRankingService');

const rankToNumber = (rankName) => {
  const s = String(rankName || '').trim().toUpperCase();
  const m = s.match(/^A([1-7])$/);
  if (!m) return 0;
  return Number(m[1] || 0);
};

exports.getMyRank = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await getOrComputeUserRank({ userId });
    const current = String(result.rankName || 'A1').toUpperCase();
    const prev = result.lastSeenRank ? String(result.lastSeenRank).toUpperCase() : null;
    const upgraded = prev ? rankToNumber(current) > rankToNumber(prev) : false;

    return res.status(200).json({
      success: true,
      rank: {
        rankName: current,
        totalTeamActiveBalance: Number(result.totalTeamActiveBalance || 0),
        calculatedAt: result.calculatedAt,
        cached: Boolean(result.cached),
        lastSeenRank: prev,
        upgraded,
      },
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.markMyRankSeen = async (req, res) => {
  try {
    const userId = req.user.id;
    const rankName = req.body?.rankName || req.body?.rank_name;
    if (!rankName) {
      return res.status(400).json({ success: false, message: 'rankName is required' });
    }

    const ok = await markUserRankSeen({ userId, rankName });
    return res.status(200).json({ success: ok });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
