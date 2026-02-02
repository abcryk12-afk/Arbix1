const express = require('express');
const router = express.Router();

const { getPublicBranding } = require('../controllers/brandingController');
const { getPublicSiteTheme } = require('../controllers/siteThemeController');
const { getPublicInvestmentPackages } = require('../controllers/userController');
const { getPublicAuroraTheme } = require('../controllers/auroraThemeController');

router.get('/branding', getPublicBranding);
router.get('/site-theme', getPublicSiteTheme);
router.get('/aurora-theme', getPublicAuroraTheme);
router.get('/investment-packages', getPublicInvestmentPackages);

module.exports = router;
