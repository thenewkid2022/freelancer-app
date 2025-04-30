import { Request, Response, NextFunction } from 'express';

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