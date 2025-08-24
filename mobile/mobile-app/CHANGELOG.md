# Changelog

Alle wichtigen Änderungen an der FreelancerApp werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt folgt [Semantic Versioning](https://semver.org/lang/de/).

## [Unreleased]

### Geplant
- Verbesserte Offline-Funktionalität
- Push-Benachrichtigungen
- Dark Mode

## [1.0.1] - 2024-12-01

### Behoben
- Netzwerkfehler im TestFlight behoben
- API-URL für Produktionsumgebung korrigiert
- Verbindung zu Render-Backend hergestellt

### Technische Änderungen
- API-URL von lokaler IP auf `https://freelancer-app-1g8o.onrender.com/api` geändert
- Dynamische API-URL-Konfiguration implementiert (Entwicklung vs. Produktion)

## [1.0.0] - 2024-12-01

### Hinzugefügt
- Erste TestFlight-Version
- Benutzer-Authentifizierung (Login/Register)
- Zeiterfassung für Projekte
- Projektverwaltung
- Statistiken und Berichte
- Export-Funktionalität
- Tagesausgleich und Merge-Funktionen

### Technische Features
- React Native mit Expo
- TypeScript-Unterstützung
- AsyncStorage für lokale Datenspeicherung
- Axios für API-Kommunikation
- Responsive UI-Design

---

## Versionsschema

- **MAJOR** (1.0.0): Große Änderungen, möglicherweise nicht rückwärtskompatibel
- **MINOR** (1.1.0): Neue Features, rückwärtskompatibel
- **PATCH** (1.0.1): Bugfixes, rückwärtskompatibel

## Build-Nummern

- **Build 1**: Version 1.0.0
- **Build 2**: Version 1.0.1 (aktuell)
