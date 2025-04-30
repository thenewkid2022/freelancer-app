const mongoose = require('mongoose');
const TimeEntry = require('../models/TimeEntry');
require('dotenv').config();

const DEMO_USER_ID = '65ff591cad66d19394d24972'; // Beispiel User ID

const projects = [
  'Projekt A - Website Entwicklung',
  'Projekt B - Mobile App',
  'Projekt C - Backend API',
  'Projekt D - UI/UX Design',
  'Projekt E - Datenbank Migration'
];

// Funktion zum Generieren einer zufälligen Dauer zwischen 30 Minuten und 4 Stunden
const generateRandomDuration = () => {
  return Math.floor(Math.random() * (4 * 3600 - 1800) + 1800); // Zwischen 1800s (30min) und 14400s (4h)
};

// Funktion zum Generieren eines zufälligen Datums in den letzten 30 Tagen
const generateRandomDate = () => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  const randomTime = thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime());
  return new Date(randomTime);
};

async function createDemoData() {
  try {
    // Verbindung zur Datenbank herstellen
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Mit MongoDB verbunden');

    // Bestehende Demo-Einträge löschen
    await TimeEntry.deleteMany({ userId: DEMO_USER_ID });
    console.log('Bestehende Demo-Einträge gelöscht');

    // 50 Demo-Einträge erstellen
    const demoEntries = [];
    for (let i = 0; i < 50; i++) {
      const startTime = generateRandomDate();
      const duration = generateRandomDuration();
      const endTime = new Date(startTime.getTime() + duration * 1000);

      demoEntries.push({
        userId: DEMO_USER_ID,
        startTime,
        endTime,
        duration,
        project: projects[Math.floor(Math.random() * projects.length)],
        description: `Demo Eintrag ${i + 1}`,
        createdAt: startTime,
        updatedAt: startTime
      });
    }

    // Einträge in die Datenbank schreiben
    await TimeEntry.insertMany(demoEntries);
    console.log('50 Demo-Einträge erstellt');

    // Verbindung trennen
    await mongoose.disconnect();
    console.log('Datenbankverbindung getrennt');

  } catch (error) {
    console.error('Fehler beim Erstellen der Demo-Daten:', error);
    process.exit(1);
  }
}

// Script ausführen
createDemoData(); 