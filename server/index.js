// Backend server entry point for Express + MySQL
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const workoutRoutes = require('./routes/workout');
const scheduleRoutes = require('./routes/schedule');
const notificationRoutes = require('./routes/notification');
const inventoryRoutes = require('./routes/inventory');
const equipmentRoutes = require('./routes/equipment');
const attendanceRoutes = require('./routes/attendance');
const reportsRoutes    = require('./routes/reports');
const { runMigrations } = require('./migrate');

async function startServer() {
  await runMigrations();

  if (!process.env.JWT_SECRET) {
    console.warn('WARNING: JWT_SECRET is not set. Using fallback secret intended for local development only.');
  }

  const app = express();
  app.use(cors());
  app.use(bodyParser.json({ limit: '25mb' }));
  app.use(bodyParser.urlencoded({ limit: '25mb', extended: true }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, port: process.env.PORT || 3001 });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/workouts', workoutRoutes);
  app.use('/api/schedule', scheduleRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/inventory', inventoryRoutes);
  app.use('/api/equipment', equipmentRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/reports',   reportsRoutes);

  const PORT = process.env.PORT || 3001;
  const HOST = process.env.HOST || '0.0.0.0';
  const server = app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
  });

  server.on('error', (error) => {
    if (error && error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Stop the existing server process or set a different PORT before starting this server.`);
      process.exit(1);
    }

    console.error('Server startup failed:', error);
    process.exit(1);
  });
}

startServer().catch((error) => {
  console.error('Server startup failed:', error);
  process.exit(1);
});
