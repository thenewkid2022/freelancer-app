"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const generateToken = (user) => {
    const payload = {
        userId: user._id,
        role: user.role
    };
    const options = {
        expiresIn: config_1.config.JWT_EXPIRES_IN
    };
    return jsonwebtoken_1.default.sign(payload, config_1.config.JWT_SECRET, options);
};
exports.generateToken = generateToken;
const verifyToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, config_1.config.JWT_SECRET);
    }
    catch (error) {
        throw new Error('Ungültiger Token');
    }
};
exports.verifyToken = verifyToken;
