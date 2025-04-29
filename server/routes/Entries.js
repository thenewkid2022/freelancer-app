const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const TimeEntry = require('../models/TimeEntry');
const auth = require('../middleware/auth');
const { cacheMiddleware } = require('../middleware/cache');

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
  body('description')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Beschreibung muss zwischen 1 und 500 Zeichen lang sein'),
  body('project')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Projektname muss zwischen 1 und 100 Zeichen lang sein'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        status: 'error',
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    }
    next();
  }
];

// GET /api/time-entries
router.get('/', auth, cacheMiddleware(300), async (req, res) => {
  try {
    const timeEntries = await TimeEntry.find({ userId: req.user })
      .sort({ startTime: -1 });
    res.json({ timeEntries });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/time-entries
router.post('/', [auth, validateTimeEntry], async (req, res) => {
  try {
    const timeEntry = new TimeEntry({
      ...req.body,
      userId: req.user
    });
    const newTimeEntry = await timeEntry.save();
    res.status(201).json(newTimeEntry);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/time-entries/:id
router.put('/:id', [auth, validateTimeEntry], async (req, res) => {
  try {
    const timeEntry = await TimeEntry.findOne({
      _id: req.params.id,
      userId: req.user
    });

    if (!timeEntry) {
      return res.status(404).json({ message: 'Zeiteintrag nicht gefunden' });
    }

    Object.assign(timeEntry, req.body);
    const updatedTimeEntry = await timeEntry.save();
    res.json(updatedTimeEntry);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/time-entries/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const timeEntry = await TimeEntry.findOne({
      _id: req.params.id,
      userId: req.user
    });

    if (!timeEntry) {
      return res.status(404).json({ message: 'Zeiteintrag nicht gefunden' });
    }

    await TimeEntry.deleteOne({ _id: req.params.id, userId: req.user });
    res.json({ message: 'Zeiteintrag gelöscht' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 