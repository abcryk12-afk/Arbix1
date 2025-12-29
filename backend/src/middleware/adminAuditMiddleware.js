const { appendAdminLog } = require('../services/adminLogService');

function safeString(value) {
  if (value == null) return '';
  return String(value);
}

function shouldRedactKey(key) {
  const k = String(key || '').toLowerCase();
  if (!k) return false;
  return (
    k.includes('password') ||
    k.includes('secret') ||
    k.includes('token') ||
    k.includes('jwt') ||
    k.includes('authorization') ||
    k.includes('mnemonic') ||
    (k.includes('api') && k.includes('key')) ||
    (k.endsWith('_key'))
  );
}

function redactSensitive(value, depth = 0) {
  if (depth > 6) return null;
  if (value == null) return value;
  if (Array.isArray(value)) return value.map((v) => redactSensitive(v, depth + 1));
  if (typeof value !== 'object') return value;

  const out = {};
  for (const [k, v] of Object.entries(value)) {
    if (shouldRedactKey(k)) {
      out[k] = '[REDACTED]';
      continue;
    }
    out[k] = redactSensitive(v, depth + 1);
  }
  return out;
}

function safeJson(value) {
  try {
    if (value == null) return null;
    const cloned = JSON.parse(JSON.stringify(value));
    return redactSensitive(cloned);
  } catch {
    return null;
  }
}

function getEntityId(req) {
  const fromParams = req?.params?.id;
  if (fromParams != null) return safeString(fromParams);

  const b = req?.body || {};
  if (b.id != null) return safeString(b.id);
  if (b.userId != null) return safeString(b.userId);

  return null;
}

exports.auditAdminAction = (action, opts) => {
  const entity = opts?.entity != null ? safeString(opts.entity) : null;

  return (req, res, next) => {
    const startedAt = Date.now();

    const adminEmail = safeString(req.user?.email || '');
    const ip = safeString(req.headers['x-forwarded-for'] || req.ip || '');
    const userAgent = safeString(req.headers['user-agent'] || '');

    const details = {
      method: req.method,
      path: req.originalUrl,
      query: safeJson(req.query),
      body: safeJson(req.body),
    };

    res.on('finish', () => {
      const statusCode = Number(res.statusCode);
      const success = statusCode >= 200 && statusCode < 300;

      appendAdminLog({
        adminEmail,
        action: safeString(action),
        entity,
        entityId: getEntityId(req),
        success,
        ip,
        userAgent,
        details: { ...details, statusCode, durationMs: Date.now() - startedAt },
      }).catch(() => {});
    });

    next();
  };
};
