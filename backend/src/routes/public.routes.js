const express = require('express');
const router = express.Router();

const { getPublicBranding } = require('../controllers/brandingController');

router.get('/branding', getPublicBranding);

module.exports = router;
