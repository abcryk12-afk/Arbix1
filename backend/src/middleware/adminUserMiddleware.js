const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

exports.requireAdminUser = (req, res, next) => {
  const email = (req.user?.email || '').toLowerCase();
  if (!email || !ADMIN_EMAILS.includes(email)) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden',
    });
  }

  next();
};
