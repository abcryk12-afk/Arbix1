const { Op } = require('sequelize');
const { User, UserActivityLog, sequelize } = require('../models');

const clampInt = (value, def, min, max) => {
  const n = parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, n));
};

const parseDate = (value) => {
  if (!value) return null;
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return null;
  return d;
};

const dayKey = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString().slice(0, 10);
};

const resolveRange = (query) => {
  const view = String(query.view || '').toLowerCase();
  const now = new Date();
  let from;
  let to;

  if (view === 'today') {
    from = new Date(now);
    from.setHours(0, 0, 0, 0);
    to = new Date(now);
    to.setHours(23, 59, 59, 999);
    return { view: 'today', from, to };
  }

  if (view === '7d' || view === '7' || view === 'last7') {
    to = new Date(now);
    to.setHours(23, 59, 59, 999);
    from = new Date(to);
    from.setDate(from.getDate() - 6);
    from.setHours(0, 0, 0, 0);
    return { view: '7d', from, to };
  }

  if (view === '30d' || view === '30' || view === 'last30') {
    to = new Date(now);
    to.setHours(23, 59, 59, 999);
    from = new Date(to);
    from.setDate(from.getDate() - 29);
    from.setHours(0, 0, 0, 0);
    return { view: '30d', from, to };
  }

  const fromQ = parseDate(query.from);
  const toQ = parseDate(query.to);
  if (fromQ && toQ) {
    from = new Date(fromQ);
    from.setHours(0, 0, 0, 0);
    to = new Date(toQ);
    to.setHours(23, 59, 59, 999);
    return { view: 'custom', from, to };
  }

  to = new Date(now);
  to.setHours(23, 59, 59, 999);
  from = new Date(to);
  from.setDate(from.getDate() - 6);
  from.setHours(0, 0, 0, 0);
  return { view: '7d', from, to };
};

exports.listUsersForAnalytics = async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const status = String(req.query.status || 'all').toLowerCase();

    const page = clampInt(req.query.page, 1, 1, 100000);
    const limit = clampInt(req.query.limit, q ? 20 : 10, 1, 100);
    const offset = (page - 1) * limit;

    const where = {};
    if (q) {
      const or = [];
      or.push({ name: { [Op.like]: `%${q}%` } });
      or.push({ email: { [Op.like]: `%${q}%` } });
      if (/^\d+$/.test(q)) {
        or.push({ id: Number(q) });
      }
      where[Op.or] = or;
    }

    if (status === 'active' || status === 'hold') {
      where.account_status = status;
    }

    const { rows, count } = await User.findAndCountAll({
      where,
      attributes: ['id', 'name', 'email', 'account_status', 'created_at'],
      order: [['id', 'DESC']],
      limit,
      offset,
    });

    const ids = rows.map((u) => u.id);
    let lastLoginMap = new Map();
    if (ids.length) {
      const [r] = await sequelize.query(
        `SELECT user_id, MAX(login_time) AS lastLoginAt
         FROM user_activity_logs
         WHERE user_id IN (:ids)
         GROUP BY user_id`,
        { replacements: { ids } }
      );
      const arr = Array.isArray(r) ? r : [];
      lastLoginMap = new Map(arr.map((x) => [Number(x.user_id), x.lastLoginAt ? new Date(x.lastLoginAt).toISOString() : null]));
    }

    return res.status(200).json({
      success: true,
      page,
      limit,
      total: Number(count || 0),
      users: rows.map((u) => ({
        id: u.id,
        name: u.name || '',
        email: u.email || '',
        accountStatus: u.account_status || null,
        createdAt: u.created_at ? new Date(u.created_at).toISOString() : null,
        lastLoginAt: lastLoginMap.get(Number(u.id)) || null,
      })),
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.getUserActivity = async (req, res) => {
  try {
    const userId = parseInt(String(req.query.userId || ''), 10);
    if (!Number.isFinite(userId) || userId <= 0) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }

    const { from, to, view } = resolveRange(req.query);

    const page = clampInt(req.query.page, 1, 1, 100000);
    const limit = clampInt(req.query.limit, 25, 1, 100);
    const offset = (page - 1) * limit;

    const where = {
      user_id: userId,
      login_time: { [Op.between]: [from, to] },
    };

    const total = await UserActivityLog.count({ where });

    const sessions = await UserActivityLog.findAll({
      where,
      attributes: ['session_id', 'login_time', 'logout_time', 'ip_address', 'device_info'],
      order: [['login_time', 'DESC']],
      limit,
      offset,
    });

    const [aggRows] = await sequelize.query(
      `SELECT
         COUNT(*) AS totalLogins,
         SUM(CASE WHEN logout_time IS NOT NULL THEN 1 ELSE 0 END) AS totalLogouts,
         MAX(login_time) AS lastLoginAt,
         MAX(logout_time) AS lastLogoutAt,
         SUM(CASE WHEN logout_time IS NOT NULL THEN TIMESTAMPDIFF(SECOND, login_time, logout_time) ELSE 0 END) AS totalActiveSeconds
       FROM user_activity_logs
       WHERE user_id = :userId AND login_time BETWEEN :from AND :to`,
      { replacements: { userId, from, to } }
    );

    const agg = Array.isArray(aggRows) && aggRows.length ? aggRows[0] : {};

    const [dailyRows] = await sequelize.query(
      `SELECT
         DATE(login_time) AS day,
         COUNT(*) AS logins,
         SUM(CASE WHEN logout_time IS NOT NULL THEN 1 ELSE 0 END) AS logouts,
         SUM(CASE WHEN logout_time IS NOT NULL THEN TIMESTAMPDIFF(SECOND, login_time, logout_time) ELSE 0 END) AS activeSeconds
       FROM user_activity_logs
       WHERE user_id = :userId AND login_time BETWEEN :from AND :to
       GROUP BY DATE(login_time)
       ORDER BY day ASC`,
      { replacements: { userId, from, to } }
    );

    const daily = (Array.isArray(dailyRows) ? dailyRows : []).map((r) => ({
      date: r.day ? String(r.day) : null,
      logins: Number(r.logins || 0),
      logouts: Number(r.logouts || 0),
      totalSessionMs: Number(r.activeSeconds || 0) * 1000,
    }));

    return res.status(200).json({
      success: true,
      range: { view, from: from.toISOString(), to: to.toISOString() },
      page,
      limit,
      total: Number(total || 0),
      kpis: {
        totalLogins: Number(agg.totalLogins || 0),
        totalLogouts: Number(agg.totalLogouts || 0),
        lastLoginAt: agg.lastLoginAt ? new Date(agg.lastLoginAt).toISOString() : null,
        lastLogoutAt: agg.lastLogoutAt ? new Date(agg.lastLogoutAt).toISOString() : null,
        totalActiveTimeMs: Number(agg.totalActiveSeconds || 0) * 1000,
        failedLoginAttempts: 0,
      },
      daily,
      sessions: sessions.map((s) => {
        const login = s.login_time ? new Date(s.login_time) : null;
        const logout = s.logout_time ? new Date(s.logout_time) : null;
        const durationMs = login && logout ? Math.max(0, logout.getTime() - login.getTime()) : null;
        return {
          sessionId: s.session_id,
          loginTime: login ? login.toISOString() : null,
          logoutTime: logout ? logout.toISOString() : null,
          durationMs,
          ipAddress: s.ip_address || null,
          deviceInfo: s.device_info || null,
        };
      }),
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const summaryCache = new Map();

const getCacheKey = ({ view, from, to }) => `${view}:${from.toISOString().slice(0, 19)}:${to.toISOString().slice(0, 19)}`;

exports.getAnalyticsSummary = async (req, res) => {
  try {
    const { from, to, view } = resolveRange(req.query);
    const cacheKey = getCacheKey({ view, from, to });

    const ttlMs = 30000;
    const cached = summaryCache.get(cacheKey);
    if (cached && Date.now() - cached.at < ttlMs) {
      return res.status(200).json({ success: true, range: cached.range, data: cached.data, cached: true });
    }

    const [dailyRows] = await sequelize.query(
      `SELECT
         DATE(login_time) AS day,
         COUNT(*) AS sessions,
         SUM(CASE WHEN logout_time IS NOT NULL THEN 1 ELSE 0 END) AS logouts
       FROM user_activity_logs
       WHERE login_time BETWEEN :from AND :to
       GROUP BY DATE(login_time)
       ORDER BY day ASC`,
      { replacements: { from, to } }
    );

    const [dailyLoginRows] = await sequelize.query(
      `SELECT
         DATE(login_time) AS day,
         COUNT(*) AS logins,
         SUM(CASE WHEN logout_time IS NOT NULL THEN 1 ELSE 0 END) AS logouts
       FROM user_activity_logs
       WHERE login_time BETWEEN :from AND :to
       GROUP BY DATE(login_time)
       ORDER BY day ASC`,
      { replacements: { from, to } }
    );

    const [hourlyRows] = await sequelize.query(
      `SELECT
         HOUR(login_time) AS hour,
         COUNT(*) AS sessions
       FROM user_activity_logs
       WHERE login_time BETWEEN :from AND :to
       GROUP BY HOUR(login_time)
       ORDER BY hour ASC`,
      { replacements: { from, to } }
    );

    const [newVsReturningRows] = await sequelize.query(
      `SELECT
         t.day AS day,
         SUM(CASE WHEN t.isNew = 1 THEN 1 ELSE 0 END) AS newUsers,
         SUM(CASE WHEN t.isNew = 0 THEN 1 ELSE 0 END) AS returningUsers
       FROM (
         SELECT
           DATE(l.login_time) AS day,
           l.user_id,
           CASE
             WHEN (SELECT MIN(login_time) FROM user_activity_logs WHERE user_id = l.user_id) = l.login_time THEN 1
             ELSE 0
           END AS isNew
         FROM user_activity_logs l
         WHERE l.login_time BETWEEN :from AND :to
       ) t
       GROUP BY t.day
       ORDER BY t.day ASC`,
      { replacements: { from, to } }
    );

    const today = new Date();
    const todayFrom = new Date(today);
    todayFrom.setHours(0, 0, 0, 0);
    const todayTo = new Date(today);
    todayTo.setHours(23, 59, 59, 999);

    const [todayRows] = await sequelize.query(
      `SELECT
         COUNT(*) AS totalSessionsToday,
         COUNT(*) AS totalLoginsToday,
         SUM(CASE WHEN logout_time IS NOT NULL THEN 1 ELSE 0 END) AS totalLogoutsToday,
         COUNT(DISTINCT user_id) AS activeUsersToday
       FROM user_activity_logs
       WHERE login_time BETWEEN :from AND :to`,
      { replacements: { from: todayFrom, to: todayTo } }
    );

    const todayAgg = Array.isArray(todayRows) && todayRows.length ? todayRows[0] : {};

    const data = {
      cards: {
        totalUsersToday: Number(todayAgg.activeUsersToday || 0),
        totalSessionsToday: Number(todayAgg.totalSessionsToday || 0),
        totalLoginsToday: Number(todayAgg.totalLoginsToday || 0),
        totalLogoutsToday: Number(todayAgg.totalLogoutsToday || 0),
        activeUsersToday: Number(todayAgg.activeUsersToday || 0),
      },
      dailyVisits: (Array.isArray(dailyRows) ? dailyRows : []).map((r) => ({
        date: r.day ? String(r.day) : null,
        sessions: Number(r.sessions || 0),
      })),
      dailyLoginsLogouts: (Array.isArray(dailyLoginRows) ? dailyLoginRows : []).map((r) => ({
        date: r.day ? String(r.day) : null,
        logins: Number(r.logins || 0),
        logouts: Number(r.logouts || 0),
      })),
      hourlyPeak: (Array.isArray(hourlyRows) ? hourlyRows : []).map((r) => ({
        hour: Number(r.hour || 0),
        sessions: Number(r.sessions || 0),
      })),
      newVsReturning: (Array.isArray(newVsReturningRows) ? newVsReturningRows : []).map((r) => ({
        date: r.day ? String(r.day) : null,
        newUsers: Number(r.newUsers || 0),
        returningUsers: Number(r.returningUsers || 0),
      })),
    };

    const payload = {
      range: { view, from: from.toISOString(), to: to.toISOString() },
      data,
    };

    summaryCache.set(cacheKey, { at: Date.now(), range: payload.range, data: payload.data });

    return res.status(200).json({ success: true, range: payload.range, data: payload.data, cached: false });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
