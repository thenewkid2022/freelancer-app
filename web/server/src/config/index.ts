import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

// Lade die richtige .env Datei basierend auf der Umgebung
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// Validierungsschema für Umgebungsvariablen
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('5000'),
  MONGODB_URI: z.string(),
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('24h'),
  CORS_ORIGIN: z.string().default('*'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

// Validiere und exportiere die Konfiguration
const config = envSchema.parse(process.env);

export { config }; 