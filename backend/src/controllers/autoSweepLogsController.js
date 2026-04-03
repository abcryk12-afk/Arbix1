const { Op } = require('sequelize');
const { AutoSweepLog, sequelize } = require('../models');

const normalizeStatus = (raw) => {
  const v = String(raw || '').trim().toLowerCase();
  if (v === 'success' || v === 'pending' || v === 'failed') return v;
  return null;
};

const normalizeAction = (raw) => {
  const v = String(raw || '').trim();
  if (!v) return null;
  return v.slice(0, 100);
};

const normalizeWallet = (raw) => {
  const v = String(raw || '').trim();
  if (!v) return null;
  return v.slice(0, 255);
};

const safeDetails = (raw) => {
  if (raw === undefined) return null;
  if (raw === null) return null;
  if (typeof raw === 'string') return raw.slice(0, 20000);
  try {
    return JSON.stringify(raw).slice(0, 20000);
  } catch {
    return String(raw).slice(0, 20000);
  }
};

exports.ingestAutoSweepLog = async (req, res) => {
  try {
    try {
      await AutoSweepLog.sync();
    } catch {}

    const wallet = normalizeWallet(req.body?.wallet);
    const action = normalizeAction(req.body?.action);
    const status = normalizeStatus(req.body?.status) || 'pending';
    const pathIndexRaw = req.body?.index;
    const pathIndex = pathIndexRaw == null ? null : Number(pathIndexRaw);

    if (!wallet || !action) {
      return res.status(400).json({ success: false, message: 'wallet and action are required' });
    }

    const details = safeDetails(req.body?.details);
    const source = String(req.body?.source || 'worker').trim().slice(0, 30) || 'worker';

    const row = await AutoSweepLog.create({
      wallet,
      path_index: Number.isFinite(pathIndex) ? Math.floor(pathIndex) : null,
      action,
      status,
      details,
      source,
    });

    return res.status(201).json({ success: true, id: row.id });
  } catch (error) {
    console.error('Auto sweep log ingest error:', error);
    return res.status(500).json({ success: false, message: 'Failed to ingest log' });
  }
};

exports.listAutoSweepLogs = async (req, res) => {
  try {
    try {
      await AutoSweepLog.sync();
    } catch {}

    const limit = Math.min(Math.max(Number(req.query.limit || 200), 1), 2000);
    const offset = Math.max(0, Number(req.query.offset || 0));

    const wallet = normalizeWallet(req.query.wallet);
    const status = normalizeStatus(req.query.status);
    const q = req.query.q ? String(req.query.q).trim() : '';

    const fromRaw = req.query.from ? String(req.query.from).trim() : '';
    const toRaw = req.query.to ? String(req.query.to).trim() : '';

    const where = {};
    if (wallet) where.wallet = { [Op.like]: `%${wallet}%` };
    if (status) where.status = status;

    if (fromRaw || toRaw) {
      const range = {};
      const from = fromRaw ? new Date(fromRaw) : null;
      const to = toRaw ? new Date(toRaw) : null;
      if (from && !Number.isNaN(from.getTime())) range[Op.gte] = from;
      if (to && !Number.isNaN(to.getTime())) range[Op.lte] = to;
      if (Object.keys(range).length) where.created_at = range;
    }

    if (q) {
      where[Op.or] = [
        { wallet: { [Op.like]: `%${q}%` } },
        { action: { [Op.like]: `%${q}%` } },
        { details: { [Op.like]: `%${q}%` } },
        { source: { [Op.like]: `%${q}%` } },
      ];
    }

    const rows = await AutoSweepLog.findAll({
      where,
      order: [[sequelize.col('created_at'), 'DESC']],
      limit,
      offset,
      raw: true,
      attributes: [
        'id',
        'wallet',
        ['path_index', 'index'],
        'action',
        'status',
        'details',
        'source',
        ['created_at', 'createdAt'],
      ],
    });

    const totalCount = await AutoSweepLog.count({ where });

    return res.status(200).json({
      success: true,
      limit,
      offset,
      totalCount: Number(totalCount || 0),
      logs: rows.map((r) => ({
        id: r.id,
        timestamp: r.createdAt,
        wallet: r.wallet,
        index: r.index === null || r.index === undefined ? null : Number(r.index),
        action: r.action,
        status: r.status,
        details: r.details,
        source: r.source,
      })),
    });
  } catch (error) {
    console.error('Auto sweep log list error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load logs' });
  }
};
