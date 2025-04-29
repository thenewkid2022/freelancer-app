const express = require('express');
const router = express.Router();
const TimeEntry = require('../../models/TimeEntry');
const auth = require('../../middleware/auth');
const { monitorMongoOperation } = require('../../utils/monitoring');

/**
 * @swagger
 * /api/v1/time-entries:
 *   get:
 *     summary: Alle Zeiterfassungen abrufen (v1)
 *     tags: [TimeEntries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: project
 *         schema:
 *           type: string
 *         description: Filter nach Projekt
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter nach Startdatum
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter nach Enddatum
 *     responses:
 *       200:
 *         description: Liste der Zeiterfassungen
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TimeEntry'
 *       401:
 *         description: Nicht autorisiert
 *       500:
 *         description: Serverfehler
 */
router.get('/', auth, async (req, res) => {
  try {
    const query = {};
    if (req.query.project) query.project = req.query.project;
    if (req.query.startDate) query.startTime = { $gte: new Date(req.query.startDate) };
    if (req.query.endDate) query.endTime = { $lte: new Date(req.query.endDate) };

    const timeEntries = await monitorMongoOperation(
      'find',
      'timeentries',
      () => TimeEntry.find(query).sort({ startTime: -1 })
    );

    res.json(timeEntries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/time-entries:
 *   post:
 *     summary: Neue Zeiterfassung erstellen (v1)
 *     tags: [TimeEntries]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TimeEntry'
 *     responses:
 *       201:
 *         description: Zeiterfassung erfolgreich erstellt
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TimeEntry'
 *       400:
 *         description: Ungültige Eingabedaten
 *       401:
 *         description: Nicht autorisiert
 *       500:
 *         description: Serverfehler
 */
router.post('/', auth, async (req, res) => {
  try {
    const timeEntry = new TimeEntry(req.body);
    const savedEntry = await monitorMongoOperation(
      'save',
      'timeentries',
      () => timeEntry.save()
    );
    res.status(201).json(savedEntry);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/time-entries/{id}:
 *   put:
 *     summary: Zeiterfassung aktualisieren (v1)
 *     tags: [TimeEntries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID der Zeiterfassung
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TimeEntry'
 *     responses:
 *       200:
 *         description: Zeiterfassung erfolgreich aktualisiert
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TimeEntry'
 *       400:
 *         description: Ungültige Eingabedaten
 *       401:
 *         description: Nicht autorisiert
 *       404:
 *         description: Zeiterfassung nicht gefunden
 *       500:
 *         description: Serverfehler
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const timeEntry = await monitorMongoOperation(
      'findByIdAndUpdate',
      'timeentries',
      () => TimeEntry.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      )
    );

    if (!timeEntry) {
      return res.status(404).json({ error: 'Zeiterfassung nicht gefunden' });
    }

    res.json(timeEntry);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/time-entries/{id}:
 *   delete:
 *     summary: Zeiterfassung löschen (v1)
 *     tags: [TimeEntries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID der Zeiterfassung
 *     responses:
 *       200:
 *         description: Zeiterfassung erfolgreich gelöscht
 *       401:
 *         description: Nicht autorisiert
 *       404:
 *         description: Zeiterfassung nicht gefunden
 *       500:
 *         description: Serverfehler
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const timeEntry = await monitorMongoOperation(
      'findByIdAndDelete',
      'timeentries',
      () => TimeEntry.findByIdAndDelete(req.params.id)
    );

    if (!timeEntry) {
      return res.status(404).json({ error: 'Zeiterfassung nicht gefunden' });
    }

    res.json({ message: 'Zeiterfassung erfolgreich gelöscht' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 