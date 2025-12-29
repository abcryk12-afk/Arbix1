const { listAdminLogs, getAutoWithdrawWorkerStatus } = require('../services/adminLogService');

exports.listLogs = async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit || 200), 1), 2000);

    const [logs, worker] = await Promise.all([
      listAdminLogs(limit),
      getAutoWithdrawWorkerStatus(),
    ]);

    return res.status(200).json({
      success: true,
      logs,
      autoWithdrawWorker: worker,
    });
  } catch (error) {
    console.error('Admin logs list error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load admin logs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
