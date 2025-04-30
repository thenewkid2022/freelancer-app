// Konfigurations-Template für die Anwendung
// Kopiere diese Datei zu config.js und fülle die Werte aus

module.exports = {
  // Server Konfiguration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // MongoDB Konfiguration
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/freelancer-app',
  mongoOptions: {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    minPoolSize: 5,
    retryWrites: true,
    w: 'majority',
    wtimeoutMS: 2500
  },

  // JWT Konfiguration
  jwtSecret: process.env.JWT_SECRET || (process.env.NODE_ENV === 'development' ? 'development_secret' : null),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',

  // CORS Konfiguration
  corsOptions: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining'],
    credentials: true,
    maxAge: 86400,
    optionsSuccessStatus: 204,
    preflightContinue: false
  },

  // Logging
  logLevel: process.env.LOG_LEVEL || 'debug'
}; 