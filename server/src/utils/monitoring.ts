import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';
import { logger } from './logger';

// Prometheus Metriken
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

// Custom Metriken
export const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Dauer der HTTP-Anfragen in Sekunden',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Gesamtzahl der HTTP-Anfragen',
  labelNames: ['method', 'route', 'status_code']
});

export const activeUsers = new client.Gauge({
  name: 'active_users',
  help: 'Anzahl der aktiven Benutzer'
});

// Request Metrics Middleware
export const requestMetricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const route = req.route?.path || req.path;
    
    httpRequestDurationMicroseconds
      .labels(req.method, route, res.statusCode.toString())
      .observe(duration / 1000);

    httpRequestsTotal
      .labels(req.method, route, res.statusCode.toString())
      .inc();
  });

  next();
};

// Metrics Endpoint Handler
export const metricsHandler = async (_req: Request, res: Response) => {
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (error) {
    logger.error('Fehler beim Abrufen der Metriken:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
}; 