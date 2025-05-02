import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/errors';
import { z } from 'zod';

export const validateRequest = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
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

  if (!email || !password) {
    return res.status(400).json({ message: 'Email und Passwort sind erforderlich' });
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Ungültige Email-Adresse' });
  }

  if (password && password.length < 6) {
    return res.status(400).json({ message: 'Passwort muss mindestens 6 Zeichen lang sein' });
  }

  if (name && name.length < 2) {
    return res.status(400).json({ message: 'Name muss mindestens 2 Zeichen lang sein' });
  }

  next();
};

export const validateAuth = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email und Passwort sind erforderlich' });
  }

  next();
};

export const validatePayment = (req: Request, res: Response, next: NextFunction) => {
  const { amount, currency, paymentMethod } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: 'Ungültiger Betrag' });
  }

  if (!currency || !['EUR', 'USD'].includes(currency)) {
    return res.status(400).json({ message: 'Ungültige Währung' });
  }

  if (!paymentMethod || !['stripe', 'bank_transfer', 'paypal'].includes(paymentMethod)) {
    return res.status(400).json({ message: 'Ungültige Zahlungsmethode' });
  }

  next();
}; 