const { SiteSetting, sequelize } = require('../models');

const ADMIN_LOGS_KEY = 'admin_activity_logs';
const AUTO_WITHDRAW_STATUS_KEY = 'auto_withdraw_worker_status';

async function ensureSiteSettingTable() {
  try {
    await SiteSetting.sync();
  } catch {}
}

function safeJsonParse(value, fallback) {
  try {
    if (value == null) return fallback;
    const raw = String(value || '').trim();
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function updateJsonKey({ key, updater }) {
  await ensureSiteSettingTable();

  return sequelize.transaction(async (t) => {
    const row = await SiteSetting.findOne({ where: { key }, transaction: t, lock: t.LOCK.UPDATE });
    const current = safeJsonParse(row?.value, null);
    const next = updater(current);
    const serialized = next == null ? null : JSON.stringify(next);

    if (row) {
      row.value = serialized;
      await row.save({ transaction: t });
      return next;
    }

    await SiteSetting.create({ key, value: serialized }, { transaction: t });
    return next;
  });
}

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function nowIso() {
  return new Date().toISOString();
}

exports.appendAdminLog = async (entry, opts) => {
  const max = Math.max(1, Math.min(Number(opts?.max || 500), 2000));
  const normalized = {
    id: entry?.id || createId(),
    time: entry?.time || nowIso(),
    adminEmail: String(entry?.adminEmail || ''),
    action: String(entry?.action || ''),
    entity: entry?.entity != null ? String(entry.entity) : null,
    entityId: entry?.entityId != null ? String(entry.entityId) : null,
    success: Boolean(entry?.success),
    ip: entry?.ip != null ? String(entry.ip) : null,
    userAgent: entry?.userAgent != null ? String(entry.userAgent) : null,
    details: entry?.details ?? null,
  };

  await updateJsonKey({
    key: ADMIN_LOGS_KEY,
    updater: (current) => {
      const arr = Array.isArray(current) ? current : [];
      arr.unshift(normalized);
      return arr.slice(0, max);
    },
  });

  return normalized;
};

exports.listAdminLogs = async (limit) => {
  await ensureSiteSettingTable();
  const row = await SiteSetting.findOne({ where: { key: ADMIN_LOGS_KEY }, raw: true });
  const arr = safeJsonParse(row?.value, []);
  const n = Math.max(1, Math.min(Number(limit || 200), 2000));
  return Array.isArray(arr) ? arr.slice(0, n) : [];
};

exports.getAutoWithdrawWorkerStatus = async () => {
  await ensureSiteSettingTable();
  const row = await SiteSetting.findOne({ where: { key: AUTO_WITHDRAW_STATUS_KEY }, raw: true });
  const obj = safeJsonParse(row?.value, null);
  return obj && typeof obj === 'object' ? obj : null;
};

exports.reportAutoWithdrawWorker = async (patch, opts) => {
  const maxEvents = Math.max(1, Math.min(Number(opts?.maxEvents || 200), 1000));

  return updateJsonKey({
    key: AUTO_WITHDRAW_STATUS_KEY,
    updater: (current) => {
      const src = current && typeof current === 'object' ? current : {};
      const next = { ...src, ...(patch && typeof patch === 'object' ? patch : {}) };

      const events = Array.isArray(next.events) ? next.events : [];
      next.events = events.slice(0, maxEvents);

      return next;
    },
  });
};

exports.appendAutoWithdrawWorkerEvent = async (level, message, meta) => {
  const event = {
    time: nowIso(),
    level: String(level || 'info'),
    message: String(message || ''),
    meta: meta ?? null,
  };

  return updateJsonKey({
    key: AUTO_WITHDRAW_STATUS_KEY,
    updater: (current) => {
      const src = current && typeof current === 'object' ? current : {};
      const events = Array.isArray(src.events) ? src.events : [];

      const next = {
        ...src,
        lastSeenAt: nowIso(),
        pid: src.pid ?? process.pid,
        events: [event, ...events].slice(0, 200),
      };

      if (String(level || '').toLowerCase() === 'error') {
        next.lastError = String(message || 'Unknown error');
      }

      return next;
    },
  });
};
