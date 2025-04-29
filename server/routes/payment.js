const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Route für die Verarbeitung der Planauswahl
router.post('/select-plan', async (req, res) => {
  try {
    const { plan } = req.body;
    
    // Hier später: Stripe Integration für die Zahlungsabwicklung
    // Für jetzt senden wir nur eine Bestätigung zurück
    res.status(200).json({
      message: 'Plan erfolgreich ausgewählt',
      plan: plan,
      // Hier später: Stripe Checkout Session ID oder ähnliches
    });
  } catch (error) {
    console.error('Fehler bei der Planauswahl:', error);
    res.status(500).json({ message: 'Interner Serverfehler bei der Planauswahl' });
  }
});

module.exports = router; 