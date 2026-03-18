const buckets = new Map();

const nowMs = () => Date.now();

const getKey = (req, keyPrefix) => {
  const ipRaw = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.ip || '';
  const ip = String(ipRaw).split(',')[0].trim();
  const path = String(req.baseUrl || '') + String(req.path || '');
  return `${keyPrefix || 'rl'}:${ip}:${path}`;
};

exports.rateLimit = ({ windowMs, max, keyPrefix }) => {
  const w = Number(windowMs || 60000);
  const m = Number(max || 60);

  return (req, res, next) => {
    try {
      const k = getKey(req, keyPrefix);
      const t = nowMs();
      const entry = buckets.get(k) || { start: t, count: 0 };

      if (t - entry.start >= w) {
        entry.start = t;
        entry.count = 0;
      }

      entry.count += 1;
      buckets.set(k, entry);

      if (entry.count > m) {
        return res.status(429).json({
          success: false,
          message: 'Too many requests',
        });
      }
    } catch (e) {
    }

    return next();
  };
};
