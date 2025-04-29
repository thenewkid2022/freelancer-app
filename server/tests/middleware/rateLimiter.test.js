const request = require('supertest');
const createTestApp = require('../testApp');

const app = createTestApp();

describe('Rate Limiter Middleware', () => {
  describe('Allgemeiner Rate Limiter', () => {
    it('sollte normale Anfragen erlauben', async () => {
      const response = await request(app)
        .get('/test')
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });

    it('sollte zu viele Anfragen blockieren', async () => {
      // Simuliere viele Anfragen
      const requests = Array(101).fill().map(() => 
        request(app).get('/test')
      );

      const responses = await Promise.all(requests);
      const blockedRequests = responses.filter(res => res.status === 429);

      expect(blockedRequests.length).toBeGreaterThan(0);
      expect(blockedRequests[0].body).toHaveProperty('error');
    });
  });

  describe('Auth Rate Limiter', () => {
    it('sollte normale Login-Versuche erlauben', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(401); // Erwarteter Fehler wegen ungültiger Anmeldedaten

      expect(response.body).toHaveProperty('error');
    });

    it('sollte zu viele Login-Versuche blockieren', async () => {
      // Simuliere viele Login-Versuche
      const requests = Array(6).fill().map(() => 
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
      expect(blockedRequests[0].body).toHaveProperty('error');
    });
  });

  describe('API Rate Limiter', () => {
    it('sollte normale API-Anfragen erlauben', async () => {
      const response = await request(app)
        .get('/api/time-entries')
        .expect(200);

      expect(Array.isArray(response.body)).toBeTruthy();
    });

    it('sollte zu viele API-Anfragen blockieren', async () => {
      // Simuliere viele API-Anfragen
      const requests = Array(31).fill().map(() => 
        request(app).get('/api/time-entries')
      );

      const responses = await Promise.all(requests);
      const blockedRequests = responses.filter(res => res.status === 429);

      expect(blockedRequests.length).toBeGreaterThan(0);
      expect(blockedRequests[0].body).toHaveProperty('error');
    });
  });
}); 