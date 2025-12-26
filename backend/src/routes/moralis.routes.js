const express = require('express');
const router = express.Router();

const { moralisWebhook } = require('../controllers/moralisController');

router.get('/webhook', (req, res) => {
  return res.status(200).json({ success: true, ready: true });
});

router.post('/webhook', moralisWebhook);

module.exports = router;
