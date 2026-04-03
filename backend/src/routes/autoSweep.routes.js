const express = require('express');
const router = express.Router();

const { ingestAutoSweepLog } = require('../controllers/autoSweepLogsController');
const { requireAutoSweepLogKey } = require('../middleware/autoSweepLogKeyMiddleware');

router.post('/logs', requireAutoSweepLogKey, ingestAutoSweepLog);

module.exports = router;
