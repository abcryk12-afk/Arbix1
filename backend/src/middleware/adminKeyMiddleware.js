const ADMIN_KEY = 'Usman@567784';

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
