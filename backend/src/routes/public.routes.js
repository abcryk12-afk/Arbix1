const express = require('express');
const router = express.Router();

const { getPublicBranding } = require('../controllers/brandingController');
const { getPublicSiteTheme } = require('../controllers/siteThemeController');
const { getPublicInvestmentPackages } = require('../controllers/userController');
const { getPublicAuroraTheme } = require('../controllers/auroraThemeController');
const { getPublicSeoSettings, getPublicRouteSeo } = require('../controllers/seoSettingsController');
const { getPublicSiteAssets } = require('../controllers/siteAssetsController');
const { getPublicCmsPageBySlug, listPublicCmsPages } = require('../controllers/cmsPagesController');
const { getPublicAdminLoginTheme } = require('../controllers/adminLoginThemeController');

router.get('/branding', getPublicBranding);
router.get('/site-theme', getPublicSiteTheme);
router.get('/aurora-theme', getPublicAuroraTheme);
router.get('/admin-login-theme', getPublicAdminLoginTheme);
router.get('/investment-packages', getPublicInvestmentPackages);
router.get('/site-assets', getPublicSiteAssets);
router.get('/seo-settings', getPublicSeoSettings);
router.get('/route-seo', getPublicRouteSeo);
router.get('/cms-pages', listPublicCmsPages);
router.get('/cms-pages/:slug', getPublicCmsPageBySlug);

module.exports = router;
