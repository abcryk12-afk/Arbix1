const db = require('../config/db');

const checkHealth = async (req, res) => {
  try {
    await db.query('SELECT 1');

    res.status(200).json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health check failed:', error.message || error);
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      error: error.message || 'Database connection failed',
    });
  }
};

module.exports = {
  checkHealth,
};
