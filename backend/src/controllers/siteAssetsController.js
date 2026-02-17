const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { SiteSetting } = require('../models');

const ASSET_KEYS = {
  favicon: {
    settingKey: 'site_favicon_asset',
    allowedMime: new Set(['image/x-icon', 'image/vnd.microsoft.icon', 'image/png']),
    allowedExt: new Set(['.ico', '.png']),
    maxBytes: 200 * 1024,
  },
  logo: {
    settingKey: 'site_logo_asset',
    allowedMime: new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']),
    allowedExt: new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg']),
    maxBytes: 1024 * 1024,
  },
  ogImage: {
    settingKey: 'site_og_image_asset',
    allowedMime: new Set(['image/png', 'image/jpeg', 'image/webp']),
    allowedExt: new Set(['.png', '.jpg', '.jpeg', '.webp']),
    maxBytes: 2 * 1024 * 1024,
  },
};

const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'public', 'uploads', 'site');

function safeJsonParse(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

async function getAssetSetting(asset) {
  const cfg = ASSET_KEYS[asset];
  if (!cfg) return null;
  const row = await SiteSetting.findOne({ where: { key: cfg.settingKey } });
  if (!row || !row.value) return null;
  const parsed = safeJsonParse(row.value, null);
  if (!parsed || typeof parsed !== 'object') return null;
  return parsed;
}

function ensureUploadDir() {
  fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
}

function guessExtFromMime(mime, fallbackExt) {
  const m = String(mime || '').toLowerCase();
  if (m === 'image/png') return '.png';
  if (m === 'image/jpeg') return '.jpg';
  if (m === 'image/webp') return '.webp';
  if (m === 'image/svg+xml') return '.svg';
  if (m === 'image/x-icon' || m === 'image/vnd.microsoft.icon') return '.ico';
  return fallbackExt || '';
}

function normalizeAssetName(asset) {
  if (asset === 'favicon') return 'favicon';
  if (asset === 'logo') return 'logo';
  if (asset === 'ogImage') return 'og-image';
  return null;
}

function parseDataUrl(dataUrl) {
  const raw = String(dataUrl || '').trim();
  const m = raw.match(/^data:([^;]+);base64,(.+)$/i);
  if (!m) return null;
  return { mime: m[1].toLowerCase(), base64: m[2] };
}

exports.getAdminSiteAssets = async (req, res) => {
  try {
    const [favicon, logo, ogImage] = await Promise.all([
      getAssetSetting('favicon'),
      getAssetSetting('logo'),
      getAssetSetting('ogImage'),
    ]);

    return res.status(200).json({
      success: true,
      assets: {
        favicon: favicon || null,
        logo: logo || null,
        ogImage: ogImage || null,
      },
    });
  } catch (error) {
    console.error('Get admin site assets error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load site assets',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.getPublicSiteAssets = async (req, res) => {
  try {
    const [favicon, logo, ogImage] = await Promise.all([
      getAssetSetting('favicon'),
      getAssetSetting('logo'),
      getAssetSetting('ogImage'),
    ]);

    const pick = (asset) => {
      if (!asset || typeof asset !== 'object') return null;
      return {
        url: typeof asset.url === 'string' ? asset.url : '',
        mime: typeof asset.mime === 'string' ? asset.mime : '',
        bytes: Number(asset.bytes || 0),
        updatedAt: typeof asset.updatedAt === 'string' ? asset.updatedAt : '',
      };
    };

    return res.status(200).json({
      success: true,
      assets: {
        favicon: pick(favicon),
        logo: pick(logo),
        ogImage: pick(ogImage),
      },
    });
  } catch (error) {
    console.error('Get public site assets error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load site assets',
    });
  }
};

exports.uploadAdminSiteAsset = async (req, res) => {
  try {
    const asset = String(req.params.asset || '').trim();
    const cfg = ASSET_KEYS[asset];
    const baseName = normalizeAssetName(asset);
    if (!cfg || !baseName) {
      return res.status(400).json({ success: false, message: 'Invalid asset type' });
    }

    const dataUrl = req.body?.dataUrl;
    if (!dataUrl || typeof dataUrl !== 'string') {
      return res.status(400).json({ success: false, message: 'dataUrl is required' });
    }

    const parsed = parseDataUrl(dataUrl);
    if (!parsed) {
      return res.status(400).json({ success: false, message: 'Invalid dataUrl format' });
    }

    if (!cfg.allowedMime.has(parsed.mime)) {
      return res.status(400).json({ success: false, message: `Unsupported file type: ${parsed.mime}` });
    }

    let buffer;
    try {
      buffer = Buffer.from(parsed.base64, 'base64');
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid base64 data' });
    }

    if (!buffer || !buffer.length) {
      return res.status(400).json({ success: false, message: 'Empty file' });
    }

    if (buffer.length > cfg.maxBytes) {
      return res.status(400).json({ success: false, message: 'File too large' });
    }

    const ext = guessExtFromMime(parsed.mime, '.bin');
    if (!cfg.allowedExt.has(ext)) {
      return res.status(400).json({ success: false, message: 'Unsupported file extension' });
    }

    ensureUploadDir();

    const hash = crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 12);
    const fileName = `${baseName}-${hash}${ext}`;
    const absPath = path.join(UPLOAD_ROOT, fileName);

    fs.writeFileSync(absPath, buffer);

    const publicUrl = `/uploads/site/${fileName}`;
    const nowIso = new Date().toISOString();

    const payload = {
      url: publicUrl,
      mime: parsed.mime,
      bytes: buffer.length,
      updatedAt: nowIso,
    };

    await SiteSetting.upsert({
      key: cfg.settingKey,
      value: JSON.stringify(payload),
    });

    return res.status(200).json({
      success: true,
      message: 'Asset uploaded',
      asset,
      payload,
    });
  } catch (error) {
    console.error('Upload admin site asset error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload asset',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.deleteAdminSiteAsset = async (req, res) => {
  try {
    const asset = String(req.params.asset || '').trim();
    const cfg = ASSET_KEYS[asset];
    if (!cfg) {
      return res.status(400).json({ success: false, message: 'Invalid asset type' });
    }

    await SiteSetting.destroy({ where: { key: cfg.settingKey } });

    return res.status(200).json({
      success: true,
      message: 'Asset removed',
      asset,
    });
  } catch (error) {
    console.error('Delete admin site asset error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove asset',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
