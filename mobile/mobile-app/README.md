# Freelancer App - Mobile

React Native Mobile-App für iOS und Android, entwickelt mit Expo.

## 🚀 Features

### ✅ Implementiert
- **Authentifizierung** - Login/Register mit JWT-Token
- **Zeiterfassung** - Vollständige CRUD-Operationen für Zeiteinträge
- **Statistiken** - Detaillierte Übersicht über Arbeitszeiten und Projekte
- **Projektverwaltung** - Projektübersicht mit Statistiken
- **Benutzerprofil** - Profil bearbeiten und Passwort ändern
- **Tagesausgleich** - Vollständige Logik für Arbeitszeit-Korrekturen
- **Export-Funktionen** - PDF, Excel und CSV Export
- **Responsive UI** - Optimiert für iOS und Android
- **Gemeinsame Komponenten** - Button, Input, Card, LoadingSpinner

### 🔄 In Entwicklung
- **Offline-Funktionalität** - Lokale Datenspeicherung
- **Push-Benachrichtigungen** - Erinnerungen und Updates
- **Dark Mode** - Dunkles Theme
- **Mehrsprachigkeit** - Deutsch/Englisch/Weitere

## 📱 Plattformen

- ✅ iOS (TestFlight kompatibel)
- ✅ Android
- ✅ Web (Expo Web)

## 🛠️ Installation

### Voraussetzungen

- Node.js 18+
- npm oder yarn
- Expo CLI: `npm install -g @expo/cli`
- EAS CLI: `npm install -g eas-cli`
- iOS: Xcode (nur für iOS-Builds)
- Android: Android Studio (nur für Android-Builds)

### Setup

1. **Dependencies installieren:**
   ```bash
   npm install
   ```

2. **App starten:**
   ```bash
   # iOS Simulator
   npm run ios
   
   # Android Emulator
   npm run android
   
   # Web
   npm run web
   
   # Expo Go App (empfohlen für Entwicklung)
   npx expo start
   ```

## 🏗️ Projektstruktur

```
src/
├── components/          # Wiederverwendbare UI-Komponenten
├── screens/            # App-Bildschirme
├── navigation/         # Navigation und Routing
├── services/           # API-Services und externe Dienste
├── contexts/           # React Context (Auth, etc.)
├── types/              # TypeScript-Typdefinitionen
└── utils/              # Hilfsfunktionen
```

## 🔧 Konfiguration

### API-URL

Die API-URL wird in `src/services/api.ts` konfiguriert:

```typescript
const API_URL = 'http://localhost:3001/api'; // Lokale Entwicklung
// const API_URL = 'https://ihre-domain.com/api'; // Produktion
```

### Umgebungsvariablen

Erstellen Sie eine `.env` Datei für Umgebungsvariablen:

```env
EXPO_PUBLIC_API_URL=http://localhost:3001/api
```

## 📱 iOS Build für TestFlight

### 1. EAS Build konfigurieren
```bash
cd mobile/mobile-app
eas login
eas project:init
```

### 2. Bundle ID anpassen
In `app.config.js` ändern:
```javascript
bundleIdentifier: "com.chrigel.freelancerapp"
```

### 3. iOS Build erstellen
```bash
npm run build:ios
# oder
eas build --platform ios --profile production
```

### 4. App Store Connect hochladen
```bash
npm run submit:ios
# oder
eas submit --platform ios
```

### 5. Vollständiges Deployment
```bash
npm run deploy:ios
```

## 🧪 Testing

### Lokaler Test

- **Expo Go App** auf dem physischen Gerät
- **iOS Simulator** für iOS-spezifische Tests
- **Android Emulator** für Android-spezifische Tests

### TestFlight

1. **Build erstellen** (siehe oben)
2. **App Store Connect** hochladen
3. **TestFlight** für Tester freigeben

**📖 Detaillierte Anleitung:** [TESTFLIGHT_DEPLOYMENT.md](TESTFLIGHT_DEPLOYMENT.md)

**📋 Versionshistorie:** [CHANGELOG.md](CHANGELOG.md)

## 🔄 Entwicklung

### Neue Screens hinzufügen

1. Screen in `src/screens/` erstellen
2. Navigation in `src/navigation/AppNavigator.tsx` hinzufügen
3. Tab-Icon in der Navigation konfigurieren

### Neue API-Endpoints

1. Service in `src/services/api.ts` hinzufügen
2. Types in `src/types/index.ts` definieren
3. Screen mit dem Service verbinden

## 📚 Nützliche Links

- [Expo Dokumentation](https://docs.expo.dev/)
- [EAS Build Dokumentation](https://docs.expo.dev/build/introduction/)
- [React Navigation](https://reactnavigation.org/)
- [React Native](https://reactnative.dev/)
- [TypeScript](https://www.typescriptlang.org/)

## 🐛 Fehlerbehebung

### Häufige Probleme

1. **Metro Bundler startet nicht:**
   ```bash
   npx expo start --clear
   ```

2. **iOS Build schlägt fehl:**
   ```bash
   eas build:clean
   npm run build:ios
   ```

3. **Android Build schlägt fehl:**
   ```bash
   eas build:clean
   npm run build:android
   ```

4. **EAS Login Probleme:**
   ```bash
   eas logout
   eas login
   ```

## 📄 Lizenz

ISC
