const { UserRankConfig } = require('../models');
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
    const rows = await UserRankConfig.findAll({ raw: true, attributes: ['rank_name', 'min_balance'], order: [['rank_name', 'ASC']] });

    const map = new Map((rows || []).map((r) => [String(r.rank_name || '').toUpperCase(), Number(r.min_balance || 0)]));
    const desired = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7'];

    const ranks = desired.map((name) => ({
      rank_name: name,
      min_balance: map.has(name) ? Number(map.get(name) || 0) : 0,
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
      if (!name || min === null) {
        return res.status(400).json({ success: false, message: 'Invalid rank payload' });
      }
      updates.push({ rank_name: name, min_balance: min });
    }

    const byName = new Map(updates.map((u) => [u.rank_name, u]));
    for (const name of ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7']) {
      if (!byName.has(name)) {
        byName.set(name, { rank_name: name, min_balance: 0 });
      }
    }

    for (const u of byName.values()) {
      await UserRankConfig.upsert(u);
    }

    invalidateRankConfigCache();

    const sampleUserId = req.body?.recomputeUserId ? Number(req.body.recomputeUserId) : null;
    if (Number.isFinite(sampleUserId) && sampleUserId > 0) {
      recomputeUserRankNonBlocking({ userId: sampleUserId });
    }

    return res.status(200).json({ success: true, message: 'Ranking config updated' });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
