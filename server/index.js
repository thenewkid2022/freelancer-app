const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const timeEntriesRoutes = require('./routes/Entries');
const timeEntriesV1Routes = require('./routes/v1/timeEntries');
const authRoutes = require('./routes/auth');
const statsRoutes = require('./routes/stats');
const config = require('./config/config');
const { errorHandler } = require('./middleware/errorHandler');
const { securityMiddleware, authLimiter, apiLimiter } = require('./middleware/security');
const { logger, logRequest } = require('./utils/logger');
const { register, requestMetricsMiddleware } = require('./utils/monitoring');
const { healthCheckMiddleware } = require('./utils/healthCheck');
const { monitorMetrics } = require('./utils/alerting');
const paymentRoutes = require('./routes/payment');
require('dotenv').config();

const app = express();

// CORS muss vor anderen Middleware kommen
app.use(cors(config.corsOptions));

// Sicherheits-Middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false
}));
app.use(securityMiddleware);

// Rate Limiting
app.use('/auth', authLimiter);
app.use('/api', apiLimiter);

// JSON Parser
app.use(express.json());

// Monitoring Middleware
app.use(requestMetricsMiddleware);

// Request Logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logRequest(req, res, duration);
  });
  next();
});

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Freelancer API Dokumentation'
}));

// Health Check Endpunkt
app.get('/health', healthCheckMiddleware);

// Test-Route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Metriken-Endpunkt
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// API Versionierung
app.use('/api/v1/time-entries', timeEntriesV1Routes);
app.use('/api/time-entries', timeEntriesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/time-entries/stats', statsRoutes);
app.use('/api/payment', paymentRoutes);

// Error Handler
app.use(errorHandler);

// MongoDB-Verbindung
logger.info('Versuche Verbindung mit MongoDB aufzubauen...');
logger.debug('MongoDB URI:', config.mongoUri ? 'URI vorhanden' : 'URI fehlt');
logger.debug('MongoDB Verbindungsoptionen:', config.mongoOptions);

const connectWithRetry = () => {
  mongoose.connect(config.mongoUri, config.mongoOptions)
    .then(() => {
      logger.info('✅ MongoDB erfolgreich verbunden');
      logger.debug('Verbindungsstatus:', mongoose.connection.readyState);
      logger.debug('Datenbank:', mongoose.connection.name);
      logger.debug('Host:', mongoose.connection.host);
    })
    .catch((err) => {
      logger.error('❌ MongoDB Verbindungsfehler:', {
        error: err.message,
        stack: err.stack,
        code: err.code
      });
      logger.info('Versuche in 5 Sekunden erneut zu verbinden...');
      setTimeout(connectWithRetry, 5000);
    });
};

connectWithRetry();

// Verbindungsereignisse
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB Verbindung verloren. Versuche erneut zu verbinden...');
  setTimeout(connectWithRetry, 5000);
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB Verbindungsfehler:', err);
});

// Regelmäßige Health Checks und Metriken-Überwachung
setInterval(async () => {
  try {
    // Memory-Überwachung
    const memoryUsage = process.memoryUsage();
    const heapUsedPercentage = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    monitorMetrics.memory(heapUsedPercentage);

    // Datenbank-Überwachung
    const start = Date.now();
    await mongoose.connection.db.admin().ping();
    const latency = Date.now() - start;
    monitorMetrics.database(latency);

    // Fehlerrate-Überwachung
    const errorRate = 0; // Hier würde die tatsächliche Fehlerrate berechnet werden
    monitorMetrics.errorRate(errorRate);
  } catch (error) {
    logger.error('Fehler bei der Metriken-Überwachung:', error);
  }
}, 60000); // Alle 60 Sekunden

// Server starten
app.listen(config.port, '0.0.0.0', () => {
  logger.info(`🚀 Server läuft auf http://localhost:${config.port}`);
  logger.info(`📚 API-Dokumentation verfügbar unter http://localhost:${config.port}/api-docs`);
  logger.info(`🔍 Health Check verfügbar unter http://localhost:${config.port}/health`);
  logger.info(`📊 Metriken verfügbar unter http://localhost:${config.port}/metrics`);
  logger.debug('Server-Status:', {
    nodeVersion: process.version,
    platform: process.platform,
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime()
  });
});

// Error Handler für unbehandelte Fehler
process.on('uncaughtException', (error) => {
  logger.error('Unbehandelter Fehler:', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  logger.error('Unbehandelte Promise-Ablehnung:', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});