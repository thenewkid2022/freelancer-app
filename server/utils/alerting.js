const { logger } = require('./logger');
const nodemailer = require('nodemailer');

// Alert-Konfiguration
const alertConfig = {
  thresholds: {
    memory: {
      startup: {
        warning: 90, // 90% Speichernutzung während Startup
        critical: 95 // 95% Speichernutzung während Startup
      },
      normal: {
        warning: 70, // 70% Speichernutzung
        critical: 85 // 85% Speichernutzung
      }
    },
    database: {
      warning: 1000, // 1 Sekunde Latenz
      critical: 3000 // 3 Sekunden Latenz
    },
    errorRate: {
      warning: 5, // 5% Fehlerrate
      critical: 10 // 10% Fehlerrate
    }
  },
  startupDuration: 3600000, // 1 Stunde Startup-Phase
  email: {
    from: process.env.ALERT_EMAIL_FROM || 'alerts@freelancer-app.com',
    to: process.env.ALERT_EMAIL_TO || 'admin@freelancer-app.com',
    subject: 'Freelancer App Alert'
  }
};

// E-Mail-Transporter nur in Produktion erstellen
const transporter = process.env.NODE_ENV === 'production' 
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })
  : null;

// Alert-Historie
const alertHistory = new Map();

// Startup-Zeit speichern
const startupTime = Date.now();

// Alert senden
const sendAlert = async (type, level, message, details) => {
  // In der Entwicklungsumgebung nur loggen
  if (process.env.NODE_ENV === 'development') {
    logger.warn(`[DEV] Alert: ${type} - ${level}`, {
      type,
      level,
      message,
      details
    });
    return;
  }

  // In Produktion E-Mail senden
  if (process.env.NODE_ENV === 'production') {
    const alertKey = `${type}-${level}`;
    const lastAlert = alertHistory.get(alertKey);
    const now = Date.now();

    // Verhindere Alert-Spam (max. 1 Alert pro Stunde)
    if (lastAlert && (now - lastAlert.timestamp) < 3600000) {
      return;
    }

    // Alert in Historie speichern
    alertHistory.set(alertKey, {
      timestamp: now,
      message,
      details
    });

    logger.warn(`Alert gesendet: ${type} - ${level}`, {
      type,
      level,
      message,
      details
    });
  }
};

// Metriken überwachen
const monitorMetrics = {
  memory: (usage) => {
    const isStartupPhase = (Date.now() - startupTime) < alertConfig.startupDuration;
    const thresholds = isStartupPhase ? alertConfig.thresholds.memory.startup : alertConfig.thresholds.memory.normal;

    if (usage >= thresholds.critical) {
      sendAlert('memory', 'critical', `Kritische Speichernutzung ${isStartupPhase ? '(Startup-Phase)' : ''}`, { usage });
      // Garbage Collection vorschlagen
      if (global.gc) {
        logger.info('Triggere manuelle Garbage Collection');
        global.gc();
      }
    } else if (usage >= thresholds.warning) {
      sendAlert('memory', 'warning', `Hohe Speichernutzung ${isStartupPhase ? '(Startup-Phase)' : ''}`, { usage });
    }
  },

  database: (latency) => {
    if (latency >= alertConfig.thresholds.database.critical) {
      sendAlert('database', 'critical', 'Kritische Datenbank-Latenz', { latency });
    } else if (latency >= alertConfig.thresholds.database.warning) {
      sendAlert('database', 'warning', 'Hohe Datenbank-Latenz', { latency });
    }
  },

  errorRate: (rate) => {
    if (rate >= alertConfig.thresholds.errorRate.critical) {
      sendAlert('errorRate', 'critical', 'Kritische Fehlerrate', { rate });
    } else if (rate >= alertConfig.thresholds.errorRate.warning) {
      sendAlert('errorRate', 'warning', 'Hohe Fehlerrate', { rate });
    }
  }
};

// Alert-Historie abrufen
const getAlertHistory = () => {
  return Array.from(alertHistory.entries()).map(([key, value]) => ({
    key,
    ...value
  }));
};

module.exports = {
  monitorMetrics,
  getAlertHistory
}; 