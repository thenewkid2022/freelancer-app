const request = require('supertest');
const createTestApp = require('../testApp');

const app = createTestApp();

describe('CORS Tests', () => {
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