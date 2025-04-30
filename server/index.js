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
const aiRoutes = require('./routes/ai');
require('dotenv').config();

// Umgebungsvariablen überprüfen
const checkEnvVars = async () => {
  const requiredVars = ['JWT_SECRET', 'MONGODB_URI'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Fehlende Umgebungsvariablen: ${missingVars.join(', ')}`);
  }
  
  logger.info('Alle erforderlichen Umgebungsvariablen sind vorhanden');
};

// Port-Konfiguration
const PORT = process.env.PORT || 5000;

// Swagger-Konfiguration
const swaggerOptions = {
  explorer: true,
  swaggerOptions: {
    urls: [
      {
        url: '/swagger.json',
        name: 'Spec'
      }
    ]
  }
};

// MongoDB-Verbindung herstellen
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, config.mongoOptions);
    logger.info('MongoDB erfolgreich verbunden');
  } catch (err) {
    logger.error('MongoDB Verbindungsfehler:', err);
    process.exit(1);
  }
};

// Async Server-Start
const startServer = async () => {
  try {
    // Warte auf Umgebungsvariablen
    await checkEnvVars();
    
    const app = express();

    // Debug-Logging für CORS-Konfiguration
    logger.debug('CORS-Konfiguration:', {
      origin: process.env.CORS_ORIGIN || 'https://freelancer-app-chi.vercel.app',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']
    });
    
    // CORS-Konfiguration (muss vor allen anderen Middlewares kommen)
    app.use(cors({
      origin: process.env.CORS_ORIGIN || 'https://freelancer-app-chi.vercel.app',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
      exposedHeaders: ['Content-Length', 'X-Requested-With'],
      maxAge: 86400
    }));

    // OPTIONS Preflight Handler
    app.options('*', cors());

    // Basis-Middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Swagger API-Dokumentation
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, swaggerOptions));
    app.get('/swagger.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpecs);
    });

    // Sicherheits-Middleware
    app.use(securityMiddleware);

    // Rate Limiting
    app.use('/api/auth', authLimiter);
    app.use('/api', apiLimiter);

    // Logging
    app.use(logRequest);

    // Monitoring
    app.use(requestMetricsMiddleware);

    // API-Routen
    app.use('/api/auth', authRoutes);
    app.use('/api/time-entries', timeEntriesRoutes);
    app.use('/api/v1/time-entries', timeEntriesV1Routes);
    app.use('/api/stats', statsRoutes);
    app.use('/api/payment', paymentRoutes);
    app.use('/api/ai', aiRoutes);

    // Health Check und Metrics
    app.get('/health', healthCheckMiddleware);
    app.get('/metrics', async (req, res) => {
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    });

    // Error Handler
    app.use(errorHandler);

    // MongoDB-Verbindung
    await connectDB();

    // Server starten
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Server läuft auf Port ${PORT}`);
      logger.info(`📚 API-Dokumentation verfügbar unter http://localhost:${PORT}/api-docs`);
      logger.info(`🔍 Health Check verfügbar unter http://localhost:${PORT}/health`);
      logger.info(`📊 Metriken verfügbar unter http://localhost:${PORT}/metrics`);
    });
  } catch (error) {
    logger.error('Fehler beim Serverstart:', error);
    process.exit(1);
  }
};

// Server starten
startServer();

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