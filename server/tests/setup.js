const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const config = require('../config/config');
const { logger } = require('../utils/logger');

// Test-Setup
process.env.NODE_ENV = 'test';
process.env.PORT = 5001;
process.env.JWT_SECRET = 'test-secret';
process.env.SMTP_HOST = 'smtp.test.com';
process.env.SMTP_PORT = '587';
process.env.SMTP_SECURE = 'false';
process.env.SMTP_USER = 'test@test.com';
process.env.SMTP_PASS = 'testpassword';
process.env.ALERT_EMAIL_FROM = 'alerts@test.com';
process.env.ALERT_EMAIL_TO = 'admin@test.com';
process.env.MONGO_URI = 'mongodb://localhost:27017/test';

// Globale Test-Timeout
jest.setTimeout(30000);

// Unbehandelte Promise-Ablehnungen abfangen
process.on('unhandledRejection', (error) => {
  console.error('Unbehandelte Promise-Ablehnung:', error);
  process.exit(1);
});

// Unbehandelte Fehler abfangen
process.on('uncaughtException', (error) => {
  console.error('Unbehandelter Fehler:', error);
  process.exit(1);
});

let mongod;

// MongoDB-Verbindung für Tests
beforeAll(async () => {
  try {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    logger.info('✅ Test-Datenbank verbunden');
  } catch (error) {
    logger.error('❌ Test-Datenbank Verbindungsfehler:', error);
    throw error;
  }
});

// MongoDB-Verbindung schließen nach Tests
afterAll(async () => {
  await mongoose.connection.close();
  await mongod.stop();
  logger.info('✅ Test-Datenbank Verbindung geschlossen');
});

// Cleanup nach jedem Test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
}); 