const { SiteSetting } = require('../models');

const KEY = 'admin_login_theme_variant';
const DEFAULT_VARIANT = 'blue';

function normalizeVariant(input) {
  const raw = String(input || '').trim().toLowerCase();
  if (raw === 'green') return 'green';
  if (raw === 'blue') return 'blue';
  if (!raw) return DEFAULT_VARIANT;
  return DEFAULT_VARIANT;
}

async function getStoredVariant() {
  const row = await SiteSetting.findOne({ where: { key: KEY } });
  return row ? normalizeVariant(row.value) : DEFAULT_VARIANT;
}

exports.getPublicAdminLoginTheme = async (req, res) => {
  try {
    const variant = await getStoredVariant();
    return res.status(200).json({ success: true, variant });
  } catch (error) {
    console.error('Get public admin login theme error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch admin login theme',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.getAdminAdminLoginTheme = async (req, res) => {
  try {
    const variant = await getStoredVariant();
    return res.status(200).json({ success: true, variant });
  } catch (error) {
    console.error('Get admin login theme error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch admin login theme',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.setAdminAdminLoginTheme = async (req, res) => {
  try {
    const variant = normalizeVariant(req.body?.variant);

    try {
      await SiteSetting.sync();
    } catch {}

    await SiteSetting.upsert({
      key: KEY,
      value: variant,
    });

    return res.status(200).json({ success: true, variant });
  } catch (error) {
    console.error('Set admin login theme error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update admin login theme',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
