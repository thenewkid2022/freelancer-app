const bcrypt = require('bcryptjs');

async function generateHash() {
  try {
    const password = 'Test';
    const saltRounds = 10;
    
    // Generiere den bcrypt-Hash
    const hash = await bcrypt.hash(password, saltRounds);
    
    console.log('=== BCRYPT HASH GENERATOR ===');
    console.log(`Passwort: ${password}`);
    console.log(`Salt Rounds: ${saltRounds}`);
    console.log(`\nNeuer bcrypt-Hash:`);
    console.log(hash);
    console.log('\n=== MONGODB UPDATE ANWEISUNG ===');
    console.log('Verwende den folgenden Befehl in der MongoDB-Shell:');
    console.log('\ndb.users.updateOne(');
    console.log('  { email: "deine_email@example.com" }, // Ersetze mit der tatsächlichen E-Mail');
    console.log('  { $set: { password: "' + hash + '" } }');
    console.log(');');
    console.log('\n=== ALTERNATIV MIT OBJECTID ===');
    console.log('db.users.updateOne(');
    console.log('  { _id: ObjectId("dein_benutzer_id") }, // Ersetze mit der tatsächlichen Benutzer-ID');
    console.log('  { $set: { password: "' + hash + '" } }');
    console.log(');');
    
  } catch (error) {
    console.error('Fehler beim Generieren des Hashes:', error);
  }
}

// Führe die Funktion aus
generateHash();
