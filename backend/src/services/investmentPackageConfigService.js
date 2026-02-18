const { SiteSetting } = require('../models');

const SETTINGS_KEY = 'investment_packages_config';

const DEFAULT_PACKAGES = {
  starter: { name: 'Starter', capital: 10, maxCapital: 30, dailyRoi: 1, durationDays: 365 },
  basic: { name: 'Basic', capital: 30, maxCapital: 50, dailyRoi: 1.3, durationDays: 365 },
  growth: { name: 'Growth', capital: 50, maxCapital: 100, dailyRoi: 1.5, durationDays: 365 },
  silver: { name: 'Silver', capital: 100, maxCapital: 500, dailyRoi: 2, durationDays: 365 },
  gold: { name: 'Gold', capital: 500, maxCapital: 1000, dailyRoi: 3, durationDays: 365 },
  platinum: { name: 'Platinum', capital: 1000, maxCapital: 5000, dailyRoi: 4, durationDays: 365 },
  elite_plus: { name: 'Elite+', capital: 'flex', minCapital: 1000, dailyRoi: 4.5, durationDays: 365 },
};

const toNumber = (v) => {
  const n = typeof v === 'number' ? v : v == null ? NaN : Number(v);
  return Number.isFinite(n) ? n : NaN;
};

const sanitizeText = (v, fallback) => {
  if (typeof v !== 'string') return fallback;
  const s = v.trim();
  if (!s) return fallback;
  return s.slice(0, 100);
};

const sanitizePackage = (id, input, fallback) => {
  const base = fallback || DEFAULT_PACKAGES[id];
  const raw = input && typeof input === 'object' ? input : {};

  const name = sanitizeText(raw.name, base.name);

  const dailyRoi = toNumber(raw.dailyRoi);
  const finalDailyRoi = Number.isFinite(dailyRoi) && dailyRoi > 0 && dailyRoi <= 100 ? dailyRoi : toNumber(base.dailyRoi);

  const durationDays = toNumber(raw.durationDays);
  const finalDurationDays = Number.isFinite(durationDays) && durationDays > 0 && durationDays <= 3650
    ? Math.floor(durationDays)
    : Math.floor(toNumber(base.durationDays));

  let capital = base.capital;
  if (raw.capital === 'flex') {
    capital = 'flex';
  } else if (raw.capital != null) {
    const cap = toNumber(raw.capital);
    if (Number.isFinite(cap) && cap > 0) capital = cap;
  }

  const maxCapital = toNumber(raw.maxCapital);
  const baseMaxCapital = toNumber(base.maxCapital);
  const finalMaxCapital = Number.isFinite(maxCapital) && maxCapital > 0
    ? maxCapital
    : Number.isFinite(baseMaxCapital) && baseMaxCapital > 0
    ? baseMaxCapital
    : undefined;

  const minCapital = toNumber(raw.minCapital);
  const finalMinCapital = base.capital === 'flex'
    ? Number.isFinite(minCapital) && minCapital > 0 ? minCapital : toNumber(base.minCapital || 1000)
    : undefined;

  const out = {
    name,
    capital,
    ...(finalMaxCapital != null ? { maxCapital: finalMaxCapital } : {}),
    dailyRoi: finalDailyRoi,
    durationDays: finalDurationDays,
  };

  if (base.capital === 'flex') {
    out.minCapital = finalMinCapital;
    out.capital = 'flex';
  }

  return out;
};

async function getStoredInvestmentPackagesConfig() {
  try {
    try {
      await SiteSetting.sync();
    } catch (err) {
      console.error('SiteSetting sync failed (get investment packages config):', err);
    }

    const row = await SiteSetting.findOne({ where: { key: SETTINGS_KEY }, raw: true });
    if (!row || !row.value) return null;

    const parsed = JSON.parse(String(row.value));
    if (!parsed || typeof parsed !== 'object') return null;

    const packages = parsed.packages && typeof parsed.packages === 'object' ? parsed.packages : null;
    if (!packages) return null;

    return { packages };
  } catch {
    return null;
  }
}

function getMergedInvestmentPackagesConfig(stored) {
  const out = {};
  const storedPkgs = stored && stored.packages && typeof stored.packages === 'object' ? stored.packages : {};

  for (const id of Object.keys(DEFAULT_PACKAGES)) {
    out[id] = sanitizePackage(id, storedPkgs[id], DEFAULT_PACKAGES[id]);
  }

  return out;
}

async function getInvestmentPackagesConfig() {
  const stored = await getStoredInvestmentPackagesConfig();
  const merged = getMergedInvestmentPackagesConfig(stored);
  return { stored, packages: merged };
}

async function setInvestmentPackagesConfig(nextConfig) {
  const input = nextConfig && typeof nextConfig === 'object' ? nextConfig : {};
  const packagesInput = input.packages && typeof input.packages === 'object' ? input.packages : {};

  const sanitized = {};
  for (const id of Object.keys(DEFAULT_PACKAGES)) {
    sanitized[id] = sanitizePackage(id, packagesInput[id], DEFAULT_PACKAGES[id]);
  }

  try {
    try {
      await SiteSetting.sync();
    } catch (err) {
      console.error('SiteSetting sync failed (set investment packages config):', err);
      throw err;
    }

    await SiteSetting.upsert({
      key: SETTINGS_KEY,
      value: JSON.stringify({ packages: sanitized }),
    });
  } catch (err) {
    console.error('Failed to persist investment packages config:', err);
    throw err;
  }

  return sanitized;
}

module.exports = {
  DEFAULT_PACKAGES,
  getInvestmentPackagesConfig,
  setInvestmentPackagesConfig,
  getMergedInvestmentPackagesConfig,
};
