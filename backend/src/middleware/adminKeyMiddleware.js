const ADMIN_KEY = process.env.ADMIN_API_KEY || 'CHANGE_ME_STRONG_KEY';

exports.requireAdminKey = (req, res, next) => {
  const providedKey = req.headers['x-admin-key'];

  if (!providedKey || providedKey !== ADMIN_KEY) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }

  next();
};
