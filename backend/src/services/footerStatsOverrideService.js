const { SiteSetting } = require('../models');

const SETTINGS_KEY = 'footer_stats_overrides';

const DEFAULT_OVERRIDES = {
  system: {
    dailyWithdrawals: 0,
    totalWithdrawals: 0,
    dailyJoinings: 0,
    totalJoinings: 0,
  },
};

const toNumber = (v) => {
  const n = typeof v === 'number' ? v : v == null ? NaN : Number(v);
  return Number.isFinite(n) ? n : NaN;
};

const sanitizeOverrides = (input) => {
  const raw = input && typeof input === 'object' ? input : {};
  const rawSystem = raw.system && typeof raw.system === 'object' ? raw.system : {};

  const dailyWithdrawals = toNumber(rawSystem.dailyWithdrawals);
  const totalWithdrawals = toNumber(rawSystem.totalWithdrawals);
  const dailyJoinings = toNumber(rawSystem.dailyJoinings);
  const totalJoinings = toNumber(rawSystem.totalJoinings);

  return {
    system: {
      dailyWithdrawals: Number.isFinite(dailyWithdrawals) ? dailyWithdrawals : 0,
      totalWithdrawals: Number.isFinite(totalWithdrawals) ? totalWithdrawals : 0,
      dailyJoinings: Number.isFinite(dailyJoinings) ? Math.trunc(dailyJoinings) : 0,
      totalJoinings: Number.isFinite(totalJoinings) ? Math.trunc(totalJoinings) : 0,
    },
  };
};

async function getFooterStatsOverrides() {
  try {
    try {
      await SiteSetting.sync();
    } catch {}

    const row = await SiteSetting.findOne({ where: { key: SETTINGS_KEY }, raw: true });
    if (!row || !row.value) return DEFAULT_OVERRIDES;

    const parsed = JSON.parse(String(row.value));
    const sanitized = sanitizeOverrides(parsed);

    return {
      system: {
        dailyWithdrawals: Number(sanitized.system.dailyWithdrawals || 0),
        totalWithdrawals: Number(sanitized.system.totalWithdrawals || 0),
        dailyJoinings: Number(sanitized.system.dailyJoinings || 0),
        totalJoinings: Number(sanitized.system.totalJoinings || 0),
      },
    };
  } catch {
    return DEFAULT_OVERRIDES;
  }
}

async function setFooterStatsOverrides(nextOverrides) {
  const sanitized = sanitizeOverrides(nextOverrides);

  try {
    try {
      await SiteSetting.sync();
    } catch {}

    await SiteSetting.upsert({
      key: SETTINGS_KEY,
      value: JSON.stringify(sanitized),
    });
  } catch {}

  return sanitized;
}

module.exports = {
  DEFAULT_OVERRIDES,
  getFooterStatsOverrides,
  setFooterStatsOverrides,
};
