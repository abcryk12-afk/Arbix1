const { SiteSetting } = require('../models');

const ENABLE_KEY = 'user_package_deactivation_enabled';
const PCT_KEY = 'user_package_deactivation_refund_percent';

const DEFAULT_ENABLED = false;
const DEFAULT_PERCENT = 70;

function normalizeEnabled(input) {
  if (input === true) return true;
  const raw = String(input ?? '').trim().toLowerCase();
  if (raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on' || raw === 'enabled') return true;
  if (raw === '0' || raw === 'false' || raw === 'no' || raw === 'off' || raw === 'disabled') return false;
  return DEFAULT_ENABLED;
}

function normalizePercent(input) {
  const n = Number(input);
  if (!Number.isFinite(n)) return DEFAULT_PERCENT;
  const clamped = Math.min(Math.max(n, 0), 1000);
  return Math.round(clamped * 100) / 100;
}

async function getSettings() {
  const [enabledRow, pctRow] = await Promise.all([
    SiteSetting.findOne({ where: { key: ENABLE_KEY } }),
    SiteSetting.findOne({ where: { key: PCT_KEY } }),
  ]);

  const enabled = enabledRow ? normalizeEnabled(enabledRow.value) : DEFAULT_ENABLED;
  const refundPercent = pctRow ? normalizePercent(pctRow.value) : DEFAULT_PERCENT;

  return { enabled, refundPercent };
}

async function saveSettings({ enabled, refundPercent }) {
  try {
    await SiteSetting.sync();
  } catch {}

  await SiteSetting.upsert({ key: ENABLE_KEY, value: enabled ? 'true' : 'false' });
  await SiteSetting.upsert({ key: PCT_KEY, value: String(refundPercent) });

  return { enabled, refundPercent };
}

exports.getPublicPackageDeactivationSettings = async (req, res) => {
  try {
    const settings = await getSettings();
    return res.status(200).json({ success: true, settings });
  } catch (error) {
    console.error('Get public package deactivation settings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch package deactivation settings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.getAdminPackageDeactivationSettings = async (req, res) => {
  try {
    const settings = await getSettings();
    return res.status(200).json({ success: true, settings });
  } catch (error) {
    console.error('Get admin package deactivation settings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch package deactivation settings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.setAdminPackageDeactivationSettings = async (req, res) => {
  try {
    const enabled = normalizeEnabled(req.body?.enabled);
    const refundPercent = normalizePercent(req.body?.refundPercent ?? req.body?.refund_percent ?? req.body?.percent);

    const saved = await saveSettings({ enabled, refundPercent });
    return res.status(200).json({ success: true, settings: saved });
  } catch (error) {
    console.error('Set admin package deactivation settings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update package deactivation settings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports._internal = {
  normalizeEnabled,
  normalizePercent,
  getSettings,
  saveSettings,
};
