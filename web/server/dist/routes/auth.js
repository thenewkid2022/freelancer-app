"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthService_1 = require("../services/AuthService");
const auth_1 = require("../middleware/auth");
const validator_1 = require("../middleware/validator");
const zod_1 = require("zod");
const User_1 = __importDefault(require("../models/User"));
const auth_2 = require("../utils/auth");
const errors_1 = require("../utils/errors");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const router = (0, express_1.Router)();
const authService = AuthService_1.AuthService.getInstance();
// Validierungsschemas
const registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Ungültige E-Mail-Adresse'),
        password: zod_1.z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
        firstName: zod_1.z.string().min(2, 'Vorname muss mindestens 2 Zeichen lang sein'),
        lastName: zod_1.z.string().min(2, 'Nachname muss mindestens 2 Zeichen lang sein'),
        role: zod_1.z.enum(['freelancer'], {
            errorMap: () => ({ message: 'Ungültige Rolle' })
        })
    })
});
const loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Ungültige E-Mail-Adresse'),
        password: zod_1.z.string().min(1, 'Passwort ist erforderlich')
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
router.post('/register', (0, validator_1.validateRequest)(registerSchema), async (req, res, next) => {
    try {
        const { email, password, firstName, lastName, role } = req.body;
        // Überprüfe, ob E-Mail bereits existiert
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            throw new errors_1.ValidationError('E-Mail-Adresse wird bereits verwendet');
        }
        // Hash Passwort
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        // Erstelle neuen Benutzer
        const user = await User_1.default.create({
            email,
            password: hashedPassword,
            firstName,
            lastName,
            role
        });
        // Generiere Token
        const token = (0, auth_2.generateToken)(user);
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
    }
    catch (error) {
        next(error);
    }
});
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
router.post('/login', (0, validator_1.validateRequest)(loginSchema), async (req, res, next) => {
    try {
        const { email, password } = req.body;
        // Finde Benutzer
        const user = await User_1.default.findOne({ email });
        if (!user) {
            throw new errors_1.AuthError('Ungültige Anmeldedaten');
        }
        // Überprüfe Passwort
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            throw new errors_1.AuthError('Ungültige Anmeldedaten');
        }
        // Generiere Token
        const token = (0, auth_2.generateToken)(user);
        res.json({
            user: {
                userId: user._id,
                email: user.email,
                name: `${user.firstName} ${user.lastName}`,
                role: user.role
            },
            token
        });
    }
    catch (error) {
        next(error);
    }
});
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
router.get('/me', auth_1.auth, async (req, res, next) => {
    try {
        res.json({ user: req.user });
    }
    catch (error) {
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
router.put('/profile', auth_1.auth, async (req, res, next) => {
    try {
        const { firstName, lastName, email, settings } = req.body;
        const userId = req.user._id;
        const updatedUser = await User_1.default.findByIdAndUpdate(userId, { firstName, lastName, email, settings }, { new: true });
        if (!updatedUser) {
            throw new Error('Benutzer nicht gefunden');
        }
        res.json({ user: updatedUser });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
