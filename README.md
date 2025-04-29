# Freelancer App

Eine Full-Stack-Anwendung für Freelancer zur Zeiterfassung und Projektverwaltung.

## Live Version

🌐 **Produktiv-Umgebung**
- Frontend: [https://freelancer-app-chi.vercel.app](https://freelancer-app-chi.vercel.app)
- Backend: [https://freelancer-app-1g8o.onrender.com](https://freelancer-app-1g8o.onrender.com)

## Features

- ⏱️ Zeiterfassung mit automatischer Persistenz
- 📊 Detaillierte Statistiken und Visualisierungen
- 📈 Projektverteilungs-Grafiken
- 🔄 Automatische Synchronisation
- 📱 Responsive Design
- 🔒 Sichere Authentifizierung
- 📑 PDF und CSV Export

## Technologie-Stack

### Frontend
- React.js mit Hooks
- TailwindCSS für Styling
- Recharts für Visualisierungen
- Axios für API-Kommunikation
- React Router für Navigation
- localStorage für Persistenz

### Backend
- Node.js mit Express
- MongoDB Atlas als Datenbank
- JWT für Authentifizierung
- Mongoose für Datenbankmodellierung
- Express-Validator für Validierung

## Entwicklungsumgebung

### Voraussetzungen
- Node.js (v14 oder höher)
- npm oder yarn
- Git

### Installation

1. Repository klonen:
```bash
git clone https://github.com/thenewkid2022/freelancer-app.git
cd freelancer-app
```

2. Backend-Abhängigkeiten installieren:
```bash
cd server
npm install
```

3. Frontend-Abhängigkeiten installieren:
```bash
cd ../frontend
npm install
```

### Lokale Konfiguration

#### Backend (.env)
```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

#### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000
```

### Lokale Entwicklung

1. Backend starten:
```bash
cd server
npm run dev
```

2. Frontend starten:
```bash
cd frontend
npm start
```

Die Anwendung ist dann verfügbar unter:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Produktionsumgebung

### Deployment-Konfiguration

#### Frontend (Vercel)
1. Verbinde dein GitHub Repository
2. Wähle den `frontend` Ordner als Root-Verzeichnis
3. Setze die Umgebungsvariable:
   - `REACT_APP_API_URL`: https://freelancer-app-1g8o.onrender.com

#### Backend (Render)
1. Erstelle einen neuen Web Service
2. Verbinde dein GitHub Repository
3. Setze die Umgebungsvariablen:
   - `MONGO_URI`: MongoDB Connection String
   - `JWT_SECRET`: Sicherer Schlüssel für JWT
   - `NODE_ENV`: production

## Features im Detail

### Zeiterfassung
- Start/Stop Funktionalität
- Automatische Speicherung bei Unterbrechungen
- Wiederherstellung nach Sitzungsende
- Projekt- und Beschreibungsfelder

### Statistiken
- Tägliche, wöchentliche und monatliche Ansichten
- Projektbasierte Auswertungen
- Arbeitszeitverteilung
- Exportfunktionen (PDF, CSV)

### Sicherheit
- JWT-basierte Authentifizierung
- Sichere Passwortspeicherung
- CORS-Konfiguration
- Rate Limiting

## API-Endpunkte

### Authentifizierung
- POST `/api/auth/register`: Registrierung
- POST `/api/auth/login`: Login

### Zeiterfassung
- GET `/api/time-entries`: Alle Einträge abrufen
- POST `/api/time-entries`: Neuen Eintrag erstellen
- PUT `/api/time-entries/:id`: Eintrag aktualisieren
- DELETE `/api/time-entries/:id`: Eintrag löschen

### Statistiken
- GET `/api/time-entries/stats/filtered`: Gefilterte Statistiken
- GET `/api/time-entries/stats/daily`: Tagesstatistiken
- GET `/api/time-entries/stats/monthly`: Monatsstatistiken

## Lizenz

MIT 