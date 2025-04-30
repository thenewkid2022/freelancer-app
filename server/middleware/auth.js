const jwt = require('jsonwebtoken');
require('dotenv').config();

const auth = (req, res, next) => {
  try {
    // Debug-Logging für alle eingehenden Anfragen
    console.log('Auth Middleware - Eingehende Anfrage:', {
      method: req.method,
      path: req.path,
      origin: req.headers.origin,
      host: req.headers.host,
      headers: {
        ...req.headers,
        authorization: req.headers.authorization ? 'Bearer [FILTERED]' : undefined
      },
      timestamp: new Date().toISOString()
    });

    // Token aus dem Authorization Header extrahieren
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      console.log('Kein Authorization Header gefunden - Verfügbare Header:', Object.keys(req.headers));
      return res.status(401).json({ 
        error: 'Authentifizierungsfehler',
        details: 'Kein Authorization Header'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      console.log('Kein Token im Authorization Header');
      return res.status(401).json({ 
        error: 'Authentifizierungsfehler',
        details: 'Kein Token gefunden'
      });
    }

    console.log('Token-Format überprüfen:', {
      length: token.length,
      startsWithBearer: authHeader.startsWith('Bearer '),
      containsSpaces: token.includes(' ')
    });

    // JWT Secret Check
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET nicht in Umgebungsvariablen gefunden');
      console.log('Verfügbare Umgebungsvariablen:', Object.keys(process.env));
      return res.status(500).json({
        error: 'Serverfehler',
        details: 'Authentifizierungskonfiguration unvollständig'
      });
    }

    // Token verifizieren
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token erfolgreich decodiert:', {
        userId: decoded.userId,
        exp: new Date(decoded.exp * 1000).toISOString(),
        iat: new Date(decoded.iat * 1000).toISOString(),
        timeUntilExpiration: Math.floor((decoded.exp * 1000 - Date.now()) / 1000) + ' Sekunden'
      });

      req.user = decoded.userId;
      next();
    } catch (jwtError) {
      console.error('JWT Verifikationsfehler:', {
        name: jwtError.name,
        message: jwtError.message,
        expiredAt: jwtError.expiredAt
      });
      
      return res.status(401).json({ 
        error: 'Authentifizierungsfehler',
        details: jwtError.name === 'TokenExpiredError' ? 'Token abgelaufen' : 'Ungültiger Token'
      });
    }
  } catch (err) {
    console.error('Auth Middleware Fehler:', {
      name: err.name,
      message: err.message,
      code: err.code,
      stack: err.stack
    });
    res.status(401).json({ 
      error: 'Authentifizierungsfehler',
      details: 'Interner Fehler bei der Authentifizierung'
    });
  }
};

module.exports = auth;