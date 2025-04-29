const express = require('express');
const router = express.Router();
const TimeEntry = require('../models/TimeEntry');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

// GET /api/time-entries
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'startTime', sortOrder = 'desc', startDate, endDate, project } = req.query;
    
    // Verstärkte Cache-Header
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, private, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    });
    
    // ETag deaktivieren
    res.set('ETag', null);

    // Filter erstellen
    const filter = { userId: req.user };
    if (startDate) {
      filter.startTime = filter.startTime || {};
      filter.startTime.$gte = new Date(startDate);
    }
    if (endDate) {
      filter.startTime = filter.startTime || {};
      filter.startTime.$lte = new Date(endDate);
    }
    if (project) {
      filter.project = project;
    }

    // Sortierung
    const sort = {
      [sortBy]: sortOrder === 'desc' ? -1 : 1
    };

    // Pagination
    const skip = (page - 1) * limit;

    // Einträge abrufen
    const entries = await TimeEntry.find(filter)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);

    // Gesamtanzahl für Pagination
    const total = await TimeEntry.countDocuments(filter);

    res.json({
      entries,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error('Fehler beim Abrufen der Zeiterfassungen:', err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/time-entries
router.post('/', auth, async (req, res) => {
  try {
    const timeEntry = new TimeEntry({
      ...req.body,
      userId: req.user
    });
    const savedEntry = await timeEntry.save();
    res.status(201).json(savedEntry);
  } catch (err) {
    console.error('Fehler beim Erstellen der Zeiterfassung:', err);
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/time-entries/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const timeEntry = await TimeEntry.findOneAndUpdate(
      { _id: req.params.id, userId: req.user },
      req.body,
      { new: true }
    );
    if (!timeEntry) {
      return res.status(404).json({ message: 'Zeiterfassung nicht gefunden' });
    }
    res.json(timeEntry);
  } catch (err) {
    console.error('Fehler beim Aktualisieren der Zeiterfassung:', err);
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/time-entries/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const timeEntry = await TimeEntry.findOneAndDelete({
      _id: req.params.id,
      userId: req.user
    });
    if (!timeEntry) {
      return res.status(404).json({ message: 'Zeiterfassung nicht gefunden' });
    }
    res.json({ message: 'Zeiterfassung erfolgreich gelöscht' });
  } catch (err) {
    console.error('Fehler beim Löschen der Zeiterfassung:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 