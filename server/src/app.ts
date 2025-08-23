import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { errorHandler } from './middleware/errorHandler';
import { securityMiddleware } from './middleware/security';
import authRoutes from './routes/auth';
import timeEntryRoutes from './routes/timeEntries';
import statsRoutes from './routes/stats';
import exportRoutes from './routes/export';
import { config } from './config';

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

// Trust Proxy für Render
app.set('trust proxy', 1);

// KORREKTE CORS-KONFIGURATION
const allowedOrigins = [
  'https://freelancer-app-chi.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, origin);
    } else {
      callback(new Error('Nicht erlaubte Origin: ' + origin), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'X-Requested-With'],
  maxAge: 86400
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helmet Konfiguration
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "unsafe-none" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "https://freelancer-app-1g8o.onrender.com", "https://freelancer-app-chi.vercel.app"],
      frameSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"]
    }
  }
}));

// Logging
app.use(morgan('dev'));

// Security Middleware
app.use(securityMiddleware);

// Routen
app.use('/api/auth', authRoutes);
app.use('/api/time-entries', timeEntryRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/export', exportRoutes);

// Health Check Endpunkte
app.head("/api/ping", (_, res) => {
  res.status(200).end();
});

// Render Health Check
app.get("/api/health", (_, res) => {
  res.status(200).json({ status: "ok" });
});

// Debug-Route für Benutzer (nur in Entwicklung)
if (process.env.NODE_ENV === 'development') {
  app.get('/api/debug/users', async (req, res) => {
    try {
      // Direkte MongoDB-Abfrage über mongoose.connection
      const db = mongoose.connection.db;
      if (!db) {
        return res.status(500).json({ error: 'Datenbank nicht verbunden' });
      }
      
      // Alle Collections auflisten
      const collections = await db.listCollections().toArray();
      
      // Verschiedene Collection-Namen testen
      let users: any[] = [];
      let collectionName = '';
      
      // Teste verschiedene mögliche Collection-Namen
      const possibleNames = ['users', 'user', 'Users', 'User'];
      
      for (const name of possibleNames) {
        try {
          const collection = db.collection(name);
          const count = await collection.countDocuments();
          if (count > 0) {
            users = await collection.find({}, { 
              projection: { email: 1, firstName: 1, lastName: 1, role: 1, createdAt: 1, _id: 1 } 
            }).toArray();
            collectionName = name;
            break;
          }
        } catch (e) {
          console.log(`Collection ${name} nicht gefunden`);
        }
      }
      
      res.json({ 
        users, 
        count: users.length, 
        collectionName,
        allCollections: collections.map(c => c.name),
        dbName: db.databaseName
      });
    } catch (error) {
      console.error('Debug-Route Fehler:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      res.status(500).json({ error: 'Fehler beim Abrufen der Benutzer', details: errorMessage });
    }
  });

  // Temporäre Route zum Aktualisieren des Passworts (nur in Entwicklung)
  app.post('/api/debug/update-password', async (req, res) => {
    try {
      const { email, newPassword } = req.body;
      
      if (!email || !newPassword) {
        return res.status(400).json({ error: 'Email und neues Passwort erforderlich' });
      }

      const db = mongoose.connection.db;
      if (!db) {
        return res.status(500).json({ error: 'Datenbank nicht verbunden' });
      }

      // Passwort hashen
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Passwort in der Datenbank aktualisieren
      const result = await db.collection('users').updateOne(
        { email: email },
        { $set: { password: hashedPassword } }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Benutzer nicht gefunden' });
      }

      // Überprüfung: Hash mit dem neuen Passwort testen
      const testMatch = await bcrypt.compare(newPassword, hashedPassword);
      
      res.json({ 
        success: true, 
        message: 'Passwort erfolgreich aktualisiert',
        updatedCount: result.modifiedCount,
        hashTest: testMatch,
        newHash: hashedPassword.substring(0, 20) + '...'
      });
    } catch (error) {
      console.error('Passwort-Update Fehler:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      res.status(500).json({ error: 'Fehler beim Aktualisieren des Passworts', details: errorMessage });
    }
  });
}

// Error Handler
app.use(errorHandler);

// MongoDB-Verbindung und Serverstart
if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(process.env.MONGODB_URI || '', {
    dbName: 'freelancer-app', // Expliziter Datenbankname (mit Bindestrich)
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    heartbeatFrequencyMS: 10000,   // 10 Sekunden
    maxPoolSize: 10,
    minPoolSize: 5
  })
    .then(() => {
      console.log('MongoDB verbunden!');
      // Verbindungsüberwachung
      mongoose.connection.on('disconnected', () => {
        console.log('MongoDB Verbindung getrennt - Versuche erneut zu verbinden...');
      });
      
      mongoose.connection.on('error', (err) => {
        console.error('MongoDB Verbindungsfehler:', err);
      });

      app.listen(port, '0.0.0.0', () => {
        console.log(`Server is running on port ${port}`);
      });
    })
    .catch(err => {
      console.error('MongoDB Fehler beim Start:', err);
      process.exit(1);
    });
}

export { app }; 