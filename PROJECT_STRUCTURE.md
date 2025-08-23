# Freelancer App - Projektstruktur

## Neue Organisationsstruktur

```
freelancer-app/
├── web/                    # Bestehende Web-App (unverändert)
│   ├── frontend/          # React Web-App
│   └── server/            # Express Backend
├── mobile/                 # Neue React Native App
│   ├── ios/               # iOS-spezifische Dateien
│   ├── android/           # Android (optional)
│   └── src/               # React Native Code
├── shared/                 # Gemeinsame Logik
│   ├── api/               # API-Client und Services
│   ├── types/             # Gemeinsame TypeScript-Typen
│   └── utils/             # Gemeinsame Utility-Funktionen
└── docs/                   # Projekt-Dokumentation
```

## Warum diese Struktur?

### ✅ Vorteile:
- **Klare Trennung** zwischen Web und Mobile
- **Gemeinsame Logik** wird nicht dupliziert
- **Einfache Wartung** beider Apps
- **Saubere Git-History** ohne Durcheinander
- **Skalierbar** für zukünftige Plattformen

### 🔄 Migration:
1. **Web-App bleibt unverändert** funktionsfähig
2. **Mobile-App wird parallel entwickelt**
3. **Gemeinsame Logik wird extrahiert**
4. **Beide Apps teilen sich API und Types**

## Nächste Schritte:
1. React Native Projekt in `mobile/` erstellen
2. Gemeinsame Logik in `shared/` extrahieren
3. Mobile-App mit bestehender API verbinden
4. iOS-Build für TestFlight vorbereiten
