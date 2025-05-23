import { Router, Request, Response, NextFunction } from 'express';
import { auth, requireRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validator';
import { z } from 'zod';
import { TimeEntry, TimeEntryDocument } from '../models/TimeEntry';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors';
import { Types } from 'mongoose';
import { startOfDay, endOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const router = Router();

// Validierungsschemas
const createTimeEntrySchema = z.object({
  body: z.object({
    projectNumber: z.string().min(1, 'Projektnummer ist erforderlich'),
    description: z.string().optional(),
    startTime: z.string().datetime(),
    endTime: z.string().datetime().optional(),
    tags: z.array(z.string()).optional()
  })
});

const updateTimeEntrySchema = z.object({
  params: z.object({
    id: z.string()
  }),
  body: z.object({
    projectNumber: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    startTime: z.string().datetime().optional(),
    endTime: z.string().datetime().optional(),
    correctedDuration: z.number().nullable().optional(),
    tags: z.array(z.string()).optional()
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
router.post('/', 
  auth,
  validateRequest(createTimeEntrySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { projectNumber, description, startTime, endTime, tags } = req.body;
      const userId = req.user._id;

      let duration = undefined;
      if (startTime && endTime) {
        duration = Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000);
      }

      // Tagesgrenzen in Europe/Zurich berechnen
      const timeZone = 'Europe/Zurich';
      const zonedDate = toZonedTime(new Date(startTime), timeZone);
      const startOfLocalDay = startOfDay(zonedDate);
      const endOfLocalDay = endOfDay(zonedDate);

      console.log('Merge-Check:', {
        userId,
        projectNumber,
        startOfLocalDay: startOfLocalDay.toISOString(),
        endOfLocalDay: endOfLocalDay.toISOString(),
        startTime,
        endTime
      });

      const existingEntries = await TimeEntry.find({
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
        await TimeEntry.deleteMany({
          _id: { $in: existingEntries.map(e => e._id) }
        });

        // Lege einen neuen, zusammengefassten Eintrag an
        const mergedEntry = await TimeEntry.create({
          userId,
          projectNumber,
          description: allDescriptions.join('\n---\n'),
          startTime: earliestStart,
          endTime: latestEnd,
          duration: allDurations,
          tags: allTags
        });

        return res.status(201).json(mergedEntry);
      } else {
        // Neuen Eintrag anlegen (auch für laufende Einträge ohne endTime!)
        const timeEntry = await TimeEntry.create({
          ...req.body,
          userId,
          duration
        });
        return res.status(201).json(timeEntry);
      }
    } catch (error) {
      next(error);
    }
  }
);

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
router.get('/',
  auth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query: any = {};
      
      query.userId = req.user._id;

      const timeEntries = await TimeEntry.find(query)
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
    } catch (error) {
      next(error);
    }
  }
);

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
router.get('/active', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activeEntry = await TimeEntry.findOne({
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
  } catch (error) {
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
router.get('/merged',
  auth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        throw new BadRequestError('startDate und endDate sind erforderlich');
      }

      const mergedEntries = await TimeEntry.aggregate([
        {
          $match: {
            userId: new Types.ObjectId(req.user._id),
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
                  timezone: "Europe/Zurich",
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

      res.json(mergedEntries);
    } catch (error) {
      next(error);
    }
  }
);

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
router.get('/:id',
  auth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const timeEntry = await TimeEntry.findById(req.params.id)
        .populate('userId', 'name email');
      
      if (!timeEntry) {
        throw new NotFoundError('Zeiteintrag nicht gefunden');
      }

      if (timeEntry.userId.toString() !== req.user._id.toString()) {
        throw new ForbiddenError('Keine Berechtigung für diesen Zeiteintrag');
      }

      const mappedEntry = {
        ...timeEntry.toObject(),
        project: {
          _id: timeEntry.projectNumber
        }
      };
      res.json(mappedEntry);
    } catch (error) {
      next(error);
    }
  }
);

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
router.put('/:id',
  auth,
  validateRequest(updateTimeEntrySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const timeEntry = await TimeEntry.findById(req.params.id);
      
      if (!timeEntry) {
        throw new NotFoundError('Zeiteintrag nicht gefunden');
      }

      if (timeEntry.userId.toString() !== req.user._id.toString()) {
        throw new ForbiddenError('Keine Berechtigung für diesen Zeiteintrag');
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
    } catch (error) {
      next(error);
    }
  }
);

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
router.patch('/:id',
  auth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const timeEntry = await TimeEntry.findById(req.params.id);

      if (!timeEntry) {
        throw new NotFoundError('Zeiteintrag nicht gefunden');
      }

      if (timeEntry.userId.toString() !== req.user._id.toString()) {
        throw new ForbiddenError('Keine Berechtigung für diesen Zeiteintrag');
      }

      // Nur erlaubte Felder aktualisieren (z.B. endTime, status)
      if (req.body.endTime) timeEntry.endTime = req.body.endTime;

      await timeEntry.save();

      const mappedEntryPatch = {
        ...timeEntry.toObject(),
        project: {
          _id: timeEntry.projectNumber
        }
      };
      res.json(mappedEntryPatch);
    } catch (error) {
      next(error);
    }
  }
);

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
router.delete('/:id',
  auth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const timeEntry = await TimeEntry.findById(req.params.id);
      
      if (!timeEntry) {
        throw new NotFoundError('Zeiteintrag nicht gefunden');
      }

      if (timeEntry.userId.toString() !== req.user._id.toString()) {
        throw new ForbiddenError('Keine Berechtigung für diesen Zeiteintrag');
      }

      await timeEntry.deleteOne();
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router; 