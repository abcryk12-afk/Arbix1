const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');

const healthRoutes = require('./src/routes/health.routes');
const emailRoutes = require('./src/routes/email.routes');
const authRoutes = require('./src/routes/auth.routes');
const adminRoutes = require('./src/routes/admin.routes');
const userRoutes = require('./src/routes/user.routes');
const db = require('./src/config/db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);

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
  await sequelize.sync();
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
