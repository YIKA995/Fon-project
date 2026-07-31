const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const assetsRoutes = require('./routes/assets.routes');
const eventsRoutes = require('./routes/events.routes');
const alertsRoutes = require('./routes/alerts.routes');
const incidentsRoutes = require('./routes/incidents.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const auditRoutes = require('./routes/audit.routes');
const notificationsRoutes = require('./routes/notifications.routes');
const threatIntelRoutes = require('./routes/threatIntel.routes');

function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'sentinel-africa-api', time: new Date().toISOString() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/assets', assetsRoutes);
  app.use('/api/events', eventsRoutes);
  app.use('/api/alerts', alertsRoutes);
  app.use('/api/incidents', incidentsRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/audit-logs', auditRoutes);
  app.use('/api/notifications', notificationsRoutes);
  app.use('/api/threat-intel', threatIntelRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
