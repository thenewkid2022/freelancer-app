import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { auth } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';
import { User } from '../models/User';
import { generateToken } from '../utils/auth';
import { ValidationError, ForbiddenError } from '../utils/errors';
import bcrypt from 'bcryptjs';

const router = Router();
const authService = AuthService.getInstance();

// Validierungsschemas
const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Ungültige E-Mail-Adresse'),
    password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
    name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein'),
    role: z.enum(['freelancer', 'client'], {
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
 *               - name
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               name:
 *                 type: string
 *                 minLength: 2
 *               role:
 *                 type: string
 *                 enum: [freelancer, client]
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
      const { email, password, name, role } = req.body;

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
        name,
        role
      });

      // Generiere Token
      const token = generateToken(user);

      res.status(201).json({
        token,
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
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
        throw new ForbiddenError('Ungültige Anmeldedaten');
      }

      // Überprüfe Passwort
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new ForbiddenError('Ungültige Anmeldedaten');
      }

      // Generiere Token
      const token = generateToken(user);

      res.json({
        token,
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
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

export default router; 