const { Op } = require('sequelize');
const { User, Wallet, Transaction, UserPackage, WithdrawalRequest, DepositRequest, sequelize } = require('../models');
const { ensureWalletForUser } = require('../services/walletService');

const PACKAGES = {
  starter: { name: 'Starter', capital: 10, dailyRoi: 1, durationDays: 365 },
  basic: { name: 'Basic', capital: 30, dailyRoi: 1.3, durationDays: 365 },
  growth: { name: 'Growth', capital: 50, dailyRoi: 1.5, durationDays: 365 },
  silver: { name: 'Silver', capital: 100, dailyRoi: 2, durationDays: 365 },
  gold: { name: 'Gold', capital: 500, dailyRoi: 3, durationDays: 365 },
  platinum: { name: 'Platinum', capital: 1000, dailyRoi: 4, durationDays: 365 },
  elite_plus: { name: 'Elite+', capital: 'flex', minCapital: 1000, dailyRoi: 4.5, durationDays: 365 },
};

exports.getSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    let wallet = await Wallet.findOne({ where: { user_id: userId } });
    if (!wallet) {
      wallet = await Wallet.create({ user_id: userId, balance: 0 });
    }

    const transactions = await Transaction.findAll({
      where: { user_id: userId },
      order: [[sequelize.col('created_at'), 'DESC']],
      limit: 20,
      raw: true,
      attributes: ['id', 'type', 'amount', 'note', [sequelize.col('created_at'), 'createdAt']],
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

exports.listDepositRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Math.min(Number(req.query.limit || 50), 200);
    const status = req.query.status ? String(req.query.status).toLowerCase() : '';

    const where = { user_id: userId };
    if (status && status !== 'all') {
      where.status = status;
    }

    const requests = await DepositRequest.findAll({
      where,
      order: [[DepositRequest.sequelize.col('created_at'), 'DESC']],
      limit,
      raw: true,
    });

    return res.status(200).json({
      success: true,
      requests: requests.map((r) => ({
        id: r.id,
        amount: Number(r.amount || 0),
        address: r.address,
        status: r.status,
        txHash: r.tx_hash || null,
        userNote: r.user_note || null,
        adminNote: r.admin_note || null,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })),
    });
  } catch (error) {
    console.error('List user deposit requests error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch deposit requests',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.requestDeposit = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, note, txHash } = req.body || {};

    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      return res.status(400).json({ success: false, message: 'Deposit amount must be positive' });
    }

    if (value < 10) {
      return res.status(400).json({ success: false, message: 'Minimum deposit is 10 USDT' });
    }

    const result = await Transaction.sequelize.transaction(async (t) => {
      const user = await User.findByPk(userId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!user) {
        return { ok: false, status: 404, message: 'User not found' };
      }

      if (!user.wallet_public_address) {
        await ensureWalletForUser(user);
        await user.reload({ transaction: t });
      }

      const address = String(user.wallet_public_address || '').trim();
      if (!address) {
        return { ok: false, status: 400, message: 'Wallet address is not assigned yet. Please try again.' };
      }

      const request = await DepositRequest.create(
        {
          user_id: userId,
          amount: value,
          address,
          status: 'pending',
          user_note: note || null,
          tx_hash: txHash || null,
        },
        { transaction: t },
      );

      return { ok: true, request };
    });

    if (!result.ok) {
      return res.status(result.status || 400).json({ success: false, message: result.message || 'Failed to submit deposit request' });
    }

    return res.status(201).json({
      success: true,
      message: 'Deposit request submitted successfully',
      request: {
        id: result.request.id,
        amount: Number(result.request.amount || 0),
        address: result.request.address,
        status: result.request.status,
        createdAt: result.request.created_at || new Date(),
      },
    });
  } catch (error) {
    console.error('User deposit request error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit deposit request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.listWithdrawalRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Math.min(Number(req.query.limit || 50), 200);
    const status = req.query.status ? String(req.query.status).toLowerCase() : '';

    const where = { user_id: userId };
    if (status && status !== 'all') {
      where.status = status;
    }

    const requests = await WithdrawalRequest.findAll({
      where,
      order: [[WithdrawalRequest.sequelize.col('created_at'), 'DESC']],
      limit,
      raw: true,
    });

    return res.status(200).json({
      success: true,
      requests: requests.map((r) => ({
        id: r.id,
        amount: Number(r.amount || 0),
        address: r.address,
        status: r.status,
        txHash: r.tx_hash || null,
        userNote: r.user_note || null,
        adminNote: r.admin_note || null,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })),
    });
  } catch (error) {
    console.error('List user withdrawal requests error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch withdrawal requests',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.requestWithdrawal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, address, note } = req.body || {};

    const value = Number(amount);
    if (!address || typeof address !== 'string') {
      return res.status(400).json({ success: false, message: 'Withdrawal address is required' });
    }

    if (!Number.isFinite(value) || value <= 0) {
      return res.status(400).json({ success: false, message: 'Withdrawal amount must be positive' });
    }

    if (value < 10) {
      return res.status(400).json({ success: false, message: 'Minimum withdrawal is 10 USDT' });
    }

    const now = new Date();

    const result = await Transaction.sequelize.transaction(async (t) => {
      let wallet = await Wallet.findOne({ where: { user_id: userId }, transaction: t, lock: t.LOCK.UPDATE });
      if (!wallet) {
        wallet = await Wallet.create({ user_id: userId, balance: 0 }, { transaction: t });
      }

      const currentBalance = Number(wallet.balance || 0);

      const pendingSumRaw = await WithdrawalRequest.sum('amount', {
        where: { user_id: userId, status: 'pending' },
        transaction: t,
      });
      const pendingSum = Number(pendingSumRaw || 0);

      const maxWithdrawable = currentBalance - pendingSum;
      if (!Number.isFinite(maxWithdrawable) || maxWithdrawable <= 0 || value > maxWithdrawable) {
        return {
          ok: false,
          status: 400,
          message: 'Insufficient balance for this withdrawal (including pending requests)',
        };
      }

      const request = await WithdrawalRequest.create(
        {
          user_id: userId,
          amount: value,
          address: String(address).trim(),
          status: 'pending',
          user_note: note || null,
        },
        { transaction: t },
      );

      return { ok: true, request };
    });

    if (!result.ok) {
      return res.status(result.status || 400).json({ success: false, message: result.message || 'Failed to submit withdrawal request' });
    }

    return res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      request: {
        id: result.request.id,
        amount: Number(result.request.amount || 0),
        address: result.request.address,
        status: result.request.status,
        createdAt: now,
      },
    });
  } catch (error) {
    console.error('User withdrawal request error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit withdrawal request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.activatePackage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { packageId, capital } = req.body;

    if (!packageId || !PACKAGES[String(packageId)]) {
      return res.status(400).json({ success: false, message: 'Invalid packageId' });
    }

    const config = PACKAGES[String(packageId)];

    const cap =
      config.capital === 'flex'
        ? Number(capital)
        : Number(config.capital);

    if (!Number.isFinite(cap) || cap <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid capital amount' });
    }

    if (config.capital === 'flex' && cap < Number(config.minCapital || 1000)) {
      return res.status(400).json({
        success: false,
        message: `Elite+ requires capital of at least ${Number(config.minCapital || 1000)}`,
      });
    }

    const now = new Date();
    const endAt = new Date(now.getTime() + Number(config.durationDays) * 24 * 60 * 60 * 1000);

    const result = await Transaction.sequelize.transaction(async (t) => {
      let wallet = await Wallet.findOne({ where: { user_id: userId }, transaction: t });
      if (!wallet) {
        wallet = await Wallet.create({ user_id: userId, balance: 0 }, { transaction: t });
      }

      const available = Number(wallet.balance || 0);
      if (available < cap) {
        return { ok: false, status: 400, message: 'Insufficient balance' };
      }

      wallet.balance = available - cap;
      await wallet.save({ transaction: t });

      const pkg = await UserPackage.create(
        {
          user_id: userId,
          package_id: String(packageId),
          package_name: String(config.name),
          capital: cap,
          daily_roi: Number(config.dailyRoi),
          duration_days: Number(config.durationDays),
          total_earned: 0,
          start_at: now,
          end_at: endAt,
          status: 'active',
          last_profit_at: null,
        },
        { transaction: t }
      );

      await Transaction.create(
        {
          user_id: userId,
          type: 'package_purchase',
          amount: cap,
          created_by: req.user?.email || null,
          note: `Package activation (#${pkg.id} - ${config.name})`,
        },
        { transaction: t }
      );

      return { ok: true, wallet, pkg };
    });

    if (!result.ok) {
      return res.status(result.status || 400).json({ success: false, message: result.message });
    }

    res.status(200).json({
      success: true,
      message: 'Package activated',
      wallet: { balance: Number(result.wallet.balance) },
      package: {
        id: result.pkg.id,
        packageId: result.pkg.package_id,
        name: result.pkg.package_name,
        capital: Number(result.pkg.capital),
        dailyRoi: Number(result.pkg.daily_roi),
        durationDays: Number(result.pkg.duration_days),
        startAt: result.pkg.start_at,
        endAt: result.pkg.end_at,
        status: result.pkg.status,
      },
    });
  } catch (error) {
    console.error('Activate package error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate package',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.getPackages = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const packages = await UserPackage.findAll({
      where: { user_id: userId },
      order: [[UserPackage.sequelize.col('created_at'), 'DESC']],
    });

    res.status(200).json({
      success: true,
      packages: packages.map((p) => {
        const endAt = p.end_at ? new Date(p.end_at) : null;
        const daysLeft = endAt ? Math.max(0, Math.ceil((endAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))) : 0;
        const capital = Number(p.capital || 0);
        const roi = Number(p.daily_roi || 0);
        const todayEarnings = (capital * roi) / 100;
        return {
          id: p.id,
          packageId: p.package_id,
          name: p.package_name,
          capital,
          dailyRoi: roi,
          durationDays: Number(p.duration_days || 0),
          startAt: p.start_at,
          endAt: p.end_at,
          status: p.status,
          daysLeft,
          todayEarnings: Number.isFinite(todayEarnings) ? todayEarnings : 0,
          totalEarned: Number(p.total_earned || 0),
        };
      }),
    });
  } catch (error) {
    console.error('Get packages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch packages',
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
        [Op.or]: [
          { type: { [Op.in]: ['referral_profit', 'referral_bonus'] } },
          { note: { [Op.like]: 'Referral commission%' } },
        ],
      },
      order: [[Transaction.sequelize.col('created_at'), 'DESC']],
      raw: true,
      attributes: [
        'id',
        'amount',
        'note',
        'type',
        [Transaction.sequelize.col('created_at'), 'createdAt'],
      ],
    });

    const summary = {
      today: 0,
      allTime: 0,
      byLevel: { 1: 0, 2: 0, 3: 0 },
      categories: {
        deposit_commission: { today: 0, allTime: 0, byLevel: { 1: 0, 2: 0, 3: 0 } },
        referral_profit: { today: 0, allTime: 0, byLevel: { 1: 0, 2: 0, 3: 0 } },
        referral_bonus: { today: 0, allTime: 0, byLevel: { 1: 0, 2: 0, 3: 0 } },
      },
    };

    const addTo = (bucket, amt, isToday, level) => {
      bucket.allTime += amt;
      if (isToday) bucket.today += amt;
      if (level && bucket.byLevel && bucket.byLevel[level] !== undefined) bucket.byLevel[level] += amt;
    };

    for (const t of txs) {
      const amt = Number(t.amount || 0);
      if (!Number.isFinite(amt)) continue;

      const isToday = t.createdAt && new Date(t.createdAt) >= startOfToday;
      const note = String(t.note || '');

      const level = note.includes('L1') ? 1 : note.includes('L2') ? 2 : note.includes('L3') ? 3 : null;

      summary.allTime += amt;
      if (isToday) summary.today += amt;
      if (level) summary.byLevel[level] += amt;

      const isDepositCommission = note.startsWith('Referral commission') || note.startsWith('Referral commission ');
      if (isDepositCommission) {
        addTo(summary.categories.deposit_commission, amt, isToday, level);
        continue;
      }

      if (t.type === 'referral_profit') {
        addTo(summary.categories.referral_profit, amt, isToday, level);
        continue;
      }

      if (t.type === 'referral_bonus') {
        addTo(summary.categories.referral_bonus, amt, isToday, level);
        continue;
      }
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
        categories: {
          deposit_commission: {
            today: summary.categories.deposit_commission.today,
            allTime: summary.categories.deposit_commission.allTime,
            breakdown: {
              l1: summary.categories.deposit_commission.byLevel[1],
              l2: summary.categories.deposit_commission.byLevel[2],
              l3: summary.categories.deposit_commission.byLevel[3],
            },
          },
          referral_profit: {
            today: summary.categories.referral_profit.today,
            allTime: summary.categories.referral_profit.allTime,
            breakdown: {
              l1: summary.categories.referral_profit.byLevel[1],
              l2: summary.categories.referral_profit.byLevel[2],
              l3: summary.categories.referral_profit.byLevel[3],
            },
          },
          referral_bonus: {
            today: summary.categories.referral_bonus.today,
            allTime: summary.categories.referral_bonus.allTime,
            breakdown: {
              l1: summary.categories.referral_bonus.byLevel[1],
              l2: summary.categories.referral_bonus.byLevel[2],
              l3: summary.categories.referral_bonus.byLevel[3],
            },
          },
        },
      },
      transactions: txs.map((t) => ({
        id: t.id,
        amount: Number(t.amount || 0),
        type: t.type,
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
      raw: true,
      attributes: ['id', 'name', 'email', [User.sequelize.col('created_at'), 'createdAt']],
      order: [[sequelize.col('created_at'), 'DESC']],
    });

    const level1Ids = level1.map((u) => u.id);
    const level2 = level1Ids.length
      ? await User.findAll({
          where: { referred_by_id: level1Ids },
          raw: true,
          attributes: ['id', 'name', 'email', [User.sequelize.col('created_at'), 'createdAt'], 'referred_by_id'],
          order: [[sequelize.col('created_at'), 'DESC']],
        })
      : [];

    const level2Ids = level2.map((u) => u.id);
    const level3 = level2Ids.length
      ? await User.findAll({
          where: { referred_by_id: level2Ids },
          raw: true,
          attributes: ['id', 'name', 'email', [User.sequelize.col('created_at'), 'createdAt'], 'referred_by_id'],
          order: [[sequelize.col('created_at'), 'DESC']],
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
    const now = new Date();
    const startOfTodayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const level1 = await User.findAll({
      where: { referred_by_id: userId },
      raw: true,
      attributes: ['id'],
    });

    const level1Ids = level1.map((u) => u.id);
    const level2 = level1Ids.length
      ? await User.findAll({
          where: { referred_by_id: level1Ids },
          raw: true,
          attributes: ['id'],
        })
      : [];

    const level2Ids = level2.map((u) => u.id);
    const level3 = level2Ids.length
      ? await User.findAll({
          where: { referred_by_id: level2Ids },
          raw: true,
          attributes: ['id'],
        })
      : [];

    const teamIds = [...level1Ids, ...level2Ids, ...level3.map((u) => u.id)];

    const systemDailyWithdrawals =
      (await Transaction.sum('amount', {
        where: {
          type: 'withdraw',
          [Op.and]: [Transaction.sequelize.where(Transaction.sequelize.col('created_at'), { [Op.gte]: startOfTodayUtc })],
        },
      })) || 0;

    const systemTotalWithdrawals =
      (await Transaction.sum('amount', {
        where: { type: 'withdraw' },
      })) || 0;

    const systemDailyJoinings = await User.count({
      where: {
        [Op.and]: [User.sequelize.where(User.sequelize.col('created_at'), { [Op.gte]: startOfTodayUtc })],
      },
    });

    const systemTotalJoinings = await User.count();

    const teamDailyWithdrawals = teamIds.length
      ? (await Transaction.sum('amount', {
          where: {
            user_id: teamIds,
            type: 'withdraw',
            [Op.and]: [Transaction.sequelize.where(Transaction.sequelize.col('created_at'), { [Op.gte]: startOfTodayUtc })],
          },
        })) || 0
      : 0;

    const teamTotalWithdrawals = teamIds.length
      ? (await Transaction.sum('amount', {
          where: {
            user_id: teamIds,
            type: 'withdraw',
          },
        })) || 0
      : 0;

    const teamDailyJoinings = teamIds.length
      ? await User.count({
          where: {
            id: teamIds,
            [Op.and]: [User.sequelize.where(User.sequelize.col('created_at'), { [Op.gte]: startOfTodayUtc })],
          },
        })
      : 0;

    const teamTotalJoinings = teamIds.length
      ? await User.count({
          where: { id: teamIds },
        })
      : 0;

    res.status(200).json({
      success: true,
      stats: {
        system: {
          daily: Number(systemDailyWithdrawals) || 0,
          total: Number(systemTotalWithdrawals) || 0,
          joiningsDaily: Number(systemDailyJoinings) || 0,
          joiningsTotal: Number(systemTotalJoinings) || 0,
        },
        team: {
          daily: Number(teamDailyWithdrawals) || 0,
          total: Number(teamTotalWithdrawals) || 0,
          joiningsDaily: Number(teamDailyJoinings) || 0,
          joiningsTotal: Number(teamTotalJoinings) || 0,
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
