# 🚀 iOS TestFlight Deployment Guide

## Voraussetzungen

### 1. Apple Developer Account
- ✅ Apple Developer Program Mitgliedschaft (99$/Jahr)
- ✅ Zugriff auf App Store Connect
- ✅ Zugriff auf Certificates, Identifiers & Profiles

### 2. Expo Account
- ✅ Expo-Konto erstellen: https://expo.dev/signup
- ✅ EAS CLI installiert: `npm install -g eas-cli`

### 3. App Store Connect Setup
- ✅ Neue App in App Store Connect erstellen
- ✅ Bundle ID: `com.yourcompany.freelancerapp`
- ✅ App-Informationen ausgefüllt

## 🔧 Konfiguration

### 1. EAS Login
```bash
cd mobile/FreelancerApp
eas login
```

### 2. Projekt-ID abrufen
```bash
eas project:init
```

### 3. Bundle Identifier anpassen
In `app.config.js` ändern:
```javascript
bundleIdentifier: "com.ihrecompany.freelancerapp"
```

### 4. Apple Team ID eintragen
In `eas.json` eintragen:
```json
"appleTeamId": "IHRE_TEAM_ID"
```

## 🏗️ Build erstellen

### 1. iOS Production Build
```bash
npm run build:ios
# oder
eas build --platform ios --profile production
```

### 2. Build-Status überwachen
```bash
eas build:list --platform ios
```

### 3. Build herunterladen (optional)
```bash
eas build:download
```

## 📤 TestFlight hochladen

### 1. App submit
```bash
npm run submit:ios
# oder
eas submit --platform ios
```

### 2. App Store Connect überprüfen
- Gehen Sie zu [App Store Connect](https://appstoreconnect.apple.com)
- Wählen Sie Ihre App
- Gehen Sie zu "TestFlight"
- Warten Sie auf die Verarbeitung

## 🧪 TestFlight Testing

### 1. Tester hinzufügen
- **Externe Tester:** E-Mail-Adressen eingeben
- **Interne Tester:** Team-Mitglieder auswählen

### 2. Build freigeben
- Build auswählen
- "Provide to External Testers" klicken
- Tester-Gruppe auswählen
- Freigeben

### 3. Tester benachrichtigen
- Tester erhalten E-Mail mit TestFlight-Link
- TestFlight-App installieren
- App testen

## 🔄 Updates deployen

### 1. Version erhöhen
In `app.config.js`:
```javascript
version: "1.0.1",
ios: {
  buildNumber: "2"
}
```

### 2. Neuen Build erstellen
```bash
npm run deploy:ios
```

## 🐛 Häufige Probleme

### Build schlägt fehl
```bash
# Cache löschen
eas build:clean

# Neuen Build starten
npm run build:ios
```

### Submit schlägt fehl
```bash
# Status prüfen
eas submit:status

# Erneut versuchen
npm run submit:ios
```

### App wird nicht verarbeitet
- Warten Sie 24-48 Stunden
- Überprüfen Sie App Store Connect
- Kontaktieren Sie Apple Support

## 📱 TestFlight-App installieren

### Für Tester:
1. **TestFlight-App** aus App Store installieren
2. **E-Mail öffnen** mit TestFlight-Link
3. **App installieren** über TestFlight
4. **App testen** und Feedback geben

### Für Entwickler:
1. **TestFlight-App** installieren
2. **Interne Tester** werden automatisch hinzugefügt
3. **Builds testen** vor externer Freigabe

## ✅ Checkliste

- [ ] Apple Developer Account aktiv
- [ ] App Store Connect App erstellt
- [ ] EAS CLI installiert und eingeloggt
- [ ] Bundle ID konfiguriert
- [ ] Apple Team ID eingetragen
- [ ] iOS Build erfolgreich
- [ ] App erfolgreich submitted
- [ ] App in App Store Connect verarbeitet
- [ ] TestFlight Build freigegeben
- [ ] Tester benachrichtigt

## 🎯 Nächste Schritte

Nach erfolgreichem TestFlight-Deployment:
1. **Feedback sammeln** von Testern
2. **Bugs beheben** basierend auf Feedback
3. **App Store Release** vorbereiten
4. **Marketing-Material** erstellen
5. **App Store Review** einreichen

---

**Viel Erfolg beim TestFlight-Deployment! 🚀**
