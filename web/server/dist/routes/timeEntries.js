"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const validator_1 = require("../middleware/validator");
const zod_1 = require("zod");
const TimeEntry_1 = require("../models/TimeEntry");
const errors_1 = require("../utils/errors");
const mongoose_1 = require("mongoose");
const date_fns_1 = require("date-fns");
const date_fns_tz_1 = require("date-fns-tz");
const router = (0, express_1.Router)();
// Validierungsschemas
const createTimeEntrySchema = zod_1.z.object({
    body: zod_1.z.object({
        projectNumber: zod_1.z.string().min(1, 'Projektnummer ist erforderlich'),
        description: zod_1.z.string().optional(),
        startTime: zod_1.z.string().datetime(),
        endTime: zod_1.z.string().datetime().optional(),
        tags: zod_1.z.array(zod_1.z.string()).optional()
    })
});
const updateTimeEntrySchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string()
    }),
    body: zod_1.z.object({
        projectNumber: zod_1.z.string().min(1).optional(),
        description: zod_1.z.string().min(1).optional(),
        startTime: zod_1.z.string().datetime().optional(),
        endTime: zod_1.z.string().datetime().optional(),
        correctedDuration: zod_1.z.number().nullable().optional(),
        tags: zod_1.z.array(zod_1.z.string()).optional()
    })
});
/**
 * @swagger
 * /api/time-entries:
 *   post:
 *     tags: [TimeEntries]
 *     summary: Erstellt einen neuen Zeiteintrag
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectNumber
 *               - projectName
 *               - description
 *               - startTime
 *               - hourlyRate
 *             properties:
 *               projectNumber:
 *                 type: string
 *               projectName:
 *                 type: string
 *               description:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               hourlyRate:
 *                 type: number
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Zeiteintrag erfolgreich erstellt
 *       400:
 *         description: Validierungsfehler
 *       401:
 *         description: Nicht authentifiziert
 */
router.post('/', auth_1.auth, (0, validator_1.validateRequest)(createTimeEntrySchema), async (req, res, next) => {
    try {
        const { projectNumber, description, startTime, endTime, tags } = req.body;
        const userId = req.user._id;
        let duration = undefined;
        if (startTime && endTime) {
            duration = Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000);
        }
        // Tagesgrenzen in Europe/Zurich berechnen
        const timeZone = 'Europe/Zurich';
        const zonedDate = (0, date_fns_tz_1.toZonedTime)(new Date(startTime), timeZone);
        const startOfLocalDay = (0, date_fns_1.startOfDay)(zonedDate);
        const endOfLocalDay = (0, date_fns_1.endOfDay)(zonedDate);
        console.log('Merge-Check:', {
            userId,
            projectNumber,
            startOfLocalDay: startOfLocalDay.toISOString(),
            endOfLocalDay: endOfLocalDay.toISOString(),
            startTime,
            endTime
        });
        const existingEntries = await TimeEntry_1.TimeEntry.find({
            userId,
            projectNumber,
            startTime: { $gte: startOfLocalDay, $lte: endOfLocalDay },
            endTime: { $exists: true, $ne: null }
        });
        console.log('existingEntries:', existingEntries.map(e => ({
            _id: e._id,
            startTime: e.startTime,
            endTime: e.endTime,
            description: e.description
        })));
        if (existingEntries.length > 0 && endTime) {
            // Alle Beschreibungen, Dauern, Tags, Start- und Endzeiten zusammenführen
            const allDescriptions = existingEntries.map(e => e.description).concat(description).filter(Boolean);
            const allDurations = existingEntries.map(e => e.duration || 0).reduce((a, b) => a + b, 0) + (duration || 0);
            const allTags = Array.from(new Set(existingEntries.flatMap(e => e.tags || []).concat(tags || [])));
            const earliestStart = [new Date(startTime), ...existingEntries.map(e => new Date(e.startTime))].sort()[0];
            const latestEnd = [new Date(endTime), ...existingEntries.map(e => new Date(e.endTime))].sort().reverse()[0];
            // Lösche alle alten Einträge
            await TimeEntry_1.TimeEntry.deleteMany({
                _id: { $in: existingEntries.map(e => e._id) }
            });
            // Lege einen neuen, zusammengefassten Eintrag an
            const mergedEntry = await TimeEntry_1.TimeEntry.create({
                userId,
                projectNumber,
                description: allDescriptions.join('\n---\n'),
                startTime: earliestStart,
                endTime: latestEnd,
                duration: allDurations,
                tags: allTags
            });
            return res.status(201).json(mergedEntry);
        }
        else {
            // Neuen Eintrag anlegen (auch für laufende Einträge ohne endTime!)
            const timeEntry = await TimeEntry_1.TimeEntry.create({
                ...req.body,
                userId,
                duration
            });
            return res.status(201).json(timeEntry);
        }
    }
    catch (error) {
        next(error);
    }
});
/**
 * @swagger
 * /api/time-entries:
 *   get:
 *     tags: [TimeEntries]
 *     summary: Gibt alle Zeiteinträge des Benutzers zurück
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Liste der Zeiteinträge
 *       401:
 *         description: Nicht authentifiziert
 */
router.get('/', auth_1.auth, async (req, res, next) => {
    try {
        const query = {};
        query.userId = req.user._id;
        const timeEntries = await TimeEntry_1.TimeEntry.find(query)
            .sort({ startTime: -1 })
            .populate('userId', 'name email');
        // Mapping: project-Objekt ergänzen
        const mappedEntries = timeEntries.map(entry => ({
            ...entry.toObject(),
            project: {
                _id: entry.projectNumber
            }
        }));
        res.json(mappedEntries);
    }
    catch (error) {
        next(error);
    }
});
/**
 * @swagger
 * /api/time-entries/active:
 *   get:
 *     tags: [TimeEntries]
 *     summary: Gibt den laufenden Zeiteintrag des Benutzers zurück
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Zeiteintrag gefunden
 *       401:
 *         description: Nicht authentifiziert
 */
router.get('/active', auth_1.auth, async (req, res, next) => {
    try {
        const activeEntry = await TimeEntry_1.TimeEntry.findOne({
            userId: req.user._id,
            $or: [
                { endTime: { $exists: false } },
                { endTime: null }
            ]
        }).sort({ startTime: -1 });
        if (!activeEntry) {
            return res.json(null);
        }
        // Mapping wie bei anderen Routen
        const mappedEntry = {
            ...activeEntry.toObject(),
            project: {
                _id: activeEntry.projectNumber
            }
        };
        res.json(mappedEntry);
    }
    catch (error) {
        console.error('Fehler in /api/time-entries/active:', error);
        next(error);
    }
});
/**
 * @swagger
 * /api/time-entries/merged:
 *   get:
 *     tags: [TimeEntries]
 *     summary: Gibt zusammengeführte Zeiteinträge des Benutzers zurück
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Startdatum im Format YYYY-MM-DD (lokale Zeit)
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Enddatum im Format YYYY-MM-DD (lokale Zeit)
 *       - in: query
 *         name: timezone
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Liste der zusammengeführten Zeiteinträge
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   project:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                   date:
 *                     type: string
 *                     format: date
 *                   totalDuration:
 *                     type: number
 *                   comments:
 *                     type: array
 *                     items:
 *                       type: string
 *                   entryIds:
 *                     type: array
 *                     items:
 *                       type: string
 *       400:
 *         description: Fehlende oder ungültige Parameter
 *       401:
 *         description: Nicht authentifiziert
 */
router.get('/merged', auth_1.auth, async (req, res, next) => {
    try {
        const { startDate, endDate, timezone } = req.query;
        if (!startDate || !endDate) {
            throw new errors_1.BadRequestError('startDate und endDate sind erforderlich');
        }
        // Zeitzone dynamisch aus Query übernehmen, Fallback Europe/Zurich
        const tz = typeof timezone === 'string' && timezone ? timezone : 'Europe/Zurich';
        const mergedEntries = await TimeEntry_1.TimeEntry.aggregate([
            {
                $match: {
                    userId: new mongoose_1.Types.ObjectId(req.user._id),
                    startTime: { $exists: true, $ne: null, $type: "date" },
                    endTime: { $exists: true, $ne: null, $type: "date" }
                },
            },
            {
                $group: {
                    _id: {
                        projectNumber: "$projectNumber",
                        date: {
                            $dateToString: {
                                format: "%Y-%m-%d",
                                date: "$startTime",
                                timezone: tz,
                            },
                        },
                    },
                    totalDuration: { $sum: "$duration" },
                    comments: { $push: "$description" },
                    entryIds: { $push: "$_id" },
                    startTime: { $min: "$startTime" },
                    endTime: { $max: "$endTime" },
                    projectName: { $first: "$projectName" },
                    correctedDurations: { $push: "$correctedDuration" },
                },
            },
            {
                $project: {
                    _id: 0,
                    projectNumber: "$_id.projectNumber",
                    date: "$_id.date",
                    totalDuration: 1,
                    comments: 1,
                    entryIds: 1,
                    startTime: 1,
                    endTime: 1,
                    projectName: 1,
                    correctedDuration: {
                        $sum: {
                            $filter: {
                                input: "$correctedDurations",
                                as: "cd",
                                cond: { $ne: ["$$cd", null] }
                            }
                        }
                    },
                    hasCorrectedDuration: {
                        $gt: [
                            {
                                $size: {
                                    $filter: {
                                        input: "$correctedDurations",
                                        as: "cd",
                                        cond: { $ne: ["$$cd", null] }
                                    }
                                }
                            },
                            0
                        ]
                    }
                },
            },
            {
                $match: {
                    date: { $gte: startDate, $lte: endDate }
                }
            },
        ]);
        console.log('Merged Export:', { startDate, endDate, timezone: tz });
        console.log('Merged Result:', mergedEntries.length, mergedEntries.map(e => e.date));
        res.json(mergedEntries);
    }
    catch (error) {
        next(error);
    }
});
/**
 * @swagger
 * /api/time-entries/{id}:
 *   get:
 *     tags: [TimeEntries]
 *     summary: Gibt einen spezifischen Zeiteintrag zurück
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Zeiteintrag gefunden
 *       401:
 *         description: Nicht authentifiziert
 *       403:
 *         description: Keine Berechtigung
 *       404:
 *         description: Zeiteintrag nicht gefunden
 */
router.get('/:id', auth_1.auth, async (req, res, next) => {
    try {
        const timeEntry = await TimeEntry_1.TimeEntry.findById(req.params.id)
            .populate('userId', 'name email');
        if (!timeEntry) {
            throw new errors_1.NotFoundError('Zeiteintrag nicht gefunden');
        }
        if (timeEntry.userId.toString() !== req.user._id.toString()) {
            throw new errors_1.ForbiddenError('Keine Berechtigung für diesen Zeiteintrag');
        }
        const mappedEntry = {
            ...timeEntry.toObject(),
            project: {
                _id: timeEntry.projectNumber
            }
        };
        res.json(mappedEntry);
    }
    catch (error) {
        next(error);
    }
});
/**
 * @swagger
 * /api/time-entries/{id}:
 *   put:
 *     tags: [TimeEntries]
 *     summary: Aktualisiert einen Zeiteintrag
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               projectNumber:
 *                 type: string
 *               projectName:
 *                 type: string
 *               description:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               hourlyRate:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [pending, approved, rejected]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Zeiteintrag erfolgreich aktualisiert
 *       400:
 *         description: Validierungsfehler
 *       401:
 *         description: Nicht authentifiziert
 *       403:
 *         description: Keine Berechtigung
 *       404:
 *         description: Zeiteintrag nicht gefunden
 */
router.put('/:id', auth_1.auth, (0, validator_1.validateRequest)(updateTimeEntrySchema), async (req, res, next) => {
    try {
        const timeEntry = await TimeEntry_1.TimeEntry.findById(req.params.id);
        if (!timeEntry) {
            throw new errors_1.NotFoundError('Zeiteintrag nicht gefunden');
        }
        if (timeEntry.userId.toString() !== req.user._id.toString()) {
            throw new errors_1.ForbiddenError('Keine Berechtigung für diesen Zeiteintrag');
        }
        // Korrigierte Dauer entfernen, wenn sie im Request nicht enthalten ist
        if (!('correctedDuration' in req.body) && timeEntry.correctedDuration !== undefined) {
            timeEntry.correctedDuration = undefined;
        }
        Object.assign(timeEntry, req.body);
        await timeEntry.save();
        const mappedEntryPut = {
            ...timeEntry.toObject(),
            project: {
                _id: timeEntry.projectNumber
            }
        };
        res.json(mappedEntryPut);
    }
    catch (error) {
        next(error);
    }
});
/**
 * @swagger
 * /api/time-entries/{id}:
 *   patch:
 *     tags: [TimeEntries]
 *     summary: Aktualisiert Felder eines Zeiteintrags (z.B. zum Stoppen)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [pending, approved, rejected]
 *     responses:
 *       200:
 *         description: Zeiteintrag erfolgreich aktualisiert
 *       400:
 *         description: Validierungsfehler
 *       401:
 *         description: Nicht authentifiziert
 *       403:
 *         description: Keine Berechtigung
 *       404:
 *         description: Zeiteintrag nicht gefunden
 */
router.patch('/:id', auth_1.auth, async (req, res, next) => {
    try {
        const timeEntry = await TimeEntry_1.TimeEntry.findById(req.params.id);
        if (!timeEntry) {
            throw new errors_1.NotFoundError('Zeiteintrag nicht gefunden');
        }
        if (timeEntry.userId.toString() !== req.user._id.toString()) {
            throw new errors_1.ForbiddenError('Keine Berechtigung für diesen Zeiteintrag');
        }
        // Nur erlaubte Felder aktualisieren (z.B. endTime, status)
        if (req.body.endTime)
            timeEntry.endTime = req.body.endTime;
        await timeEntry.save();
        const mappedEntryPatch = {
            ...timeEntry.toObject(),
            project: {
                _id: timeEntry.projectNumber
            }
        };
        res.json(mappedEntryPatch);
    }
    catch (error) {
        next(error);
    }
});
/**
 * @swagger
 * /api/time-entries/{id}:
 *   delete:
 *     tags: [TimeEntries]
 *     summary: Löscht einen Zeiteintrag
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Zeiteintrag erfolgreich gelöscht
 *       401:
 *         description: Nicht authentifiziert
 *       403:
 *         description: Keine Berechtigung
 *       404:
 *         description: Zeiteintrag nicht gefunden
 */
router.delete('/:id', auth_1.auth, async (req, res, next) => {
    try {
        const timeEntry = await TimeEntry_1.TimeEntry.findById(req.params.id);
        if (!timeEntry) {
            throw new errors_1.NotFoundError('Zeiteintrag nicht gefunden');
        }
        if (timeEntry.userId.toString() !== req.user._id.toString()) {
            throw new errors_1.ForbiddenError('Keine Berechtigung für diesen Zeiteintrag');
        }
        await timeEntry.deleteOne();
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
