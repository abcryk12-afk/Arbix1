const ADMIN_EMAILS = ['wanum01234@gmail.com'];

exports.requireAdminUser = (req, res, next) => {
  const allow = ADMIN_EMAILS.map((s) => s.trim().toLowerCase()).filter(Boolean);

  const email = (req.user?.email || '').toLowerCase();
  if (!email || !allow.includes(email)) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden',
    });
  }

  next();
};
