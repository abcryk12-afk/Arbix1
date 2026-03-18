const { Op } = require('sequelize');
const { User, UserPackage, UserRankConfig, UserRankStatus, sequelize } = require('../models');

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

  const rows = await UserRankConfig.findAll({ raw: true, attributes: ['rank_name', 'min_balance'] });
  const normalized = (rows || [])
    .map((r) => ({
      rankName: normalizeRankName(r.rank_name),
      minBalance: numberOrZero(r.min_balance),
    }))
    .filter((r) => r.rankName);

  const byName = new Map(normalized.map((r) => [r.rankName, r]));
  for (const name of ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7']) {
    if (!byName.has(name)) byName.set(name, { rankName: name, minBalance: 0 });
  }

  const ranks = Array.from(byName.values()).sort((a, b) => b.minBalance - a.minBalance);
  configCache.ranks = ranks;
  configCache.at = now;
  return ranks;
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

  try {
    const cached = await UserRankStatus.findOne({ where: { user_id: userId }, raw: true });
    if (cached?.calculated_at) {
      const age = now.getTime() - new Date(cached.calculated_at).getTime();
      if (age >= 0 && age <= maxAgeMs) {
        return {
          cached: true,
          rankName: String(cached.rank_name || 'A1'),
          totalTeamActiveBalance: numberOrZero(cached.total_team_active_balance),
          calculatedAt: new Date(cached.calculated_at).toISOString(),
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
  };
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
