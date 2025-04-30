import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import { User } from '../models/User';
import { TimeEntry } from '../models/TimeEntry';
import { generateToken } from '../utils/auth';

describe('TimeEntry Routes', () => {
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
  });

  describe('POST /api/time-entries', () => {
    it('sollte einen neuen Zeiteintrag erstellen', async () => {
      const timeEntryData = {
        client: clientId,
        project: 'Test Project',
        description: 'Test Description',
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        hourlyRate: 50
      };

      const response = await request(app)
        .post('/api/time-entries')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send(timeEntryData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('_id');
      expect(response.body.freelancer).toBe(freelancerId.toString());
      expect(response.body.client).toBe(clientId.toString());
      expect(response.body.project).toBe(timeEntryData.project);
      expect(response.body.status).toBe('pending');
    });

    it('sollte einen Fehler zurückgeben, wenn der Benutzer kein Freelancer ist', async () => {
      const timeEntryData = {
        client: freelancerId,
        project: 'Test Project',
        description: 'Test Description',
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        hourlyRate: 50
      };

      const response = await request(app)
        .post('/api/time-entries')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(timeEntryData);

      expect(response.status).toBe(403);
    });

    it('sollte einen Fehler zurückgeben, wenn die Validierung fehlschlägt', async () => {
      const invalidData = {
        client: clientId,
        project: '',
        description: '',
        startTime: 'invalid-date',
        endTime: new Date(),
        hourlyRate: -50
      };

      const response = await request(app)
        .post('/api/time-entries')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/time-entries', () => {
    beforeEach(async () => {
      // Erstelle Test-Zeiteinträge
      await TimeEntry.create([
        {
          freelancer: freelancerId,
          client: clientId,
          project: 'Project 1',
          description: 'Description 1',
          startTime: new Date(),
          endTime: new Date(Date.now() + 3600000),
          hourlyRate: 50,
          status: 'pending'
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
    });

    it('sollte alle Zeiteinträge für einen Freelancer zurückgeben', async () => {
      const response = await request(app)
        .get('/api/time-entries')
        .set('Authorization', `Bearer ${freelancerToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toHaveProperty('freelancer', freelancerId.toString());
    });

    it('sollte alle Zeiteinträge für einen Client zurückgeben', async () => {
      const response = await request(app)
        .get('/api/time-entries')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toHaveProperty('client', clientId.toString());
    });

    it('sollte Zeiteinträge nach Status filtern', async () => {
      const response = await request(app)
        .get('/api/time-entries?status=approved')
        .set('Authorization', `Bearer ${freelancerToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].status).toBe('approved');
    });
  });

  describe('PUT /api/time-entries/:id', () => {
    let timeEntryId: string;

    beforeEach(async () => {
      const timeEntry = await TimeEntry.create({
        freelancer: freelancerId,
        client: clientId,
        project: 'Test Project',
        description: 'Test Description',
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        hourlyRate: 50,
        status: 'pending'
      });
      timeEntryId = timeEntry._id.toString();
    });

    it('sollte einen Zeiteintrag aktualisieren', async () => {
      const updateData = {
        description: 'Updated Description',
        hourlyRate: 60
      };

      const response = await request(app)
        .put(`/api/time-entries/${timeEntryId}`)
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.description).toBe(updateData.description);
      expect(response.body.hourlyRate).toBe(updateData.hourlyRate);
    });

    it('sollte einen Fehler zurückgeben, wenn der Benutzer keine Berechtigung hat', async () => {
      const updateData = {
        description: 'Updated Description'
      };

      const response = await request(app)
        .put(`/api/time-entries/${timeEntryId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send(updateData);

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/time-entries/:id', () => {
    let timeEntryId: string;

    beforeEach(async () => {
      const timeEntry = await TimeEntry.create({
        freelancer: freelancerId,
        client: clientId,
        project: 'Test Project',
        description: 'Test Description',
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        hourlyRate: 50,
        status: 'pending'
      });
      timeEntryId = timeEntry._id.toString();
    });

    it('sollte einen Zeiteintrag löschen', async () => {
      const response = await request(app)
        .delete(`/api/time-entries/${timeEntryId}`)
        .set('Authorization', `Bearer ${freelancerToken}`);

      expect(response.status).toBe(204);

      const deletedEntry = await TimeEntry.findById(timeEntryId);
      expect(deletedEntry).toBeNull();
    });

    it('sollte einen Fehler zurückgeben, wenn der Benutzer keine Berechtigung hat', async () => {
      const response = await request(app)
        .delete(`/api/time-entries/${timeEntryId}`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(response.status).toBe(403);
    });
  });
}); 