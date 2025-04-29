const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const timeEntriesRoutes = require('../routes/Entries');
const timeEntriesV1Routes = require('../routes/v1/timeEntries');
const authRoutes = require('../routes/auth');
const config = require('../config/config');
const errorHandler = require('../middleware/errorHandler');
const { generalLimiter, authLimiter, apiLimiter } = require('../middleware/rateLimiter');
const { requestMetricsMiddleware } = require('../utils/monitoring');
const { healthCheckMiddleware } = require('../utils/healthCheck');

const createTestApp = () => {
  const app = express();

  // Sicherheits-Middleware
  app.use(helmet());

  // Rate Limiting
  app.use(generalLimiter);
  app.use('/auth', authLimiter);
  app.use('/api', apiLimiter);

  // CORS-Konfiguration
  app.use(cors(config.corsOptions));

  // JSON Parser
  app.use(express.json());

  // Monitoring Middleware
  app.use(requestMetricsMiddleware);

  // Health Check Endpunkt
  app.get('/health', healthCheckMiddleware);

  // Test-Route
  app.get('/test', (req, res) => {
    res.json({ message: 'Server is running!' });
  });

  // API Versionierung
  app.use('/api/v1/time-entries', timeEntriesV1Routes);
  app.use('/api/time-entries', timeEntriesRoutes);
  app.use('/auth', authRoutes);

  // Error Handler
  app.use(errorHandler);

  return app;
};

module.exports = createTestApp; 