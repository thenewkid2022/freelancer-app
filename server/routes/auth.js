const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { validateUser, validateAuth } = require('../middleware/validator');
require('dotenv').config();

// Debug-Logging für JWT Secret
console.log('JWT Secret Status:', {
  isDefined: !!process.env.JWT_SECRET,
  length: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0,
  environment: process.env.NODE_ENV
});

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error('WARNING: JWT_SECRET is not set in production environment');
}

// Registrierung
router.post('/register', validateUser, async (req, res) => {
  const { email, password, name } = req.body;

  try {
    // Prüfen, ob der Benutzer bereits existiert
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'Benutzer existiert bereits' });
    }

    // Passwort hashen
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Neuen Benutzer erstellen
    user = new User({
      email,
      password: hashedPassword,
      name
    });
    await user.save();

    res.status(201).json({ message: 'Benutzer erfolgreich registriert' });
  } catch (err) {
    console.error('Fehler bei der Registrierung:', err);
    res.status(500).json({ message: 'Serverfehler' });
  }
});

// Login-Route
router.post('/login', validateAuth, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Debug-Logging für Login-Versuch
    console.log('Login-Versuch:', {
      email,
      timestamp: new Date().toISOString(),
      headers: req.headers
    });

    // Benutzer suchen
    const user = await User.findOne({ email });
    if (!user) {
      console.log('Benutzer nicht gefunden:', email);
      return res.status(400).json({ message: 'Ungültige Anmeldedaten' });
    }

    // Passwort überprüfen
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Falsches Passwort für Benutzer:', email);
      return res.status(400).json({ message: 'Ungültige Anmeldedaten' });
    }

    // JWT generieren
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Erfolgreiche Antwort
    res.json({
      token,
      userId: user._id,
      message: 'Login erfolgreich'
    });

  } catch (err) {
    console.error('Login-Fehler:', {
      error: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ message: 'Serverfehler bei der Anmeldung' });
  }
});

// Profil abrufen
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Benutzer nicht gefunden' });
    }
    res.json(user);
  } catch (err) {
    console.error('Fehler beim Abrufen des Profils:', err);
    res.status(500).json({ message: 'Serverfehler' });
  }
});

// Profil aktualisieren
router.put('/profile', auth, async (req, res) => {
  const { name, email } = req.body;

  try {
    // Prüfen, ob die E-Mail bereits von einem anderen Benutzer verwendet wird
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.user } });
      if (existingUser) {
        return res.status(400).json({ message: 'E-Mail wird bereits verwendet' });
      }
    }

    // Benutzer aktualisieren
    const user = await User.findByIdAndUpdate(
      req.user,
      { name, email },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (err) {
    console.error('Fehler beim Aktualisieren des Profils:', err);
    res.status(500).json({ message: 'Serverfehler' });
  }
});

// Passwort ändern
router.put('/change-password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    // Benutzer finden
    const user = await User.findById(req.user);
    if (!user) {
      return res.status(404).json({ message: 'Benutzer nicht gefunden' });
    }

    // Aktuelles Passwort überprüfen
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Aktuelles Passwort ist falsch' });
    }

    // Neues Passwort hashen
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Passwort aktualisieren
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Passwort erfolgreich geändert' });
  } catch (err) {
    console.error('Fehler beim Ändern des Passworts:', err);
    res.status(500).json({ message: 'Serverfehler' });
  }
});

module.exports = router;