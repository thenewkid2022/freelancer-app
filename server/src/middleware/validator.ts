import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

export const validateRequest = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        next(new ValidationError('Validierungsfehler', 400, errors));
      } else {
        next(error);
      }
    }
  };
};

export const validateUser = (req: Request, res: Response, next: NextFunction) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Alle Felder sind erforderlich' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Passwort muss mindestens 6 Zeichen lang sein' });
  }

  if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return res.status(400).json({ message: 'Ungültige E-Mail-Adresse' });
  }

  next();
};

export const validateAuth = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'E-Mail und Passwort sind erforderlich' });
  }

  next();
};

export const validatePayment = (req: Request, res: Response, next: NextFunction) => {
  const { timeEntryIds, amount, currency, paymentMethod } = req.body;

  if (!timeEntryIds || !Array.isArray(timeEntryIds) || timeEntryIds.length === 0) {
    return res.status(400).json({ message: 'Mindestens ein TimeEntry muss angegeben werden' });
  }

  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ message: 'Ungültiger Betrag' });
  }

  if (!currency || typeof currency !== 'string') {
    return res.status(400).json({ message: 'Währung muss angegeben werden' });
  }

  if (!paymentMethod || typeof paymentMethod !== 'string') {
    return res.status(400).json({ message: 'Zahlungsmethode muss angegeben werden' });
  }

  next();
}; 