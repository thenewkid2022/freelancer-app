import express from 'express';
import { paymentController } from '../controllers/paymentController';
import { auth } from '../middleware/auth';
import { validatePayment } from '../middleware/validator';

const router = express.Router();

// Alle Routen erfordern Authentifizierung
router.use(auth);

// Zahlungen erstellen
router.post('/', validatePayment, paymentController.create);

// Zahlungen abrufen
router.get('/freelancer', paymentController.getFreelancerPayments);
router.get('/client', paymentController.getClientPayments);
router.get('/:id', paymentController.getPayment);

// Zahlungsstatus aktualisieren
router.patch('/:id/status', paymentController.updateStatus);

export default router; 