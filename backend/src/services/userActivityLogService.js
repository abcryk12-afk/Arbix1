const crypto = require('crypto');
const { UserActivityLog } = require('../models');

const normalizeIp = (value) => {
  if (!value) return null;
  const raw = String(value);
  const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
  const ip = parts[0] || '';
  if (!ip) return null;
  if (ip.startsWith('::ffff:')) return ip.slice(7);
  return ip;
};

const getRequestIp = (req) => {
  return (
    normalizeIp(req.headers['x-forwarded-for']) ||
    normalizeIp(req.headers['x-real-ip']) ||
    normalizeIp(req.ip) ||
    normalizeIp(req.connection && req.connection.remoteAddress)
  );
};

const getDeviceInfo = (req) => {
  const ua = req.headers['user-agent'];
  if (!ua) return null;
  const raw = String(ua);
  if (raw.length <= 255) return raw;
  return raw.slice(0, 255);
};

exports.createLoginActivity = async ({ req, userId }) => {
  const sessionId = crypto.randomBytes(24).toString('hex');

  try {
    await UserActivityLog.create({
      user_id: userId,
      session_id: sessionId,
      login_time: new Date(),
      logout_time: null,
      ip_address: getRequestIp(req),
      device_info: getDeviceInfo(req),
      created_at: new Date(),
    });
  } catch (e) {
  }

  return sessionId;
};

exports.markLogoutActivity = async ({ userId, sessionId }) => {
  if (!userId || !sessionId) return false;

  try {
    const [affected] = await UserActivityLog.update(
      { logout_time: new Date() },
      {
        where: {
          user_id: userId,
          session_id: sessionId,
          logout_time: null,
        },
      }
    );
    return Number(affected || 0) > 0;
  } catch (e) {
    return false;
  }
};
