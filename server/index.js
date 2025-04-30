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

// Verbesserte Umgebungsvariablen-Überprüfung
const checkEnvVars = (retries = 3, delay = 1000) => {
  return new Promise((resolve, reject) => {
    const check = (attempt) => {
      const jwtSecret = process.env.JWT_SECRET;
      const mongoUri = process.env.MONGODB_URI;
      
      logger.info('Umgebungsvariablen-Status:', {
        jwtSecretDefined: !!jwtSecret,
        mongoUriDefined: !!mongoUri,
        environment: process.env.NODE_ENV,
        attempt: attempt
      });

      if (jwtSecret && mongoUri) {
        logger.info('✅ Alle kritischen Umgebungsvariablen sind verfügbar');
        resolve(true);
      } else if (attempt < retries) {
        logger.warn(`⚠️ Warte auf Umgebungsvariablen (Versuch ${attempt}/${retries})...`);
        setTimeout(() => check(attempt + 1), delay);
      } else {
        logger.error('❌ Kritische Umgebungsvariablen nicht verfügbar nach mehreren Versuchen');
        if (process.env.NODE_ENV === 'production') {
          logger.error('Server wird in Produktionsumgebung ohne kritische Umgebungsvariablen gestartet!');
          process.exit(1);
        } else {
          logger.warn('⚠️ Server startet im Entwicklungsmodus ohne alle Umgebungsvariablen');
          resolve(false);
        }
      }
    };
    
    check(1);
  });
};

// Async Server-Start
const startServer = async () => {
  try {
    // Warte auf Umgebungsvariablen
    await checkEnvVars();
    
    const app = express();
    
    // CORS-Konfiguration (muss vor allen anderen Middlewares kommen)
    app.use(cors({
      origin: process.env.CORS_ORIGIN || 'https://freelancer-app-chi.vercel.app',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
      exposedHeaders: ['Content-Length', 'X-Requested-With'],
      maxAge: 86400,
      preflightContinue: false,
      optionsSuccessStatus: 204
    }));

    // Basis-Middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

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
    const PORT = process.env.PORT || 10000;
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Server läuft auf Port ${PORT}`);
      logger.info(`📚 API-Dokumentation verfügbar unter http://localhost:${PORT}/api-docs`);
      logger.info(`🔍 Health Check verfügbar unter http://localhost:${PORT}/health`);
      logger.info(`📊 Metriken verfügbar unter http://localhost:${PORT}/metrics`);
      logger.debug('Server-Status:', {
        nodeVersion: process.version,
        platform: process.platform,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime()
      });
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