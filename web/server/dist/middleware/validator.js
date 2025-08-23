"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePayment = exports.validateAuth = exports.validateUser = exports.validateRequest = void 0;
const errors_1 = require("../utils/errors");
const zod_1 = require("zod");
const validateRequest = (schema) => {
    return async (req, res, next) => {
        try {
            const data = {
                body: req.body,
                query: req.query,
                params: req.params,
            };
            await schema.parseAsync(data);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                const errors = error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));
                next(new errors_1.ValidationError('Validierungsfehler', 400, errors));
            }
            else {
                next(error);
            }
        }
    };
};
exports.validateRequest = validateRequest;
const validateUser = (req, res, next) => {
    const { email, password, name } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email und Passwort sind erforderlich' });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: 'Ungültige Email-Adresse' });
    }
    if (password && password.length < 6) {
        return res.status(400).json({ message: 'Passwort muss mindestens 6 Zeichen lang sein' });
    }
    if (name && name.length < 2) {
        return res.status(400).json({ message: 'Name muss mindestens 2 Zeichen lang sein' });
    }
    next();
};
exports.validateUser = validateUser;
const validateAuth = (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email und Passwort sind erforderlich' });
    }
    next();
};
exports.validateAuth = validateAuth;
const validatePayment = (req, res, next) => {
    const { amount, currency, paymentMethod } = req.body;
    if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Ungültiger Betrag' });
    }
    if (!currency || !['EUR', 'USD'].includes(currency)) {
        return res.status(400).json({ message: 'Ungültige Währung' });
    }
    if (!paymentMethod || !['stripe', 'bank_transfer', 'paypal'].includes(paymentMethod)) {
        return res.status(400).json({ message: 'Ungültige Zahlungsmethode' });
    }
    next();
};
exports.validatePayment = validatePayment;
