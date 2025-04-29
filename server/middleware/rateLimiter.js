const rateLimit = require('express-rate-limit');
const winston = require('winston');

// Logger für Rate Limiting
const logger = winston.createLogger({
  level: 'warn',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'rate-limit.log' })
  ]
});

// Rate Limiter Konfiguration basierend auf Umgebung
const getRateLimitConfig = (windowMs, max, message) => {
  // In der Testumgebung niedrigere Limits setzen
  if (process.env.NODE_ENV === 'test') {
    return {
      windowMs: 1000, // 1 Sekunde
      max: 5, // Niedriges Limit für Tests
      message: {
        error: 'Zu viele Anfragen',
        message: 'Bitte versuchen Sie es später erneut'
      }
    };
  }

  return {
    windowMs,
    max,
    message,
    handler: (req, res, next, options) => {
      logger.warn({
        message: 'Rate Limit überschritten',
        ip: req.ip,
        path: req.path,
        method: req.method
      });
      res.status(429).json(options.message);
    }
  };
};

// Allgemeiner Rate Limiter
const generalLimiter = rateLimit(getRateLimitConfig(
  15 * 60 * 1000, // 15 Minuten
  100, // Maximal 100 Requests pro Window
  {
    error: 'Zu viele Anfragen',
    message: 'Bitte versuchen Sie es später erneut'
  }
));

// Strikterer Limiter für Auth-Endpunkte
const authLimiter = rateLimit(getRateLimitConfig(
  60 * 60 * 1000, // 1 Stunde
  5, // Maximal 5 Login-Versuche pro Stunde
  {
    error: 'Zu viele Login-Versuche',
    message: 'Bitte versuchen Sie es in einer Stunde erneut'
  }
));

// API-spezifischer Limiter
const apiLimiter = rateLimit(getRateLimitConfig(
  60 * 1000, // 1 Minute
  30, // Maximal 30 Requests pro Minute
  {
    error: 'API Rate Limit überschritten',
    message: 'Bitte reduzieren Sie Ihre Anfragefrequenz'
  }
));

module.exports = {
  generalLimiter,
  authLimiter,
  apiLimiter
}; 