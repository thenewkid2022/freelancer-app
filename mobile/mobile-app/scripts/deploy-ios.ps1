# iOS TestFlight Deployment Script für Windows
# Führen Sie dieses Skript in PowerShell aus

Write-Host "🚀 iOS TestFlight Deployment gestartet..." -ForegroundColor Green

# 1. Abhängigkeiten installieren
Write-Host "📦 Installiere Abhängigkeiten..." -ForegroundColor Yellow
npm install

# 2. iOS Build erstellen
Write-Host "🏗️ Erstelle iOS Build..." -ForegroundColor Yellow
eas build --platform ios --profile production

# 3. Build-Status prüfen
Write-Host "⏳ Warte auf Build-Abschluss..." -ForegroundColor Yellow
eas build:list --platform ios --limit 1

# 4. App für TestFlight hochladen
Write-Host "📤 Lade App für TestFlight hoch..." -ForegroundColor Yellow
eas submit --platform ios

Write-Host "✅ iOS TestFlight Deployment abgeschlossen!" -ForegroundColor Green
Write-Host "📱 App wird in App Store Connect verarbeitet..." -ForegroundColor Cyan
Write-Host "🔍 Überprüfen Sie den Status in App Store Connect" -ForegroundColor Cyan
