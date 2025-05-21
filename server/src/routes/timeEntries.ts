import { Router, Request, Response, NextFunction } from 'express';
import { auth, requireRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validator';
import { z } from 'zod';
import { TimeEntry, TimeEntryDocument } from '../models/TimeEntry';
import { NotFoundError, ForbiddenError } from '../utils/errors';

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
      // Datum extrahieren (nur Jahr-Monat-Tag)
      const entryDate = new Date(startTime);
      entryDate.setHours(0,0,0,0);
      const nextDay = new Date(entryDate);
      nextDay.setDate(entryDate.getDate() + 1);

      // Suche nach bestehendem Eintrag für selben Nutzer, Projektnummer und Tag
      const existing = await TimeEntry.findOne({
        userId,
        projectNumber,
        startTime: { $gte: entryDate, $lt: nextDay }
      });

      // Dauer berechnen (in Sekunden)
      let duration = undefined;
      if (startTime && endTime) {
        duration = Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000);
      }

      if (existing) {
        // Beschreibung zusammenführen
        const mergedDescription = existing.description
          ? (description ? existing.description + '\n---\n' + description : existing.description)
          : (description || '');
        // Endzeit ggf. aktualisieren
        const newEndTime = (!existing.endTime || (endTime && new Date(endTime) > existing.endTime))
          ? endTime
          : existing.endTime;
        // Dauer aufsummieren
        const newDuration = (existing.duration || 0) + (duration || 0);
        // Tags zusammenführen (optional, hier als Set)
        const mergedTags = Array.from(new Set([...(existing.tags || []), ...(tags || [])]));
        existing.description = mergedDescription;
        existing.endTime = newEndTime;
        existing.duration = newDuration;
        existing.tags = mergedTags;
        await existing.save();
        return res.status(200).json(existing);
      } else {
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