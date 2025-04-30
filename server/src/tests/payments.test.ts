import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import { User } from '../models/User';
import { TimeEntry } from '../models/TimeEntry';
import { Payment } from '../models/Payment';
import { generateToken } from '../utils/auth';

describe('Payment Routes', () => {
  let freelancerToken: string;
  let clientToken: string;
  let freelancerId: mongoose.Types.ObjectId;
  let clientId: mongoose.Types.ObjectId;
  let timeEntryIds: mongoose.Types.ObjectId[];

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
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        hourlyRate: 50,
        status: 'approved'
      },
      {
        freelancer: freelancerId,
        client: clientId,
        project: 'Project 2',
        description: 'Description 2',
        startTime: new Date(),
        endTime: new Date(Date.now() + 7200000),
        hourlyRate: 60,
        status: 'approved'
      }
    ]);

    timeEntryIds = timeEntries.map(entry => new mongoose.Types.ObjectId(entry._id.toString()));
  });

  describe('POST /api/payments', () => {
    it('sollte eine neue Zahlung erstellen', async () => {
      const paymentData = {
        timeEntries: timeEntryIds,
        paymentMethod: 'bank_transfer',
        notes: 'Test payment'
      };

      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(paymentData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('_id');
      expect(response.body.freelancer).toBe(freelancerId.toString());
      expect(response.body.client).toBe(clientId.toString());
      expect(response.body.status).toBe('pending');
      expect(response.body.paymentMethod).toBe(paymentData.paymentMethod);
      expect(response.body.amount).toBe(130); // 50€ + 60€ = 110€ für 2 Stunden
    });

    it('sollte einen Fehler zurückgeben, wenn der Benutzer kein Client ist', async () => {
      const paymentData = {
        timeEntries: timeEntryIds,
        paymentMethod: 'bank_transfer'
      };

      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send(paymentData);

      expect(response.status).toBe(403);
    });

    it('sollte einen Fehler zurückgeben, wenn die Zeiteinträge nicht genehmigt sind', async () => {
      // Erstelle einen nicht genehmigten Zeiteintrag
      const pendingTimeEntry = await TimeEntry.create({
        freelancer: freelancerId,
        client: clientId,
        project: 'Project 3',
        description: 'Description 3',
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        hourlyRate: 50,
        status: 'pending'
      });

      const paymentData = {
        timeEntries: [pendingTimeEntry._id],
        paymentMethod: 'bank_transfer'
      };

      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(paymentData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Alle Zeiteinträge müssen genehmigt sein');
    });
  });

  describe('GET /api/payments', () => {
    beforeEach(async () => {
      // Erstelle Test-Zahlungen
      await Payment.create([
        {
          freelancer: freelancerId,
          client: clientId,
          timeEntries: timeEntryIds,
          amount: 130,
          currency: 'EUR',
          status: 'pending',
          paymentMethod: 'bank_transfer'
        },
        {
          freelancer: freelancerId,
          client: clientId,
          timeEntries: timeEntryIds,
          amount: 130,
          currency: 'EUR',
          status: 'completed',
          paymentMethod: 'bank_transfer',
          paidAt: new Date()
        }
      ]);
    });

    it('sollte alle Zahlungen für einen Freelancer zurückgeben', async () => {
      const response = await request(app)
        .get('/api/payments')
        .set('Authorization', `Bearer ${freelancerToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toHaveProperty('freelancer', freelancerId.toString());
    });

    it('sollte alle Zahlungen für einen Client zurückgeben', async () => {
      const response = await request(app)
        .get('/api/payments')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toHaveProperty('client', clientId.toString());
    });

    it('sollte Zahlungen nach Status filtern', async () => {
      const response = await request(app)
        .get('/api/payments?status=completed')
        .set('Authorization', `Bearer ${freelancerToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].status).toBe('completed');
    });
  });

  describe('PUT /api/payments/:id', () => {
    let paymentId: string;

    beforeEach(async () => {
      const payment = await Payment.create({
        freelancer: freelancerId,
        client: clientId,
        timeEntries: timeEntryIds,
        amount: 130,
        currency: 'EUR',
        status: 'pending',
        paymentMethod: 'bank_transfer'
      });
      paymentId = payment._id.toString();
    });

    it('sollte eine Zahlung aktualisieren', async () => {
      const updateData = {
        status: 'completed',
        paymentDetails: {
          transactionId: '123456',
          paidAt: new Date()
        }
      };

      const response = await request(app)
        .put(`/api/payments/${paymentId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(updateData.status);
      expect(response.body.paymentDetails).toEqual(updateData.paymentDetails);
    });

    it('sollte einen Fehler zurückgeben, wenn der Benutzer keine Berechtigung hat', async () => {
      const updateData = {
        status: 'completed'
      };

      const response = await request(app)
        .put(`/api/payments/${paymentId}`)
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send(updateData);

      expect(response.status).toBe(403);
    });
  });
}); 