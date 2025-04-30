import { Router, Request, Response, NextFunction } from 'express';
import { auth, requireRole } from '../middleware/auth';
import { TimeEntry } from '../models/TimeEntry';
import { Payment } from '../models/Payment';
import { ForbiddenError } from '../utils/errors';

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
      if (!req.user) {
        throw new ForbiddenError('Nicht authentifiziert');
      }

      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        throw new ForbiddenError('Start- und Enddatum sind erforderlich');
      }

      const stats = await TimeEntry.getStats(
        req.user._id,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.json(stats);
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
      if (!req.user) {
        throw new ForbiddenError('Nicht authentifiziert');
      }

      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        throw new ForbiddenError('Start- und Enddatum sind erforderlich');
      }

      const query: any = {
        createdAt: {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string)
        }
      };

      if (req.user.role === 'freelancer') {
        query.freelancer = req.user._id;
      } else if (req.user.role === 'client') {
        query.client = req.user._id;
      }

      const [totalAmount, pendingAmount, completedAmount] = await Promise.all([
        Payment.aggregate([
          { $match: query },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        Payment.aggregate([
          { $match: { ...query, status: 'pending' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        Payment.aggregate([
          { $match: { ...query, status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ])
      ]);

      const stats = {
        totalAmount: totalAmount[0]?.total || 0,
        pendingAmount: pendingAmount[0]?.total || 0,
        completedAmount: completedAmount[0]?.total || 0,
        currency: 'EUR'
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
      if (!req.user) {
        throw new ForbiddenError('Nicht authentifiziert');
      }

      const query: any = {};
      if (req.user.role === 'freelancer') {
        query.freelancer = req.user._id;
      } else if (req.user.role === 'client') {
        query.client = req.user._id;
      }

      const [timeStats, paymentStats] = await Promise.all([
        TimeEntry.aggregate([
          { $match: query },
          {
            $group: {
              _id: null,
              totalHours: { $sum: { $divide: ['$duration', 3600] } },
              totalEntries: { $sum: 1 },
              avgDuration: { $avg: '$duration' }
            }
          }
        ]),
        Payment.aggregate([
          { $match: query },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: '$amount' },
              pendingAmount: {
                $sum: {
                  $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0]
                }
              },
              completedAmount: {
                $sum: {
                  $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0]
                }
              }
            }
          }
        ])
      ]);

      const stats = {
        time: {
          totalHours: Math.round((timeStats[0]?.totalHours || 0) * 100) / 100,
          totalEntries: timeStats[0]?.totalEntries || 0,
          avgDuration: Math.round(timeStats[0]?.avgDuration || 0)
        },
        payments: {
          totalAmount: paymentStats[0]?.totalAmount || 0,
          pendingAmount: paymentStats[0]?.pendingAmount || 0,
          completedAmount: paymentStats[0]?.completedAmount || 0,
          currency: 'EUR'
        }
      };

      res.json(stats);
    } catch (error) {
      next(error);
    }
  }
);

export default router; 