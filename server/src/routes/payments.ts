import { Router, Request, Response, NextFunction } from 'express';
import { auth, requireRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';
import { Payment, PaymentDocument } from '../models/Payment';
import { TimeEntry, TimeEntryDocument } from '../models/TimeEntry';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';

const router = Router();

// Validierungsschemas
const createPaymentSchema = z.object({
  body: z.object({
    timeEntries: z.array(z.string()).min(1, 'Mindestens ein Zeiteintrag ist erforderlich'),
    paymentMethod: z.enum(['bank_transfer', 'paypal', 'stripe']),
    dueDate: z.string().datetime(),
    notes: z.string().optional()
  })
});

const updatePaymentSchema = z.object({
  params: z.object({
    id: z.string()
  }),
  body: z.object({
    status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
    paymentDetails: z.object({
      transactionId: z.string().optional(),
      paymentDate: z.string().datetime().optional(),
      notes: z.string().optional()
    }).optional()
  })
});

/**
 * @swagger
 * /api/payments:
 *   post:
 *     tags: [Payments]
 *     summary: Erstellt eine neue Zahlung
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - timeEntries
 *               - paymentMethod
 *               - dueDate
 *             properties:
 *               timeEntries:
 *                 type: array
 *                 items:
 *                   type: string
 *               paymentMethod:
 *                 type: string
 *                 enum: [bank_transfer, paypal, stripe]
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Zahlung erfolgreich erstellt
 *       400:
 *         description: Validierungsfehler
 *       401:
 *         description: Nicht authentifiziert
 */
router.post('/',
  auth,
  requireRole(['client']),
  validateRequest(createPaymentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ForbiddenError('Nicht authentifiziert');
      }

      const { timeEntries, paymentMethod, dueDate, notes } = req.body;

      // Überprüfe, ob alle Zeiteinträge existieren und dem Kunden gehören
      const entries = await TimeEntry.find({
        _id: { $in: timeEntries },
        client: req.user._id,
        status: 'approved'
      }) as TimeEntryDocument[];

      if (entries.length !== timeEntries.length) {
        throw new ValidationError('Einige Zeiteinträge wurden nicht gefunden oder gehören nicht zu Ihnen');
      }

      // Berechne den Gesamtbetrag
      const totalAmount = entries.reduce((sum, entry) => sum + entry.totalAmount, 0);

      const payment = await Payment.create({
        freelancer: entries[0].freelancer,
        client: req.user._id,
        timeEntries,
        amount: totalAmount,
        currency: 'EUR',
        paymentMethod,
        dueDate: new Date(dueDate),
        paymentDetails: {
          notes
        }
      });

      res.status(201).json(payment);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/payments:
 *   get:
 *     tags: [Payments]
 *     summary: Gibt alle Zahlungen des Benutzers zurück
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, failed]
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
 *         description: Liste der Zahlungen
 *       401:
 *         description: Nicht authentifiziert
 */
router.get('/',
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

      if (req.query.status) {
        query.status = req.query.status;
      }

      if (req.query.startDate || req.query.endDate) {
        query.createdAt = {};
        if (req.query.startDate) {
          query.createdAt.$gte = new Date(req.query.startDate as string);
        }
        if (req.query.endDate) {
          query.createdAt.$lte = new Date(req.query.endDate as string);
        }
      }

      const payments = await Payment.find(query)
        .sort({ createdAt: -1 })
        .populate('freelancer', 'name email')
        .populate('client', 'name email')
        .populate('timeEntries');

      res.json(payments);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/payments/{id}:
 *   put:
 *     tags: [Payments]
 *     summary: Aktualisiert eine Zahlung
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
 *               status:
 *                 type: string
 *                 enum: [pending, processing, completed, failed]
 *               paymentDetails:
 *                 type: object
 *                 properties:
 *                   transactionId:
 *                     type: string
 *                   paymentDate:
 *                     type: string
 *                     format: date-time
 *                   notes:
 *                     type: string
 *     responses:
 *       200:
 *         description: Zahlung erfolgreich aktualisiert
 *       400:
 *         description: Validierungsfehler
 *       401:
 *         description: Nicht authentifiziert
 *       403:
 *         description: Keine Berechtigung
 *       404:
 *         description: Zahlung nicht gefunden
 */
router.put('/:id',
  auth,
  validateRequest(updatePaymentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ForbiddenError('Nicht authentifiziert');
      }

      const payment = await Payment.findById(req.params.id) as PaymentDocument;
      
      if (!payment) {
        throw new NotFoundError('Zahlung nicht gefunden');
      }

      if (req.user.role === 'freelancer' && payment.freelancer.toString() !== req.user._id.toString()) {
        throw new ForbiddenError('Keine Berechtigung für diese Zahlung');
      }

      if (req.user.role === 'client' && payment.client.toString() !== req.user._id.toString()) {
        throw new ForbiddenError('Keine Berechtigung für diese Zahlung');
      }

      Object.assign(payment, req.body);
      await payment.save();

      res.json(payment);
    } catch (error) {
      next(error);
    }
  }
);

export default router; 