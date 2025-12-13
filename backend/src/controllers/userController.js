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
