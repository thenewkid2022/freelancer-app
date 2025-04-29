const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../index');
const config = require('../../config/config');
const TimeEntry = require('../../models/TimeEntry');

describe('API Performance Tests', () => {
  beforeAll(async () => {
    await mongoose.connect(config.mongoUri, config.mongoOptions);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Testdaten erstellen
    const testEntries = Array.from({ length: 100 }, (_, i) => ({
      project: `Test Project ${i}`,
      description: `Test Description ${i}`,
      startTime: new Date(),
      endTime: new Date(Date.now() + 3600000),
      duration: 3600,
      userId: new mongoose.Types.ObjectId()
    }));

    await TimeEntry.insertMany(testEntries);
  });

  afterEach(async () => {
    // Testdaten aufräumen
    await TimeEntry.deleteMany({});
  });

  describe('GET /api/time-entries', () => {
    it('sollte 100 Einträge in unter 1 Sekunde abrufen', async () => {
      const start = Date.now();
      
      const response = await request(app)
        .get('/api/time-entries')
        .expect(200);

      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(1000);
      expect(response.body.length).toBe(100);
    });

    it('sollte gefilterte Abfragen in unter 500ms ausführen', async () => {
      const start = Date.now();
      
      const response = await request(app)
        .get('/api/time-entries?project=Test Project 1')
        .expect(200);

      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(500);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/time-entries', () => {
    it('sollte einen neuen Eintrag in unter 200ms erstellen', async () => {
      const newEntry = {
        project: 'New Project',
        description: 'New Description',
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        duration: 3600,
        userId: new mongoose.Types.ObjectId()
      };

      const start = Date.now();
      
      const response = await request(app)
        .post('/api/time-entries')
        .send(newEntry)
        .expect(201);

      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(200);
      expect(response.body.project).toBe(newEntry.project);
    });
  });

  describe('PUT /api/time-entries/:id', () => {
    it('sollte einen Eintrag in unter 200ms aktualisieren', async () => {
      const entry = await TimeEntry.findOne();
      const update = {
        project: 'Updated Project',
        description: 'Updated Description'
      };

      const start = Date.now();
      
      const response = await request(app)
        .put(`/api/time-entries/${entry._id}`)
        .send(update)
        .expect(200);

      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(200);
      expect(response.body.project).toBe(update.project);
    });
  });

  describe('DELETE /api/time-entries/:id', () => {
    it('sollte einen Eintrag in unter 200ms löschen', async () => {
      const entry = await TimeEntry.findOne();

      const start = Date.now();
      
      const response = await request(app)
        .delete(`/api/time-entries/${entry._id}`)
        .expect(200);

      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(200);
      expect(response.body.message).toBe('Zeiterfassung erfolgreich gelöscht');
    });
  });

  describe('Concurrent Requests', () => {
    it('sollte 10 gleichzeitige Anfragen in unter 2 Sekunden verarbeiten', async () => {
      const requests = Array.from({ length: 10 }, () =>
        request(app).get('/api/time-entries')
      );

      const start = Date.now();
      
      const responses = await Promise.all(requests);
      
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(2000);
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.length).toBe(100);
      });
    });
  });
}); 