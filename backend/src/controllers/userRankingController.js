const { getOrComputeUserRank } = require('../services/userRankingService');

exports.getMyRank = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await getOrComputeUserRank({ userId });
    return res.status(200).json({
      success: true,
      rank: {
        rankName: result.rankName,
        totalTeamActiveBalance: Number(result.totalTeamActiveBalance || 0),
        calculatedAt: result.calculatedAt,
        cached: Boolean(result.cached),
      },
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
