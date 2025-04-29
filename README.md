# Freelancer App

Eine Full-Stack-Anwendung für Freelancer zur Zeiterfassung und Projektverwaltung.

## Technologie-Stack

- Frontend: React.js
- Backend: Node.js mit Express
- Datenbank: MongoDB Atlas
- Authentication: JWT

## Voraussetzungen

- Node.js (v14 oder höher)
- MongoDB Atlas Konto
- npm oder yarn

## Installation

1. Repository klonen:
```bash
git clone [repository-url]
cd freelancer-app
```

2. Backend-Abhängigkeiten installieren:
```bash
cd server
npm install
```

3. Frontend-Abhängigkeiten installieren:
```bash
cd ../client
npm install
```

## Konfiguration

1. Kopiere die Konfigurationsdatei:
```bash
cd server
cp config/config.js config/config.js
```

2. Konfiguriere die Umgebungsvariablen in `config.js`:
- `MONGO_URI`: MongoDB Atlas Verbindungs-URL
- `JWT_SECRET`: Geheimer Schlüssel für JWT
- `CLIENT_URL`: URL des Frontend-Servers
- Weitere Konfigurationsoptionen siehe `config.js`

## Starten der Anwendung

1. Backend starten:
```bash
cd server
npm start
```

2. Frontend starten:
```bash
cd client
npm start
```

## MongoDB Atlas Konfiguration

1. Erstelle ein MongoDB Atlas Konto
2. Erstelle einen neuen Cluster
3. Konfiguriere die Netzwerk-Zugriffsregeln
4. Erstelle einen Datenbankbenutzer
5. Kopiere die Verbindungs-URL und füge sie in die Konfiguration ein

## Sicherheitshinweise

- Speichere niemals sensible Daten in der Versionskontrolle
- Verwende starke Passwörter für MongoDB Atlas
- Aktiviere SSL/TLS für die MongoDB-Verbindung
- Konfiguriere IP-Whitelisting in MongoDB Atlas

## Entwicklung

- `npm run dev`: Startet den Entwicklungsserver
- `npm test`: Führt Tests aus
- `npm run lint`: Führt Linting durch

## Lizenz

MIT 