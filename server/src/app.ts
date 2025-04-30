import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { errorHandler } from './middleware/errorHandler';
import { securityMiddleware } from './middleware/security';
import { apiLimiter } from './middleware/rateLimit';
import authRoutes from './routes/auth';
import timeEntriesRouter from './routes/timeEntries';
import paymentsRouter from './routes/payments';
import statsRouter from './routes/stats';
import healthRoutes from './routes/health';
import rateLimit from 'express-rate-limit';
import { auth } from './middleware/auth';

const app = express();

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 100, // Limit jede IP auf 100 Requests pro Fenster
  message: 'Zu viele Anfragen von dieser IP, bitte versuchen Sie es später erneut'
});

// CORS-Konfiguration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'https://freelancer-app-chi.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true,
  maxAge: 86400 // 24 Stunden
};

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.use(helmet());
app.use(morgan('dev'));
app.use(securityMiddleware);
app.use(limiter);

// API-Dokumentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/time-entries', auth, timeEntriesRouter);
app.use('/api/payments', auth, paymentsRouter);
app.use('/api/stats', auth, statsRouter);
app.use('/api/health', healthRoutes);

// Error Handler
app.use(errorHandler);

export default app; 