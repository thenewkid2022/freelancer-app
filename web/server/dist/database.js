"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
exports.disconnectDB = disconnectDB;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = require("./utils/logger");
const defaultOptions = {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    minPoolSize: 5,
    retryWrites: true,
    retryReads: true
};
async function connectDB() {
    try {
        if (mongoose_1.default.connection.readyState !== 0) {
            await mongoose_1.default.disconnect();
        }
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI ist nicht definiert');
        }
        await mongoose_1.default.connect(process.env.MONGODB_URI, {
            ...defaultOptions,
            autoIndex: true
        });
        logger_1.logger.info('✅ Produktions-Datenbank verbunden');
    }
    catch (error) {
        logger_1.logger.error('Fehler beim Verbinden mit der Datenbank:', error);
        throw error;
    }
}
async function disconnectDB() {
    try {
        if (mongoose_1.default.connection.readyState !== 0) {
            await mongoose_1.default.disconnect();
            logger_1.logger.info('✅ Datenbank-Verbindung geschlossen');
        }
    }
    catch (error) {
        logger_1.logger.error('Fehler beim Schließen der Datenbankverbindung:', error);
        throw error;
    }
}
