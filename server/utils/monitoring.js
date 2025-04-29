const prometheus = require('prom-client');
const { logger } = require('./logger');

// Metriken-Register
const register = new prometheus.Registry();

// Counter für HTTP-Anfragen
const httpRequestsTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Gesamtzahl der HTTP-Anfragen',
  labelNames: ['method', 'route', 'status']
});

// Histogram für Antwortzeiten
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Dauer der HTTP-Anfragen in Sekunden',
  labelNames: ['method', 'route'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

// Gauge für aktive Verbindungen
const activeConnections = new prometheus.Gauge({
  name: 'active_connections',
  help: 'Anzahl aktiver Verbindungen'
});

// Gauge für Speichernutzung
const memoryUsage = new prometheus.Gauge({
  name: 'memory_usage_bytes',
  help: 'Speichernutzung in Bytes',
  labelNames: ['type']
});

// Gauge für Datenbank-Latenz
const databaseLatency = new prometheus.Gauge({
  name: 'database_latency_seconds',
  help: 'Datenbank-Latenz in Sekunden'
});

// Counter für Fehler
const errorCounter = new prometheus.Counter({
  name: 'error_total',
  help: 'Gesamtzahl der Fehler',
  labelNames: ['type']
});

// Metriken zum Register hinzufügen
register.registerMetric(httpRequestsTotal);
register.registerMetric(httpRequestDuration);
register.registerMetric(activeConnections);
register.registerMetric(memoryUsage);
register.registerMetric(databaseLatency);
register.registerMetric(errorCounter);

// Middleware für Request-Metriken
const requestMetricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    
    httpRequestsTotal.inc({
      method: req.method,
      route: req.route?.path || req.path,
      status: res.statusCode
    });
    
    httpRequestDuration.observe({
      method: req.method,
      route: req.route?.path || req.path
    }, duration);
  });
  
  next();
};

// Funktionen zur Aktualisierung der Metriken
const updateMemoryMetrics = () => {
  const mem = process.memoryUsage();
  memoryUsage.set({ type: 'heapTotal' }, mem.heapTotal);
  memoryUsage.set({ type: 'heapUsed' }, mem.heapUsed);
  memoryUsage.set({ type: 'rss' }, mem.rss);
  memoryUsage.set({ type: 'external' }, mem.external);
};

const updateDatabaseMetrics = (latency) => {
  databaseLatency.set(latency / 1000);
};

const incrementErrorCount = (type) => {
  errorCounter.inc({ type });
};

const updateConnectionCount = (count) => {
  activeConnections.set(count);
};

// Regelmäßige Aktualisierung der Metriken
setInterval(() => {
  try {
    updateMemoryMetrics();
  } catch (error) {
    logger.error('Fehler beim Aktualisieren der Metriken:', error);
  }
}, 15000);

module.exports = {
  register,
  requestMetricsMiddleware,
  updateMemoryMetrics,
  updateDatabaseMetrics,
  incrementErrorCount,
  updateConnectionCount
}; 