const { Op } = require('sequelize');
const { User, UserPackage, RankSetting, UserRankBonusLedger } = require('../models');
const { getOrComputeUserRank, awardRankBonusesNonBlocking } = require('../services/userRankingService');

const cache = new Map();

const numberOrZero = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const rankToNumber = (rankName) => {
  const s = String(rankName || '').trim().toUpperCase();
  const m = s.match(/^A([1-7])$/);
  if (!m) return 0;
  return Number(m[1] || 0);
};

const getCache = (key) => {
  const v = cache.get(key);
  if (!v) return null;
  if (Date.now() > v.expiresAt) {
    cache.delete(key);
    return null;
  }
  return v.value;
};

const setCache = (key, value, ttlMs) => {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
};

const computeTeamIdsL1L2L3 = async (userId) => {
  const level1 = await User.findAll({
    where: { referred_by_id: userId },
    raw: true,
    attributes: ['id'],
    limit: 200000,
  });
  const l1Ids = (level1 || []).map((u) => Number(u.id)).filter((id) => Number.isFinite(id) && id > 0);

  const level2 = l1Ids.length
    ? await User.findAll({
        where: { referred_by_id: { [Op.in]: l1Ids } },
        raw: true,
        attributes: ['id'],
        limit: 200000,
      })
    : [];
  const l2Ids = (level2 || []).map((u) => Number(u.id)).filter((id) => Number.isFinite(id) && id > 0);

  const level3 = l2Ids.length
    ? await User.findAll({
        where: { referred_by_id: { [Op.in]: l2Ids } },
        raw: true,
        attributes: ['id'],
        limit: 200000,
      })
    : [];
  const l3Ids = (level3 || []).map((u) => Number(u.id)).filter((id) => Number.isFinite(id) && id > 0);

  const all = Array.from(new Set([...l1Ids, ...l2Ids, ...l3Ids]));
  return { l1Ids, l2Ids, l3Ids, allIds: all };
};

exports.getTeamActiveCapital = async (req, res) => {
  try {
    const userId = req.user.id;

    const cacheKey = `teamActiveCapital:${userId}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return res.status(200).json({ success: true, ...cached, cached: true });
    }

    const { allIds } = await computeTeamIdsL1L2L3(userId);

    const sum = allIds.length
      ? await UserPackage.sum('capital', {
          where: {
            user_id: { [Op.in]: allIds },
            status: 'active',
          },
        })
      : 0;

    const payload = {
      teamActiveCapital: numberOrZero(sum),
      teamUsersCount: allIds.length,
    };

    setCache(cacheKey, payload, 2 * 60_000);

    return res.status(200).json({ success: true, ...payload, cached: false });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.getRankBonus = async (req, res) => {
  try {
    const userId = req.user.id;

    const cacheKey = `rankBonus:${userId}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return res.status(200).json({ success: true, ...cached, cached: true });
    }

    const r = await getOrComputeUserRank({ userId });
    const currentRank = String(r.rankName || 'A1').toUpperCase();
    const currentNum = rankToNumber(currentRank);

    awardRankBonusesNonBlocking({ userId, achievedRankName: currentRank });

    const settings = await RankSetting.findAll({ raw: true, attributes: ['rank_name', 'rank_bonus'] });
    const bonusByRank = new Map(
      (settings || []).map((x) => [String(x.rank_name || '').toUpperCase(), numberOrZero(x.rank_bonus)])
    );

    const ledger = await UserRankBonusLedger.findAll({ where: { user_id: userId }, raw: true });
    const earnedByRank = new Map(
      (ledger || []).map((x) => [String(x.rank_name || '').toUpperCase(), numberOrZero(x.bonus_amount)])
    );

    const rows = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7'].map((rankName) => {
      const achieved = currentNum >= rankToNumber(rankName);
      const bonus = numberOrZero(bonusByRank.get(rankName) || 0);
      const earned = numberOrZero(earnedByRank.get(rankName) || 0);
      return {
        rank: rankName,
        bonus,
        bonusEarned: achieved ? earned : 0,
        status: achieved ? 'Achieved' : 'Locked',
        awarded: earned > 0,
      };
    });

    const payload = {
      currentRank,
      rows,
    };

    setCache(cacheKey, payload, 2 * 60_000);

    return res.status(200).json({ success: true, ...payload, cached: false });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
