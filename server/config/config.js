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
    wtimeoutMS: 2500,
    useNewUrlParser: true,
    useUnifiedTopology: true
  },

  // JWT Konfiguration
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',

  // CORS Konfiguration
  corsOptions: {
    origin: function(origin, callback) {
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'https://freelancer-app-chi.vercel.app',
        process.env.CLIENT_URL,
        process.env.ADMIN_URL
      ].filter(Boolean);
      
      // Erlaube Requests ohne Origin (z.B. mobile Apps oder Postman)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`CORS-Blockierung für Origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining'],
    credentials: true,
    maxAge: 86400,
    optionsSuccessStatus: 200,
    preflightContinue: false
  },

  // Logging
  logLevel: process.env.LOG_LEVEL || 'debug'
}; 