const KEY = String(process.env.AUTO_SWEEP_LOG_KEY || '').trim();

exports.requireAutoSweepLogKey = (req, res, next) => {
  const provided = req.headers['x-auto-sweep-key'];
  if (!KEY || !provided || String(provided).trim() !== KEY) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }
  return next();
};
