const { Op } = require('sequelize');
const { User, Wallet, Transaction, WalletKey, UserPackage, WithdrawalRequest, DepositRequest, Notification, ChainDepositEvent, DepositScanLog, SiteSetting, sequelize } = require('../models');
const { ensureWalletForUser } = require('../services/walletService');
const { decrypt } = require('../utils/encryption');
const { deriveChildWallet } = require('../utils/hdWallet');
const { runDailyProfitCredit } = require('../services/dailyProfitService');
const {
  getStoredEmailList,
  setStoredEmailList,
  normalizeEmailList,
} = require('../services/adminNotificationEmailService');
const {
  DEFAULT_PACKAGES,
  getInvestmentPackagesConfig,
  setInvestmentPackagesConfig,
} = require('../services/investmentPackageConfigService');
const {
  DEFAULT_OVERRIDES: DEFAULT_FOOTER_STATS_OVERRIDES,
  getFooterStatsOverrides,
  setFooterStatsOverrides,
} = require('../services/footerStatsOverrideService');

let notificationsColumnsCache = null;

exports.checkAccess = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: {
        id: req.user?.id,
        email: req.user?.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check admin access',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.listBalanceRecords = async (req, res) => {
  try {
    const typeRaw = String(req.query.type || '').trim().toLowerCase();
    const type = typeRaw === 'withdraw' || typeRaw === 'withdrawal' ? 'withdraw' : typeRaw === 'deposit' ? 'deposit' : null;
    if (!type) {
      return res.status(400).json({ success: false, message: 'type must be deposit or withdraw' });
    }

    const limit = Math.min(Math.max(Number(req.query.limit || 7), 1), 200);
    const offset = Math.max(0, Number(req.query.offset || 0));
    const q = req.query.q ? String(req.query.q).trim() : '';

    const where = {
      type,
      note: { [Op.like]: '%Request #%' },
    };

    if (q) {
      const maybeId = Number(q);
      const userWhere = {};
      const or = [];
      if (Number.isFinite(maybeId) && maybeId > 0) {
        or.push({ id: maybeId });
      }
      or.push({ name: { [Op.like]: `%${q}%` } });
      or.push({ email: { [Op.like]: `%${q}%` } });
      or.push({ referral_code: { [Op.like]: `%${q}%` } });
      userWhere[Op.or] = or;

      const users = await User.findAll({ where: userWhere, raw: true, attributes: ['id'] });
      const userIds = (users || []).map((u) => u.id);
      if (!userIds.length) {
        return res.status(200).json({
          success: true,
          type,
          q,
          limit,
          offset,
          totalCount: 0,
          totalAmount: 0,
          records: [],
        });
      }
      where.user_id = userIds;
    }

    const [rows, totalAmountRaw, totalCount] = await Promise.all([
      Transaction.findAll({
        where,
        order: [[sequelize.col('created_at'), 'DESC']],
        limit,
        offset,
        raw: true,
        attributes: ['id', 'user_id', 'type', 'amount', 'note', 'created_by', [sequelize.col('created_at'), 'createdAt']],
      }),
      Transaction.sum('amount', { where }),
      Transaction.count({ where }),
    ]);

    const userIds = Array.from(new Set((rows || []).map((r) => r.user_id).filter(Boolean)));
    const users = userIds.length
      ? await User.findAll({
          where: { id: userIds },
          raw: true,
          attributes: ['id', 'name', 'email', ['referral_code', 'referralCode']],
        })
      : [];
    const userMap = new Map((users || []).map((u) => [u.id, u]));

    const totalAmount = Number(totalAmountRaw || 0);

    return res.status(200).json({
      success: true,
      type,
      q,
      limit,
      offset,
      totalCount: Number(totalCount || 0),
      totalAmount: Number.isFinite(totalAmount) ? totalAmount : 0,
      records: (rows || []).map((r) => {
        const u = userMap.get(r.user_id) || {};
        return {
          id: r.id,
          userId: r.user_id,
          userName: u.name || null,
          email: u.email || null,
          referralCode: u.referralCode || null,
          amount: Number(r.amount || 0),
          createdAt: r.createdAt || null,
          note: r.note || null,
        };
      }),
    });
  } catch (error) {
    console.error('Admin list balance records error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to list records',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.setUserWithdrawalHold = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (!Number.isFinite(userId) || userId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid user id' });
    }

    const enabled = Boolean(req.body?.enabled);
    const rawNote = req.body?.note;
    const note = rawNote == null ? null : String(rawNote).trim();

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.withdrawal_hold_enabled = enabled;
    user.withdrawal_hold_note = enabled ? (note || null) : null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: enabled ? 'User withdrawals are now on hold' : 'User withdrawals have been unheld',
      user: {
        id: user.id,
        withdrawalHoldEnabled: Boolean(user.withdrawal_hold_enabled),
        withdrawalHoldNote: user.withdrawal_hold_note || null,
      },
    });
  } catch (error) {
    console.error('Admin set user withdrawal hold error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update withdrawal hold',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.getFooterStatsOverridesSetting = async (req, res) => {
  try {
    const overrides = await getFooterStatsOverrides();
    return res.status(200).json({
      success: true,
      overrides,
      defaults: DEFAULT_FOOTER_STATS_OVERRIDES,
    });
  } catch (error) {
    console.error('Get footer stats overrides setting error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load footer stats overrides',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.setFooterStatsOverridesSetting = async (req, res) => {
  try {
    const input = req.body?.overrides != null ? req.body.overrides : req.body;
    const saved = await setFooterStatsOverrides(input);

    return res.status(200).json({
      success: true,
      overrides: saved,
    });
  } catch (error) {
    console.error('Set footer stats overrides setting error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update footer stats overrides',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.getAdminNotificationEmails = async (req, res) => {
  try {
    try {
      await SiteSetting.sync();
    } catch {}

    const emails = await getStoredEmailList();
    return res.status(200).json({
      success: true,
      emails,
    });
  } catch (error) {
    console.error('Get admin notification emails error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load admin notification emails',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.setAdminNotificationEmails = async (req, res) => {
  try {
    try {
      await SiteSetting.sync();
    } catch {}

    const raw = req.body?.emails;
    let input = raw;
    if (typeof input === 'string') {
      input = String(input)
        .split(',')
        .map((s) => s.trim());
    }

    if (input == null) input = [];
    if (!Array.isArray(input)) {
      return res.status(400).json({ success: false, message: 'emails must be an array or comma-separated string' });
    }

    const normalized = normalizeEmailList(input);
    if (normalized.length > 50) {
      return res.status(400).json({ success: false, message: 'Too many emails (max 50)' });
    }

    const saved = await setStoredEmailList(normalized);
    return res.status(200).json({
      success: true,
      message: 'Admin notification emails updated',
      emails: saved,
    });
  } catch (error) {
    console.error('Set admin notification emails error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update admin notification emails',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.getAutoWithdrawSetting = async (req, res) => {
  try {
    try {
      await SiteSetting.sync();
    } catch {}

    const row = await SiteSetting.findOne({ where: { key: 'auto_withdraw_enabled' }, raw: true });
    const raw = String(row?.value || '').trim().toLowerCase();
    const enabled = ['1', 'true', 'yes', 'on'].includes(raw);

    return res.status(200).json({
      success: true,
      enabled,
    });
  } catch (error) {
    console.error('Get auto withdraw setting error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load auto withdraw setting',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.setAutoWithdrawSetting = async (req, res) => {
  try {
    const enabled = Boolean(req.body?.enabled);

    try {
      await SiteSetting.sync();
    } catch {}

    await SiteSetting.upsert({
      key: 'auto_withdraw_enabled',
      value: enabled ? '1' : '0',
    });

    return res.status(200).json({
      success: true,
      enabled,
    });
  } catch (error) {
    console.error('Set auto withdraw setting error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update auto withdraw setting',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.getInvestmentPackagesSetting = async (req, res) => {
  try {
    const cfg = await getInvestmentPackagesConfig();
    return res.status(200).json({
      success: true,
      packages: cfg.packages,
      defaults: DEFAULT_PACKAGES,
    });
  } catch (error) {
    console.error('Get investment packages setting error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load investment packages',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.setInvestmentPackagesSetting = async (req, res) => {
  try {
    const applyToActive = Boolean(req.body?.applyToActive);
    const saved = await setInvestmentPackagesConfig({ packages: req.body?.packages });

    let appliedToActive = 0;
    if (applyToActive) {
      await sequelize.transaction(async (t) => {
        for (const packageId of Object.keys(saved || {})) {
          const p = saved[packageId];
          const updateResult = await UserPackage.update(
            {
              daily_roi: Number(p.dailyRoi || 0),
              package_name: String(p.name || ''),
            },
            {
              where: { package_id: String(packageId), status: 'active' },
              transaction: t,
            },
          );
          const count = Array.isArray(updateResult) ? updateResult[0] : updateResult;
          appliedToActive += Number(count || 0);
        }
      });
    }

    return res.status(200).json({
      success: true,
      packages: saved,
      applyToActive,
      appliedToActive,
    });
  } catch (error) {
    console.error('Set investment packages setting error:', error);
    const code = error?.original?.code || error?.parent?.code || error?.code || undefined;
    const dbMessage = error?.original?.sqlMessage || error?.parent?.sqlMessage || undefined;
    return res.status(500).json({
      success: false,
      message: 'Failed to update investment packages',
      code,
      dbMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.listDepositScanLogs = async (req, res) => {
  return res.status(410).json({
    success: false,
    message: 'Deposit scan logs are no longer available (deposit detection migrated to QuickNode RPC scanning).',
  });
};

exports.listTradeLogs = async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit || 100), 1), 500);
    const q = String(req.query.q || '').trim();
    const userId = req.query.userId != null ? Number(req.query.userId) : null;

    const whereEvents = {};
    if (Number.isFinite(userId) && userId > 0) {
      whereEvents.user_id = userId;
    }
    if (q) {
      whereEvents[Op.or] = [
        { tx_hash: { [Op.like]: `%${q}%` } },
        { address: { [Op.like]: `%${q}%` } },
      ];
    }

    const [eventsRaw, requestsRaw, txRaw] = await Promise.all([
      ChainDepositEvent.findAll({
        where: whereEvents,
        order: [[sequelize.col('created_at'), 'DESC']],
        limit,
        raw: true,
      }),
      DepositRequest.findAll({
        order: [[sequelize.col('created_at'), 'DESC']],
        limit: Math.min(limit, 200),
        raw: true,
      }),
      Transaction.findAll({
        where: {
          type: 'deposit',
          created_by: { [Op.ne]: 'moralis' },
        },
        order: [[sequelize.col('created_at'), 'DESC']],
        limit: Math.min(limit, 200),
        raw: true,
      }),
    ]);

    const eventUserIds = Array.from(new Set(eventsRaw.map((e) => e.user_id).filter(Boolean)));
    const requestUserIds = Array.from(new Set(requestsRaw.map((r) => r.user_id).filter(Boolean)));
    const txUserIds = Array.from(new Set(txRaw.map((t) => t.user_id).filter(Boolean)));
    const userIds = Array.from(new Set([...eventUserIds, ...requestUserIds, ...txUserIds]));

    const users = userIds.length
      ? await User.findAll({
          where: { id: userIds },
          raw: true,
          attributes: ['id', 'name', 'email', 'referral_code', 'wallet_public_address'],
        })
      : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    const txHashes = Array.from(new Set(eventsRaw.map((e) => String(e.tx_hash || '').trim()).filter(Boolean)));
    const relatedRequests = txHashes.length
      ? await DepositRequest.findAll({
          where: { tx_hash: { [Op.in]: txHashes } },
          order: [[sequelize.col('created_at'), 'DESC']],
          limit: 500,
          raw: true,
        })
      : [];
    const reqByTx = new Map();
    for (const r of relatedRequests) {
      const key = String(r.tx_hash || '').trim();
      if (!key) continue;
      if (!reqByTx.has(key)) reqByTx.set(key, []);
      reqByTx.get(key).push(r);
    }

    let checkpoints = {};
    try {
      await SiteSetting.sync();
    } catch {}
    try {
      const [rows, cursorKeysCount] = await Promise.all([
        SiteSetting.findAll({
          where: {
            key: {
              [Op.in]: ['quicknode_last_user_id', 'quicknode_detected_log_range_limit'],
            },
          },
          raw: true,
        }),
        SiteSetting.count({
          where: {
            key: { [Op.like]: 'quicknode_cursor_bsc_usdt_%' },
          },
        }),
      ]);

      checkpoints = (rows || []).reduce((acc, row) => {
        acc[String(row.key)] = row.value;
        return acc;
      }, {});
      checkpoints.quicknode_cursor_keys_count = Number(cursorKeysCount || 0);
    } catch {}

    let rpcHost = null;
    try {
      rpcHost = new URL(String(process.env.BSC_RPC_URL || '').trim()).host;
    } catch {}

    const detectedRangeLimitRaw = checkpoints.quicknode_detected_log_range_limit;
    const detectedRangeLimit = detectedRangeLimitRaw != null ? Number(detectedRangeLimitRaw) : null;

    const usersWithAddress = await User.count({
      where: {
        wallet_public_address: { [Op.ne]: null },
      },
    });

    const events = eventsRaw.map((e) => {
      const u = userMap.get(e.user_id) || {};
      const txHash = String(e.tx_hash || '').trim();
      return {
        id: e.id,
        createdAt: e.created_at,
        updatedAt: e.updated_at,
        chain: e.chain,
        token: e.token,
        userId: e.user_id,
        userName: u.name || '',
        email: u.email || '',
        referralCode: u.referral_code || '',
        walletAddress: u.wallet_public_address || null,
        address: e.address,
        amount: Number(e.amount || 0),
        txHash,
        logIndex: e.log_index,
        blockNumber: e.block_number,
        credited: Boolean(e.credited),
        creditedAt: e.credited_at || null,
        relatedDepositRequests: (reqByTx.get(txHash) || []).map((r) => ({
          id: r.id,
          userId: r.user_id,
          amount: Number(r.amount || 0),
          status: r.status,
          address: r.address,
          txHash: r.tx_hash || null,
          createdAt: r.created_at,
        })),
      };
    });

    const depositRequests = requestsRaw.map((r) => {
      const u = userMap.get(r.user_id) || {};
      return {
        id: r.id,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        userId: r.user_id,
        userName: u.name || '',
        email: u.email || '',
        referralCode: u.referral_code || '',
        walletAddress: u.wallet_public_address || null,
        address: r.address,
        amount: Number(r.amount || 0),
        status: r.status,
        txHash: r.tx_hash || null,
        userNote: r.user_note || null,
        adminNote: r.admin_note || null,
      };
    });

    const transactions = txRaw.map((t) => {
      const u = userMap.get(t.user_id) || {};
      return {
        id: t.id,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
        userId: t.user_id,
        userName: u.name || '',
        email: u.email || '',
        type: t.type,
        amount: Number(t.amount || 0),
        createdBy: t.created_by || null,
        note: t.note || null,
      };
    });

    return res.status(200).json({
      success: true,
      config: {
        rpcHost,
        minDepositUsdt: Math.max(10, Number(process.env.MIN_DEPOSIT_USDT || 10)),
        confirmations: Number(process.env.DEPOSIT_CONFIRMATIONS || 12),
        maxBlocksPerScan: Number(process.env.QUICKNODE_MAX_BLOCKS_PER_SCAN || 2000),
        lookbackBlocks: Number(process.env.QUICKNODE_LOOKBACK_BLOCKS || 20000),
        userLookbackBlocks: Number(process.env.QUICKNODE_USER_LOOKBACK_BLOCKS || 2000),
        userScanLimit: Number(process.env.QUICKNODE_USER_SCAN_LIMIT || 50),
        maxWindowsPerAddress: Number(process.env.QUICKNODE_MAX_WINDOWS_PER_ADDRESS || 60),
        detectedLogRangeLimit: Number.isFinite(detectedRangeLimit) ? detectedRangeLimit : null,
      },
      checkpoints,
      counts: {
        usersWithAddress,
        chainEvents: eventsRaw.length,
        depositRequests: requestsRaw.length,
        workerDepositTransactions: txRaw.length,
      },
      events,
      depositRequests,
      transactions,
    });
  } catch (error) {
    console.error('Admin trade logs error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load trade logs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.sendNotification = async (req, res) => {
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

  const extractUnknownColumn = (err) => {
    const msg = String(err?.original?.sqlMessage || err?.original?.message || err?.message || '');
    const match = msg.match(/Unknown column '([^']+)'/i);
    return match ? match[1] : null;
  };

  const pickCol = (colsSet, candidates) => candidates.find((c) => colsSet.has(c)) || null;

  const getNotificationsColumns = async () => {
    if (notificationsColumnsCache) return notificationsColumnsCache;
    const qi = sequelize.getQueryInterface();
    const desc = await qi.describeTable('notifications');
    notificationsColumnsCache = Object.keys(desc || {});
    return notificationsColumnsCache;
  };

  const rawInsertNotification = async ({ userId, title, message, createdBy }) => {
    const now = new Date();
    let cols;
    try {
      cols = await getNotificationsColumns();
    } catch (err) {
      if (isNotificationsSchemaError(err)) {
        await Notification.sync({ alter: true });
        notificationsColumnsCache = null;
        cols = await getNotificationsColumns();
      } else {
        throw err;
      }
    }

    const colsSet = new Set(cols);

    const userCol = pickCol(colsSet, ['user_id', 'userId']);
    const titleCol = pickCol(colsSet, ['title']);
    const messageCol = pickCol(colsSet, ['message', 'text']);
    const createdByCol = pickCol(colsSet, ['created_by', 'createdBy']);
    const isReadCol = pickCol(colsSet, ['is_read', 'isRead']);
    const createdAtCol = pickCol(colsSet, ['created_at', 'createdAt']);
    const updatedAtCol = pickCol(colsSet, ['updated_at', 'updatedAt']);

    if (!userCol || !titleCol || !messageCol) {
      const e = new Error('notifications table schema incompatible');
      e.code = 'NOTIFICATIONS_SCHEMA_INCOMPATIBLE';
      throw e;
    }

    const replacements = {
      [userCol]: userId,
      [titleCol]: title,
      [messageCol]: message,
    };

    if (createdByCol) replacements[createdByCol] = createdBy;
    if (isReadCol) replacements[isReadCol] = 0;
    if (createdAtCol) replacements[createdAtCol] = now;
    if (updatedAtCol) replacements[updatedAtCol] = now;

    const insertCols = Object.keys(replacements);
    const sql = `INSERT INTO notifications (${insertCols.join(', ')}) VALUES (${insertCols
      .map((c) => `:${c}`)
      .join(', ')})`;

    try {
      await sequelize.query(sql, { replacements });
      return true;
    } catch (err) {
      const unknown = extractUnknownColumn(err);
      if (unknown && replacements[unknown] !== undefined) {
        delete replacements[unknown];
        const cols2 = Object.keys(replacements);
        const sql2 = `INSERT INTO notifications (${cols2.join(', ')}) VALUES (${cols2
          .map((c) => `:${c}`)
          .join(', ')})`;
        await sequelize.query(sql2, { replacements });
        return true;
      }
      throw err;
    }
  };

  const createOne = async ({ userId, title, message, createdBy }) => {
    return Notification.create({
      user_id: userId,
      title,
      message,
      created_by: createdBy,
      is_read: false,
    });
  };

  try {
    const { userId, sendToAll, title, message } = req.body || {};

    const cleanTitle = String(title || '').trim();
    const cleanMessage = String(message || '').trim();

    if (!cleanTitle || cleanTitle.length < 2) {
      return res.status(400).json({ success: false, message: 'Notification title is required' });
    }

    if (!cleanMessage || cleanMessage.length < 2) {
      return res.status(400).json({ success: false, message: 'Notification message is required' });
    }

    const createdBy = req.user?.email || 'admin';
    const isBroadcast = Boolean(sendToAll);

    if (!isBroadcast) {
      const numericUserId = Number(userId);
      if (!Number.isFinite(numericUserId) || numericUserId <= 0) {
        return res.status(400).json({ success: false, message: 'Valid userId is required (or set sendToAll=true)' });
      }

      const user = await User.findByPk(numericUserId, { attributes: ['id'] });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      let notif;
      try {
        notif = await createOne({ userId: numericUserId, title: cleanTitle, message: cleanMessage, createdBy });
      } catch (err) {
        if (isNotificationsSchemaError(err)) {
          await Notification.sync({ alter: true });
          notificationsColumnsCache = null;
          try {
            notif = await createOne({ userId: numericUserId, title: cleanTitle, message: cleanMessage, createdBy });
          } catch (err2) {
            if (!isNotificationsSchemaError(err2)) throw err2;

            await rawInsertNotification({ userId: numericUserId, title: cleanTitle, message: cleanMessage, createdBy });
            return res.status(201).json({
              success: true,
              message: 'Notification sent',
              created: 1,
              notification: {
                id: null,
                userId: numericUserId,
              },
            });
          }
        } else {
          throw err;
        }
      }

      return res.status(201).json({
        success: true,
        message: 'Notification sent',
        created: 1,
        notification: {
          id: notif.id,
          userId: numericUserId,
        },
      });
    }

    const users = await User.findAll({ raw: true, attributes: ['id'] });
    const ids = (users || []).map((u) => Number(u.id)).filter((v) => Number.isFinite(v) && v > 0);
    if (!ids.length) {
      return res.status(200).json({ success: true, message: 'No users to notify', created: 0 });
    }

    try {
      await Notification.bulkCreate(
        ids.map((id) => ({
          user_id: id,
          title: cleanTitle,
          message: cleanMessage,
          created_by: createdBy,
          is_read: false,
        })),
      );
    } catch (err) {
      if (isNotificationsSchemaError(err)) {
        await Notification.sync({ alter: true });
        notificationsColumnsCache = null;
        try {
          await Notification.bulkCreate(
            ids.map((id) => ({
              user_id: id,
              title: cleanTitle,
              message: cleanMessage,
              created_by: createdBy,
              is_read: false,
            })),
          );
        } catch (err2) {
          if (!isNotificationsSchemaError(err2)) throw err2;

          const results = await Promise.allSettled(
            ids.map((id) => rawInsertNotification({ userId: id, title: cleanTitle, message: cleanMessage, createdBy })),
          );
          const created = results.filter((r) => r.status === 'fulfilled').length;
          return res.status(201).json({ success: true, message: 'Broadcast sent', created });
        }
      } else {
        throw err;
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Broadcast sent',
      created: ids.length,
    });
  } catch (error) {
    console.error('Admin send notification error:', error);
    const code = error?.original?.code || error?.parent?.code || error?.code || undefined;
    const dbMessage = error?.original?.sqlMessage || error?.parent?.sqlMessage || undefined;
    return res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      code,
      dbMessage,
      error: process.env.NODE_ENV === 'development' ? (error?.original?.message || error.message) : undefined,
    });
  }
};

exports.listDepositRequests = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 50), 200);
    const status = req.query.status && String(req.query.status).toLowerCase() !== 'all'
      ? String(req.query.status).toLowerCase()
      : null;

    const depositRequestTtlMinutes = Math.min(
      Math.max(Math.floor(Number(process.env.DEPOSIT_REQUEST_TTL_MINUTES || 30)), 1),
      24 * 60,
    );

    const where = {};
    if (status) {
      where.status = status;
    }

    const requestsRaw = await DepositRequest.findAll({
      where,
      order: [[sequelize.col('created_at'), 'DESC']],
      limit,
      raw: true,
    });

    const userIds = Array.from(new Set(requestsRaw.map((r) => r.user_id).filter(Boolean)));

    const [users, wallets] = await Promise.all([
      userIds.length
        ? User.findAll({
            where: { id: userIds },
            raw: true,
            attributes: ['id', 'name', 'email', 'referral_code', 'wallet_public_address'],
          })
        : [],
      userIds.length
        ? Wallet.findAll({
            where: { user_id: userIds },
            raw: true,
            attributes: ['user_id', 'balance'],
          })
        : [],
    ]);

    const userMap = new Map(users.map((u) => [u.id, u]));
    const walletMap = new Map(wallets.map((w) => [w.user_id, w]));

    const requests = requestsRaw.map((r) => {
      const u = userMap.get(r.user_id) || {};
      const w = walletMap.get(r.user_id) || {};

      const rawStatus = String(r.status || 'pending');
      const status = rawStatus === 'approved' ? 'completed' : rawStatus === 'rejected' ? 'failed' : rawStatus;

      return {
        id: r.id,
        userId: r.user_id,
        userName: u.name || '',
        email: u.email || '',
        referralCode: u.referral_code || '',
        amount: Number(r.amount || 0),
        address: r.address,
        status,
        rawStatus,
        token: r.token || 'USDT',
        network: r.network || 'BSC',
        autoWithdrawEnabledAtRequest: r.auto_withdraw_enabled === null || r.auto_withdraw_enabled === undefined ? null : Boolean(r.auto_withdraw_enabled),
        txHash: r.tx_hash || null,
        userNote: r.user_note || null,
        adminNote: r.admin_note || null,
        requestTime: r.created_at,
        walletAddress: u.wallet_public_address || null,
        userBalance: Number(w.balance || 0),
      };
    });

    return res.status(200).json({
      success: true,
      config: { depositRequestTtlMinutes },
      requests,
    });
  } catch (error) {
    console.error('Admin list deposit requests error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to list deposit requests',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.updateDepositRequestStatus = async (req, res) => {
  try {
    const { id, action, txHash, adminNote } = req.body || {};

    const numericId = Number(id);
    if (!Number.isFinite(numericId) || numericId <= 0) {
      return res.status(400).json({ success: false, message: 'Valid deposit request id is required' });
    }

    const normalizedAction = String(action || '').toLowerCase();
    if (!['approve', 'reject'].includes(normalizedAction)) {
      return res.status(400).json({ success: false, message: 'action must be approve or reject' });
    }

    const result = await sequelize.transaction(async (t) => {
      const request = await DepositRequest.findByPk(numericId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!request) {
        return { ok: false, status: 404, message: 'Deposit request not found' };
      }

      if (request.status !== 'pending') {
        return { ok: false, status: 400, message: 'Only pending requests can be updated' };
      }

      if (request.tx_hash) {
        return {
          ok: false,
          status: 400,
          message: 'Cannot update a processing deposit request. Please wait for automatic credit/approval.',
        };
      }

      const ttlMinutes = Math.min(
        Math.max(Math.floor(Number(process.env.DEPOSIT_REQUEST_TTL_MINUTES || 30)), 1),
        24 * 60,
      );
      const cutoff = new Date(Date.now() - ttlMinutes * 60 * 1000);
      const createdAt = request.created_at ? new Date(request.created_at) : null;
      if (createdAt && createdAt.getTime() < cutoff.getTime()) {
        return {
          ok: false,
          status: 400,
          message: `Deposit request expired after ${ttlMinutes} minutes`,
        };
      }

      const userId = request.user_id;
      const amount = Number(request.amount || 0);
      if (!Number.isFinite(amount) || amount <= 0) {
        return { ok: false, status: 400, message: 'Invalid deposit amount on request' };
      }

      if (normalizedAction === 'reject') {
        request.status = 'rejected';
        request.admin_note = adminNote || null;
        await request.save({ transaction: t });
        return { ok: true, request };
      }

      let wallet = await Wallet.findOne({ where: { user_id: userId }, transaction: t, lock: t.LOCK.UPDATE });
      if (!wallet) {
        wallet = await Wallet.create({ user_id: userId, balance: 0 }, { transaction: t });
      }

      wallet.balance = Number(wallet.balance || 0) + amount;
      await wallet.save({ transaction: t });

      await Transaction.create(
        {
          user_id: userId,
          type: 'deposit',
          amount,
          created_by: req.user?.email || 'admin',
          note: `User deposit approved (Request #${request.id})`,
        },
        { transaction: t },
      );

      request.status = 'approved';
      request.tx_hash = txHash || request.tx_hash || null;
      request.admin_note = adminNote || request.admin_note || null;
      await request.save({ transaction: t });

      return { ok: true, request, wallet };
    });

    if (!result.ok) {
      return res.status(result.status || 400).json({ success: false, message: result.message || 'Failed to update deposit request' });
    }

    return res.status(200).json({
      success: true,
      message: `Deposit request ${result.request.status} successfully`,
      request: {
        id: result.request.id,
        status: result.request.status,
        txHash: result.request.tx_hash || null,
        adminNote: result.request.admin_note || null,
      },
      wallet: result.wallet ? { balance: Number(result.wallet.balance || 0) } : undefined,
    });
  } catch (error) {
    console.error('Admin update deposit request status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update deposit request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.getUserDetails = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (!Number.isFinite(userId) || userId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid user id' });
    }

    const user = await User.findByPk(userId, {
      raw: true,
      attributes: [
        'id',
        'name',
        'email',
        'phone',
        ['withdrawal_hold_enabled', 'withdrawalHoldEnabled'],
        ['withdrawal_hold_note', 'withdrawalHoldNote'],
        ['cnic_passport', 'cnicPassport'],
        ['referral_code', 'referralCode'],
        ['referred_by_id', 'referredById'],
        ['kyc_status', 'kycStatus'],
        ['account_status', 'accountStatus'],
        'role',
        ['wallet_public_address', 'walletPublicAddress'],
        [sequelize.col('created_at'), 'createdAt'],
      ],
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const [wallet, packagesRaw, txTotalsRaw, referralsL1] = await Promise.all([
      Wallet.findOne({ where: { user_id: userId }, raw: true, attributes: ['user_id', 'balance', 'currency'] }),
      UserPackage.findAll({
        where: { user_id: userId },
        order: [[sequelize.col('created_at'), 'DESC']],
        raw: true,
        attributes: [
          'id',
          ['package_id', 'packageId'],
          ['package_name', 'packageName'],
          'capital',
          ['daily_roi', 'dailyRoi'],
          ['duration_days', 'durationDays'],
          ['total_earned', 'totalEarned'],
          ['start_at', 'startAt'],
          ['end_at', 'endAt'],
          'status',
          ['last_profit_at', 'lastProfitAt'],
        ],
      }),
      Transaction.findAll({
        where: { user_id: userId },
        attributes: ['type', [sequelize.fn('SUM', sequelize.col('amount')), 'total']],
        group: ['type'],
        raw: true,
      }),
      User.findAll({
        where: { referred_by_id: userId },
        order: [[sequelize.col('created_at'), 'DESC']],
        raw: true,
        attributes: [
          'id',
          'name',
          'email',
          ['account_status', 'accountStatus'],
          ['referral_code', 'referralCode'],
          [sequelize.col('created_at'), 'createdAt'],
        ],
      }),
    ]);

    const packages = (packagesRaw || []).map((p) => {
      const capital = Number(p.capital || 0);
      const dailyRoi = Number(p.dailyRoi || 0);
      const dailyRevenue = (Number.isFinite(capital) && Number.isFinite(dailyRoi)) ? (capital * dailyRoi) / 100 : 0;
      return {
        id: p.id,
        packageId: p.packageId,
        packageName: p.packageName,
        capital: Number(capital || 0),
        dailyRoi: Number(dailyRoi || 0),
        dailyRevenue: Number(dailyRevenue || 0),
        durationDays: Number(p.durationDays || 0),
        totalEarned: Number(p.totalEarned || 0),
        startAt: p.startAt,
        endAt: p.endAt,
        status: p.status,
        lastProfitAt: p.lastProfitAt,
      };
    });

    const txTotalsByType = {};
    for (const row of txTotalsRaw || []) {
      txTotalsByType[String(row.type)] = Number(row.total || 0);
    }

    const l1Ids = referralsL1.map((r) => r.id);
    const referralsL2 = l1Ids.length
      ? await User.findAll({ where: { referred_by_id: l1Ids }, raw: true, attributes: ['id'] })
      : [];
    const l2Ids = referralsL2.map((r) => r.id);
    const l2Count = l2Ids.length;
    const l3Count = l2Ids.length ? await User.count({ where: { referred_by_id: l2Ids } }) : 0;

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || null,
        withdrawalHoldEnabled: Boolean(user.withdrawalHoldEnabled),
        withdrawalHoldNote: user.withdrawalHoldNote != null ? String(user.withdrawalHoldNote) : null,
        cnicPassport: user.cnicPassport || null,
        referralCode: user.referralCode || null,
        referredById: user.referredById || null,
        kycStatus: user.kycStatus || null,
        accountStatus: user.accountStatus || null,
        role: user.role || null,
        walletPublicAddress: user.walletPublicAddress || null,
        createdAt: user.createdAt || null,
        lastLogin: null,
      },
      wallet: {
        balance: wallet ? Number(wallet.balance || 0) : 0,
        currency: wallet?.currency || 'USDT',
      },
      packages,
      earnings: {
        byType: txTotalsByType,
      },
      referrals: {
        l1Count: referralsL1.length,
        l2Count,
        l3Count: Number(l3Count || 0),
        l1: referralsL1.map((r) => ({
          id: r.id,
          name: r.name,
          email: r.email,
          accountStatus: r.accountStatus,
          referralCode: r.referralCode,
          createdAt: r.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Admin get user details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.listWithdrawalRequests = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 50), 200);
    const status = req.query.status && String(req.query.status).toLowerCase() !== 'all'
      ? String(req.query.status).toLowerCase()
      : null;

    const where = {};
    if (status) {
      where.status = status;
    }

    const requestsRaw = await WithdrawalRequest.findAll({
      where,
      order: [[sequelize.col('created_at'), 'DESC']],
      limit,
      raw: true,
    });

    const userIds = Array.from(new Set(requestsRaw.map((r) => r.user_id).filter(Boolean)));

    const [users, wallets] = await Promise.all([
      userIds.length
        ? User.findAll({
            where: { id: userIds },
            raw: true,
            attributes: ['id', 'name', 'email', 'referral_code', 'wallet_public_address'],
          })
        : [],
      userIds.length
        ? Wallet.findAll({
            where: { user_id: userIds },
            raw: true,
            attributes: ['user_id', 'balance'],
          })
        : [],
    ]);

    const userMap = new Map(users.map((u) => [u.id, u]));
    const walletMap = new Map(wallets.map((w) => [w.user_id, w]));

    const requests = requestsRaw.map((r) => {
      const u = userMap.get(r.user_id) || {};
      const w = walletMap.get(r.user_id) || {};

      const rawStatus = String(r.status || 'pending');
      const status = rawStatus === 'approved' ? 'completed' : rawStatus === 'rejected' ? 'failed' : rawStatus;
      return {
        id: r.id,
        userId: r.user_id,
        userName: u.name || '',
        email: u.email || '',
        referralCode: u.referral_code || '',
        amount: Number(r.amount || 0),
        address: r.address,
        status,
        rawStatus,
        token: r.token || 'USDT',
        network: r.network || 'BSC',
        autoWithdrawEnabledAtRequest: r.auto_withdraw_enabled === null || r.auto_withdraw_enabled === undefined ? null : Boolean(r.auto_withdraw_enabled),
        txHash: r.tx_hash || null,
        userNote: r.user_note || null,
        adminNote: r.admin_note || null,
        requestTime: r.created_at,
        walletAddress: u.wallet_public_address || null,
        userBalance: Number(w.balance || 0),
      };
    });

    res.status(200).json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error('Admin list withdrawal requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list withdrawal requests',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.updateWithdrawalRequestStatus = async (req, res) => {
  try {
    const { id, action, txHash, adminNote } = req.body || {};

    const numericId = Number(id);
    if (!Number.isFinite(numericId) || numericId <= 0) {
      return res.status(400).json({ success: false, message: 'Valid withdrawal request id is required' });
    }

    const normalizedAction = String(action || '').toLowerCase();
    if (!['approve', 'reject'].includes(normalizedAction)) {
      return res.status(400).json({ success: false, message: 'action must be approve or reject' });
    }

    const result = await sequelize.transaction(async (t) => {
      const request = await WithdrawalRequest.findByPk(numericId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!request) {
        return { ok: false, status: 404, message: 'Withdrawal request not found' };
      }

      const currentStatus = String(request.status || 'pending');
      const isProcessing = currentStatus === 'processing';

      if (isProcessing || request.tx_hash) {
        return { ok: false, status: 400, message: 'Cannot update an auto-processing withdrawal request' };
      }

      if (currentStatus !== 'pending') {
        return { ok: false, status: 400, message: 'Only pending requests can be updated' };
      }

      const token = String(request.token || 'USDT').toUpperCase();
      const network = String(request.network || 'BSC').toUpperCase();
      if (token !== 'USDT' || network !== 'BSC') {
        return { ok: false, status: 400, message: 'Only USDT withdrawals on BSC are supported' };
      }

      const userId = request.user_id;
      const amount = Number(request.amount || 0);
      if (!Number.isFinite(amount) || amount <= 0) {
        return { ok: false, status: 400, message: 'Invalid withdrawal amount on request' };
      }

      if (normalizedAction === 'reject') {
        request.status = 'failed';
        request.admin_note = adminNote || null;
        await request.save({ transaction: t });
        return { ok: true, request };
      }

      // approve
      let wallet = await Wallet.findOne({ where: { user_id: userId }, transaction: t, lock: t.LOCK.UPDATE });
      if (!wallet) {
        wallet = await Wallet.create({ user_id: userId, balance: 0 }, { transaction: t });
      }

      const currentBalance = Number(wallet.balance || 0);
      if (!Number.isFinite(currentBalance) || currentBalance < amount) {
        return { ok: false, status: 400, message: 'User wallet has insufficient balance to approve this withdrawal' };
      }

      wallet.balance = currentBalance - amount;
      await wallet.save({ transaction: t });

      await Transaction.create(
        {
          user_id: userId,
          type: 'withdraw',
          amount,
          created_by: req.user?.email || 'admin',
          note: `User withdrawal approved (Request #${request.id})`,
        },
        { transaction: t },
      );

      request.status = 'completed';
      request.tx_hash = txHash || request.tx_hash || null;
      request.admin_note = adminNote || request.admin_note || null;
      await request.save({ transaction: t });

      return { ok: true, request };
    });

    if (!result.ok) {
      return res.status(result.status || 400).json({ success: false, message: result.message || 'Failed to update withdrawal request' });
    }

    return res.status(200).json({
      success: true,
      message: `Withdrawal request ${result.request.status} successfully`,
      request: {
        id: result.request.id,
        status: result.request.status,
        txHash: result.request.tx_hash || null,
        adminNote: result.request.admin_note || null,
      },
    });
  } catch (error) {
    console.error('Admin update withdrawal request status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update withdrawal request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.runDailyProfit = async (req, res) => {
  try {
    const result = await runDailyProfitCredit({
      sequelize,
      User,
      Wallet,
      Transaction,
      UserPackage,
    });

    res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Admin run daily profit error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to run daily profit job',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.listWallets = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 50), 200);

    const users = await User.findAll({
      order: [[sequelize.col('created_at'), 'DESC']],
      limit,
      raw: true,
      attributes: [
        'id',
        'name',
        'email',
        ['referral_code', 'referralCode'],
        ['wallet_public_address', 'walletAddress'],
        ['wallet_private_key_encrypted', 'walletPrivateKeyEncrypted'],
        [sequelize.col('created_at'), 'createdAt'],
      ],
    });

    const userIds = users.map((u) => u.id);
    const keys = await WalletKey.findAll({ where: { user_id: userIds }, raw: true });
    const keyMap = new Map(keys.map((k) => [k.user_id, k]));

    const wallets = users.map((u) => {
      const k = keyMap.get(u.id);
      const address = u.walletAddress || (k ? k.address : null);
      let privateKey = null;
      if (k) {
        if (process.env.WALLET_ENC_KEY) {
          try {
            privateKey = decrypt(k.privateKeyEncrypted);
          } catch {
            privateKey = null;
          }
        }

        if (!privateKey && Number.isFinite(Number(k.pathIndex))) {
          try {
            const derived = deriveChildWallet(Number(k.pathIndex));
            if (derived?.address && address && String(derived.address).toLowerCase() === String(address).toLowerCase()) {
              privateKey = derived.privateKey;
            }
          } catch {
            privateKey = privateKey;
          }
        }
      }

      if (!privateKey && process.env.WALLET_ENC_KEY && u.walletPrivateKeyEncrypted) {
        try {
          privateKey = decrypt(u.walletPrivateKeyEncrypted);
        } catch {
          privateKey = null;
        }
      }

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        referralCode: u.referralCode,
        createdAt: u.createdAt,
        publicAddress: address,
        privateAddress: privateKey,
        pathIndex: k ? k.pathIndex : null,
      };
    });

    res.status(200).json({
      success: true,
      wallets,
    });
  } catch (error) {
    console.error('Admin list wallets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list wallets',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.listUsers = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 20), 100);
    const page = Math.max(1, Number(req.query.page || 1));
    const offset = Math.max(0, Number(req.query.offset || (page - 1) * limit));
    const q = req.query.q ? String(req.query.q).trim() : '';

    const where = {};
    if (q) {
      const maybeId = Number(q);
      const or = [];
      if (Number.isFinite(maybeId) && maybeId > 0) {
        or.push({ id: maybeId });
      }
      or.push({ name: { [Op.like]: `%${q}%` } });
      or.push({ email: { [Op.like]: `%${q}%` } });
      or.push({ referral_code: { [Op.like]: `%${q}%` } });
      where[Op.or] = or;
    }

    const users = await User.findAll({
      where,
      order: [[sequelize.col('created_at'), 'DESC']],
      limit,
      offset,
      raw: true,
      attributes: [
        'id',
        'name',
        'email',
        'phone',
        ['withdrawal_hold_enabled', 'withdrawalHoldEnabled'],
        ['withdrawal_hold_note', 'withdrawalHoldNote'],
        ['kyc_status', 'kycStatus'],
        ['account_status', 'accountStatus'],
        ['referral_code', 'referralCode'],
        ['referred_by_id', 'referredById'],
        ['cnic_passport', 'cnicPassport'],
        'role',
        ['wallet_public_address', 'walletPublicAddress'],
        [sequelize.col('created_at'), 'createdAt'],
      ],
    });

    const userIds = users.map((u) => u.id);
    const wallets = await Wallet.findAll({ where: { user_id: userIds }, raw: true });
    const walletMap = new Map(wallets.map((w) => [w.user_id, w]));

    res.status(200).json({
      success: true,
      users: users.map((u) => {
        const w = walletMap.get(u.id);
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone || null,
          referralCode: u.referralCode,
          referredById: u.referredById || null,
          cnicPassport: u.cnicPassport || null,
          role: u.role || null,
          walletPublicAddress: u.walletPublicAddress || null,
          kycStatus: u.kycStatus || null,
          accountStatus: u.accountStatus,
          withdrawalHoldEnabled: Boolean(u.withdrawalHoldEnabled),
          withdrawalHoldNote: u.withdrawalHoldNote != null ? String(u.withdrawalHoldNote) : null,
          createdAt: u.createdAt,
          balance: w ? Number(w.balance) : 0,
        };
      }),
    });
  } catch (error) {
    console.error('Admin list users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (!Number.isFinite(userId) || userId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid user id' });
    }

    const { accountStatus, status, action } = req.body || {};

    let nextStatus = null;
    if (action != null) {
      const a = String(action || '').trim().toLowerCase();
      if (a === 'hold') nextStatus = 'hold';
      if (a === 'unhold' || a === 'active' || a === 'activate') nextStatus = 'active';
    }

    if (!nextStatus) {
      const s = String(accountStatus ?? status ?? '').trim().toLowerCase();
      if (s === 'active' || s === 'hold') nextStatus = s;
    }

    if (!nextStatus) {
      return res.status(400).json({ success: false, message: 'accountStatus must be active or hold' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.account_status = nextStatus;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User status updated to ${nextStatus}`,
      user: {
        id: user.id,
        accountStatus: user.account_status,
      },
    });
  } catch (error) {
    console.error('Admin update user status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (!Number.isFinite(userId) || userId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid user id' });
    }

    const result = await sequelize.transaction(async (t) => {
      const user = await User.findByPk(userId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!user) {
        return { ok: false, status: 404, message: 'User not found' };
      }

      if (String(user.role || '').toLowerCase() === 'admin') {
        return { ok: false, status: 400, message: 'Admin users cannot be deleted' };
      }

      const addresses = new Set();
      if (user.wallet_public_address) {
        addresses.add(String(user.wallet_public_address).toLowerCase());
      }

      const walletKey = await WalletKey.findOne({ where: { user_id: userId }, transaction: t, raw: true });
      if (walletKey?.address) {
        addresses.add(String(walletKey.address).toLowerCase());
      }

      const cursorKeys = Array.from(addresses)
        .filter(Boolean)
        .map((addr) => `bsc_deposit_cursor_${String(addr).toLowerCase()}`);

      const [unlinkedCount] = await User.update(
        { referred_by_id: null },
        { where: { referred_by_id: userId }, transaction: t },
      );

      const deleted = {
        unlinkedReferrals: Number(unlinkedCount || 0),
        chainDepositEvents: await ChainDepositEvent.destroy({ where: { user_id: userId }, transaction: t }),
        depositScanLogs: await DepositScanLog.destroy({ where: { user_id: userId }, transaction: t }),
        notifications: await Notification.destroy({ where: { user_id: userId }, transaction: t }),
        depositRequests: await DepositRequest.destroy({ where: { user_id: userId }, transaction: t }),
        withdrawalRequests: await WithdrawalRequest.destroy({ where: { user_id: userId }, transaction: t }),
        userPackages: await UserPackage.destroy({ where: { user_id: userId }, transaction: t }),
        transactions: await Transaction.destroy({ where: { user_id: userId }, transaction: t }),
        walletKeys: await WalletKey.destroy({ where: { user_id: userId }, transaction: t }),
        wallets: await Wallet.destroy({ where: { user_id: userId }, transaction: t }),
        siteSettings: cursorKeys.length
          ? await SiteSetting.destroy({ where: { key: { [Op.in]: cursorKeys } }, transaction: t })
          : 0,
        user: await User.destroy({ where: { id: userId }, transaction: t }),
      };

      return { ok: true, userId, deleted };
    });

    if (!result.ok) {
      return res.status(result.status || 400).json({ success: false, message: result.message || 'Failed to delete user' });
    }

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      userId: result.userId,
      deleted: result.deleted,
    });
  } catch (error) {
    console.error('Admin delete user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.deposit = async (req, res) => {
  try {
    const { userId, amount, note } = req.body;

    const value = Number(amount);
    if (!userId || !Number.isFinite(value) || value <= 0) {
      return res.status(400).json({
        success: false,
        message: 'userId and positive amount are required',
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const wallet = await Wallet.findOrCreate({
      where: { user_id: userId },
      defaults: { user_id: userId, balance: 0 },
    }).then(([w]) => w);

    wallet.balance = Number(wallet.balance) + value;
    await wallet.save();

    await Transaction.create({
      user_id: userId,
      type: 'deposit',
      amount: value,
      created_by: req.user?.email || null,
      note: note || 'Admin deposit',
    });

    const commissionAmount = value * 0.01;
    if (Number.isFinite(commissionAmount) && commissionAmount > 0) {
      const uplines = [];
      const seen = new Set([Number(userId)]);

      let current = user;
      for (let level = 1; level <= 3; level++) {
        const nextId = current?.referred_by_id;
        if (!nextId) break;
        const nextNum = Number(nextId);
        if (!Number.isFinite(nextNum) || seen.has(nextNum)) break;
        seen.add(nextNum);
        uplines.push({ id: nextNum, level });

        current = await User.findByPk(nextNum);
        if (!current) break;
      }

      for (const upline of uplines) {
        const w = await Wallet.findOrCreate({
          where: { user_id: upline.id },
          defaults: { user_id: upline.id, balance: 0 },
        }).then(([wallet]) => wallet);

        w.balance = Number(w.balance) + commissionAmount;
        await w.save();

        await Transaction.create({
          user_id: upline.id,
          type: 'deposit',
          amount: commissionAmount,
          created_by: req.user?.email || 'system',
          note: `Referral commission L${upline.level} (1%) from user ${userId} deposit`,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Deposit successful',
      balance: Number(wallet.balance),
    });
  } catch (error) {
    console.error('Admin deposit error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deposit',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.withdraw = async (req, res) => {
  try {
    const { userId, amount, note } = req.body;

    const value = Number(amount);
    if (!userId || !Number.isFinite(value) || value <= 0) {
      return res.status(400).json({
        success: false,
        message: 'userId and positive amount are required',
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const wallet = await Wallet.findOrCreate({
      where: { user_id: userId },
      defaults: { user_id: userId, balance: 0 },
    }).then(([w]) => w);

    const current = Number(wallet.balance);
    if (current < value) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance',
      });
    }

    wallet.balance = current - value;
    await wallet.save();

    await Transaction.create({
      user_id: userId,
      type: 'withdraw',
      amount: value,
      created_by: req.user?.email || null,
      note: note || 'Admin withdraw',
    });

    res.status(200).json({
      success: true,
      message: 'Withdraw successful',
      balance: Number(wallet.balance),
    });
  } catch (error) {
    console.error('Admin withdraw error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to withdraw',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, phone, referredBy } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'name, email and password are required',
      });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    let referredById = null;
    if (referredBy) {
      const ref = String(referredBy).trim();
      if (ref) {
        const maybeId = Number(ref);
        if (Number.isFinite(maybeId) && maybeId > 0) {
          const refUser = await User.findByPk(maybeId, { attributes: ['id'] });
          if (refUser) referredById = refUser.id;
        } else {
          const refUser = await User.findOne({
            where: { referral_code: ref.toUpperCase() },
            attributes: ['id'],
          });
          if (refUser) referredById = refUser.id;
        }
      }
    }

    const user = await User.create({
      name,
      email,
      password_hash: password,
      phone: phone || null,
      referred_by_id: referredById,
      kyc_status: 'pending',
      account_status: 'active',
      reset_token: null,
      reset_token_expires_at: null,
    });

    await ensureWalletForUser(user);

    const userData = user.get();
    delete userData.password_hash;
    delete userData.reset_token;
    delete userData.reset_token_expires_at;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: userData,
    });
  } catch (error) {
    console.error('Admin create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.getAdminStats = async (req, res) => {
  try {
    const [totalUsers, activeInvestors, totalDepositedRaw, totalWithdrawnRaw, pendingKyc, pendingWithdrawals] =
      await Promise.all([
        User.count({ where: { role: { [Op.ne]: 'admin' } } }),
        UserPackage.count({ where: { status: 'active' }, distinct: true, col: 'user_id' }),
        Transaction.sum('amount', { where: { type: 'deposit' } }),
        Transaction.sum('amount', { where: { type: 'withdraw' } }),
        User.count({ where: { kyc_status: 'pending', role: { [Op.ne]: 'admin' } } }),
        WithdrawalRequest.count({ where: { status: 'pending' } }),
      ]);

    res.set('Cache-Control', 'no-store');
    res.set('Vary', 'Authorization');
    res.status(200).json({
      success: true,
      stats: {
        totalUsers: Number(totalUsers || 0),
        activeInvestors: Number(activeInvestors || 0),
        totalDeposited: Number(totalDepositedRaw || 0),
        totalWithdrawn: Number(totalWithdrawnRaw || 0),
        pendingKyc: Number(pendingKyc || 0),
        pendingWithdrawals: Number(pendingWithdrawals || 0),
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin stats',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.listRecentTransactions = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 20), 100);

    const [depositsRaw, withdrawalsRaw] = await Promise.all([
      Transaction.findAll({
        where: { type: 'deposit' },
        order: [[sequelize.col('created_at'), 'DESC']],
        limit,
        raw: true,
        attributes: [
          'id',
          'user_id',
          'type',
          'amount',
          'note',
          [sequelize.col('created_at'), 'createdAt'],
        ],
      }),
      Transaction.findAll({
        where: { type: 'withdraw' },
        order: [[sequelize.col('created_at'), 'DESC']],
        limit,
        raw: true,
        attributes: [
          'id',
          'user_id',
          'type',
          'amount',
          'note',
          [sequelize.col('created_at'), 'createdAt'],
        ],
      }),
    ]);

    const userIds = Array.from(
      new Set([
        ...depositsRaw.map((t) => t.user_id).filter(Boolean),
        ...withdrawalsRaw.map((t) => t.user_id).filter(Boolean),
      ]),
    );

    const [users, wallets] = await Promise.all([
      userIds.length
        ? User.findAll({
            where: { id: userIds },
            raw: true,
            attributes: ['id', 'name', 'email', 'wallet_public_address'],
          })
        : [],
      userIds.length
        ? Wallet.findAll({
            where: { user_id: userIds },
            raw: true,
            attributes: ['user_id', 'balance'],
          })
        : [],
    ]);

    const userMap = new Map(users.map((u) => [u.id, u]));
    const walletMap = new Map(wallets.map((w) => [w.user_id, w]));

    const deposits = depositsRaw.map((t) => {
      const u = userMap.get(t.user_id) || {};
      return {
        id: t.id,
        userId: t.user_id,
        userName: u.name || '',
        email: u.email || '',
        amount: Number(t.amount || 0),
        // There is no tx hash column in the schema, use note or id as a fallback
        txHash: t.note || `TX-${t.id}`,
        status: 'success',
        time: t.createdAt,
      };
    });

    const withdrawals = withdrawalsRaw.map((t) => {
      const u = userMap.get(t.user_id) || {};
      const w = walletMap.get(t.user_id) || {};
      return {
        id: t.id,
        userId: t.user_id,
        userName: u.name || '',
        email: u.email || '',
        amount: Number(t.amount || 0),
        walletAddress: u.wallet_public_address || null,
        userBalance: Number(w.balance || 0),
        status: 'success',
        time: t.createdAt,
      };
    });

    res.status(200).json({
      success: true,
      deposits,
      withdrawals,
    });
  } catch (error) {
    console.error('Admin recent transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent transactions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
