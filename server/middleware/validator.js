const { body, validationResult } = require('express-validator');
const { ValidationError } = require('./errorHandler');

// Validierung für TimeEntry
const validateTimeEntry = [
  body('startTime')
    .isISO8601()
    .withMessage('Startzeit muss ein gültiges ISO8601-Datum sein'),
  body('endTime')
    .isISO8601()
    .withMessage('Endzeit muss ein gültiges ISO8601-Datum sein')
    .custom((endTime, { req }) => {
      if (new Date(endTime) <= new Date(req.body.startTime)) {
        throw new Error('Endzeit muss nach Startzeit liegen');
      }
      return true;
    }),
  body('project')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Projektname muss zwischen 1 und 100 Zeichen lang sein'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Beschreibung muss zwischen 1 und 500 Zeichen lang sein'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validierungsfehler', errors.array());
    }
    next();
  }
];

// Validierung für Benutzer
const validateUser = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Gültige E-Mail-Adresse erforderlich'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Passwort muss mindestens 8 Zeichen lang sein')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/)
    .withMessage('Passwort muss Buchstaben und Zahlen enthalten'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name muss zwischen 2 und 50 Zeichen lang sein'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validierungsfehler', errors.array());
    }
    next();
  }
];

// Validierung für Authentifizierung
const validateAuth = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Gültige E-Mail-Adresse erforderlich'),
  body('password')
    .notEmpty()
    .withMessage('Passwort erforderlich'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validierungsfehler', errors.array());
    }
    next();
  }
];

module.exports = {
  validateTimeEntry,
  validateUser,
  validateAuth
}; 