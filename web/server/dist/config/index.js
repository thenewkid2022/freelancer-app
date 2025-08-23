"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
const path_1 = __importDefault(require("path"));
// Lade die richtige .env Datei basierend auf der Umgebung
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), envFile) });
// Validierungsschema für Umgebungsvariablen
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'test', 'production']).default('development'),
    PORT: zod_1.z.string().default('5000'),
    MONGODB_URI: zod_1.z.string(),
    JWT_SECRET: zod_1.z.string(),
    JWT_EXPIRES_IN: zod_1.z.string().default('24h'),
    CORS_ORIGIN: zod_1.z.string().default('*'),
    LOG_LEVEL: zod_1.z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});
// Validiere und exportiere die Konfiguration
const config = envSchema.parse(process.env);
exports.config = config;
