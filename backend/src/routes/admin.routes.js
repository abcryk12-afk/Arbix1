const express = require('express');
const router = express.Router();

const { requireAdminKey } = require('../middleware/adminKeyMiddleware');
const { protect } = require('../middleware/authMiddleware');
const { requireAdminUser } = require('../middleware/adminUserMiddleware');
const { checkAccess, createUser, listUsers, listWallets, deposit, withdraw } = require('../controllers/adminController');

router.get('/check', protect, requireAdminUser, requireAdminKey, checkAccess);
router.get('/users', protect, requireAdminUser, requireAdminKey, listUsers);
router.get('/wallets', protect, requireAdminUser, requireAdminKey, listWallets);
router.post('/users', protect, requireAdminUser, requireAdminKey, createUser);
router.post('/deposit', protect, requireAdminUser, requireAdminKey, deposit);
router.post('/withdraw', protect, requireAdminUser, requireAdminKey, withdraw);

module.exports = router;
