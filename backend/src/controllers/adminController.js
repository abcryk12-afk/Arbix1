const { Op } = require('sequelize');
const { User, Wallet, Transaction, WalletKey, UserPackage, WithdrawalRequest, sequelize } = require('../models');
const { ensureWalletForUser } = require('../services/walletService');
const { decrypt } = require('../utils/encryption');
const { deriveChildWallet } = require('../utils/hdWallet');
const { runDailyProfitCredit } = require('../services/dailyProfitService');

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
      return {
        id: r.id,
        userId: r.user_id,
        userName: u.name || '',
        email: u.email || '',
        referralCode: u.referral_code || '',
        amount: Number(r.amount || 0),
        address: r.address,
        status: r.status,
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

      if (request.status !== 'pending') {
        return { ok: false, status: 400, message: 'Only pending requests can be updated' };
      }

      const userId = request.user_id;
      const amount = Number(request.amount || 0);
      if (!Number.isFinite(amount) || amount <= 0) {
        return { ok: false, status: 400, message: 'Invalid withdrawal amount on request' };
      }

      if (normalizedAction === 'reject') {
        request.status = 'rejected';
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

      request.status = 'approved';
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
        ['account_status', 'accountStatus'],
        ['referral_code', 'referralCode'],
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
          referralCode: u.referralCode,
          accountStatus: u.accountStatus,
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
        User.count(),
        UserPackage.count({ where: { status: 'active' } }),
        Transaction.sum('amount', { where: { type: 'deposit' } }),
        Transaction.sum('amount', { where: { type: 'withdraw' } }),
        User.count({ where: { kyc_status: 'pending' } }),
        WithdrawalRequest.count({ where: { status: 'pending' } }),
      ]);

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
