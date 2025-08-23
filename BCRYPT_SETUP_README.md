# BCRYPT HASH GENERATOR - ANLEITUNG

## Übersicht
Dieses Skript generiert einen bcrypt-Hash für das Passwort "Test" und zeigt die entsprechenden MongoDB-Update-Befehle an.

## Voraussetzungen

### 1. Node.js installieren
Stelle sicher, dass Node.js auf deinem System installiert ist:
```bash
node --version
npm --version
```

### 2. bcryptjs installieren
Das Projekt verwendet bereits `bcryptjs`. Falls du es separat installieren möchtest:
```bash
npm install bcryptjs
```

## Verwendung

### 1. Skript ausführen
```bash
node generate_bcrypt_hash.js
```

### 2. Ausgabe verstehen
Das Skript gibt folgende Informationen aus:
- Das verwendete Passwort (Test)
- Die Anzahl der Salt-Rounds (10)
- Den generierten bcrypt-Hash
- MongoDB-Update-Befehle

### 3. Hash in MongoDB aktualisieren

#### Option A: Über E-Mail-Adresse
```javascript
db.users.updateOne(
  { email: "deine_email@example.com" }, // Ersetze mit der tatsächlichen E-Mail
  { $set: { password: "dein_generierter_hash" } } // Ersetze mit dem tatsächlichen Hash
);
```

#### Option B: Über ObjectId
```javascript
db.users.updateOne(
  { _id: ObjectId("dein_benutzer_id") }, // Ersetze mit der tatsächlichen Benutzer-ID
  { $set: { password: "dein_generierter_hash" } } // Ersetze mit dem tatsächlichen Hash
);
```

## MongoDB-Verbindung

### 1. MongoDB-Shell starten
```bash
mongosh "deine_connection_string"
```

### 2. Datenbank auswählen
```javascript
use deine_datenbank_name
```

### 3. Benutzer finden
```javascript
// Alle Benutzer anzeigen
db.users.find()

// Spezifischen Benutzer suchen
db.users.findOne({ email: "deine_email@example.com" })
```

## Testen

### 1. Anmeldung testen
Verwende das Passwort **Test**, um dich in deiner Anwendung anzumelden.

### 2. Funktionalität überprüfen
- Anmeldung sollte erfolgreich sein
- Passwort-Vergleich funktioniert korrekt
- JWT-Token wird generiert

## Sicherheitshinweise

- **Salt Rounds**: Das Skript verwendet 10 Salt-Rounds, was ein guter Kompromiss zwischen Sicherheit und Performance ist
- **Hash-Speicherung**: Der Hash wird sicher in der Datenbank gespeichert
- **Passwort-Vergleich**: Die Anwendung vergleicht eingegebene Passwörter mit dem Hash über `bcrypt.compare()`

## Fehlerbehebung

### Häufige Probleme

1. **bcryptjs nicht gefunden**
   ```bash
   npm install bcryptjs
   ```

2. **MongoDB-Verbindung fehlgeschlagen**
   - Überprüfe die Connection-String
   - Stelle sicher, dass MongoDB läuft

3. **Hash wird nicht akzeptiert**
   - Überprüfe, ob der Hash korrekt kopiert wurde
   - Stelle sicher, dass keine zusätzlichen Leerzeichen vorhanden sind

## Technische Details

- **Algorithmus**: bcrypt
- **Salt Rounds**: 10
- **Hash-Format**: `$2a$10$...`
- **Kompatibilität**: Vollständig kompatibel mit der bestehenden Anwendung

## Support

Bei Problemen überprüfe:
1. Node.js-Version (empfohlen: 14+)
2. MongoDB-Version (empfohlen: 4.0+)
3. Netzwerkverbindung zur Datenbank
4. Berechtigungen für Datenbank-Updates
