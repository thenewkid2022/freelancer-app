const mongoose = require('mongoose');
const { logger } = require('./logger');

// Health Check Status
let healthStatus = {
  status: 'healthy',
  timestamp: new Date(),
  checks: {
    database: {
      status: 'unknown',
      latency: 0,
      lastChecked: null
    },
    memory: {
      status: 'unknown',
      usage: 0,
      lastChecked: null
    },
    uptime: {
      status: 'unknown',
      value: 0,
      lastChecked: null
    }
  }
};

// Datenbank-Health Check
const checkDatabase = async () => {
  const start = Date.now();
  try {
    const state = mongoose.connection.readyState;
    const latency = Date.now() - start;
    
    healthStatus.checks.database = {
      status: state === 1 ? 'healthy' : 'unhealthy',
      latency,
      lastChecked: new Date(),
      details: {
        state,
        stateName: ['disconnected', 'connected', 'connecting', 'disconnecting'][state]
      }
    };
  } catch (error) {
    logger.error('Datenbank Health Check fehlgeschlagen:', error);
    healthStatus.checks.database = {
      status: 'unhealthy',
      latency: Date.now() - start,
      lastChecked: new Date(),
      error: error.message
    };
  }
};

// Memory-Health Check
const checkMemory = () => {
  try {
    const memoryUsage = process.memoryUsage();
    const heapUsed = memoryUsage.heapUsed / 1024 / 1024; // MB
    const heapTotal = memoryUsage.heapTotal / 1024 / 1024; // MB
    const heapUsedPercentage = (heapUsed / heapTotal) * 100;

    healthStatus.checks.memory = {
      status: heapUsedPercentage < 80 ? 'healthy' : 'warning',
      usage: heapUsedPercentage,
      lastChecked: new Date(),
      details: {
        heapUsed: Math.round(heapUsed * 100) / 100,
        heapTotal: Math.round(heapTotal * 100) / 100,
        heapUsedPercentage: Math.round(heapUsedPercentage * 100) / 100
      }
    };
  } catch (error) {
    logger.error('Memory Health Check fehlgeschlagen:', error);
    healthStatus.checks.memory = {
      status: 'unhealthy',
      lastChecked: new Date(),
      error: error.message
    };
  }
};

// Uptime-Health Check
const checkUptime = () => {
  try {
    const uptime = process.uptime();
    healthStatus.checks.uptime = {
      status: 'healthy',
      value: uptime,
      lastChecked: new Date(),
      details: {
        formatted: formatUptime(uptime)
      }
    };
  } catch (error) {
    logger.error('Uptime Health Check fehlgeschlagen:', error);
    healthStatus.checks.uptime = {
      status: 'unhealthy',
      lastChecked: new Date(),
      error: error.message
    };
  }
};

// Hilfsfunktion zum Formatieren der Uptime
const formatUptime = (uptime) => {
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
};

// Alle Health Checks ausführen
const runHealthChecks = async () => {
  await checkDatabase();
  checkMemory();
  checkUptime();

  // Gesamtstatus aktualisieren
  const allChecks = Object.values(healthStatus.checks);
  const hasUnhealthy = allChecks.some(check => check.status === 'unhealthy');
  const hasWarning = allChecks.some(check => check.status === 'warning');

  healthStatus.status = hasUnhealthy ? 'unhealthy' : (hasWarning ? 'warning' : 'healthy');
  healthStatus.timestamp = new Date();

  return healthStatus;
};

// Health Check Middleware
const healthCheckMiddleware = async (req, res) => {
  const status = await runHealthChecks();
  const statusCode = status.status === 'unhealthy' ? 503 : 200;
  
  res.status(statusCode).json(status);
};

module.exports = {
  runHealthChecks,
  healthCheckMiddleware
}; 