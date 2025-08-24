#!/bin/bash

# iOS TestFlight Deployment Script
# Führen Sie dieses Skript aus, um die App für TestFlight zu deployen

echo "🚀 iOS TestFlight Deployment gestartet..."

# 1. Abhängigkeiten installieren
echo "📦 Installiere Abhängigkeiten..."
npm install

# 2. iOS Build erstellen
echo "🏗️ Erstelle iOS Build..."
eas build --platform ios --profile production

# 3. Build-Status prüfen
echo "⏳ Warte auf Build-Abschluss..."
eas build:list --platform ios --limit 1

# 4. App für TestFlight hochladen
echo "📤 Lade App für TestFlight hoch..."
eas submit --platform ios

echo "✅ iOS TestFlight Deployment abgeschlossen!"
echo "📱 App wird in App Store Connect verarbeitet..."
echo "🔍 Überprüfen Sie den Status in App Store Connect"
