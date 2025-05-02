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
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS Konfiguration
const corsOptions = {
  origin: [
    'https://freelancer-app-chi.vercel.app',
    'https://freelancer-app-1g8o.onrender.com',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Headers',
    'Access-Control-Allow-Methods',
    'Access-Control-Allow-Credentials'
  ],
  exposedHeaders: [
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Headers',
    'Access-Control-Allow-Methods',
    'Access-Control-Allow-Credentials'
  ],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// OPTIONS Handler für Preflight Requests
app.options('*', cors(corsOptions));

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "unsafe-none" }
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
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

export { app }; 