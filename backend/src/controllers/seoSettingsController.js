const { SiteSetting } = require('../models');

const GLOBAL_KEY = 'seo_global_settings';
const ROUTE_OVERRIDES_KEY = 'seo_route_overrides';

const MAX_LEN = {
  title: 120,
  description: 300,
  keywords: 500,
  canonicalBase: 300,
  googleVerification: 200,
  jsonLd: 6000,
};

function safeJsonParse(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function cleanText(v, max) {
  if (v == null) return '';
  const s = String(v).replace(/\s+/g, ' ').trim();
  if (!s) return '';
  return s.length > max ? s.slice(0, max) : s;
}

function cleanUrl(v, max) {
  const s = cleanText(v, max);
  if (!s) return '';
  try {
    const u = new URL(s);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return '';
    return u.toString();
  } catch {
    return '';
  }
}

function normalizeTwitterCard(v) {
  const raw = String(v || '').trim().toLowerCase();
  if (!raw) return 'summary_large_image';
  const allowed = new Set(['summary', 'summary_large_image', 'app', 'player']);
  return allowed.has(raw) ? raw : 'summary_large_image';
}

function normalizeRobotsIndex(v) {
  if (v === false || v === 'false' || v === '0' || v === 0) return false;
  if (v === true || v === 'true' || v === '1' || v === 1) return true;
  return true;
}

function sanitizeGlobalSettings(input) {
  const src = input && typeof input === 'object' ? input : {};
  const out = {
    defaultMetaTitle: cleanText(src.defaultMetaTitle, MAX_LEN.title),
    defaultMetaDescription: cleanText(src.defaultMetaDescription, MAX_LEN.description),
    defaultKeywords: cleanText(src.defaultKeywords, MAX_LEN.keywords),
    openGraphTitle: cleanText(src.openGraphTitle, MAX_LEN.title),
    openGraphDescription: cleanText(src.openGraphDescription, MAX_LEN.description),
    ogImageUrl: cleanText(src.ogImageUrl, MAX_LEN.canonicalBase),
    twitterCardType: normalizeTwitterCard(src.twitterCardType),
    canonicalBase: cleanUrl(src.canonicalBase, MAX_LEN.canonicalBase),
    robotsIndex: normalizeRobotsIndex(src.robotsIndex),
    googleVerification: cleanText(src.googleVerification, MAX_LEN.googleVerification),
    updatedAt: new Date().toISOString(),
  };

  return out;
}

function normalizeRoutePath(p) {
  const raw = String(p || '').trim();
  if (!raw) return null;
  if (!raw.startsWith('/')) return null;
  if (raw.length > 200) return null;
  if (raw.includes('..')) return null;
  if (raw.includes('#') || raw.includes('?')) return null;
  return raw === '/' ? '/' : raw.replace(/\/+$/, '');
}

function sanitizeRouteOverride(input) {
  const src = input && typeof input === 'object' ? input : {};
  const out = {
    title: cleanText(src.title, MAX_LEN.title),
    description: cleanText(src.description, MAX_LEN.description),
    keywords: cleanText(src.keywords, MAX_LEN.keywords),
    canonicalUrl: cleanUrl(src.canonicalUrl, MAX_LEN.canonicalBase),
    ogTitle: cleanText(src.ogTitle, MAX_LEN.title),
    ogDescription: cleanText(src.ogDescription, MAX_LEN.description),
    ogImageUrl: cleanText(src.ogImageUrl, MAX_LEN.canonicalBase),
    jsonLd: cleanText(src.jsonLd, MAX_LEN.jsonLd),
    index: normalizeRobotsIndex(src.index),
    updatedAt: new Date().toISOString(),
  };

  return out;
}

async function readGlobalSettings() {
  const row = await SiteSetting.findOne({ where: { key: GLOBAL_KEY } });
  if (!row || !row.value) return sanitizeGlobalSettings({});
  return sanitizeGlobalSettings(safeJsonParse(row.value, {}));
}

async function readRouteOverrides() {
  const row = await SiteSetting.findOne({ where: { key: ROUTE_OVERRIDES_KEY } });
  const parsed = row && row.value ? safeJsonParse(row.value, {}) : {};
  const out = {};
  if (parsed && typeof parsed === 'object') {
    for (const [k, v] of Object.entries(parsed)) {
      const path = normalizeRoutePath(k);
      if (!path) continue;
      out[path] = sanitizeRouteOverride(v);
    }
  }
  return out;
}

exports.getAdminSeoSettings = async (req, res) => {
  try {
    const [global, routes] = await Promise.all([readGlobalSettings(), readRouteOverrides()]);
    return res.status(200).json({
      success: true,
      global,
      routes,
    });
  } catch (error) {
    console.error('Get admin seo settings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load SEO settings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.updateAdminSeoSettings = async (req, res) => {
  try {
    const input = req.body?.global != null ? req.body.global : req.body;
    const cleaned = sanitizeGlobalSettings(input);

    await SiteSetting.upsert({
      key: GLOBAL_KEY,
      value: JSON.stringify(cleaned),
    });

    return res.status(200).json({ success: true, global: cleaned });
  } catch (error) {
    console.error('Update admin seo settings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update SEO settings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.listAdminRouteSeo = async (req, res) => {
  try {
    const routes = await readRouteOverrides();
    return res.status(200).json({ success: true, routes });
  } catch (error) {
    console.error('List admin route seo error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load route SEO overrides',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.upsertAdminRouteSeo = async (req, res) => {
  try {
    const pathRaw = req.body?.path;
    const routePath = normalizeRoutePath(pathRaw);
    if (!routePath) {
      return res.status(400).json({ success: false, message: 'Invalid path. Must start with / and not include ? or #.' });
    }

    const override = sanitizeRouteOverride(req.body?.override);

    const current = await readRouteOverrides();
    current[routePath] = override;

    await SiteSetting.upsert({
      key: ROUTE_OVERRIDES_KEY,
      value: JSON.stringify(current),
    });

    return res.status(200).json({
      success: true,
      path: routePath,
      override,
    });
  } catch (error) {
    console.error('Upsert admin route seo error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update route SEO override',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.deleteAdminRouteSeo = async (req, res) => {
  try {
    const routePath = normalizeRoutePath(req.body?.path || req.query?.path);
    if (!routePath) {
      return res.status(400).json({ success: false, message: 'Invalid path' });
    }

    const current = await readRouteOverrides();
    if (current[routePath]) {
      delete current[routePath];
    }

    await SiteSetting.upsert({
      key: ROUTE_OVERRIDES_KEY,
      value: JSON.stringify(current),
    });

    return res.status(200).json({ success: true, path: routePath });
  } catch (error) {
    console.error('Delete admin route seo error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete route SEO override',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.getPublicSeoSettings = async (req, res) => {
  try {
    const global = await readGlobalSettings();

    return res.status(200).json({
      success: true,
      global: {
        defaultMetaTitle: global.defaultMetaTitle,
        defaultMetaDescription: global.defaultMetaDescription,
        defaultKeywords: global.defaultKeywords,
        openGraphTitle: global.openGraphTitle,
        openGraphDescription: global.openGraphDescription,
        ogImageUrl: global.ogImageUrl,
        twitterCardType: global.twitterCardType,
        canonicalBase: global.canonicalBase,
        robotsIndex: global.robotsIndex,
        googleVerification: global.googleVerification,
        updatedAt: global.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get public seo settings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch SEO settings',
    });
  }
};

exports.getPublicRouteSeo = async (req, res) => {
  try {
    const pathRaw = req.query?.path;
    const routePath = normalizeRoutePath(pathRaw);
    if (!routePath) {
      return res.status(400).json({ success: false, message: 'Invalid path' });
    }

    const routes = await readRouteOverrides();
    const override = routes[routePath] || null;

    return res.status(200).json({
      success: true,
      path: routePath,
      override,
    });
  } catch (error) {
    console.error('Get public route seo error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch route SEO override',
    });
  }
};
