const request = require('supertest');
const mongoose = require('mongoose');
const createTestApp = require('../testApp');
const jwt = require('jsonwebtoken');

const app = createTestApp();

describe('SQL Injection Protection Tests', () => {
  it('sollte SQL-Injection-Angriffe blockieren', async () => {
    const token = jwt.sign(
      { userId: new mongoose.Types.ObjectId() },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const maliciousQuery = {
      project: "'; DROP TABLE timeentries; --"
    };

    const response = await request(app)
      .get('/api/time-entries')
      .set('Authorization', `Bearer ${token}`)
      .query(maliciousQuery)
      .expect(200);

    // Prüfen, ob die Datenbank noch existiert
    const dbStats = await mongoose.connection.db.stats();
    expect(dbStats.collections).toBeGreaterThan(0);
  });
}); 