const { Op } = require('sequelize');
const { ethers } = require('ethers');
const { User, Wallet, Transaction, UserPackage, WithdrawalRequest, DepositRequest, Notification, SiteSetting, DailyCheckin, sequelize } = require('../models');
const { ensureWalletForUser } = require('../services/walletService');
const { notifyDepositRequest, notifyWithdrawRequest } = require('../services/adminNotificationEmailService');
const { getInvestmentPackagesConfig } = require('../services/investmentPackageConfigService');
const { getFooterStatsOverrides } = require('../services/footerStatsOverrideService');

const CHECKIN_INTERVAL_MS = 24 * 60 * 60 * 1000;

const computeNextDay = (streakDay) => {
  const day = Number(streakDay || 0);
  if (day >= 7) return 1;
  return day + 1;
};

const rewardAmountForDay = (day) => {
  const n = Math.min(Math.max(Number(day) || 1, 1), 7);
  return Number((n * 0.05).toFixed(2));
};

exports.getDailyCheckinStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    let wallet = await Wallet.findOne({ where: { user_id: userId } });
    if (!wallet) {
      wallet = await Wallet.create({ user_id: userId, balance: 0 });
    }

    let record = await DailyCheckin.findOne({ where: { user_id: userId } });
    if (!record) {
      record = await DailyCheckin.create({ user_id: userId, streak_day: 0, last_claimed_at: null });
    }

    const last = record.last_claimed_at ? new Date(record.last_claimed_at) : null;
    const elapsed = last ? now.getTime() - last.getTime() : CHECKIN_INTERVAL_MS;
    const remainingMs = Math.max(0, CHECKIN_INTERVAL_MS - elapsed);
    const canClaim = remainingMs <= 0;
    const nextDay = canClaim ? computeNextDay(record.streak_day) : null;
    const amount = canClaim && nextDay ? rewardAmountForDay(nextDay) : null;

    const streakDayForUi = canClaim && Number(record.streak_day) >= 7 ? 0 : Number(record.streak_day || 0);
    const nextEligibleAt = last ? new Date(last.getTime() + CHECKIN_INTERVAL_MS) : null;

    return res.status(200).json({
      success: true,
      canClaim,
      nextDay: nextDay || (Number(record.streak_day) >= 7 ? 1 : Number(record.streak_day || 0) + 1),
      amount: amount !== null ? amount : rewardAmountForDay(computeNextDay(record.streak_day)),
      streakDay: streakDayForUi,
      nextEligibleAt: nextEligibleAt ? nextEligibleAt.toISOString() : null,
      remainingMs,
      walletBalance: Number(wallet.balance || 0),
      rewardBalance: Number(wallet.reward_balance || 0),
    });
  } catch (error) {
    console.error('Daily check-in status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch daily check-in status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.getFooterDemoStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfTodayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const HOUR_MS = 60 * 60 * 1000;
    const demoEpochUtcMs = Date.UTC(2025, 0, 1, 0, 0, 0);
    const nowHourIndex = Math.max(0, Math.floor((now.getTime() - demoEpochUtcMs) / HOUR_MS));
    const todayStartHourIndex = Math.max(0, Math.floor((startOfTodayUtc.getTime() - demoEpochUtcMs) / HOUR_MS));

    const joiningsDailyBase = sumHourlyRange('footer_demo_joinings', todayStartHourIndex, nowHourIndex, 80, 100, 0);
    const joiningsTotalBase = sumHourlyRange('footer_demo_joinings', 0, nowHourIndex, 80, 100, 0);

    const withdrawalsDailyBase = sumHourlyRange('footer_demo_withdrawals', todayStartHourIndex, nowHourIndex, 800, 1000, 2);
    const withdrawalsTotalBase = sumHourlyRange('footer_demo_withdrawals', 0, nowHourIndex, 800, 1000, 2);

    let overrides = null;
    try {
      overrides = await getFooterStatsOverrides();
    } catch {}

    const systemOverrides = overrides?.system || {};

    const adjustedSystemDailyWithdrawals = Math.max(
      0,
      (Number(withdrawalsDailyBase) || 0) + (Number(systemOverrides.dailyWithdrawals) || 0),
    );
    const adjustedSystemTotalWithdrawals = Math.max(
      0,
      (Number(withdrawalsTotalBase) || 0) + (Number(systemOverrides.totalWithdrawals) || 0),
    );
    const adjustedSystemDailyJoinings = Math.max(
      0,
      Math.trunc((Number(joiningsDailyBase) || 0) + (Number(systemOverrides.dailyJoinings) || 0)),
    );
    const adjustedSystemTotalJoinings = Math.max(
      0,
      Math.trunc((Number(joiningsTotalBase) || 0) + (Number(systemOverrides.totalJoinings) || 0)),
    );

    return res.status(200).json({
      success: true,
      stats: {
        system: {
          daily: adjustedSystemDailyWithdrawals,
          total: adjustedSystemTotalWithdrawals,
          joiningsDaily: adjustedSystemDailyJoinings,
          joiningsTotal: adjustedSystemTotalJoinings,
        },
        team: {
          daily: 0,
          total: 0,
          joiningsDaily: 0,
          joiningsTotal: 0,
        },
        updatedAt: new Date().toISOString(),
        timezone: 'UTC',
      },
    });
  } catch (error) {
    console.error('Get footer demo stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch footer demo stats',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.claimDailyCheckin = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const result = await Transaction.sequelize.transaction(async (t) => {
      let wallet = await Wallet.findOne({ where: { user_id: userId }, transaction: t });
      if (!wallet) {
        wallet = await Wallet.create({ user_id: userId, balance: 0 }, { transaction: t });
      }

      let record = await DailyCheckin.findOne({ where: { user_id: userId }, transaction: t, lock: t.LOCK.UPDATE });
      if (!record) {
        record = await DailyCheckin.create(
          { user_id: userId, streak_day: 0, last_claimed_at: null },
          { transaction: t }
        );
      }

      const last = record.last_claimed_at ? new Date(record.last_claimed_at) : null;
      const elapsed = last ? now.getTime() - last.getTime() : CHECKIN_INTERVAL_MS;
      const remainingMs = Math.max(0, CHECKIN_INTERVAL_MS - elapsed);
      if (remainingMs > 0) {
        return { ok: false, status: 400, message: 'Not eligible yet', remainingMs };
      }

      const dayToClaim = computeNextDay(record.streak_day);
      const amount = rewardAmountForDay(dayToClaim);

      wallet.reward_balance = Number(wallet.reward_balance || 0) + amount;
      await wallet.save({ transaction: t });

      record.streak_day = dayToClaim;
      record.last_claimed_at = now;
      await record.save({ transaction: t });

      await Transaction.create(
        {
          user_id: userId,
          type: 'daily_bonus',
          amount,
          created_by: req.user?.email || null,
          note: `Daily check-in bonus (Day ${dayToClaim})`,
        },
        { transaction: t }
      );

      return {
        ok: true,
        walletBalance: Number(wallet.balance || 0),
        rewardBalance: Number(wallet.reward_balance || 0),
        reward: {
          day: dayToClaim,
          amount,
          currency: 'USDT',
          claimedAt: now.toISOString(),
        },
      };
    });

    if (!result.ok) {
      return res.status(result.status || 400).json({
        success: false,
        message: result.message || 'Unable to claim',
        remainingMs: result.remainingMs,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Daily bonus claimed',
      wallet: {
        balance: Number(result.walletBalance || 0),
        rewardBalance: Number(result.rewardBalance || 0),
      },
      reward: result.reward,
    });
  } catch (error) {
    console.error('Daily check-in claim error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to claim daily bonus',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.getPublicInvestmentPackages = async (req, res) => {
  try {
    const cfg = await getInvestmentPackagesConfig();
    return res.status(200).json({
      success: true,
      packages: cfg?.packages || {},
    });
  } catch (error) {
    console.error('Get public investment packages error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch investment packages',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.getSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    try {
      const user = await User.findByPk(userId, { attributes: ['id', 'wallet_public_address'] });
      if (user && !user.wallet_public_address) {
        await ensureWalletForUser(user);
      }
    } catch {}

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
      config: {
        minDepositUsdt: Math.max(10, Number(process.env.MIN_DEPOSIT_USDT || 10)),
        confirmations: Number(process.env.DEPOSIT_CONFIRMATIONS || 12),
        depositRequestTtlMinutes: Math.min(
          Math.max(Math.floor(Number(process.env.DEPOSIT_REQUEST_TTL_MINUTES || 30)), 1),
          24 * 60,
        ),
      },
      wallet: {
        balance: Number(wallet.balance),
        rewardBalance: Number(wallet.reward_balance || 0),
        totalBalance: Number(wallet.balance || 0) + Number(wallet.reward_balance || 0),
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

exports.listNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Math.min(Number(req.query.limit || 10), 50);

    const pickCol = (colsSet, candidates) => candidates.find((c) => colsSet.has(c)) || null;

    try {
      const qi = sequelize.getQueryInterface();
      const desc = await qi.describeTable('notifications');
      const colsSet = new Set(Object.keys(desc || {}));

      const userCol = pickCol(colsSet, ['user_id', 'userId']);
      const createdAtCol = pickCol(colsSet, ['created_at', 'createdAt']);
      const isReadCol = pickCol(colsSet, ['is_read', 'isRead']);

      if (userCol) {
        const selectParts = ['id', 'title', 'message'];
        if (isReadCol) selectParts.push(`${isReadCol} as isRead`);
        if (createdAtCol) selectParts.push(`${createdAtCol} as createdAt`);

        const orderCol = createdAtCol || 'id';
        const raw = await sequelize.query(
          `SELECT ${selectParts.join(', ')} FROM notifications WHERE ${userCol} = :userId ORDER BY ${orderCol} DESC LIMIT :limit`,
          { replacements: { userId, limit } },
        );

        const items = Array.isArray(raw) ? raw[0] : [];
        return res.status(200).json({
          success: true,
          notifications: (items || []).map((n) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            isRead: Boolean(n.isRead),
            createdAt: n.createdAt || null,
          })),
        });
      }
    } catch (e) {}

    const fetchRows = async () => {
      return Notification.findAll({
        where: { user_id: userId },
        order: [[Notification.sequelize.col('created_at'), 'DESC']],
        limit,
        raw: true,
        attributes: ['id', 'title', 'message', ['is_read', 'isRead'], [Notification.sequelize.col('created_at'), 'createdAt']],
      });
    };

    let rows;
    try {
      rows = await fetchRows();
    } catch (err) {
      const code = err?.original?.code || err?.parent?.code || err?.code;
      const msg = String(err?.original?.message || err?.message || '');
      if (
        code === 'ER_NO_SUCH_TABLE' ||
        code === 'ER_BAD_FIELD_ERROR' ||
        msg.toLowerCase().includes('notifications') ||
        msg.toLowerCase().includes('unknown column')
      ) {
        await Notification.sync({ alter: true });
        try {
          rows = await fetchRows();
        } catch (err2) {
          const code2 = err2?.original?.code || err2?.parent?.code || err2?.code;
          const msg2 = String(err2?.original?.message || err2?.message || '');
          if (
            code2 === 'ER_BAD_FIELD_ERROR' ||
            msg2.toLowerCase().includes('unknown column')
          ) {
            const qi = sequelize.getQueryInterface();
            const desc = await qi.describeTable('notifications');
            const colsSet = new Set(Object.keys(desc || {}));

            const userCol = pickCol(colsSet, ['user_id', 'userId']);
            const createdAtCol = pickCol(colsSet, ['created_at', 'createdAt']);
            const isReadCol = pickCol(colsSet, ['is_read', 'isRead']);

            const selectParts = ['id', 'title', 'message'];
            if (isReadCol) selectParts.push(`${isReadCol} as isRead`);
            if (createdAtCol) selectParts.push(`${createdAtCol} as createdAt`);

            const whereCol = userCol || 'user_id';
            const orderCol = createdAtCol || 'id';

            const raw = await sequelize.query(
              `SELECT ${selectParts.join(', ')} FROM notifications WHERE ${whereCol} = :userId ORDER BY ${orderCol} DESC LIMIT :limit`,
              { replacements: { userId, limit } },
            );

            const items = Array.isArray(raw) ? raw[0] : [];
            return res.status(200).json({
              success: true,
              notifications: (items || []).map((n) => ({
                id: n.id,
                title: n.title,
                message: n.message,
                isRead: Boolean(n.isRead),
                createdAt: n.createdAt || null,
              })),
            });
          }

          throw err2;
        }
      } else {
        throw err;
      }
    }

    return res.status(200).json({
      success: true,
      notifications: rows.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        isRead: Boolean(n.isRead),
        createdAt: n.createdAt,
      })),
    });
  } catch (error) {
    console.error('List user notifications error:', error);
    const code = error?.original?.code || error?.parent?.code || error?.code || undefined;
    const dbMessage = error?.original?.sqlMessage || error?.parent?.sqlMessage || undefined;
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      code,
      dbMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.markNotificationsRead = async (req, res) => {
  const isNotificationsSchemaError = (err) => {
    const code = err?.original?.code || err?.parent?.code || err?.code;
    const msg = String(err?.original?.message || err?.message || '');
    return (
      code === 'ER_NO_SUCH_TABLE' ||
      code === 'ER_BAD_FIELD_ERROR' ||
      msg.toLowerCase().includes('notifications') ||
      msg.toLowerCase().includes('unknown column')
    );
  };

  const pickCol = (colsSet, candidates) => candidates.find((c) => colsSet.has(c)) || null;

  const normalizeIds = (input) => {
    if (!Array.isArray(input)) return [];
    return input
      .map((v) => Number(v))
      .filter((v) => Number.isFinite(v) && v > 0)
      .slice(0, 200);
  };

  const updateWithModel = async ({ userId, ids }) => {
    const where = { user_id: userId, is_read: false };
    if (ids.length) where.id = { [Op.in]: ids };
    const result = await Notification.update({ is_read: true }, { where });
    const updated = Array.isArray(result) ? Number(result[0] || 0) : Number(result || 0);
    return updated;
  };

  try {
    const userId = req.user.id;
    const ids = normalizeIds(req.body?.ids);
    const all = Boolean(req.body?.all);

    if (!all && ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Provide ids[] or set all=true' });
    }

    const runRawUpdate = async () => {
      const qi = sequelize.getQueryInterface();
      const desc = await qi.describeTable('notifications');
      const colsSet = new Set(Object.keys(desc || {}));

      const userCol = pickCol(colsSet, ['user_id', 'userId']);
      const isReadCol = pickCol(colsSet, ['is_read', 'isRead']);
      const idCol = pickCol(colsSet, ['id']);

      if (!userCol || !isReadCol) {
        const e = new Error('notifications table schema incompatible');
        e.code = 'NOTIFICATIONS_SCHEMA_INCOMPATIBLE';
        throw e;
      }

      let whereSql = `${userCol} = :userId AND ${isReadCol} = 0`;
      const replacements = { userId };

      if (!all && ids.length && idCol) {
        whereSql += ` AND ${idCol} IN (:ids)`;
        replacements.ids = ids;
      }

      const sql = `UPDATE notifications SET ${isReadCol} = 1 WHERE ${whereSql}`;
      const result = await sequelize.query(sql, { replacements });
      const meta = Array.isArray(result) ? result[1] : null;
      const updated = Number(meta?.affectedRows ?? meta?.changedRows ?? 0);
      return updated;
    };

    let updated = 0;
    try {
      updated = await updateWithModel({ userId, ids: all ? [] : ids });
    } catch (err) {
      if (isNotificationsSchemaError(err)) {
        await Notification.sync({ alter: true });
        try {
          updated = await updateWithModel({ userId, ids: all ? [] : ids });
        } catch (err2) {
          if (!isNotificationsSchemaError(err2)) throw err2;
          updated = await runRawUpdate();
        }
      } else {
        try {
          updated = await runRawUpdate();
        } catch {
          throw err;
        }
      }
    }

    return res.status(200).json({
      success: true,
      updated,
    });
  } catch (error) {
    console.error('Mark notifications read error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.getActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Math.min(Number(req.query.limit || 30), 200);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [txsRaw, depositRequestsRaw, withdrawalRequestsRaw] = await Promise.all([
      Transaction.findAll({
        where: { user_id: userId },
        order: [[sequelize.col('created_at'), 'DESC']],
        limit,
        raw: true,
        attributes: ['id', 'type', 'amount', 'note', [sequelize.col('created_at'), 'createdAt']],
      }),
      DepositRequest.findAll({
        where: { user_id: userId },
        order: [[DepositRequest.sequelize.col('created_at'), 'DESC']],
        limit,
        raw: true,
        attributes: [
          'id',
          'amount',
          'address',
          'status',
          ['tx_hash', 'txHash'],
          ['user_note', 'userNote'],
          ['admin_note', 'adminNote'],
          [DepositRequest.sequelize.col('created_at'), 'createdAt'],
        ],
      }),
      WithdrawalRequest.findAll({
        where: { user_id: userId },
        order: [[WithdrawalRequest.sequelize.col('created_at'), 'DESC']],
        limit,
        raw: true,
        attributes: [
          'id',
          'amount',
          'address',
          'status',
          ['tx_hash', 'txHash'],
          ['user_note', 'userNote'],
          ['admin_note', 'adminNote'],
          [WithdrawalRequest.sequelize.col('created_at'), 'createdAt'],
        ],
      }),
    ]);

    const fromUserIds = new Set();

    const txItems = (txsRaw || []).map((t) => {
      const note = String(t.note || '');
      const amount = Number(t.amount || 0);
      const createdAt = t.createdAt;

      const levelMatch = note.match(/\bL([123])\b/i);
      const level = levelMatch ? Number(levelMatch[1]) : null;

      const fromUserMatch = note.match(/from user\s+(\d+)/i);
      const fromUserId = fromUserMatch ? Number(fromUserMatch[1]) : null;
      if (fromUserId && Number.isFinite(fromUserId)) fromUserIds.add(fromUserId);

      const isDepositCommission = note.startsWith('Referral commission') || note.startsWith('Referral commission ');

      const direction = t.type === 'withdraw' || t.type === 'package_purchase' ? 'out' : 'in';

      let label = 'Transaction';
      if (isDepositCommission) label = 'Deposit Commission';
      else if (t.type === 'referral_profit') label = 'Referral Profit';
      else if (t.type === 'referral_bonus') label = 'Referral Bonus';
      else if (t.type === 'profit') label = 'Trading Profit';
      else if (t.type === 'deposit') label = 'Deposit';
      else if (t.type === 'withdraw') label = 'Withdraw';
      else if (t.type === 'package_purchase') label = 'Package Purchase';

      return {
        id: `tx-${t.id}`,
        kind: 'transaction',
        txId: t.id,
        txType: t.type,
        category: isDepositCommission ? 'deposit_commission' : t.type,
        amount: Number.isFinite(amount) ? amount : 0,
        direction,
        label,
        note: note || null,
        level,
        fromUserId,
        createdAt,
      };
    });

    const reqItems = [];
    for (const r of depositRequestsRaw || []) {
      reqItems.push({
        id: `dr-${r.id}`,
        kind: 'deposit_request',
        requestId: r.id,
        amount: Number(r.amount || 0),
        address: r.address,
        status: r.status,
        txHash: r.txHash || null,
        userNote: r.userNote || null,
        adminNote: r.adminNote || null,
        createdAt: r.createdAt,
      });
    }

    for (const r of withdrawalRequestsRaw || []) {
      reqItems.push({
        id: `wr-${r.id}`,
        kind: 'withdrawal_request',
        requestId: r.id,
        amount: Number(r.amount || 0),
        address: r.address,
        status: r.status,
        txHash: r.txHash || null,
        userNote: r.userNote || null,
        adminNote: r.adminNote || null,
        createdAt: r.createdAt,
      });
    }

    const fromUsersRaw = fromUserIds.size
      ? await User.findAll({
          where: { id: Array.from(fromUserIds) },
          raw: true,
          attributes: ['id', 'name', 'email'],
        })
      : [];

    const fromUsers = new Map((fromUsersRaw || []).map((u) => [u.id, u]));

    const enrichedTxItems = txItems.map((item) => {
      const u = item.fromUserId ? fromUsers.get(item.fromUserId) : null;
      return {
        ...item,
        fromUser: u
          ? { id: u.id, name: u.name || null, email: u.email || null }
          : item.fromUserId
            ? { id: item.fromUserId, name: null, email: null }
            : null,
      };
    });

    const allItems = [...enrichedTxItems, ...reqItems]
      .filter((i) => i.createdAt)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);

    const todayByLevel = { 1: 0, 2: 0, 3: 0 };
    for (const item of enrichedTxItems) {
      if (!item.createdAt) continue;
      const created = new Date(item.createdAt);
      if (created < startOfToday) continue;
      if (!item.level) continue;
      if (!['referral_profit', 'referral_bonus', 'deposit_commission'].includes(String(item.category))) continue;
      todayByLevel[item.level] += Number(item.amount || 0);
    }

    return res.status(200).json({
      success: true,
      summary: {
        todayByLevel: {
          l1: Number(todayByLevel[1] || 0),
          l2: Number(todayByLevel[2] || 0),
          l3: Number(todayByLevel[3] || 0),
        },
      },
      items: allItems,
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch activity',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone } = req.body || {};

    const updates = {};

    if (name !== undefined) {
      if (name === null) {
        updates.name = null;
      } else if (typeof name === 'string') {
        const trimmed = name.trim();
        if (trimmed && trimmed.length < 2) {
          return res.status(400).json({ success: false, message: 'Name must be at least 2 characters' });
        }
        updates.name = trimmed || null;
      } else {
        return res.status(400).json({ success: false, message: 'Invalid name' });
      }
    }

    if (phone !== undefined) {
      if (phone === null) {
        updates.phone = null;
      } else if (typeof phone === 'string') {
        const trimmed = phone.trim();
        if (trimmed.length > 50) {
          return res.status(400).json({ success: false, message: 'Phone number is too long' });
        }
        updates.phone = trimmed || null;
      } else {
        return res.status(400).json({ success: false, message: 'Invalid phone number' });
      }
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (updates.name !== undefined) user.name = updates.name;
    if (updates.phone !== undefined) user.phone = updates.phone;

    await user.save();

    const cleanUser = await User.findByPk(userId, {
      attributes: { exclude: ['password_hash', 'reset_token', 'reset_token_expires_at'] },
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: cleanUser,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.getThemePreference = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId, { attributes: ['id', 'theme_preference'] });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      themePreference: user.theme_preference || null,
    });
  } catch (error) {
    console.error('Get user theme preference error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch theme preference',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.setThemePreference = async (req, res) => {
  try {
    const userId = req.user.id;
    const raw = req.body?.theme;

    const normalized = raw === null || raw === undefined || raw === '' || raw === 'default'
      ? null
      : String(raw).toLowerCase();

    if (normalized !== null && !['light', 'dark', 'colorful', 'aurora'].includes(normalized)) {
      return res.status(400).json({ success: false, message: 'Invalid theme. Use light, dark, colorful, aurora, or default.' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.theme_preference = normalized;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Theme preference updated',
      themePreference: user.theme_preference || null,
    });
  } catch (error) {
    console.error('Set user theme preference error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update theme preference',
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

    const minDeposit = Math.max(10, Number(process.env.MIN_DEPOSIT_USDT || 10));

    if (value < minDeposit) {
      return res.status(400).json({ success: false, message: `Minimum deposit is ${minDeposit} USDT` });
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

      return {
        ok: true,
        request,
        user: {
          id: user.id,
          name: user.name || null,
          email: user.email || null,
          phone: user.phone || null,
        },
      };
    });

    if (!result.ok) {
      return res.status(result.status || 400).json({ success: false, message: result.message || 'Failed to submit deposit request' });
    }

    Promise.resolve()
      .then(() => notifyDepositRequest({
        user: result.user,
        request: {
          id: result.request.id,
          amount: Number(result.request.amount || 0),
          address: result.request.address,
          status: result.request.status,
          txHash: result.request.tx_hash || null,
          userNote: result.request.user_note || null,
          createdAt: result.request.created_at || new Date(),
        },
      }))
      .catch((err) => console.error('Admin deposit notification email failed:', err));

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

    let autoWithdrawEnabled = false;
    try {
      await SiteSetting.sync();
      const row = await SiteSetting.findOne({ where: { key: 'auto_withdraw_enabled' }, raw: true });
      const raw = String(row?.value || '').trim().toLowerCase();
      autoWithdrawEnabled = ['1', 'true', 'yes', 'on'].includes(raw);
    } catch {}

    const value = Number(amount);
    if (!address || typeof address !== 'string') {
      return res.status(400).json({ success: false, message: 'Withdrawal address is required' });
    }

    const toAddress = String(address).trim();
    if (!ethers.utils.isAddress(toAddress)) {
      return res.status(400).json({ success: false, message: 'Invalid withdrawal address' });
    }

    if (!Number.isFinite(value) || value <= 0) {
      return res.status(400).json({ success: false, message: 'Withdrawal amount must be positive' });
    }

    if (value < 10) {
      return res.status(400).json({ success: false, message: 'Minimum withdrawal is 10 USDT' });
    }

    const now = new Date();

    const result = await Transaction.sequelize.transaction(async (t) => {
      const user = await User.findByPk(userId, { transaction: t });

      if (user && Boolean(user.withdrawal_hold_enabled)) {
        return {
          ok: false,
          status: 403,
          code: 'WITHDRAWAL_HOLD',
          holdNote: user.withdrawal_hold_note || null,
          message: 'Your withdrawals are currently on hold. Please contact support for assistance.',
        };
      }

      let wallet = await Wallet.findOne({ where: { user_id: userId }, transaction: t, lock: t.LOCK.UPDATE });
      if (!wallet) {
        wallet = await Wallet.create({ user_id: userId, balance: 0 }, { transaction: t });
      }

      const currentBalance = Number(wallet.balance || 0);

      const pendingSumRaw = await WithdrawalRequest.sum('amount', {
        where: { user_id: userId, status: { [Op.in]: ['pending', 'processing'] } },
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
          address: toAddress,
          network: 'BSC',
          token: 'USDT',
          auto_withdraw_enabled: autoWithdrawEnabled,
          status: 'pending',
          user_note: note || null,
        },
        { transaction: t },
      );

      return {
        ok: true,
        request,
        user: user
          ? {
              id: user.id,
              name: user.name || null,
              email: user.email || null,
              phone: user.phone || null,
            }
          : {
              id: userId,
              name: req.user?.name || null,
              email: req.user?.email || null,
              phone: req.user?.phone || null,
            },
      };
    });

    if (!result.ok) {
      return res.status(result.status || 400).json({
        success: false,
        message: result.message || 'Failed to submit withdrawal request',
        code: result.code,
        holdNote: result.holdNote,
      });
    }

    Promise.resolve()
      .then(() => notifyWithdrawRequest({
        user: result.user,
        request: {
          id: result.request.id,
          amount: Number(result.request.amount || 0),
          address: result.request.address,
          status: result.request.status,
          userNote: result.request.user_note || null,
          createdAt: now,
        },
      }))
      .catch((err) => console.error('Admin withdraw notification email failed:', err));

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

    const cfg = await getInvestmentPackagesConfig();
    const packages = cfg?.packages || {};

    if (!packageId || !packages[String(packageId)]) {
      return res.status(400).json({ success: false, message: 'Invalid packageId' });
    }

    const config = packages[String(packageId)];

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
      const rewardAvailable = Number(wallet.reward_balance || 0);
      const useReward = Math.min(rewardAvailable, cap);
      const remaining = cap - useReward;

      if (available < remaining) {
        return { ok: false, status: 400, message: 'Insufficient balance' };
      }

      wallet.reward_balance = rewardAvailable - useReward;
      wallet.balance = available - remaining;
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
      wallet: {
        balance: Number(result.wallet.balance),
        rewardBalance: Number(result.wallet.reward_balance || 0),
      },
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

function hourlyValueForKey(seedKey, min, max, decimals) {
  const rand = mulberry32(hashSeed(seedKey));
  const v = min + rand() * (max - min);
  if (Number.isFinite(decimals) && decimals > 0) return Number(v.toFixed(decimals));
  return Math.round(v);
}

function sumHourlyRange(seedPrefix, fromHourIndex, toHourIndex, min, max, decimals) {
  const start = Math.max(0, Math.floor(Number(fromHourIndex) || 0));
  const end = Math.max(start, Math.floor(Number(toHourIndex) || 0));
  let sum = 0;
  for (let h = start; h <= end; h++) {
    sum += hourlyValueForKey(`${seedPrefix}_${h}`, min, max, decimals);
  }
  return sum;
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

    let overrides = null;
    try {
      overrides = await getFooterStatsOverrides();
    } catch {}

    const systemOverrides = overrides?.system || {};

    const adjustedSystemDailyWithdrawals = Math.max(
      0,
      (Number(systemDailyWithdrawals) || 0) + (Number(systemOverrides.dailyWithdrawals) || 0),
    );
    const adjustedSystemTotalWithdrawals = Math.max(
      0,
      (Number(systemTotalWithdrawals) || 0) + (Number(systemOverrides.totalWithdrawals) || 0),
    );
    const adjustedSystemDailyJoinings = Math.max(
      0,
      Math.trunc((Number(systemDailyJoinings) || 0) + (Number(systemOverrides.dailyJoinings) || 0)),
    );
    const adjustedSystemTotalJoinings = Math.max(
      0,
      Math.trunc((Number(systemTotalJoinings) || 0) + (Number(systemOverrides.totalJoinings) || 0)),
    );

    res.status(200).json({
      success: true,
      stats: {
        system: {
          daily: adjustedSystemDailyWithdrawals,
          total: adjustedSystemTotalWithdrawals,
          joiningsDaily: adjustedSystemDailyJoinings,
          joiningsTotal: adjustedSystemTotalJoinings,
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
