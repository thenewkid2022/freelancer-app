"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const errors_1 = require("../utils/errors");
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    // Mongoose Validierungsfehler
    if (err instanceof mongoose_1.default.Error.ValidationError) {
        return res.status(400).json({
            message: err.message,
            code: 'VALIDATION_ERROR'
        });
    }
    // Eigene Fehlertypen
    if (err instanceof errors_1.ValidationError) {
        return res.status(400).json({
            message: err.message,
            code: 'VALIDATION_ERROR'
        });
    }
    if (err instanceof errors_1.AuthError) {
        return res.status(401).json({
            message: err.message,
            code: 'AUTH_ERROR'
        });
    }
    if (err instanceof errors_1.NotFoundError) {
        return res.status(404).json({
            message: err.message,
            code: 'NOT_FOUND'
        });
    }
    if (err instanceof errors_1.ForbiddenError) {
        return res.status(403).json({
            message: err.message,
            code: 'FORBIDDEN'
        });
    }
    if (err instanceof errors_1.BadRequestError) {
        return res.status(400).json({
            message: err.message,
            code: 'BAD_REQUEST'
        });
    }
    // Unbekannte Fehler
    return res.status(500).json({
        message: 'Ein interner Serverfehler ist aufgetreten',
        code: 'INTERNAL_SERVER_ERROR'
    });
};
exports.errorHandler = errorHandler;
