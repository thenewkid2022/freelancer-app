const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const config = require('../config/config');

// Basis-Sicherheitsmiddleware
const securityMiddleware = [
  // Helmet für HTTP-Header-Sicherheit
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: "same-site" },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: "deny" },
    hidePoweredBy: true,
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true
  }),

  // CORS-Konfiguration
  cors(config.corsOptions),

  // Body Parser mit Größenbeschränkung
  express.json({ limit: '10kb' }),
  express.urlencoded({ extended: true, limit: '10kb' }),

  // Rate Limiting
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 Minuten
    max: 100, // Maximal 100 Requests pro Window
    message: {
      status: 'error',
      message: 'Zu viele Anfragen, bitte versuchen Sie es später erneut'
    }
  })
];

// Spezifische Rate Limiter
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 Stunde
  max: 5, // Maximal 5 Login-Versuche pro Stunde
  message: {
    status: 'error',
    message: 'Zu viele Login-Versuche, bitte versuchen Sie es in einer Stunde erneut'
  }
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 Minute
  max: 30, // Maximal 30 Requests pro Minute
  message: {
    status: 'error',
    message: 'API Rate Limit überschritten, bitte reduzieren Sie Ihre Anfragefrequenz'
  }
});

module.exports = {
  securityMiddleware,
  authLimiter,
  apiLimiter
}; 