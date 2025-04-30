import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import { User } from '../models/User';
import { TimeEntry } from '../models/TimeEntry';
import { Payment } from '../models/Payment';
import { generateToken } from '../utils/auth';

describe('Stats Routes', () => {
  let freelancerToken: string;
  let clientToken: string;
  let freelancerId: mongoose.Types.ObjectId;
  let clientId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Payment.deleteMany({});
    await TimeEntry.deleteMany({});
    await User.deleteMany({});

    // Erstelle Test-Benutzer
    const freelancer = await User.create({
      email: 'freelancer@test.com',
      password: 'password123',
      name: 'Test Freelancer',
      role: 'freelancer'
    });

    const client = await User.create({
      email: 'client@test.com',
      password: 'password123',
      name: 'Test Client',
      role: 'client'
    });

    freelancerId = new mongoose.Types.ObjectId(freelancer._id.toString());
    clientId = new mongoose.Types.ObjectId(client._id.toString());

    freelancerToken = generateToken(freelancer);
    clientToken = generateToken(client);

    // Erstelle Test-Zeiteinträge
    const timeEntries = await TimeEntry.create([
      {
        freelancer: freelancerId,
        client: clientId,
        project: 'Project 1',
        description: 'Description 1',
        startTime: new Date(Date.now() - 3600000), // 1 Stunde zurück
        endTime: new Date(),
        hourlyRate: 50,
        status: 'approved',
        duration: 3600,
        totalAmount: 50
      },
      {
        freelancer: freelancerId,
        client: clientId,
        project: 'Project 2',
        description: 'Description 2',
        startTime: new Date(Date.now() - 7200000), // 2 Stunden zurück
        endTime: new Date(Date.now() - 3600000),
        hourlyRate: 60,
        status: 'approved',
        duration: 3600,
        totalAmount: 60
      },
      {
        freelancer: freelancerId,
        client: clientId,
        project: 'Project 3',
        description: 'Description 3',
        startTime: new Date(Date.now() - 10800000), // 3 Stunden zurück
        endTime: new Date(Date.now() - 7200000),
        hourlyRate: 70,
        status: 'pending',
        duration: 3600,
        totalAmount: 70
      }
    ]);

    // Erstelle Test-Zahlungen
    await Payment.create([
      {
        freelancer: freelancerId,
        client: clientId,
        timeEntries: [timeEntries[0]._id],
        amount: 50,
        currency: 'EUR',
        status: 'completed',
        paymentMethod: 'bank_transfer',
        paidAt: new Date()
      },
      {
        freelancer: freelancerId,
        client: clientId,
        timeEntries: [timeEntries[1]._id],
        amount: 60,
        currency: 'EUR',
        status: 'pending',
        paymentMethod: 'bank_transfer'
      }
    ]);
  });

  describe('GET /api/stats/freelancer', () => {
    it('sollte Statistiken für einen Freelancer zurückgeben', async () => {
      const response = await request(app)
        .get('/api/stats/freelancer')
        .set('Authorization', `Bearer ${freelancerToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalHours', 3);
      expect(response.body).toHaveProperty('totalEarnings', 180);
      expect(response.body).toHaveProperty('pendingAmount', 130);
      expect(response.body).toHaveProperty('completedAmount', 50);
      expect(response.body).toHaveProperty('averageHourlyRate', 60);
      expect(response.body).toHaveProperty('projectStats');
      expect(response.body.projectStats).toHaveLength(3);
    });

    it('sollte einen Fehler zurückgeben, wenn der Benutzer kein Freelancer ist', async () => {
      const response = await request(app)
        .get('/api/stats/freelancer')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(response.status).toBe(403);
    });

    it('sollte Statistiken für einen bestimmten Zeitraum zurückgeben', async () => {
      const startDate = new Date(Date.now() - 86400000); // 24 Stunden zurück
      const endDate = new Date();

      const response = await request(app)
        .get(`/api/stats/freelancer?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
        .set('Authorization', `Bearer ${freelancerToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalHours', 3);
      expect(response.body).toHaveProperty('totalEarnings', 180);
    });
  });

  describe('GET /api/stats/client', () => {
    it('sollte Statistiken für einen Client zurückgeben', async () => {
      const response = await request(app)
        .get('/api/stats/client')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalSpent', 110);
      expect(response.body).toHaveProperty('pendingAmount', 130);
      expect(response.body).toHaveProperty('completedAmount', 50);
      expect(response.body).toHaveProperty('freelancerStats');
      expect(response.body.freelancerStats).toHaveLength(1);
    });

    it('sollte einen Fehler zurückgeben, wenn der Benutzer kein Client ist', async () => {
      const response = await request(app)
        .get('/api/stats/client')
        .set('Authorization', `Bearer ${freelancerToken}`);

      expect(response.status).toBe(403);
    });

    it('sollte Statistiken für einen bestimmten Zeitraum zurückgeben', async () => {
      const startDate = new Date(Date.now() - 86400000); // 24 Stunden zurück
      const endDate = new Date();

      const response = await request(app)
        .get(`/api/stats/client?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalSpent', 110);
    });
  });

  describe('GET /api/stats/project/:projectId', () => {
    let projectId: string;

    beforeEach(async () => {
      const timeEntry = await TimeEntry.findOne({ project: 'Project 1' });
      projectId = timeEntry?._id.toString() || '';
    });

    it('sollte Statistiken für ein Projekt zurückgeben', async () => {
      const response = await request(app)
        .get(`/api/stats/project/${projectId}`)
        .set('Authorization', `Bearer ${freelancerToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalHours', 1);
      expect(response.body).toHaveProperty('totalAmount', 50);
      expect(response.body).toHaveProperty('averageHourlyRate', 50);
      expect(response.body).toHaveProperty('timeEntries');
      expect(response.body.timeEntries).toHaveLength(1);
    });

    it('sollte einen Fehler zurückgeben, wenn der Benutzer keine Berechtigung hat', async () => {
      const response = await request(app)
        .get(`/api/stats/project/${projectId}`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(response.status).toBe(403);
    });
  });
}); 