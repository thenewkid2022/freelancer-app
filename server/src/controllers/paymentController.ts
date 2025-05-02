import { Request, Response } from 'express';
import { Payment, IPayment } from '../models/Payment';
import { TimeEntry } from '../models/TimeEntry';
import { AuthenticatedRequest } from '../types';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { Types } from 'mongoose';

export const paymentController = {
  // Neue Zahlung erstellen
  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { timeEntryId, amount, currency, paymentMethod } = req.body;
      const timeEntry = await TimeEntry.findById(timeEntryId);

      if (!timeEntry) {
        throw new AppError('Zeiteintrag nicht gefunden', 404);
      }

      const payment = new Payment({
        project: timeEntry.project,
        freelancer: timeEntry.freelancer,
        amount,
        currency,
        paymentMethod,
        status: 'pending'
      });

      await payment.save();
      logger.info('Neue Zahlung erstellt', { paymentId: payment._id });
      res.status(201).json(payment);
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        logger.error('Fehler beim Erstellen der Zahlung', { error });
        res.status(500).json({ message: 'Interner Serverfehler' });
      }
    }
  },

  // Alle Zahlungen eines Freelancers abrufen
  async getFreelancerPayments(req: AuthenticatedRequest, res: Response) {
    try {
      const { startDate, endDate, status } = req.query;
      const query: any = {
        freelancer: req.user?._id,
        createdAt: {
          $gte: startDate ? new Date(startDate as string) : undefined,
          $lte: endDate ? new Date(endDate as string) : undefined
        }
      };

      if (status) {
        query.status = status;
      }

      const payments = await Payment.find(query)
        .populate('project')
        .sort({ createdAt: -1 });

      res.json(payments);
    } catch (error) {
      logger.error('Fehler beim Abrufen der Zahlungen', { error });
      res.status(500).json({ message: 'Fehler beim Abrufen der Zahlungen' });
    }
  },

  // Einzelne Zahlung abrufen
  async getPayment(req: AuthenticatedRequest, res: Response) {
    try {
      const payment = await Payment.findById(req.params.id)
        .populate('project')
        .populate('freelancer');

      if (!payment) {
        throw new AppError('Zahlung nicht gefunden', 404);
      }

      // Überprüfe Berechtigung
      if (payment.freelancer.toString() !== req.user?._id.toString()) {
        return res.status(403).json({ message: 'Nicht autorisiert' });
      }

      res.json(payment);
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        logger.error('Fehler beim Abrufen der Zahlung', { error });
        res.status(500).json({ message: 'Fehler beim Abrufen der Zahlung' });
      }
    }
  },

  // Zahlungsstatus aktualisieren
  async updateStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { status, paymentIntentId, transferId } = req.body;
      const payment = await Payment.findById(req.params.id);

      if (!payment) {
        throw new AppError('Zahlung nicht gefunden', 404);
      }

      // Nur der Freelancer kann den Status aktualisieren
      if (payment.freelancer.toString() !== req.user?._id.toString()) {
        return res.status(403).json({ message: 'Nicht autorisiert' });
      }

      if (status) payment.status = status;
      if (paymentIntentId) payment.paymentIntentId = paymentIntentId;
      if (transferId) payment.transferId = transferId;

      await payment.save();
      logger.info('Zahlungsstatus aktualisiert', { paymentId: payment._id, status });
      res.json(payment);
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        logger.error('Fehler beim Aktualisieren des Zahlungsstatus', { error });
        res.status(500).json({ message: 'Fehler beim Aktualisieren des Zahlungsstatus' });
      }
    }
  },

  async deletePayment(req: AuthenticatedRequest, res: Response) {
    try {
      const payment = await Payment.findById(req.params.id);

      if (!payment) {
        throw new AppError('Zahlung nicht gefunden', 404);
      }

      // Nur der Freelancer kann die Zahlung löschen
      if (payment.freelancer.toString() !== req.user?._id.toString()) {
        return res.status(403).json({ message: 'Nicht autorisiert' });
      }

      await payment.deleteOne();
      res.status(204).send();
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Interner Serverfehler' });
      }
    }
  },

  async getPaymentStats(req: AuthenticatedRequest, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const userId = new Types.ObjectId(req.user._id);

      const stats = await Payment.getStats(
        userId,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: 'Interner Serverfehler' });
    }
  }
}; 