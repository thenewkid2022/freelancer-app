const mongoose = require('mongoose');
const config = require('../config/config');

describe('MongoDB Verbindung', () => {
  beforeAll(async () => {
    await mongoose.connect(config.mongoUri, config.mongoOptions);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test('MongoDB Verbindung erfolgreich', () => {
    expect(mongoose.connection.readyState).toBe(1);
  });

  test('Datenbank-Name korrekt', () => {
    expect(mongoose.connection.name).toBe('freelancer-test');
  });
}); 