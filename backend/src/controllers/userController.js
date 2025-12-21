const { Wallet, Transaction } = require('../models');

exports.getSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    let wallet = await Wallet.findOne({ where: { userId } });
    if (!wallet) {
      wallet = await Wallet.create({ userId, balance: 0 });
    }

    const transactions = await Transaction.findAll({
      where: { userId },
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

    const todayKey = utcDateKey(today);
    const systemDaily = dailyValueForKey(`system:${todayKey}`, systemMin, systemMax);
    const teamDaily = dailyValueForKey(`team:${userId}:${todayKey}`, teamMin, teamMax);

    let systemTotal = 0;
    let teamTotal = 0;

    for (let i = 0; i <= dayCount; i++) {
      const d = new Date(Date.UTC(2025, 0, 1 + i));
      const key = utcDateKey(d);
      systemTotal += dailyValueForKey(`system:${key}`, systemMin, systemMax);
      teamTotal += dailyValueForKey(`team:${userId}:${key}`, teamMin, teamMax);
    }

    res.status(200).json({
      success: true,
      stats: {
        system: {
          daily: systemDaily,
          total: systemTotal,
        },
        team: {
          daily: teamDaily,
          total: teamTotal,
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
