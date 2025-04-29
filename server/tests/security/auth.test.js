const request = require('supertest');
const mongoose = require('mongoose');
const createTestApp = require('../testApp');
const config = require('../../config/config');
const jwt = require('jsonwebtoken');

const app = createTestApp();

describe('Security Tests', () => {
  describe('JWT Authentifizierung', () => {
    it('sollte einen gültigen JWT akzeptieren', async () => {
      const token = jwt.sign(
        { userId: new mongoose.Types.ObjectId() },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/time-entries')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.status).toBe(200);
    });

    it('sollte einen ungültigen JWT ablehnen', async () => {
      const response = await request(app)
        .get('/api/time-entries')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toBe('Authentifizierungsfehler');
    });

    it('sollte einen abgelaufenen JWT ablehnen', async () => {
      const token = jwt.sign(
        { userId: new mongoose.Types.ObjectId() },
        process.env.JWT_SECRET,
        { expiresIn: '0s' }
      );

      const response = await request(app)
        .get('/api/time-entries')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      expect(response.body.error).toBe('Authentifizierungsfehler');
    });
  });

  describe('Rate Limiting', () => {
    it('sollte zu viele Anfragen blockieren', async () => {
      const requests = Array.from({ length: 6 }, () =>
        request(app).get('/test')
      );

      const responses = await Promise.all(requests);
      const blockedRequests = responses.filter(res => res.status === 429);

      expect(blockedRequests.length).toBeGreaterThan(0);
      expect(blockedRequests[0].body.error).toBe('Zu viele Anfragen');
    });

    it('sollte zu viele Login-Versuche blockieren', async () => {
      const requests = Array.from({ length: 6 }, () =>
        request(app)
          .post('/auth/login')
          .send({
            email: 'test@example.com',
            password: 'wrongpassword'
          })
      );

      const responses = await Promise.all(requests);
      const blockedRequests = responses.filter(res => res.status === 429);

      expect(blockedRequests.length).toBeGreaterThan(0);
      expect(blockedRequests[0].body.error).toBe('Zu viele Anfragen');
    });
  });

  describe('CORS', () => {
    it('sollte CORS-Header korrekt setzen', async () => {
      const response = await request(app)
        .get('/test')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('sollte nicht erlaubte Origins blockieren', async () => {
      const response = await request(app)
        .get('/test')
        .set('Origin', 'http://malicious-site.com')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).not.toBe('http://malicious-site.com');
    });
  });

  describe('XSS Protection', () => {
    it('sollte XSS-Angriffe in Eingabedaten blockieren', async () => {
      const token = jwt.sign(
        { userId: new mongoose.Types.ObjectId() },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const maliciousInput = {
        project: '<script>alert("xss")</script>',
        description: 'Test Description'
      };

      const response = await request(app)
        .post('/api/time-entries')
        .set('Authorization', `Bearer ${token}`)
        .send(maliciousInput)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('SQL Injection Protection', () => {
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
}); 