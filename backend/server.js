const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env'), override: true });
const express = require('express');
const cors = require('cors');

const healthRoutes = require('./src/routes/health.routes');
const emailRoutes = require('./src/routes/email.routes');
const authRoutes = require('./src/routes/auth.routes');
const adminRoutes = require('./src/routes/admin.routes');
const adminLoginRoutes = require('./src/routes/adminLogin.routes');
const userRoutes = require('./src/routes/user.routes');
const publicRoutes = require('./src/routes/public.routes');
const moralisRoutes = require('./src/routes/moralis.routes');
const db = require('./src/config/db');
const { startDailyProfitScheduler } = require('./src/services/dailyProfitService');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({
  verify: (req, res, buf) => {
    try {
      req.rawBody = buf.toString('utf8');
    } catch {}
  },
}));

app.use((err, req, res, next) => {
  const url = String(req.originalUrl || '');
  if (url.startsWith('/api/moralis/webhook') && err && err.type === 'entity.parse.failed') {
    return res.status(200).json({
      success: true,
      ready: true,
      message: 'Moralis webhook endpoint is ready. Set MORALIS_STREAM_SECRET (or MORALIS_STREAMS_SECRET) to enable signature verification and ingestion.',
    });
  }
  return next(err);
});
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminLoginRoutes); // Register login routes first
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/moralis', moralisRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ status: 'error', message: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ status: 'error', message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

const ensureSchema = async () => {
  const { sequelize } = require('./src/models');
  const models = require('./src/models');
  await sequelize.sync();

  try {
    const [colsRaw] = await sequelize.query('SHOW COLUMNS FROM users');
    const cols = Array.isArray(colsRaw) ? colsRaw : [];
    const colSet = new Set(cols.map((c) => String(c.Field || '').toLowerCase()).filter(Boolean));

    if (!colSet.has('theme_preference')) {
      await sequelize.query("ALTER TABLE users ADD COLUMN theme_preference ENUM('light','dark') NULL");
    } else {
      const [rows] = await sequelize.query("SHOW COLUMNS FROM users LIKE 'theme_preference'");
      const row = Array.isArray(rows) && rows.length ? rows[0] : null;
      const rawType = row?.Type ? String(row.Type) : '';
      const existingValues = rawType.startsWith('enum(')
        ? rawType
            .slice(5, -1)
            .split(',')
            .map((s) => s.trim())
            .map((s) => s.replace(/^'/, '').replace(/'$/, ''))
            .filter(Boolean)
        : [];
      const desiredValues = ['light', 'dark'];
      const merged = Array.from(new Set([...existingValues, ...desiredValues]));
      if (merged.length && desiredValues.some((v) => !existingValues.includes(v))) {
        const enumSql = merged.map((v) => `'${v.replace(/'/g, "''")}'`).join(',');
        await sequelize.query(`ALTER TABLE users MODIFY COLUMN theme_preference ENUM(${enumSql}) NULL`);
      }
    }
  } catch (e) {}

  try {
    const [rows] = await sequelize.query("SHOW COLUMNS FROM transactions LIKE 'type'");
    const row = Array.isArray(rows) && rows.length ? rows[0] : null;
    const rawType = row?.Type ? String(row.Type) : '';

    const existingValues = rawType.startsWith('enum(')
      ? rawType
          .slice(5, -1)
          .split(',')
          .map((s) => s.trim())
          .map((s) => s.replace(/^'/, '').replace(/'$/, ''))
          .filter(Boolean)
      : [];

    const desiredValues = [
      'deposit',
      'withdraw',
      'package_purchase',
      'profit',
      'referral_profit',
      'referral_bonus',
      'daily_bonus',
    ];

    const merged = Array.from(new Set([...existingValues, ...desiredValues]));
    if (merged.length && desiredValues.some((v) => !existingValues.includes(v))) {
      const enumSql = merged.map((v) => `'${v.replace(/'/g, "''")}'`).join(',');
      await sequelize.query(`ALTER TABLE transactions MODIFY COLUMN type ENUM(${enumSql}) NOT NULL`);
    }
  } catch (e) {}

  try {
    const [colsRaw] = await sequelize.query('SHOW COLUMNS FROM withdrawal_requests');
    const cols = Array.isArray(colsRaw) ? colsRaw : [];
    const colSet = new Set(cols.map((c) => String(c.Field || '').toLowerCase()).filter(Boolean));

    if (!colSet.has('network')) {
      await sequelize.query("ALTER TABLE withdrawal_requests ADD COLUMN network VARCHAR(50) NOT NULL DEFAULT 'BSC'");
    }
    if (!colSet.has('token')) {
      await sequelize.query("ALTER TABLE withdrawal_requests ADD COLUMN token VARCHAR(50) NOT NULL DEFAULT 'USDT'");
    }
    if (!colSet.has('auto_withdraw_enabled')) {
      await sequelize.query('ALTER TABLE withdrawal_requests ADD COLUMN auto_withdraw_enabled TINYINT(1) NULL');
    }

    const [statusRows] = await sequelize.query("SHOW COLUMNS FROM withdrawal_requests LIKE 'status'");
    const statusRow = Array.isArray(statusRows) && statusRows.length ? statusRows[0] : null;
    const rawType = statusRow?.Type ? String(statusRow.Type) : '';

    const existingValues = rawType.startsWith('enum(')
      ? rawType
          .slice(5, -1)
          .split(',')
          .map((s) => s.trim())
          .map((s) => s.replace(/^'/, '').replace(/'$/, ''))
          .filter(Boolean)
      : [];

    const desiredValues = ['pending', 'processing', 'completed', 'failed', 'approved', 'rejected'];
    const merged = Array.from(new Set([...existingValues, ...desiredValues]));
    if (merged.length && desiredValues.some((v) => !existingValues.includes(v))) {
      const enumSql = merged.map((v) => `'${v.replace(/'/g, "''")}'`).join(',');
      await sequelize.query(`ALTER TABLE withdrawal_requests MODIFY COLUMN status ENUM(${enumSql}) NOT NULL DEFAULT 'pending'`);
    }
  } catch (e) {}

  startDailyProfitScheduler({
    sequelize: models.sequelize,
    User: models.User,
    Wallet: models.Wallet,
    Transaction: models.Transaction,
    UserPackage: models.UserPackage,
  });
};

ensureSchema()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database schema:', err);
    process.exit(1);
  });

module.exports = app;
