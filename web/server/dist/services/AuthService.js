"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const User_1 = __importDefault(require("../models/User"));
const errors_1 = require("../utils/errors");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
class AuthService {
    constructor() { }
    static getInstance() {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }
    async register(data) {
        try {
            const existingUser = await User_1.default.findOne({ email: data.email });
            if (existingUser) {
                throw new errors_1.AuthError('E-Mail-Adresse wird bereits verwendet');
            }
            const user = await User_1.default.create(data);
            const token = this.generateToken(user);
            return {
                user: this.sanitizeUser(user),
                token
            };
        }
        catch (error) {
            if (error instanceof errors_1.AuthError)
                throw error;
            throw new errors_1.AuthError('Registrierung fehlgeschlagen');
        }
    }
    async login(credentials) {
        try {
            const user = await User_1.default.findOne({ email: credentials.email });
            if (!user) {
                throw new errors_1.AuthError('Ungültige Anmeldedaten', 401);
            }
            const isPasswordValid = await user.comparePassword(credentials.password);
            if (!isPasswordValid) {
                throw new errors_1.AuthError('Ungültige Anmeldedaten', 401);
            }
            if (!user.isActive) {
                throw new errors_1.AuthError('Konto ist deaktiviert', 403);
            }
            user.lastLogin = new Date();
            await user.save();
            const token = this.generateToken(user);
            return {
                user: this.sanitizeUser(user),
                token
            };
        }
        catch (error) {
            if (error instanceof errors_1.AuthError)
                throw error;
            throw new errors_1.AuthError('Anmeldung fehlgeschlagen');
        }
    }
    generateToken(user) {
        const payload = { userId: user._id, role: user.role };
        const options = { expiresIn: config_1.config.JWT_EXPIRES_IN };
        return jsonwebtoken_1.default.sign(payload, config_1.config.JWT_SECRET, options);
    }
    async validateToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, config_1.config.JWT_SECRET);
            const user = await User_1.default.findById(decoded.userId);
            if (!user || !user.isActive) {
                throw new errors_1.AuthError('Ungültiger Token', 401);
            }
            return user;
        }
        catch (error) {
            throw new errors_1.AuthError('Ungültiger Token', 401);
        }
    }
    sanitizeUser(user) {
        const sanitized = user.toObject();
        delete sanitized.password;
        return sanitized;
    }
}
exports.AuthService = AuthService;
