import mongoose from 'mongoose';
import { logger } from './utils/logger';

const defaultOptions = {
  serverSelectionTimeoutMS: 15000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  minPoolSize: 5,
  retryWrites: true,
  retryReads: true
};

export async function connectDB(): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI ist nicht definiert');
    }
    await mongoose.connect(process.env.MONGODB_URI, {
      ...defaultOptions,
      autoIndex: true
    });
    logger.info('✅ Produktions-Datenbank verbunden');
  } catch (error) {
    logger.error('Fehler beim Verbinden mit der Datenbank:', error);
    throw error;
  }
}

export async function disconnectDB(): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      logger.info('✅ Datenbank-Verbindung geschlossen');
    }
  } catch (error) {
    logger.error('Fehler beim Schließen der Datenbankverbindung:', error);
    throw error;
  }
} 