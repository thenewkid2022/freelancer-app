import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { auth } from '../middleware/auth';
import { validateRequest } from '../middleware/validator';
import { z } from 'zod';
import User from '../models/User';
import { generateToken } from '../utils/auth';
import { ValidationError, AuthError } from '../utils/errors';
import bcrypt from 'bcryptjs';

const router = Router();
const authService = AuthService.getInstance();

// Validierungsschemas
const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Ungültige E-Mail-Adresse'),
    password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
    firstName: z.string().min(2, 'Vorname muss mindestens 2 Zeichen lang sein'),
    lastName: z.string().min(2, 'Nachname muss mindestens 2 Zeichen lang sein'),
    role: z.enum(['freelancer'], {
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
 *                 minLength: 8
 *               firstName:
 *                 type: string
 *                 minLength: 2
 *               lastName:
 *                 type: string
 *                 minLength: 2
 *               role:
 *                 type: string
 *                 enum: [freelancer]
 *     responses:
 *       201:
 *         description: Benutzer erfolgreich registriert
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                       description: Die eindeutige ID des Benutzers
 *                     email:
 *                       type: string
 *                       format: email
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [freelancer]
 *                 token:
 *                   type: string
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

      // Hash Passwort
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Erstelle neuen Benutzer
      const user = await User.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role
      });

      // Generiere Token
      const token = generateToken(user);

      res.status(201).json({
        token,
        user: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                       description: Die eindeutige ID des Benutzers
 *                     email:
 *                       type: string
 *                       format: email
 *                     name:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [admin, freelancer]
 *                 token:
 *                   type: string
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
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new AuthError('Ungültige Anmeldedaten');
      }

      // Generiere Token
      const token = generateToken(user);

      res.json({
        user: {
          userId: user._id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role
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
router.get('/me', auth, async (req, res, next) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     tags: [Auth]
 *     summary: Aktualisiert das Profil des aktuellen Benutzers
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               settings:
 *                 type: object
 *                 properties:
 *                   emailNotifications:
 *                     type: boolean
 *                   darkMode:
 *                     type: boolean
 *                   language:
 *                     type: string
 *     responses:
 *       200:
 *         description: Profil erfolgreich aktualisiert
 *       401:
 *         description: Nicht authentifiziert
 */
router.put('/profile', auth, async (req, res, next) => {
  try {
    const { firstName, lastName, email, settings } = req.body;
    const userId = req.user._id;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { firstName, lastName, email, settings },
      { new: true }
    );

    if (!updatedUser) {
      throw new Error('Benutzer nicht gefunden');
    }

    res.json({ user: updatedUser });
  } catch (error) {
    next(error);
  }
});

export default router; 