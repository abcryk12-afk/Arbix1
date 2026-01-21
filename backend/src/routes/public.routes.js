const express = require('express');
const router = express.Router();

const { getPublicBranding } = require('../controllers/brandingController');
const { getPublicSiteTheme } = require('../controllers/siteThemeController');
const { getPublicInvestmentPackages } = require('../controllers/userController');

router.get('/branding', getPublicBranding);
router.get('/site-theme', getPublicSiteTheme);
router.get('/investment-packages', getPublicInvestmentPackages);

module.exports = router;
