exports.requireAdminKey = (req, res, next) => {
  const configuredKey = process.env.ADMIN_API_KEY;
  const providedKey = req.headers['x-admin-key'];

  if (!configuredKey) {
    return res.status(500).json({
      success: false,
      message: 'Admin API key is not configured',
    });
  }

  if (!providedKey || providedKey !== configuredKey) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }

  next();
};
