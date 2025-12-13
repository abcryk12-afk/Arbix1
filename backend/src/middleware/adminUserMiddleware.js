exports.requireAdminUser = (req, res, next) => {
  const allow = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (allow.length === 0) {
    return res.status(500).json({
      success: false,
      message: 'Admin emails are not configured',
    });
  }

  const email = (req.user?.email || '').toLowerCase();
  if (!email || !allow.includes(email)) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden',
    });
  }

  next();
};
