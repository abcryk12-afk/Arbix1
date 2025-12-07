require('dotenv').config();
const express = require('express');
const cors = require('cors');

// const healthRoutes = require('./src/routes/health.routes');
// const emailRoutes = require('./src/routes/email.routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
// app.use('/api/health', healthRoutes);
// app.use('/api/email', emailRoutes);

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
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
