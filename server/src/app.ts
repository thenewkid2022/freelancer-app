import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { errorHandler } from './middleware/errorHandler';
import { securityMiddleware } from './middleware/security';
import authRoutes from './routes/auth';
import timeEntryRoutes from './routes/timeEntries';
import statsRoutes from './routes/stats';
import healthRoutes from './routes/health';
import { config } from './config';

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Trust Proxy für Render
app.set('trust proxy', 1);

// KORREKTE CORS-KONFIGURATION
const allowedOrigins = [
  'https://freelancer-app-chi.vercel.app',
  'http://localhost:3000'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, origin);
    } else {
      callback(new Error('Nicht erlaubte Origin: ' + origin), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'X-Requested-With'],
  maxAge: 86400
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helmet Konfiguration
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "unsafe-none" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "https://freelancer-app-1g8o.onrender.com", "https://freelancer-app-chi.vercel.app"],
      frameSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"]
    }
  }
}));

// Logging
app.use(morgan('dev'));

// Security Middleware
app.use(securityMiddleware);

// Routen
app.use('/api/auth', authRoutes);
app.use('/api/time-entries', timeEntryRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/health', healthRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error Handler
app.use(errorHandler);

// MongoDB-Verbindung und Serverstart
if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(process.env.MONGODB_URI || '', {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  })
    .then(() => {
      console.log('MongoDB verbunden!');
      app.listen(port, '0.0.0.0', () => {
        console.log(`Server is running on port ${port}`);
      });
    })
    .catch(err => {
      console.error('MongoDB Fehler beim Start:', err);
      process.exit(1);
    });
}

export { app }; 