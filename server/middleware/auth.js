const jwt = require('jsonwebtoken');
require('dotenv').config();

const auth = (req, res, next) => {
  try {
    // Debug-Logging für alle eingehenden Anfragen
    console.log('Auth Middleware - Eingehende Anfrage:', {
      method: req.method,
      path: req.path,
      headers: req.headers
    });

    // Token aus dem Authorization Header extrahieren
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      console.log('Kein Authorization Header gefunden');
      return res.status(401).json({ error: 'Authentifizierungsfehler' });
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      console.log('Kein Token im Authorization Header');
      return res.status(401).json({ error: 'Authentifizierungsfehler' });
    }

    console.log('Extrahierter Token:', token.substring(0, 20) + '...');

    // JWT Secret aus der Umgebungsvariable oder Fallback
    const jwtSecret = process.env.JWT_SECRET || 'FreelancerApp2025SecretKey';
    console.log('Verwendeter JWT Secret:', jwtSecret.substring(0, 5) + '...');

    // Token verifizieren
    const decoded = jwt.verify(token, jwtSecret);
    console.log('Decodierter Token:', {
      userId: decoded.userId,
      exp: new Date(decoded.exp * 1000).toISOString(),
      iat: new Date(decoded.iat * 1000).toISOString()
    });

    // User-ID im Request-Objekt speichern
    req.user = decoded.userId;
    console.log('Gespeicherte User ID:', req.user);
    next();
  } catch (err) {
    console.error('Auth Middleware Fehler:', {
      name: err.name,
      message: err.message,
      code: err.code,
      stack: err.stack
    });
    res.status(401).json({ error: 'Authentifizierungsfehler' });
  }
};

module.exports = auth;