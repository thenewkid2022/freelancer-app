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

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(securityMiddleware);
app.use(apiLimiter);

// API-Dokumentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/time-entries', timeEntriesRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/health', healthRoutes);

// Error Handler
app.use(errorHandler);

export default app; 