const { SiteSetting } = require('../models');

const KEY = 'ui_theme';
const DEFAULT_THEME = 'default';

function normalizeTheme(input) {
  const raw = String(input || '').trim().toLowerCase();
  if (!raw || raw === 'default' || raw === 'system' || raw === 'legacy') return 'default';
  if (raw === 'aurora_glass' || raw === 'auroraglass' || raw === 'aurora-glass') return 'aurora_glass';
  return DEFAULT_THEME;
}

async function getStoredTheme() {
  const row = await SiteSetting.findOne({ where: { key: KEY } });
  return row ? normalizeTheme(row.value) : DEFAULT_THEME;
}

exports.getPublicUiTheme = async (req, res) => {
  try {
    const theme = await getStoredTheme();
    return res.status(200).json({ success: true, theme });
  } catch (error) {
    console.error('Get public ui theme error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch UI theme',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.getAdminUiTheme = async (req, res) => {
  try {
    const theme = await getStoredTheme();
    return res.status(200).json({ success: true, theme });
  } catch (error) {
    console.error('Get admin ui theme error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch UI theme',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.setAdminUiTheme = async (req, res) => {
  try {
    const theme = normalizeTheme(req.body?.theme);

    try {
      await SiteSetting.sync();
    } catch {}

    await SiteSetting.upsert({
      key: KEY,
      value: theme,
    });

    return res.status(200).json({ success: true, theme });
  } catch (error) {
    console.error('Set ui theme error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update UI theme',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
