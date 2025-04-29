const request = require('supertest');
const mongoose = require('mongoose');
const createTestApp = require('../testApp');
const jwt = require('jsonwebtoken');

const app = createTestApp();

describe('XSS Protection Tests', () => {
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