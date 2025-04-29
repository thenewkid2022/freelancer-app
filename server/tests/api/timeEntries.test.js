const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../index');
const config = require('../../config/config');
const TimeEntry = require('../../models/TimeEntry');

describe('TimeEntries API', () => {
  let testTimeEntry;

  beforeAll(async () => {
    await mongoose.connect(config.mongoUri, config.mongoOptions);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Testdaten erstellen
    testTimeEntry = await TimeEntry.create({
      project: 'Test Projekt',
      description: 'Test Beschreibung',
      startTime: new Date(),
      endTime: new Date(Date.now() + 3600000),
      duration: 3600,
      userId: new mongoose.Types.ObjectId()
    });
  });

  afterEach(async () => {
    // Testdaten aufräumen
    await TimeEntry.deleteMany({});
  });

  describe('GET /api/time-entries', () => {
    it('sollte alle Zeiterfassungen zurückgeben', async () => {
      const response = await request(app)
        .get('/api/time-entries')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('sollte Zeiterfassungen nach Projekt filtern', async () => {
      const response = await request(app)
        .get('/api/time-entries?project=Test Projekt')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body[0].project).toBe('Test Projekt');
    });
  });

  describe('POST /api/time-entries', () => {
    it('sollte eine neue Zeiterfassung erstellen', async () => {
      const newTimeEntry = {
        project: 'Neues Projekt',
        description: 'Neue Beschreibung',
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        duration: 3600,
        userId: new mongoose.Types.ObjectId()
      };

      const response = await request(app)
        .post('/api/time-entries')
        .send(newTimeEntry)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.project).toBe(newTimeEntry.project);
    });

    it('sollte einen Fehler bei ungültigen Daten zurückgeben', async () => {
      const invalidTimeEntry = {
        project: '', // Leeres Projekt ist ungültig
        description: 'Test Beschreibung'
      };

      const response = await request(app)
        .post('/api/time-entries')
        .send(invalidTimeEntry)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/time-entries/:id', () => {
    it('sollte eine bestehende Zeiterfassung aktualisieren', async () => {
      const updateData = {
        project: 'Aktualisiertes Projekt',
        description: 'Aktualisierte Beschreibung'
      };

      const response = await request(app)
        .put(`/api/time-entries/${testTimeEntry._id}`)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.project).toBe(updateData.project);
      expect(response.body.description).toBe(updateData.description);
    });

    it('sollte einen Fehler bei ungültiger ID zurückgeben', async () => {
      const invalidId = new mongoose.Types.ObjectId();
      const updateData = {
        project: 'Aktualisiertes Projekt'
      };

      const response = await request(app)
        .put(`/api/time-entries/${invalidId}`)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/time-entries/:id', () => {
    it('sollte eine Zeiterfassung löschen', async () => {
      const response = await request(app)
        .delete(`/api/time-entries/${testTimeEntry._id}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      
      // Überprüfen, ob der Eintrag wirklich gelöscht wurde
      const deletedEntry = await TimeEntry.findById(testTimeEntry._id);
      expect(deletedEntry).toBeNull();
    });

    it('sollte einen Fehler bei ungültiger ID zurückgeben', async () => {
      const invalidId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/time-entries/${invalidId}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });
}); 