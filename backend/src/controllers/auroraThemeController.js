const { SiteSetting } = require('../models');

const AURORA_OVERRIDES_KEY = 'aurora_theme_overrides';

const ALLOWED_TOKENS = [
  '--t-page',
  '--t-surface',
  '--t-surface-2',
  '--t-overlay',
  '--t-fg',
  '--t-heading',
  '--t-muted',
  '--t-subtle',
  '--t-border',
  '--t-border-2',
  '--t-ring',
  '--t-primary',
  '--t-primary-hover',
  '--t-on-primary',
  '--t-secondary',
  '--t-on-secondary',
  '--t-info',
  '--t-on-info',
  '--t-success',
  '--t-on-success',
  '--t-warning',
  '--t-on-warning',
  '--t-danger',
  '--t-on-danger',
  '--t-accent',
  '--t-on-accent',
  '--t-brand-1',
  '--t-brand-2',
  '--t-brand-3',
  '--t-white',
  '--t-shadow-rgb',
  '--t-dashboard-1',
  '--t-dashboard-2',
  '--t-dashboard-3',
  '--t-warning-deep',
  '--t-success-deep',
  '--t-danger-soft',
  '--t-danger-deep',
  '--t-border-soft',
];

function isValidRgbTriplet(value) {
  const raw = String(value || '').trim();
  if (!raw) return false;
  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length !== 3) return false;
  return parts.every((p) => {
    if (!/^\d{1,3}$/.test(p)) return false;
    const n = Number(p);
    return Number.isInteger(n) && n >= 0 && n <= 255;
  });
}

function sanitizeOverrides(input) {
  if (!input || typeof input !== 'object') return {};

  const allowed = new Set(ALLOWED_TOKENS);
  const out = {};

  for (const [k, v] of Object.entries(input)) {
    if (!allowed.has(k)) continue;
    if (!isValidRgbTriplet(v)) continue;
    out[k] = String(v).trim();
  }

  return out;
}

async function getStoredOverrides() {
  const row = await SiteSetting.findOne({ where: { key: AURORA_OVERRIDES_KEY } });
  if (!row || !row.value) return {};

  try {
    const parsed = JSON.parse(row.value);
    return sanitizeOverrides(parsed);
  } catch {
    return {};
  }
}

exports.getPublicAuroraTheme = async (req, res) => {
  try {
    const overrides = await getStoredOverrides();
    return res.status(200).json({
      success: true,
      overrides,
    });
  } catch (error) {
    console.error('Get public aurora theme error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch aurora theme overrides',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.getAdminAuroraTheme = async (req, res) => {
  try {
    const overrides = await getStoredOverrides();
    return res.status(200).json({
      success: true,
      overrides,
    });
  } catch (error) {
    console.error('Get admin aurora theme error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch aurora theme overrides',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.setAdminAuroraTheme = async (req, res) => {
  try {
    const overrides = sanitizeOverrides(req.body?.overrides);

    try {
      await SiteSetting.sync();
    } catch {}

    await SiteSetting.upsert({
      key: AURORA_OVERRIDES_KEY,
      value: JSON.stringify(overrides || {}),
    });

    return res.status(200).json({
      success: true,
      overrides,
    });
  } catch (error) {
    console.error('Set admin aurora theme error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update aurora theme overrides',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
