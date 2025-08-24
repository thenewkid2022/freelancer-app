# 🚀 Deployment-Konfiguration

Dieser Ordner enthält alle Deployment-Konfigurationen für die Freelancer App.

## 📁 Struktur

```
deployment/
├── README.md           # Diese Datei
├── render.yaml         # Render.com Backend-Deployment
├── vercel.json         # Vercel.com Full-Stack-Deployment
└── mobile/             # Mobile-App Deployment (zukünftig)
    ├── eas.json        # EAS Build-Konfiguration
    └── app-store/      # App Store Connect Konfiguration
```

## 🌐 Web-App Deployment

### Render.com (Backend)
- **Datei:** `render.yaml`
- **Zweck:** Backend-API auf Render.com hosten
- **Pfad:** `web/server/` (aktualisiert)
- **Port:** 3001 (aktualisiert)

### Vercel.com (Full-Stack)
- **Datei:** `vercel.json`
- **Zweck:** Frontend + Backend auf Vercel deployen
- **Frontend:** `web/frontend/` (aktualisiert)
- **Backend:** `web/server/` (aktualisiert)

## 📱 Mobile-App Deployment

### EAS Build (Expo)
- **Datei:** `mobile/mobile-app/eas.json`
- **Zweck:** iOS/Android Builds für TestFlight/Play Store

### App Store Connect
- **Konfiguration:** In `mobile/mobile-app/app.config.js`
- **Deployment:** Über EAS CLI

## 🔧 Deployment-Befehle

### Web-App
```bash
# Backend auf Render deployen
cd web/server
git push origin main

# Frontend auf Vercel deployen
cd web/frontend
vercel --prod
```

### Mobile-App
```bash
# iOS Build für TestFlight
cd mobile/mobile-app
npm run deploy:ios

# Android Build für Play Store
cd mobile/mobile-app
npm run deploy:android
```

## 📋 Deployment-Checkliste

### Web-App
- [ ] Backend läuft auf Render.com
- [ ] Frontend läuft auf Vercel.com
- [ ] API-Endpoints funktionieren
- [ ] CORS konfiguriert
- [ ] Umgebungsvariablen gesetzt

### Mobile-App
- [ ] EAS Build konfiguriert
- [ ] iOS Build erfolgreich
- [ ] Android Build erfolgreich
- [ ] TestFlight freigegeben
- [ ] Play Store freigegeben

## 🐛 Häufige Probleme

### Pfad-Fehler
- **Problem:** Veraltete Pfade nach Projektumstrukturierung
- **Lösung:** Alle Pfade auf `web/` aktualisiert

### Port-Konflikte
- **Problem:** Backend läuft auf Port 3001, nicht 5000
- **Lösung:** `render.yaml` aktualisiert

### CORS-Fehler
- **Problem:** Frontend kann Backend nicht erreichen
- **Lösung:** CORS-Origin in `vercel.json` konfiguriert

## 🔄 Updates

Nach Änderungen an der Projektstruktur:
1. **Deployment-Dateien aktualisieren**
2. **Pfade korrigieren**
3. **Ports überprüfen**
4. **CORS-Einstellungen anpassen**
5. **Deployment testen**

---

**💡 Tipp:** Der deployment/ Ordner macht weiterhin Sinn, da er alle Deployment-Konfigurationen zentral verwaltet!
