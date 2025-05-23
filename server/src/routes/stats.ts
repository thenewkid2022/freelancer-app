import { Router, Request, Response, NextFunction } from 'express';
import { auth } from '../middleware/auth';
import { TimeEntry } from '../models/TimeEntry';
import { BadRequestError, ForbiddenError } from '../utils/errors';
import { Types } from 'mongoose';
import { IUser } from '../models/User';

// Erweitere die Express Request-Definition
declare module 'express-serve-static-core' {
  interface Request {
    user: IUser & {
      _id: Types.ObjectId;
    };
  }
}

const router = Router();

/**
 * @swagger
 * /api/stats/time:
 *   get:
 *     tags: [Stats]
 *     summary: Gibt Zeitstatistiken zurück
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Zeitstatistiken
 *       401:
 *         description: Nicht authentifiziert
 */
router.get('/time',
  auth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        throw new BadRequestError('Start- und Enddatum sind erforderlich');
      }

      const query: any = {
        freelancer: req.user._id,
        startTime: {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string)
        }
      };

      const timeEntries = await TimeEntry.find(query);

      const totalHours = timeEntries.reduce((acc, entry) => {
        return acc + ((entry.duration ?? 0) / 3600);
      }, 0);

      res.json({
        totalHours,
        totalEntries: timeEntries.length,
        entries: timeEntries
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/stats/payments:
 *   get:
 *     tags: [Stats]
 *     summary: Gibt Zahlungsstatistiken zurück
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Zahlungsstatistiken
 *       401:
 *         description: Nicht authentifiziert
 */
router.get('/payments',
  auth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        throw new BadRequestError('Start- und Enddatum sind erforderlich');
      }

      const query: any = {
        freelancer: req.user._id,
        startTime: {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string)
        }
      };

      const timeEntries = await TimeEntry.find(query);
      const totalHours = timeEntries.reduce((acc, entry) => acc + ((entry.duration ?? 0) / 3600), 0);
      const totalDuration = timeEntries.reduce((acc, entry) => acc + (entry.duration ?? 0), 0);
      const avgDuration = timeEntries.length > 0 ? totalDuration / timeEntries.length : 0;

      const stats = {
        time: {
          totalHours: Math.round(totalHours * 100) / 100,
          totalEntries: timeEntries.length,
          avgDuration: Math.round(avgDuration)
        }
      };

      res.json(stats);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/stats/overview:
 *   get:
 *     tags: [Stats]
 *     summary: Gibt eine Übersicht der Statistiken zurück
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Übersicht der Statistiken
 *       401:
 *         description: Nicht authentifiziert
 */
router.get('/overview',
  auth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query: any = {
        freelancer: req.user._id
      };

      const timeEntries = await TimeEntry.find(query);

      let totalHours = 0;
      let totalDuration = 0;

      timeEntries.forEach(entry => {
        totalDuration += (entry.duration ?? 0);
        totalHours += (entry.duration ?? 0) / 3600;
      });

      const avgDuration = timeEntries.length > 0 ? totalDuration / timeEntries.length : 0;

      const stats = {
        time: {
          totalHours: Math.round(totalHours * 100) / 100,
          totalEntries: timeEntries.length,
          avgDuration: Math.round(avgDuration)
        }
      };

      res.json(stats);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/stats/freelancer:
 *   get:
 *     summary: Get freelancer statistics
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Freelancer statistics
 */
router.get('/freelancer',
  auth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const timeEntries = await TimeEntry.find({ freelancer: req.user._id });

      const totalHours = timeEntries.reduce((acc, entry) => {
        return acc + ((entry.duration ?? 0) / 3600);
      }, 0);

      const projectStats = await TimeEntry.aggregate([
        { $match: { freelancer: req.user._id } },
        {
          $group: {
            _id: { projectNumber: '$projectNumber' },
            totalHours: {
              $sum: { $divide: ['$duration', 3600] }
            },
            totalEarnings: { $sum: { $multiply: ['$hourlyRate', { $divide: ['$duration', 3600] }] } }
          }
        }
      ]);

      res.json({
        totalHours,
        projectStats
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/stats/project/{projectNumber}:
 *   get:
 *     summary: Get project statistics
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project statistics
 */
router.get('/project/:projectNumber',
  auth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const timeEntries = await TimeEntry.find({
        freelancer: req.user._id,
        projectNumber: req.params.projectNumber
      });

      const totalHours = timeEntries.reduce((acc, entry) => {
        return acc + ((entry.duration ?? 0) / 3600);
      }, 0);

      res.json({
        totalHours,
        timeEntries
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/stats/merged:
 *   get:
 *     tags: [Stats]
 *     summary: Gibt zusammengeführte Zeiteinträge (aggregiert) zurück
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

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new BadRequestError('Ungültiges Datumsformat');
      }

      // Aggregation wie bei /api/time-entries/merged
      const mergedEntries = await TimeEntry.aggregate([
        {
          $match: {
            userId: new Types.ObjectId(req.user._id),
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
          },
        },
        {
          $match: {
            "_id.date": { $gte: startDate as string, $lte: endDate as string },
          },
        },
        {
          $sort: { "_id.date": 1, "_id.projectNumber": 1 },
        },
      ]);

      const mappedMergedEntries = mergedEntries.map(entry => ({
        project: { _id: entry._id.projectNumber },
        date: entry._id.date,
        totalDuration: entry.totalDuration,
        comments: entry.comments.filter(Boolean),
        entryIds: entry.entryIds,
      }));

      res.json(mappedMergedEntries);
    } catch (error) {
      next(error);
    }
  }
);

export default router; 