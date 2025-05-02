import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Überprüft den Gesundheitszustand der API
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API ist gesund
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "healthy"
 *                 database:
 *                   type: string
 *                   example: "connected"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: API ist nicht gesund
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "unhealthy"
 *                 error:
 *                   type: string
 *                   example: "Datenbankverbindung fehlgeschlagen"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/', async (req, res) => {
  const timestamp = new Date().toISOString();
  
  try {
    // Überprüfe den Datenbankstatus
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Wenn die Datenbank nicht verbunden ist, geben wir trotzdem 200 zurück
    // aber mit dem Status "disconnected"
    res.json({
      status: 'healthy',
      database: dbStatus,
      timestamp
    });
  } catch (error) {
    // Bei unerwarteten Fehlern geben wir 500 zurück
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unerwarteter Fehler',
      timestamp
    });
  }
});

export default router; 