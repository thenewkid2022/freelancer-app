const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const authenticateToken = require('../middleware/auth');

// Handler für die Planauswahl
router.post('/select-plan', authenticateToken, (req, res) => {
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

// Stripe Checkout Session erstellen
router.post('/create-stripe-session', authenticateToken, async (req, res) => {
  try {
    const { amount, plan, currency = 'chf' } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: `Freelancer App ${plan} Plan`,
            },
            unit_amount: Math.round(amount * 100), // Konvertiere zu Rappen
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/payment/success`,
      cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Stripe Fehler:', error);
    res.status(500).json({ error: 'Fehler bei der Zahlungsverarbeitung' });
  }
});

// Handler für Lightning-Zahlungen
router.post('/lightning-invoice', authenticateToken, (req, res) => {
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

// Handler für die Zahlungsbestätigung
router.post('/confirm-payment', authenticateToken, (req, res) => {
  try {
    const { paymentId, status } = req.body;
    
    if (!paymentId || !status) {
      return res.status(400).json({ message: 'Fehlende Zahlungsinformationen' });
    }

    // Hier später: Aktualisierung des Benutzerstatus basierend auf der Zahlung
    res.status(200).json({
      message: 'Zahlung erfolgreich bestätigt',
      paymentId,
      status
    });
  } catch (error) {
    console.error('Fehler bei der Zahlungsbestätigung:', error);
    res.status(500).json({ message: 'Fehler bei der Zahlungsbestätigung' });
  }
});

module.exports = router;
