# Freelancer App - Projektstruktur

## Aktuelle Organisationsstruktur

```
freelancer-app/
├── web/                    # Web-Anwendung (React + Express)
│   ├── frontend/          # React Web-App (vollständig)
│   │   ├── src/           # React Source Code
│   │   ├── public/        # Statische Dateien
│   │   ├── package.json   # Frontend Dependencies
│   │   └── ...
│   └── server/            # Express Backend (vollständig)
│       ├── src/           # Backend Source Code
│       ├── package.json   # Backend Dependencies
│       └── ...
├── mobile/                 # Mobile-Anwendung (React Native + Expo)
│   └── mobile-app/         # Expo React Native App
│       ├── src/           # React Native Source Code
│       │   ├── screens/   # App-Bildschirme
│       │   ├── navigation/ # Navigation
│       │   ├── services/  # API-Services
│       │   ├── contexts/  # React Context
│       │   └── types/     # TypeScript-Typen
│       ├── package.json   # Mobile Dependencies
│       └── README.md      # Mobile-App Dokumentation
├── shared/                 # Gemeinsame Logik (für zukünftige Verwendung)
└── deployment/             # Deployment-Konfigurationen
```

## Status der verschiedenen Apps

### ✅ Web-App (web/)
- **Frontend:** Vollständig funktionsfähig
- **Backend:** Vollständig funktionsfähig
- **API:** Läuft auf Port 3001
- **Datenbank:** MongoDB verbunden

### 🚧 Mobile-App (mobile/)
- **Grundstruktur:** Erstellt
- **Login-Screen:** Implementiert
- **Navigation:** Grundgerüst vorhanden
- **API-Integration:** Verbunden mit Backend
- **Nächste Schritte:** Weitere Screens implementieren

## Warum diese Struktur?

### ✅ Vorteile:
- **Klare Trennung** zwischen Web und Mobile
- **Gemeinsame Logik** kann später extrahiert werden
- **Einfache Wartung** beider Apps
- **Saubere Git-History** ohne Durcheinander
- **Skalierbar** für zukünftige Plattformen

### 🔄 Migration abgeschlossen:
1. ✅ **Web-App in web/ verschoben** - Funktioniert weiterhin
2. ✅ **Mobile-App in mobile/ erstellt** - Grundstruktur vorhanden
3. ✅ **Beide Apps teilen sich API** - Gleiche Backend-URL
4. ✅ **Projektstruktur dokumentiert** - Klare Übersicht

## Nächste Schritte:
1. **Mobile-App vervollständigen** - Alle Screens implementieren
2. **Gemeinsame Logik extrahieren** - API-Client, Types, Utils
3. **iOS-Build für TestFlight** vorbereiten
4. **Web-App weiterentwickeln** - Neue Features hinzufügen

## Entwicklung

### Web-App starten:
```bash
# Backend
cd web/server
npm install
npm run dev

# Frontend (neues Terminal)
cd web/frontend
npm install
npm start
```

### Mobile-App starten:
```bash
cd mobile/mobile-app
npm install
npx expo start
```

## Git-Struktur
- **Hauptbranch:** `main`
- **Web-App:** Funktioniert unverändert
- **Mobile-App:** Neue Dateien hinzugefügt
- **Keine Breaking Changes** für bestehende Funktionalität
