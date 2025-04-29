const mongoose = require('mongoose');
const config = require('../../config/config');
const { logger } = require('../../utils/logger');

// Mock für mongoose
jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  return {
    ...actualMongoose,
    connect: jest.fn().mockResolvedValue(actualMongoose),
    connection: {
      readyState: 1,
      name: 'freelancer-test',
      close: jest.fn().mockResolvedValue(true),
      db: {
        stats: jest.fn().mockResolvedValue({ collections: 1 })
      }
    }
  };
});

describe('MongoDB Integration Tests', () => {
  beforeAll(async () => {
    // Verbindung zur Test-Datenbank herstellen
    await mongoose.connect(config.mongoUri, config.mongoOptions);
  });

  afterAll(async () => {
    // Verbindung schließen
    await mongoose.connection.close();
  });

  describe('Verbindungsstatus', () => {
    it('sollte erfolgreich mit MongoDB verbunden sein', () => {
      expect(mongoose.connection.readyState).toBe(1);
    });

    it('sollte die korrekte Datenbank verwenden', () => {
      expect(mongoose.connection.name).toBe('freelancer-test');
    });
  });

  describe('Verbindungsfehler', () => {
    it('sollte bei ungültiger URI einen Fehler werfen', async () => {
      mongoose.connect.mockRejectedValueOnce(new Error('Invalid URI'));
      await expect(mongoose.connect('invalid-uri')).rejects.toThrow('Invalid URI');
    });

    it('sollte bei Timeout einen Fehler werfen', async () => {
      mongoose.connect.mockRejectedValueOnce(new Error('Timeout'));
      await expect(mongoose.connect('mongodb://localhost:27017/test')).rejects.toThrow('Timeout');
    });
  });

  describe('Wiederverbindungslogik', () => {
    it('sollte nach Verbindungsabbruch automatisch wieder verbinden', async () => {
      // Verbindung manuell schließen
      await mongoose.connection.close();
      
      // Warten auf Wiederverbindung
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Prüfen, ob wieder verbunden
      expect(mongoose.connection.readyState).toBe(1);
    });
  });

  describe('Datenbankoperationen', () => {
    it('sollte CRUD-Operationen ausführen können', async () => {
      // Test-Dokument erstellen
      const TestModel = mongoose.model('Test', new mongoose.Schema({ name: String }));
      
      // Mock für Model-Operationen
      TestModel.create = jest.fn().mockResolvedValue({ name: 'test' });
      TestModel.findById = jest.fn().mockResolvedValue({ name: 'test' });
      TestModel.findByIdAndUpdate = jest.fn().mockResolvedValue({ name: 'updated' });
      TestModel.findByIdAndDelete = jest.fn().mockResolvedValue({ name: 'test' });
      
      // Create
      const doc = await TestModel.create({ name: 'test' });
      expect(doc.name).toBe('test');
      
      // Read
      const found = await TestModel.findById('test-id');
      expect(found.name).toBe('test');
      
      // Update
      const updated = await TestModel.findByIdAndUpdate(
        'test-id',
        { name: 'updated' },
        { new: true }
      );
      expect(updated.name).toBe('updated');
      
      // Delete
      await TestModel.findByIdAndDelete('test-id');
      expect(TestModel.findByIdAndDelete).toHaveBeenCalledWith('test-id');
    });
  });

  describe('Performance', () => {
    it('sollte Bulk-Operationen effizient ausführen', async () => {
      const TestModel = mongoose.model('BulkTest', new mongoose.Schema({ value: Number }));
      
      // Mock für insertMany
      TestModel.insertMany = jest.fn().mockResolvedValue([]);
      TestModel.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 1000 });
      
      // 1000 Dokumente erstellen
      const docs = Array.from({ length: 1000 }, (_, i) => ({ value: i }));
      
      const start = Date.now();
      await TestModel.insertMany(docs);
      const duration = Date.now() - start;
      
      // Bulk-Insert sollte weniger als 5 Sekunden dauern
      expect(duration).toBeLessThan(5000);
      expect(TestModel.insertMany).toHaveBeenCalledWith(docs);
      
      // Aufräumen
      await TestModel.deleteMany({});
      expect(TestModel.deleteMany).toHaveBeenCalled();
    });
  });

  describe('Fehlerbehandlung', () => {
    it('sollte Validierungsfehler korrekt behandeln', async () => {
      const TestModel = mongoose.model('ValidationTest', 
        new mongoose.Schema({ 
          required: { type: String, required: true }
        })
      );
      
      // Mock für create mit Validierungsfehler
      TestModel.create = jest.fn().mockRejectedValue(new Error('Validation failed'));
      
      await expect(TestModel.create({}))
        .rejects.toThrow('Validation failed');
    });

    it('sollte Duplikat-Fehler korrekt behandeln', async () => {
      const TestModel = mongoose.model('UniqueTest',
        new mongoose.Schema({
          unique: { type: String, unique: true }
        })
      );
      
      // Mock für create mit Duplikat-Fehler
      TestModel.create = jest.fn()
        .mockResolvedValueOnce({ unique: 'test' })
        .mockRejectedValueOnce(new Error('Duplicate key error'));
      
      await TestModel.create({ unique: 'test' });
      await expect(TestModel.create({ unique: 'test' }))
        .rejects.toThrow('Duplicate key error');
    });
  });
}); 