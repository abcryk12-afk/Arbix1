const { Op } = require('sequelize');
const { User, UserPackage, UserRankConfig, UserRankStatus, RankSetting, UserRankBonusLedger, Wallet, Transaction, sequelize } = require('../models');

const configCache = {
  at: 0,
  ttlMs: 60_000,
  ranks: null,
};

const normalizeRankName = (value) => {
  const s = String(value || '').trim().toUpperCase();
  if (!/^A[1-7]$/.test(s)) return null;
  return s;
};

const numberOrZero = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const getRankConfig = async () => {
  const now = Date.now();
  if (configCache.ranks && now - configCache.at < configCache.ttlMs) {
    return configCache.ranks;
  }

  let normalized = [];
  try {
    const rows = await RankSetting.findAll({ raw: true, attributes: ['rank_name', 'min_team_business', 'rank_bonus'] });
    normalized = (rows || [])
      .map((r) => ({
        rankName: normalizeRankName(r.rank_name),
        minBalance: numberOrZero(r.min_team_business),
        rankBonus: numberOrZero(r.rank_bonus),
      }))
      .filter((r) => r.rankName);
  } catch (e) {
    normalized = [];
  }

  if (!normalized.length) {
    const rows = await UserRankConfig.findAll({ raw: true, attributes: ['rank_name', 'min_balance'] });
    normalized = (rows || [])
      .map((r) => ({
        rankName: normalizeRankName(r.rank_name),
        minBalance: numberOrZero(r.min_balance),
        rankBonus: 0,
      }))
      .filter((r) => r.rankName);
  }

  const byName = new Map(normalized.map((r) => [r.rankName, r]));
  for (const name of ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7']) {
    if (!byName.has(name)) byName.set(name, { rankName: name, minBalance: 0, rankBonus: 0 });
  }

  const ranks = Array.from(byName.values()).sort((a, b) => b.minBalance - a.minBalance);
  configCache.ranks = ranks;
  configCache.at = now;
  return ranks;
};

const rankToNumber = (rankName) => {
  const s = String(rankName || '').trim().toUpperCase();
  const m = s.match(/^A([1-7])$/);
  if (!m) return 0;
  return Number(m[1] || 0);
};

const awardRankBonuses = async ({ userId, achievedRankName }) => {
  const target = String(achievedRankName || 'A1').toUpperCase();
  const targetN = rankToNumber(target);
  if (!targetN) return;

  const ranks = await getRankConfig();
  const inOrder = [...ranks]
    .map((r) => ({ rankName: String(r.rankName || '').toUpperCase(), rankBonus: numberOrZero(r.rankBonus) }))
    .filter((r) => /^A[1-7]$/.test(r.rankName))
    .sort((a, b) => rankToNumber(a.rankName) - rankToNumber(b.rankName));

  const eligible = inOrder.filter((r) => rankToNumber(r.rankName) > 0 && rankToNumber(r.rankName) <= targetN);
  if (!eligible.length) return;

  await sequelize.transaction(async (t) => {
    const already = await UserRankBonusLedger.findAll({ where: { user_id: userId }, raw: true, transaction: t });
    const have = new Set((already || []).map((x) => String(x.rank_name || '').toUpperCase()).filter(Boolean));

    const toAward = eligible.filter((r) => !have.has(r.rankName) && numberOrZero(r.rankBonus) > 0);
    if (!toAward.length) return;

    const totalAward = toAward.reduce((acc, r) => acc + numberOrZero(r.rankBonus), 0);

    await Wallet.findOrCreate({ where: { user_id: userId }, defaults: { user_id: userId, balance: 0, reward_balance: 0 }, transaction: t });
    await Wallet.increment(
      { reward_balance: totalAward },
      { where: { user_id: userId }, transaction: t }
    );

    const now = new Date();
    for (const r of toAward) {
      await UserRankBonusLedger.create(
        { user_id: userId, rank_name: r.rankName, bonus_amount: numberOrZero(r.rankBonus), awarded_at: now },
        { transaction: t }
      );

      await Transaction.create(
        {
          user_id: userId,
          type: 'daily_bonus',
          amount: numberOrZero(r.rankBonus),
          created_by: 'system',
          note: `Rank bonus ${r.rankName}`,
        },
        { transaction: t }
      );
    }
  });
};

exports.invalidateRankConfigCache = () => {
  configCache.at = 0;
  configCache.ranks = null;
};

const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

const getDownlineUserIdsUnlimited = async ({ rootUserId, maxNodes = 50000 }) => {
  const visited = new Set();
  const queue = [rootUserId];
  visited.add(rootUserId);

  const downline = [];

  while (queue.length) {
    const batch = queue.splice(0, 500);

    const children = await User.findAll({
      where: { referred_by_id: { [Op.in]: batch } },
      raw: true,
      attributes: ['id'],
      limit: 200000,
    });

    for (const row of children || []) {
      const id = Number(row.id);
      if (!Number.isFinite(id) || id <= 0) continue;
      if (visited.has(id)) continue;
      visited.add(id);
      downline.push(id);
      queue.push(id);
      if (downline.length >= maxNodes) return downline;
    }
  }

  return downline;
};

const sumActiveCapitalForUsers = async (userIds) => {
  if (!userIds.length) return 0;
  let sum = 0;

  for (const ids of chunk(userIds, 800)) {
    const partial = await UserPackage.sum('capital', {
      where: {
        user_id: { [Op.in]: ids },
        status: 'active',
      },
    });
    sum += numberOrZero(partial);
  }

  return sum;
};

const pickRankForBalance = async (balance) => {
  const ranks = await getRankConfig();
  const b = numberOrZero(balance);
  for (const r of ranks) {
    if (b >= numberOrZero(r.minBalance)) return r.rankName;
  }
  return 'A1';
};

exports.computeUserTeamActiveBalance = async ({ userId }) => {
  const downlineIds = await getDownlineUserIdsUnlimited({ rootUserId: userId });
  const total = await sumActiveCapitalForUsers(downlineIds);
  return { downlineCount: downlineIds.length, totalTeamActiveBalance: total };
};

exports.getOrComputeUserRank = async ({ userId, maxAgeMs = 10 * 60_000 }) => {
  const now = new Date();

  let lastSeenRank = null;

  try {
    const cached = await UserRankStatus.findOne({ where: { user_id: userId }, raw: true });
    if (cached?.calculated_at) {
      lastSeenRank = cached?.last_seen_rank ? String(cached.last_seen_rank) : null;
      const age = now.getTime() - new Date(cached.calculated_at).getTime();
      if (age >= 0 && age <= maxAgeMs) {
        return {
          cached: true,
          rankName: String(cached.rank_name || 'A1'),
          totalTeamActiveBalance: numberOrZero(cached.total_team_active_balance),
          calculatedAt: new Date(cached.calculated_at).toISOString(),
          lastSeenRank,
        };
      }
    }
  } catch (e) {
  }

  const computed = await exports.computeUserTeamActiveBalance({ userId });
  const rankName = await pickRankForBalance(computed.totalTeamActiveBalance);

  try {
    await sequelize.query(
      `INSERT INTO user_rank_status (user_id, rank_name, total_team_active_balance, calculated_at)
       VALUES (:userId, :rankName, :bal, :at)
       ON DUPLICATE KEY UPDATE
         rank_name = VALUES(rank_name),
         total_team_active_balance = VALUES(total_team_active_balance),
         calculated_at = VALUES(calculated_at)`,
      {
        replacements: {
          userId,
          rankName,
          bal: computed.totalTeamActiveBalance,
          at: now,
        },
      }
    );
  } catch (e) {
  }

  return {
    cached: false,
    rankName,
    totalTeamActiveBalance: computed.totalTeamActiveBalance,
    calculatedAt: now.toISOString(),
    lastSeenRank,
  };
};

exports.awardRankBonusesNonBlocking = ({ userId, achievedRankName }) => {
  const id = Number(userId);
  if (!Number.isFinite(id) || id <= 0) return;
  Promise.resolve()
    .then(() => awardRankBonuses({ userId: id, achievedRankName }))
    .catch(() => null);
};

exports.markUserRankSeen = async ({ userId, rankName }) => {
  const safe = normalizeRankName(rankName) || 'A1';
  const now = new Date();

  try {
    await sequelize.query(
      `INSERT INTO user_rank_status (user_id, rank_name, total_team_active_balance, calculated_at, last_seen_rank, last_seen_at)
       VALUES (:userId, :rankName, 0, :at, :rankName, :at)
       ON DUPLICATE KEY UPDATE
         last_seen_rank = :rankName,
         last_seen_at = :at`,
      { replacements: { userId, rankName: safe, at: now } }
    );
    return true;
  } catch (e) {
    return false;
  }
};

exports.recomputeUserRankNonBlocking = ({ userId }) => {
  if (!userId) return;
  Promise.resolve()
    .then(() => exports.getOrComputeUserRank({ userId, maxAgeMs: 0 }))
    .catch(() => null);
};

exports.recomputeUplineRanksNonBlocking = ({ userId, maxDepth = 100 }) => {
  const root = Number(userId);
  if (!Number.isFinite(root) || root <= 0) return;

  Promise.resolve()
    .then(async () => {
      const visited = new Set();
      let currentId = root;
      let depth = 0;

      while (depth < maxDepth) {
        depth += 1;

        let row;
        try {
          row = await User.findByPk(currentId, { raw: true, attributes: ['id', 'referred_by_id'] });
        } catch {
          return;
        }

        const parentId = Number(row?.referred_by_id);
        if (!Number.isFinite(parentId) || parentId <= 0) return;
        if (visited.has(parentId)) return;
        visited.add(parentId);

        await exports.getOrComputeUserRank({ userId: parentId, maxAgeMs: 0 }).catch(() => null);
        currentId = parentId;
      }
    })
    .catch(() => null);
};
