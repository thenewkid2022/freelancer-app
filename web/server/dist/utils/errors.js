"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BadRequestError = exports.ConflictError = exports.ForbiddenError = exports.NotFoundError = exports.ValidationError = exports.AuthError = exports.AppError = void 0;
class AppError extends Error {
    constructor(message, statusCode = 500, code) {
        super(message);
        this.message = message;
        this.statusCode = statusCode;
        this.code = code;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class AuthError extends AppError {
    constructor(message, statusCode = 401) {
        super(message, statusCode, 'AUTH_ERROR');
    }
}
exports.AuthError = AuthError;
class ValidationError extends AppError {
    constructor(message, statusCode = 400, errors = []) {
        super(message, statusCode, 'VALIDATION_ERROR');
        this.errors = errors;
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends AppError {
    constructor(message) {
        super(message, 404, 'NOT_FOUND');
    }
}
exports.NotFoundError = NotFoundError;
class ForbiddenError extends AppError {
    constructor(message) {
        super(message, 403, 'FORBIDDEN');
    }
}
exports.ForbiddenError = ForbiddenError;
class ConflictError extends AppError {
    constructor(message) {
        super(message, 409, 'CONFLICT');
    }
}
exports.ConflictError = ConflictError;
class BadRequestError extends AppError {
    constructor(message) {
        super(message, 400, 'BAD_REQUEST');
    }
}
exports.BadRequestError = BadRequestError;
