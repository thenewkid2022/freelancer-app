import { Request, Response } from 'express';
import { Payment, IPayment } from '../models/Payment';
import { TimeEntry } from '../models/TimeEntry';
import { AuthenticatedRequest } from '../types';
import { logger } from '../utils/logger';

export const paymentController = {
  // Neue Zahlung erstellen
  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { timeEntryIds, amount, currency, paymentMethod } = req.body;
      const freelancerId = req.user?.userId;

      // Überprüfe, ob alle TimeEntries existieren und dem Freelancer gehören
      const timeEntries = await TimeEntry.find({
        _id: { $in: timeEntryIds },
        userId: freelancerId
      });

      if (timeEntries.length !== timeEntryIds.length) {
        return res.status(400).json({ message: 'Ungültige TimeEntries' });
      }

      const payment = new Payment({
        freelancer: freelancerId,
        client: timeEntries[0].clientId, // Annahme: Alle TimeEntries gehören zum gleichen Client
        timeEntries: timeEntryIds,
        amount,
        currency,
        paymentMethod
      });

      await payment.save();
      logger.info('Neue Zahlung erstellt', { paymentId: payment._id });
      res.status(201).json(payment);
    } catch (error) {
      logger.error('Fehler beim Erstellen der Zahlung', { error });
      res.status(500).json({ message: 'Fehler beim Erstellen der Zahlung' });
    }
  },

  // Alle Zahlungen eines Freelancers abrufen
  async getFreelancerPayments(req: AuthenticatedRequest, res: Response) {
    try {
      const freelancerId = req.user?.userId;
      const payments = await Payment.find({ freelancer: freelancerId })
        .populate('client', 'name email')
        .populate('timeEntries')
        .sort({ createdAt: -1 });

      res.json(payments);
    } catch (error) {
      logger.error('Fehler beim Abrufen der Zahlungen', { error });
      res.status(500).json({ message: 'Fehler beim Abrufen der Zahlungen' });
    }
  },

  // Alle Zahlungen eines Clients abrufen
  async getClientPayments(req: AuthenticatedRequest, res: Response) {
    try {
      const clientId = req.user?.userId;
      const payments = await Payment.find({ client: clientId })
        .populate('freelancer', 'name email')
        .populate('timeEntries')
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
        .populate('freelancer', 'name email')
        .populate('client', 'name email')
        .populate('timeEntries');

      if (!payment) {
        return res.status(404).json({ message: 'Zahlung nicht gefunden' });
      }

      // Überprüfe Berechtigung
      if (payment.freelancer.toString() !== req.user?.userId && 
          payment.client.toString() !== req.user?.userId) {
        return res.status(403).json({ message: 'Nicht autorisiert' });
      }

      res.json(payment);
    } catch (error) {
      logger.error('Fehler beim Abrufen der Zahlung', { error });
      res.status(500).json({ message: 'Fehler beim Abrufen der Zahlung' });
    }
  },

  // Zahlungsstatus aktualisieren
  async updateStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { status } = req.body;
      const payment = await Payment.findById(req.params.id);

      if (!payment) {
        return res.status(404).json({ message: 'Zahlung nicht gefunden' });
      }

      // Nur der Client kann den Status aktualisieren
      if (payment.client.toString() !== req.user?.userId) {
        return res.status(403).json({ message: 'Nicht autorisiert' });
      }

      payment.status = status;
      if (status === 'paid') {
        payment.paymentDate = new Date();
      }

      await payment.save();
      logger.info('Zahlungsstatus aktualisiert', { paymentId: payment._id, status });
      res.json(payment);
    } catch (error) {
      logger.error('Fehler beim Aktualisieren des Zahlungsstatus', { error });
      res.status(500).json({ message: 'Fehler beim Aktualisieren des Zahlungsstatus' });
    }
  }
}; 