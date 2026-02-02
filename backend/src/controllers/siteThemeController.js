const { SiteSetting } = require('../models');

const THEME_KEY = 'site_theme';
const DEFAULT_THEME = null;

function normalizeTheme(input) {
  const raw = String(input || '').trim().toLowerCase();
  if (!raw || raw === 'default' || raw === 'system') return null;
  if (raw === 'light') return 'light';
  if (raw === 'dark') return 'dark';
  if (raw === 'colorful') return 'colorful';
  return null;
}

async function getStoredTheme() {
  const row = await SiteSetting.findOne({ where: { key: THEME_KEY } });
  return row ? normalizeTheme(row.value) : DEFAULT_THEME;
}

exports.getPublicSiteTheme = async (req, res) => {
  try {
    const theme = await getStoredTheme();
    return res.status(200).json({
      success: true,
      theme,
    });
  } catch (error) {
    console.error('Get public site theme error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch site theme',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.getAdminSiteTheme = async (req, res) => {
  try {
    const theme = await getStoredTheme();
    return res.status(200).json({
      success: true,
      theme,
    });
  } catch (error) {
    console.error('Get admin site theme error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch site theme',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.setAdminSiteTheme = async (req, res) => {
  try {
    const theme = normalizeTheme(req.body?.theme);

    try {
      await SiteSetting.sync();
    } catch {}

    await SiteSetting.upsert({
      key: THEME_KEY,
      value: theme,
    });

    return res.status(200).json({
      success: true,
      theme,
    });
  } catch (error) {
    console.error('Set admin site theme error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update site theme',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
