const { SiteSetting } = require('../models');

const LOGO_KEY = 'site_logo_data_url';

async function getLogoDataUrl() {
  const row = await SiteSetting.findOne({ where: { key: LOGO_KEY } });
  return row ? row.value : null;
}

exports.getPublicBranding = async (req, res) => {
  try {
    const logoDataUrl = await getLogoDataUrl();
    return res.status(200).json({
      success: true,
      branding: {
        logoDataUrl: logoDataUrl || null,
      },
    });
  } catch (error) {
    console.error('Get public branding error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch branding',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.getAdminBranding = async (req, res) => {
  try {
    const logoDataUrl = await getLogoDataUrl();
    return res.status(200).json({
      success: true,
      branding: {
        logoDataUrl: logoDataUrl || null,
      },
    });
  } catch (error) {
    console.error('Get admin branding error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch branding',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.setLogo = async (req, res) => {
  try {
    const { logoDataUrl } = req.body || {};
    if (!logoDataUrl || typeof logoDataUrl !== 'string') {
      return res.status(400).json({ success: false, message: 'logoDataUrl is required' });
    }

    const trimmed = String(logoDataUrl).trim();
    if (!trimmed.startsWith('data:image/')) {
      return res.status(400).json({ success: false, message: 'logoDataUrl must be a data:image/* url' });
    }

    if (trimmed.length > 2 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: 'Logo is too large. Please upload a smaller image.' });
    }

    const existing = await SiteSetting.findOne({ where: { key: LOGO_KEY } });
    if (existing) {
      existing.value = trimmed;
      await existing.save();
    } else {
      await SiteSetting.create({ key: LOGO_KEY, value: trimmed });
    }

    return res.status(200).json({
      success: true,
      message: 'Logo updated',
      branding: {
        logoDataUrl: trimmed,
      },
    });
  } catch (error) {
    console.error('Set logo error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update logo',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.removeLogo = async (req, res) => {
  try {
    await SiteSetting.destroy({ where: { key: LOGO_KEY } });
    return res.status(200).json({
      success: true,
      message: 'Logo removed',
      branding: {
        logoDataUrl: null,
      },
    });
  } catch (error) {
    console.error('Remove logo error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove logo',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
