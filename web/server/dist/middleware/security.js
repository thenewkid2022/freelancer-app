"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityMiddleware = exports.apiLimiter = exports.authLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const helmet_1 = __importDefault(require("helmet"));
const logger_1 = require("../utils/logger");
// Rate Limiter für Auth-Endpunkte
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 Minuten
    max: 5, // 5 Versuche
    message: {
        status: 'error',
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Zu viele Anmeldeversuche. Bitte versuchen Sie es später erneut.'
    },
    handler: (req, res) => {
        logger_1.logger.warn('Rate limit überschritten', {
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
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 Minute
    max: 100, // 100 Anfragen pro Minute
    message: {
        status: 'error',
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.'
    }
});
// Security Middleware
exports.securityMiddleware = [
    (0, helmet_1.default)({
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
    (req, res, next) => {
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
