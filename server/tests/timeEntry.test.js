const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../index');
const TimeEntry = require('../models/TimeEntry');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

let mongoServer;
let testUser;
let authToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Testbenutzer erstellen
  testUser = await User.create({
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User'
  });

  // JWT Token generieren
  authToken = jwt.sign(
    { userId: testUser._id },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await TimeEntry.deleteMany({});
});

describe('TimeEntry API', () => {
  describe('POST /api/time-entries', () => {
    it('sollte einen neuen Zeiteintrag erstellen', async () => {
      const timeEntry = {
        project: 'Test Projekt',
        description: 'Test Beschreibung',
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        duration: 3600
      };

      const response = await request(app)
        .post('/api/time-entries')
        .set('Authorization', `Bearer ${authToken}`)
        .send(timeEntry);

      expect(response.status).toBe(201);
      expect(response.body.project).toBe(timeEntry.project);
      expect(response.body.description).toBe(timeEntry.description);
    });

    it('sollte einen Fehler bei ungültigen Daten zurückgeben', async () => {
      const invalidTimeEntry = {
        project: '',
        description: '',
        startTime: new Date(),
        endTime: new Date(Date.now() - 3600000) // Endzeit vor Startzeit
      };

      const response = await request(app)
        .post('/api/time-entries')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidTimeEntry);

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });
  });

  describe('GET /api/time-entries', () => {
    it('sollte alle Zeiteinträge des Benutzers zurückgeben', async () => {
      // Testdaten erstellen
      await TimeEntry.create([
        {
          userId: testUser._id,
          project: 'Projekt 1',
          description: 'Beschreibung 1',
          startTime: new Date(),
          endTime: new Date(Date.now() + 3600000),
          duration: 3600
        },
        {
          userId: testUser._id,
          project: 'Projekt 2',
          description: 'Beschreibung 2',
          startTime: new Date(),
          endTime: new Date(Date.now() + 7200000),
          duration: 7200
        }
      ]);

      const response = await request(app)
        .get('/api/time-entries')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.timeEntries).toHaveLength(2);
    });

    it('sollte Zeiteinträge nach Projekt filtern', async () => {
      // Testdaten erstellen
      await TimeEntry.create([
        {
          userId: testUser._id,
          project: 'Projekt A',
          description: 'Beschreibung A',
          startTime: new Date(),
          endTime: new Date(Date.now() + 3600000),
          duration: 3600
        },
        {
          userId: testUser._id,
          project: 'Projekt B',
          description: 'Beschreibung B',
          startTime: new Date(),
          endTime: new Date(Date.now() + 7200000),
          duration: 7200
        }
      ]);

      const response = await request(app)
        .get('/api/time-entries?project=Projekt A')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.timeEntries).toHaveLength(1);
      expect(response.body.timeEntries[0].project).toBe('Projekt A');
    });
  });

  describe('PUT /api/time-entries/:id', () => {
    it('sollte einen Zeiteintrag aktualisieren', async () => {
      // Testeintrag erstellen
      const timeEntry = await TimeEntry.create({
        userId: testUser._id,
        project: 'Altes Projekt',
        description: 'Alte Beschreibung',
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        duration: 3600
      });

      const update = {
        project: 'Aktualisiertes Projekt',
        description: 'Aktualisierte Beschreibung'
      };

      const response = await request(app)
        .put(`/api/time-entries/${timeEntry._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(update);

      expect(response.status).toBe(200);
      expect(response.body.project).toBe(update.project);
      expect(response.body.description).toBe(update.description);
    });

    it('sollte einen Fehler bei nicht existierendem Eintrag zurückgeben', async () => {
      const response = await request(app)
        .put('/api/time-entries/123456789012')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          project: 'Test',
          description: 'Test'
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/time-entries/:id', () => {
    it('sollte einen Zeiteintrag löschen', async () => {
      // Testeintrag erstellen
      const timeEntry = await TimeEntry.create({
        userId: testUser._id,
        project: 'Zu löschendes Projekt',
        description: 'Zu löschende Beschreibung',
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        duration: 3600
      });

      const response = await request(app)
        .delete(`/api/time-entries/${timeEntry._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      // Überprüfen, ob der Eintrag wirklich gelöscht wurde
      const deletedEntry = await TimeEntry.findById(timeEntry._id);
      expect(deletedEntry).toBeNull();
    });
  });
}); 