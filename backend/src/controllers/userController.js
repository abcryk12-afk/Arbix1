const { Op } = require('sequelize');
const { User, Wallet, Transaction } = require('../models');

exports.getSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    let wallet = await Wallet.findOne({ where: { user_id: userId } });
    if (!wallet) {
      wallet = await Wallet.create({ user_id: userId, balance: 0 });
    }

    const transactions = await Transaction.findAll({
      where: { user_id: userId },
      order: [['createdAt', 'DESC']],
      limit: 20,
    });

    res.status(200).json({
      success: true,
      wallet: {
        balance: Number(wallet.balance),
      },
      transactions: transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        createdAt: t.createdAt,
        note: t.note || null,
      })),
    });
  } catch (error) {
    console.error('Get user summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user summary',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.getReferralEarnings = async (req, res) => {
  try {
    const userId = req.user.id;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const txs = await Transaction.findAll({
      where: {
        user_id: userId,
        note: {
          [Op.like]: 'Referral commission%'
        },
      },
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'amount', 'note', 'createdAt'],
    });

    const summary = {
      today: 0,
      allTime: 0,
      byLevel: { 1: 0, 2: 0, 3: 0 },
    };

    for (const t of txs) {
      const amt = Number(t.amount || 0);
      if (!Number.isFinite(amt)) continue;

      summary.allTime += amt;
      if (t.createdAt && new Date(t.createdAt) >= startOfToday) summary.today += amt;

      const note = String(t.note || '');
      if (note.includes('L1')) summary.byLevel[1] += amt;
      else if (note.includes('L2')) summary.byLevel[2] += amt;
      else if (note.includes('L3')) summary.byLevel[3] += amt;
    }

    res.status(200).json({
      success: true,
      earnings: {
        today: summary.today,
        allTime: summary.allTime,
        withdrawable: summary.allTime,
        breakdown: {
          l1: summary.byLevel[1],
          l2: summary.byLevel[2],
          l3: summary.byLevel[3],
        },
      },
      transactions: txs.map((t) => ({
        id: t.id,
        amount: Number(t.amount || 0),
        note: t.note || null,
        createdAt: t.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get referral earnings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch referral earnings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.getReferrals = async (req, res) => {
  try {
    const userId = req.user.id;

    const level1 = await User.findAll({
      where: { referred_by_id: userId },
      attributes: ['id', 'name', 'email', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });

    const level1Ids = level1.map((u) => u.id);
    const level2 = level1Ids.length
      ? await User.findAll({
          where: { referred_by_id: level1Ids },
          attributes: ['id', 'name', 'email', 'createdAt', 'referred_by_id'],
          order: [['createdAt', 'DESC']],
        })
      : [];

    const level2Ids = level2.map((u) => u.id);
    const level3 = level2Ids.length
      ? await User.findAll({
          where: { referred_by_id: level2Ids },
          attributes: ['id', 'name', 'email', 'createdAt', 'referred_by_id'],
          order: [['createdAt', 'DESC']],
        })
      : [];

    res.status(200).json({
      success: true,
      counts: {
        l1: level1.length,
        l2: level2.length,
        l3: level3.length,
        total: level1.length + level2.length + level3.length,
      },
      referrals: {
        l1: level1.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          joinDate: u.createdAt,
          level: 1,
        })),
        l2: level2.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          joinDate: u.createdAt,
          level: 2,
          referredById: u.referred_by_id,
        })),
        l3: level3.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          joinDate: u.createdAt,
          level: 3,
          referredById: u.referred_by_id,
        })),
      },
    });
  } catch (error) {
    console.error('Get referrals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch referrals',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

function pad2(n) {
  return String(n).padStart(2, '0');
}

function utcDateKey(date) {
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function dailyValueForKey(seedKey, min, max) {
  const rand = mulberry32(hashSeed(seedKey));
  const v = min + rand() * (max - min);
  return Math.round(v);
}

function daysBetweenUtc(start, end) {
  const startUtc = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const endUtc = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  return Math.max(0, Math.floor((endUtc - startUtc) / (24 * 60 * 60 * 1000)));
}

exports.getFooterStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    const start = new Date(Date.UTC(2025, 0, 1));

    const dayCount = daysBetweenUtc(start, today);

    const systemMin = 700;
    const systemMax = 3000;
    const teamMin = 250;
    const teamMax = 1800;

    const systemJoinMin = 250;
    const systemJoinMax = 1200;
    const teamJoinMin = 5;
    const teamJoinMax = 80;

    const todayKey = utcDateKey(today);
    const systemDaily = dailyValueForKey(`system:${todayKey}`, systemMin, systemMax);
    const teamDaily = dailyValueForKey(`team:${userId}:${todayKey}`, teamMin, teamMax);

    const systemDailyJoinings = dailyValueForKey(
      `system:joinings:${todayKey}`,
      systemJoinMin,
      systemJoinMax
    );
    const teamDailyJoinings = dailyValueForKey(
      `team:${userId}:joinings:${todayKey}`,
      teamJoinMin,
      teamJoinMax
    );

    let systemTotal = 0;
    let teamTotal = 0;
    let systemTotalJoinings = 0;
    let teamTotalJoinings = 0;

    for (let i = 0; i <= dayCount; i++) {
      const d = new Date(Date.UTC(2025, 0, 1 + i));
      const key = utcDateKey(d);
      systemTotal += dailyValueForKey(`system:${key}`, systemMin, systemMax);
      teamTotal += dailyValueForKey(`team:${userId}:${key}`, teamMin, teamMax);

      systemTotalJoinings += dailyValueForKey(
        `system:joinings:${key}`,
        systemJoinMin,
        systemJoinMax
      );
      teamTotalJoinings += dailyValueForKey(
        `team:${userId}:joinings:${key}`,
        teamJoinMin,
        teamJoinMax
      );
    }

    res.status(200).json({
      success: true,
      stats: {
        system: {
          daily: systemDaily,
          total: systemTotal,
          joiningsDaily: systemDailyJoinings,
          joiningsTotal: systemTotalJoinings,
        },
        team: {
          daily: teamDaily,
          total: teamTotal,
          joiningsDaily: teamDailyJoinings,
          joiningsTotal: teamTotalJoinings,
        },
        updatedAt: new Date().toISOString(),
        timezone: 'UTC',
      },
    });
  } catch (error) {
    console.error('Get footer stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch footer stats',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
