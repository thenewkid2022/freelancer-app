import { Router, Request, Response, NextFunction } from 'express';
import { auth } from '../middleware/auth';
import { TimeEntry } from '../models/TimeEntry';
import { Payment } from '../models/Payment';
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
        $or: [
          { freelancer: req.user._id },
          { client: req.user._id }
        ],
        startTime: {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string)
        }
      };

      const timeEntries = await TimeEntry.find(query);

      const totalHours = timeEntries.reduce((acc, entry) => {
        return acc + (entry.duration / 3600);
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
        $or: [
          { freelancer: req.user._id },
          { client: req.user._id }
        ],
        createdAt: {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string)
        }
      };

      const payments = await Payment.find(query);

      const stats = {
        totalAmount: 0,
        pendingAmount: 0,
        completedAmount: 0,
        currency: 'EUR'
      };

      payments.forEach(payment => {
        stats.totalAmount += payment.amount;
        if (payment.status === 'pending') {
          stats.pendingAmount += payment.amount;
        } else if (payment.status === 'completed') {
          stats.completedAmount += payment.amount;
        }
      });

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
        $or: [
          { freelancer: req.user._id },
          { client: req.user._id }
        ]
      };

      const timeEntries = await TimeEntry.find(query);
      const payments = await Payment.find(query);

      let totalHours = 0;
      let totalDuration = 0;

      timeEntries.forEach(entry => {
        totalDuration += entry.duration;
        totalHours += entry.duration / 3600;
      });

      const avgDuration = timeEntries.length > 0 ? totalDuration / timeEntries.length : 0;

      const stats = {
        time: {
          totalHours: Math.round(totalHours * 100) / 100,
          totalEntries: timeEntries.length,
          avgDuration: Math.round(avgDuration)
        },
        payments: {
          totalAmount: 0,
          pendingAmount: 0,
          completedAmount: 0,
          currency: 'EUR'
        }
      };

      payments.forEach(payment => {
        stats.payments.totalAmount += payment.amount;
        if (payment.status === 'pending') {
          stats.payments.pendingAmount += payment.amount;
        } else if (payment.status === 'completed') {
          stats.payments.completedAmount += payment.amount;
        }
      });

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
      const payments = await Payment.find({ freelancer: req.user._id });

      const totalHours = timeEntries.reduce((acc, entry) => {
        return acc + (entry.duration / 3600);
      }, 0);

      const totalEarnings = payments.reduce((acc, payment) => acc + payment.amount, 0);

      const projectStats = await TimeEntry.aggregate([
        { $match: { freelancer: req.user._id } },
        {
          $group: {
            _id: '$project',
            totalHours: {
              $sum: { $divide: ['$duration', 3600] }
            },
            totalEarnings: { $sum: { $multiply: ['$hourlyRate', { $divide: ['$duration', 3600] }] } }
          }
        }
      ]);

      res.json({
        totalHours,
        totalEarnings,
        projectStats
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/stats/client:
 *   get:
 *     summary: Get client statistics
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Client statistics
 */
router.get('/client',
  auth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const timeEntries = await TimeEntry.find({ client: req.user._id });
      const payments = await Payment.find({ client: req.user._id });

      const totalHours = timeEntries.reduce((acc, entry) => {
        return acc + (entry.duration / 3600);
      }, 0);

      const totalPayments = payments.reduce((acc, payment) => acc + payment.amount, 0);

      const projectStats = await TimeEntry.aggregate([
        { $match: { client: req.user._id } },
        {
          $group: {
            _id: '$project',
            totalHours: {
              $sum: { $divide: ['$duration', 3600] }
            },
            totalPayments: { $sum: { $multiply: ['$hourlyRate', { $divide: ['$duration', 3600] }] } }
          }
        }
      ]);

      res.json({
        totalHours,
        totalPayments,
        projectStats
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/stats/project/{projectId}:
 *   get:
 *     summary: Get project statistics
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project statistics
 */
router.get('/project/:projectId',
  auth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const timeEntries = await TimeEntry.find({
        $or: [
          { freelancer: req.user._id, project: req.params.projectId },
          { client: req.user._id, project: req.params.projectId }
        ]
      }).populate('freelancer client');

      const payments = await Payment.find({
        $or: [
          { freelancer: req.user._id, project: req.params.projectId },
          { client: req.user._id, project: req.params.projectId }
        ]
      });

      const totalHours = timeEntries.reduce((acc, entry) => {
        return acc + (entry.duration / 3600);
      }, 0);

      const totalPayments = payments.reduce((acc, payment) => acc + payment.amount, 0);

      res.json({
        totalHours,
        totalPayments,
        timeEntries
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router; 