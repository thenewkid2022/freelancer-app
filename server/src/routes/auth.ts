import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { auth } from '../middleware/auth';
import { validateRequest } from '../middleware/validator';
import { z } from 'zod';
import User from '../models/User';
import { ValidationError, AuthError } from '../utils/errors';
import bcrypt from 'bcryptjs';

const router = Router();
const authService = AuthService.getInstance();

// Validierungsschemas
const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Ungültige E-Mail-Adresse'),
    password: z.string().min(6, 'Passwort muss mindestens 6 Zeichen lang sein'),
    firstName: z.string().min(2, 'Vorname muss mindestens 2 Zeichen lang sein'),
    lastName: z.string().min(2, 'Nachname muss mindestens 2 Zeichen lang sein'),
    role: z.enum(['admin', 'freelancer'], {
      errorMap: () => ({ message: 'Ungültige Rolle' })
    })
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Ungültige E-Mail-Adresse'),
    password: z.string().min(1, 'Passwort ist erforderlich')
  })
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Registriert einen neuen Benutzer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               firstName:
 *                 type: string
 *                 minLength: 2
 *               lastName:
 *                 type: string
 *                 minLength: 2
 *               role:
 *                 type: string
 *                 enum: [admin, freelancer]
 *     responses:
 *       201:
 *         description: Benutzer erfolgreich registriert
 *       400:
 *         description: Validierungsfehler
 */
router.post('/register',
  validateRequest(registerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, firstName, lastName, role } = req.body;

      // Überprüfe, ob E-Mail bereits existiert
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new ValidationError('E-Mail-Adresse wird bereits verwendet');
      }

      // Erstelle neuen Benutzer
      const user = await User.create({
        email,
        password,
        firstName,
        lastName,
        role,
        settings: {
          darkMode: false,
          language: 'de'
        }
      });

      // Generiere Token
      const token = user.generateAuthToken();

      res.status(201).json({
        token,
        user: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          settings: user.settings
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Authentifiziert einen Benutzer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Erfolgreich eingeloggt
 *       400:
 *         description: Validierungsfehler
 *       401:
 *         description: Ungültige Anmeldedaten
 */
router.post('/login',
  validateRequest(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      // Finde Benutzer
      const user = await User.findOne({ email });
      if (!user) {
        throw new AuthError('Ungültige Anmeldedaten');
      }

      // Überprüfe Passwort
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        throw new AuthError('Ungültige Anmeldedaten');
      }

      if (!user.isActive) {
        throw new AuthError('Konto ist deaktiviert');
      }

      // Aktualisiere lastLogin
      user.lastLogin = new Date();
      await user.save();

      // Generiere Token
      const token = user.generateAuthToken();

      res.json({
        user: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          settings: user.settings
        },
        token
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Gibt Informationen über den aktuellen Benutzer zurück
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Benutzerinformationen
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Nicht authentifiziert
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/me', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // req.user wird von der auth-Middleware gesetzt
    const user = req.user;
    res.json({
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      settings: user.settings
    });
  } catch (error) {
    next(error);
  }
});

export default router; 