const { RankSetting, UserRankConfig } = require('../models');
const { invalidateRankConfigCache, recomputeUserRankNonBlocking } = require('../services/userRankingService');

const normalizeRankName = (value) => {
  const s = String(value || '').trim().toUpperCase();
  if (!/^A[1-7]$/.test(s)) return null;
  return s;
};

const clampBalance = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, n);
};

exports.getRankingConfig = async (req, res) => {
  try {
    const settings = await RankSetting.findAll({
      raw: true,
      attributes: ['rank_name', 'min_team_business', 'rank_bonus'],
      order: [['rank_name', 'ASC']],
    });

    const map = new Map(
      (settings || []).map((r) => [
        String(r.rank_name || '').toUpperCase(),
        { min: Number(r.min_team_business || 0), bonus: Number(r.rank_bonus || 0) },
      ])
    );
    const desired = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7'];

    const ranks = desired.map((name) => ({
      rank_name: name,
      min_balance: map.has(name) ? Number(map.get(name)?.min || 0) : 0,
      rank_bonus: map.has(name) ? Number(map.get(name)?.bonus || 0) : 0,
    }));

    return res.status(200).json({ success: true, ranks });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.updateRankingConfig = async (req, res) => {
  try {
    const input = req.body?.ranks;
    if (!Array.isArray(input)) {
      return res.status(400).json({ success: false, message: 'ranks must be an array' });
    }

    const updates = [];
    for (const item of input) {
      const name = normalizeRankName(item?.rank_name ?? item?.rankName);
      const min = clampBalance(item?.min_balance ?? item?.minBalance);
      const bonus = clampBalance(item?.rank_bonus ?? item?.rankBonus ?? item?.bonus);
      if (!name || min === null) {
        return res.status(400).json({ success: false, message: 'Invalid rank payload' });
      }
      updates.push({ rank_name: name, min_team_business: min, rank_bonus: bonus === null ? 0 : bonus });
    }

    const byName = new Map(updates.map((u) => [u.rank_name, u]));
    for (const name of ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7']) {
      if (!byName.has(name)) {
        byName.set(name, { rank_name: name, min_team_business: 0, rank_bonus: 0 });
      }
    }

    for (const u of byName.values()) {
      await RankSetting.upsert(u);
      try {
        await UserRankConfig.upsert({ rank_name: u.rank_name, min_balance: u.min_team_business });
      } catch (e) {}
    }

    invalidateRankConfigCache();

    const sampleUserId = req.body?.recomputeUserId ? Number(req.body.recomputeUserId) : null;
    if (Number.isFinite(sampleUserId) && sampleUserId > 0) {
      recomputeUserRankNonBlocking({ userId: sampleUserId, reason: 'config_change' });
    }

    return res.status(200).json({ success: true, message: 'Ranking config updated' });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
