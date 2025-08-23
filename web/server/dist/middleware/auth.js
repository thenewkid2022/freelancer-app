"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.auth = void 0;
const AuthService_1 = require("../services/AuthService");
const errors_1 = require("../utils/errors");
const auth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            throw new errors_1.AuthError('Kein Authentifizierungstoken vorhanden');
        }
        const token = authHeader.replace('Bearer ', '');
        const authService = AuthService_1.AuthService.getInstance();
        const user = await authService.validateToken(token);
        req.user = user;
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.auth = auth;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new errors_1.AuthError('Nicht authentifiziert'));
        }
        if (!roles.includes(req.user.role)) {
            return next(new errors_1.ForbiddenError('Keine Berechtigung für diese Aktion'));
        }
        next();
    };
};
exports.requireRole = requireRole;
