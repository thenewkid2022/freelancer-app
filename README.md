# Freelancer App

Eine vollständige Freelancer-Management-Anwendung mit Web- und Mobile-Interfaces.

## 🏗️ Projektstruktur

```
freelancer-app/
├── web/                    # Web-Anwendung (React + Express)
│   ├── frontend/          # React Web-App
│   └── server/            # Express Backend
├── mobile/                 # Mobile-Anwendung (React Native + Expo)
│   └── FreelancerApp/     # Expo React Native App
├── shared/                 # Gemeinsame Logik (API, Types, etc.)
└── deployment/             # Deployment-Konfigurationen
```

## 🚀 Features

### Web-App
- **Authentifizierung** - JWT-basierte Anmeldung
- **Zeiterfassung** - Start/Stop Timer für Projekte
- **Projektverwaltung** - Projekte erstellen und verwalten
- **Statistiken** - Detaillierte Arbeitszeit-Übersichten
- **Export-Funktionen** - PDF und Excel Export
- **Responsive Design** - Optimiert für alle Bildschirmgrößen

### Mobile-App (iOS/Android)
- **Native Mobile-Experience** - Vollständig native App
- **Offline-Funktionalität** - Funktioniert auch ohne Internet
- **TestFlight-kompatibel** - Für iOS-Testing bereit
- **Gemeinsame API** - Nutzt dieselbe Backend-API
- **Touch-optimiert** - Für mobile Geräte optimiert

## 🛠️ Technologie-Stack

### Backend
- **Node.js** - Server-Runtime
- **Express.js** - Web-Framework
- **MongoDB** - Datenbank
- **Mongoose** - ODM
- **JWT** - Authentifizierung
- **bcryptjs** - Passwort-Hashing

### Web-Frontend
- **React 18** - UI-Framework
- **TypeScript** - Typsicherheit
- **Material-UI** - UI-Komponenten
- **React Query** - Datenverwaltung
- **React Router** - Navigation

### Mobile-App
- **React Native** - Cross-Platform Mobile
- **Expo** - Development Platform
- **TypeScript** - Typsicherheit
- **React Navigation** - Mobile Navigation
- **AsyncStorage** - Lokale Datenspeicherung

## 📱 Plattformen

| Plattform | Status | Features |
|-----------|--------|----------|
| **Web** | ✅ Produktionsbereit | Vollständige Funktionalität |
| **iOS** | 🚧 In Entwicklung | TestFlight-kompatibel |
| **Android** | 🚧 In Entwicklung | Play Store bereit |

## 🚀 Schnellstart

### 1. Repository klonen
```bash
git clone https://github.com/thenewkid2022/freelancer-app.git
cd freelancer-app
```

### 2. Web-App starten
```bash
# Backend starten
cd web/server
npm install
npm run dev

# Frontend starten (neues Terminal)
cd web/frontend
npm install
npm start
```

### 3. Mobile-App starten
```bash
cd mobile/FreelancerApp
npm install
npx expo start
```

## 🔧 Konfiguration

### Umgebungsvariablen

#### Backend (web/server/.env)
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/freelancer-app
JWT_SECRET=ihr_jwt_secret
NODE_ENV=development
```

#### Frontend (web/frontend/.env)
```env
REACT_APP_API_URL=http://localhost:3001/api
```

#### Mobile (mobile/FreelancerApp/.env)
```env
EXPO_PUBLIC_API_URL=http://localhost:3001/api
```

## 📱 Mobile-Entwicklung

### iOS (TestFlight)
```bash
cd mobile/FreelancerApp
npx eas build --platform ios
npx eas submit --platform ios
```

### Android
```bash
cd mobile/FreelancerApp
npx eas build --platform android
```

## 🧪 Testing

### Web-App
- **Backend:** `npm test` im server-Ordner
- **Frontend:** `npm test` im frontend-Ordner

### Mobile-App
- **Expo Go App** - Für schnelle Tests
- **iOS Simulator** - Für iOS-spezifische Tests
- **Android Emulator** - Für Android-spezifische Tests

## 📊 API-Dokumentation

### Authentifizierung
- `POST /api/auth/login` - Benutzer anmelden
- `POST /api/auth/register` - Benutzer registrieren
- `GET /api/auth/me` - Benutzerprofil abrufen

### Zeiterfassung
- `GET /api/time-entries` - Alle Zeiteinträge abrufen
- `POST /api/time-entries` - Neuen Zeiteintrag erstellen
- `PUT /api/time-entries/:id` - Zeiteintrag aktualisieren
- `DELETE /api/time-entries/:id` - Zeiteintrag löschen

### Statistiken
- `GET /api/stats` - Arbeitszeit-Statistiken abrufen

### Export
- `GET /api/export` - Zeiteinträge exportieren

## 🔒 Sicherheit

- **JWT-Token** - Sichere Authentifizierung
- **bcrypt-Hashing** - Sichere Passwort-Speicherung
- **CORS-Konfiguration** - Geschützte API-Zugriffe
- **Input-Validierung** - Zod-Schema-Validierung
- **Rate-Limiting** - Schutz vor Missbrauch

## 🚀 Deployment

### Web-App
- **Backend:** Render, Heroku, DigitalOcean
- **Frontend:** Vercel, Netlify, GitHub Pages

### Mobile-App
- **iOS:** App Store Connect (TestFlight)
- **Android:** Google Play Console

## 🤝 Beitragen

1. Fork des Repositories
2. Feature-Branch erstellen (`git checkout -b feature/AmazingFeature`)
3. Änderungen committen (`git commit -m 'Add some AmazingFeature'`)
4. Branch pushen (`git push origin feature/AmazingFeature`)
5. Pull Request erstellen

## 📄 Lizenz

Dieses Projekt steht unter der ISC-Lizenz. Siehe [LICENSE](LICENSE) für Details.

## 📞 Support

Bei Fragen oder Problemen:
- **Issues:** GitHub Issues öffnen
- **Dokumentation:** Siehe [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)
- **Mobile-App:** Siehe [mobile/FreelancerApp/README.md](mobile/FreelancerApp/README.md)

## 🎯 Roadmap

- [ ] **Mobile-App vervollständigen** - Alle Features implementieren
- [ ] **Push-Benachrichtigungen** - Für wichtige Events
- [ ] **Offline-Synchronisation** - Automatische Daten-Sync
- [ ] **Dark Mode** - Für bessere Benutzerfreundlichkeit
- [ ] **Mehrsprachigkeit** - Internationale Unterstützung
- [ ] **Analytics** - Benutzer-Verhalten verstehen 