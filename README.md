# Freelancer App

Eine moderne Webanwendung für Freelancer und ihre Kunden zur Verwaltung von Zeiterfassung, Abrechnungen und Projekten.

## Projektstruktur

```
freelancer-app/
├── frontend/                 # React Frontend
│   ├── src/
│   │   ├── components/      # React Komponenten
│   │   ├── hooks/          # Custom React Hooks
│   │   ├── services/       # API Services
│   │   ├── types/          # TypeScript Typdefinitionen
│   │   └── utils/          # Hilfsfunktionen
│   ├── public/             # Statische Dateien
│   ├── build/              # Build-Ausgabe
│   └── package.json        # Frontend Dependencies
│
├── server/                  # Node.js Backend
│   ├── src/
│   │   ├── config/         # Konfigurationsdateien
│   │   ├── controllers/    # Route Controller
│   │   ├── middleware/     # Express Middleware
│   │   ├── models/         # Mongoose Modelle
│   │   ├── routes/         # API Routen
│   │   ├── services/       # Business Logic
│   │   ├── tests/          # Integration Tests
│   │   ├── types/          # TypeScript Typdefinitionen
│   │   └── utils/          # Hilfsfunktionen
│   └── package.json        # Backend Dependencies
│
├── .github/                # GitHub Actions Workflows
├── .gitignore             # Git Ignore Regeln
├── package.json           # Root Dependencies
├── tsconfig.json          # TypeScript Konfiguration
├── vercel.json            # Vercel Deployment Konfiguration
└── render.yaml            # Render Deployment Konfiguration
```

## Technologien

### Frontend
- React mit TypeScript
- Material-UI für das UI
- React Query für Datenverwaltung
- React Router für Navigation
- Jest und React Testing Library für Tests
- file-saver für Datei-Downloads

### Backend
- Node.js mit Express
- TypeScript
- MongoDB mit Mongoose
- JWT für Authentifizierung
- Jest für Tests
- Swagger für API Dokumentation

## Entwicklung

1. Repository klonen:
```bash
git clone https://github.com/your-username/freelancer-app.git
cd freelancer-app
```

2. Dependencies installieren:
```bash
# Root Dependencies
npm install

# Frontend Dependencies
cd frontend
npm install

# Backend Dependencies
cd ../server
npm install
```

3. Umgebungsvariablen konfigurieren:
```bash
# Server .env
cp server/.env.example server/.env

# Frontend .env
cp frontend/.env.example frontend/.env
```

4. Entwicklungsserver starten:
```bash
# Backend
cd server
npm run dev

# Frontend
cd frontend
npm start
```

## Tests

```bash
# Backend Tests
cd server
npm test

# Frontend Tests
cd frontend
npm test
```

## Deployment

Die Anwendung ist für Deployment auf Vercel (Frontend) und Render (Backend) konfiguriert.

### Frontend Deployment
- Automatisches Deployment über Vercel
- Konfiguration in `vercel.json`

### Backend Deployment
- Automatisches Deployment über Render
- Konfiguration in `render.yaml`

## API Dokumentation

Die API-Dokumentation ist über Swagger verfügbar:
- Entwicklung: `http://localhost:3000/api-docs`
- Produktion: `https://api.freelancer-app.com/api-docs`

## Lizenz

MIT 