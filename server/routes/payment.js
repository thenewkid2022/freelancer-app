const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Route für die Verarbeitung der Planauswahl
router.post('/select-plan', authenticateToken, async (req, res) => {
  try {
    const { plan } = req.body;
    
    // Validierung des Plans
    const validPlans = ['basic', 'pro', 'enterprise'];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ message: 'Ungültiger Plan ausgewählt' });
    }

    // Hier später: Stripe Integration für die Zahlungsabwicklung
    res.status(200).json({
      message: 'Plan erfolgreich ausgewählt',
      plan: plan
    });
  } catch (error) {
    console.error('Fehler bei der Planauswahl:', error);
    res.status(500).json({ message: 'Interner Serverfehler bei der Planauswahl' });
  }
});

// Route für Lightning-Zahlungen
router.post('/lightning-invoice', authenticateToken, async (req, res) => {
  try {
    const { plan } = req.body;
    
    // Preise in Satoshis
    const prices = {
      pro: 2900000,      // 29 CHF in Sats
      enterprise: 9900000 // 99 CHF in Sats
    };

    if (!plan || !prices[plan]) {
      return res.status(400).json({ message: 'Ungültiger Plan für Lightning-Zahlung' });
    }

    const amount = prices[plan];

    // Demo-Invoice für Testzwecke
    const invoice = {
      paymentRequest: 'lnbc1000n1pj4d5ekpp5v4w8x50n6xkn0z24w3uhv9zxsj6j38h8gk4pw4hs8spg4f7qhx4qdp8xys9xct5da5kueegcqzpgxqyz5vqsp5usxj4qzwhd6r4858687640npy96nyqy3g5mwgxrsymxdd7k4k4ms9qyyssqy4lgdx5v6659tx68wpxkr7jnc4k95tjdwvj0szs8zlkv2j4r7emg9wksfsjul935ym5h7h89rnhqt9v5gdsg2xnm0wgu6j72jaxt4ycpn4tu0m',
      amount: amount
    };

    res.status(200).json(invoice);
  } catch (error) {
    console.error('Fehler bei der Lightning-Invoice-Generierung:', error);
    res.status(500).json({ message: 'Fehler bei der Lightning-Invoice-Generierung' });
  }
});

module.exports = router; 