import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { logger } from '../utils/logger';
import { RequestHandler } from 'express';

// Rate Limiter für Auth-Endpunkte
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 5, // 5 Versuche
  message: {
    status: 'error',
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Zu viele Anmeldeversuche. Bitte versuchen Sie es später erneut.'
  },
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit überschritten', {
      ip: req.ip,
      path: req.path
    });
    res.status(429).json({
      status: 'error',
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.'
    });
  }
});

// Allgemeiner API Rate Limiter
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 Minute
  max: 100, // 100 Anfragen pro Minute
  message: {
    status: 'error',
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.'
  }
});

// Security Middleware
export const securityMiddleware: RequestHandler[] = [
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https://api.stripe.com']
      }
    }
  }),
  (req: Request, res: Response, next: NextFunction) => {
    // XSS Protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Clickjacking Protection
    res.setHeader('X-Frame-Options', 'DENY');
    
    // MIME Type Sniffing Protection
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    next();
  }
]; 