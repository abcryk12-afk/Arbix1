const { SiteSetting } = require('../models');

const MIN_KEY = 'min_withdrawal_amount';
const MAX_KEY = 'max_withdrawal_amount';
const NOTE_KEY = 'withdrawal_limit_note';

const DEFAULT_MIN = 10;

function normalizeMoney(input, { allowNull } = { allowNull: false }) {
  if (input === null || input === undefined || input === '') {
    return allowNull ? null : DEFAULT_MIN;
  }

  const n = Number(input);
  if (!Number.isFinite(n)) return allowNull ? null : DEFAULT_MIN;
  const rounded = Math.round(Math.max(0, n) * 100) / 100;
  return allowNull ? rounded : rounded;
}

function normalizeNote(input) {
  if (input === null || input === undefined) return null;
  const s = String(input).trim();
  return s ? s : null;
}

async function getSettings() {
  const [minRow, maxRow, noteRow] = await Promise.all([
    SiteSetting.findOne({ where: { key: MIN_KEY } }),
    SiteSetting.findOne({ where: { key: MAX_KEY } }),
    SiteSetting.findOne({ where: { key: NOTE_KEY } }),
  ]);

  const min = minRow ? normalizeMoney(minRow.value, { allowNull: false }) : DEFAULT_MIN;
  const max = maxRow ? normalizeMoney(maxRow.value, { allowNull: true }) : null;
  const note = noteRow ? normalizeNote(noteRow.value) : null;

  return { min, max, note };
}

async function saveSettings({ min, max, note }) {
  try {
    await SiteSetting.sync();
  } catch {}

  await SiteSetting.upsert({ key: MIN_KEY, value: String(min) });

  if (max === null) {
    await SiteSetting.destroy({ where: { key: MAX_KEY } });
  } else {
    await SiteSetting.upsert({ key: MAX_KEY, value: String(max) });
  }

  if (note === null) {
    await SiteSetting.destroy({ where: { key: NOTE_KEY } });
  } else {
    await SiteSetting.upsert({ key: NOTE_KEY, value: String(note) });
  }

  return { min, max, note };
}

exports.getPublicWithdrawalLimits = async (req, res) => {
  try {
    const settings = await getSettings();
    return res.status(200).json({ success: true, settings });
  } catch (error) {
    console.error('Get public withdrawal limits error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch withdrawal limits',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.getAdminWithdrawalLimits = async (req, res) => {
  try {
    const settings = await getSettings();
    return res.status(200).json({ success: true, settings });
  } catch (error) {
    console.error('Get admin withdrawal limits error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch withdrawal limits',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.setAdminWithdrawalLimits = async (req, res) => {
  try {
    const min = normalizeMoney(req.body?.min ?? req.body?.minimum ?? req.body?.minWithdrawal ?? req.body?.min_withdrawal, { allowNull: false });
    const max = normalizeMoney(req.body?.max ?? req.body?.maximum ?? req.body?.maxWithdrawal ?? req.body?.max_withdrawal, { allowNull: true });
    const note = normalizeNote(req.body?.note ?? req.body?.instructions ?? req.body?.limitNote ?? req.body?.withdrawalLimitNote);

    if (!Number.isFinite(Number(min)) || Number(min) < 0) {
      return res.status(400).json({ success: false, message: 'Invalid minimum withdrawal amount' });
    }

    if (max !== null) {
      if (!Number.isFinite(Number(max)) || Number(max) <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid maximum withdrawal amount' });
      }
      if (Number(max) < Number(min)) {
        return res.status(400).json({ success: false, message: 'Maximum withdrawal must be greater than or equal to minimum' });
      }
    }

    const saved = await saveSettings({ min, max, note });
    return res.status(200).json({ success: true, settings: saved });
  } catch (error) {
    console.error('Set admin withdrawal limits error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update withdrawal limits',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports._internal = {
  MIN_KEY,
  MAX_KEY,
  NOTE_KEY,
  DEFAULT_MIN,
  normalizeMoney,
  normalizeNote,
  getSettings,
  saveSettings,
};
