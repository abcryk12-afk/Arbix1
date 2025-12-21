const { User, Wallet, Transaction, WalletKey } = require('../models');
const { ensureWalletForUser } = require('../services/walletService');
const { decrypt } = require('../utils/encryption');

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

exports.listWallets = async (req, res) => {
  try {
    if (!process.env.WALLET_ENC_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Wallet encryption key is not configured',
      });
    }

    const limit = Math.min(Number(req.query.limit || 50), 200);

    const users = await User.findAll({
      order: [['createdAt', 'DESC']],
      limit,
      attributes: ['id', 'name', 'email', 'referralCode', 'walletAddress', 'createdAt'],
    });

    const userIds = users.map((u) => u.id);
    const keys = await WalletKey.findAll({ where: { userId: userIds } });
    const keyMap = new Map(keys.map((k) => [k.userId, k]));

    const wallets = users.map((u) => {
      const k = keyMap.get(u.id);
      const address = u.walletAddress || (k ? k.address : null);
      let privateKey = null;
      if (k) {
        try {
          privateKey = decrypt(k.privateKeyEncrypted);
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

    const users = await User.findAll({
      order: [['createdAt', 'DESC']],
      limit,
      attributes: ['id', 'name', 'email', 'referralCode', 'createdAt'],
    });

    const userIds = users.map((u) => u.id);
    const wallets = await Wallet.findAll({ where: { userId: userIds } });
    const walletMap = new Map(wallets.map((w) => [w.userId, w]));

    res.status(200).json({
      success: true,
      users: users.map((u) => {
        const w = walletMap.get(u.id);
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          referralCode: u.referralCode,
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

    const user = await User.create({
      name,
      email,
      password,
      phone: phone || null,
      referredBy: referredBy || null,
      emailVerified: true,
      accountStatus: 'active',
      emailVerificationToken: null,
      emailVerificationExpires: null,
    });

    await ensureWalletForUser(user);

    const userData = user.get();
    delete userData.password;
    delete userData.emailVerificationToken;
    delete userData.emailVerificationExpires;
    delete userData.passwordResetToken;
    delete userData.passwordResetExpires;

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
