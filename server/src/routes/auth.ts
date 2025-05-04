import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { auth } from '../middleware/auth';
import { z } from 'zod';
import { ValidationError } from '../utils/errors';

const router = Router();
const authService = AuthService.getInstance();

// Validierungsschemas
const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6)
  })
});

const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    role: z.enum(['admin', 'freelancer'])
  })
});

// Login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parse = loginSchema.safeParse({ body: req.body });
    if (!parse.success) {
      return next(new ValidationError('Ungültige Eingabedaten', 400, parse.error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))));
    }
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Registrierung
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parse = registerSchema.safeParse({ body: req.body });
    if (!parse.success) {
      return next(new ValidationError('Ungültige Eingabedaten', 400, parse.error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))));
    }
    const { email, password, firstName, lastName, role } = req.body;
    const result = await authService.register({ email, password, firstName, lastName, role });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// Aktueller Nutzer
router.get('/me', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // req.user wird von der auth-Middleware gesetzt
    res.json(req.user);
  } catch (error) {
    next(error);
  }
});

export default router; 