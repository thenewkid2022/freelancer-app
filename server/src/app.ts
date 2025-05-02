import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
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

// CORS Pre-flight Handler
app.options('*', cors());

// CORS Konfiguration - muss vor allen anderen Middleware kommen
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://freelancer-app-chi.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

// Middleware
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

app.use(morgan('dev'));
app.use(securityMiddleware);

// Routes
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

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on port ${port}`);
  });
}

export { app }; 