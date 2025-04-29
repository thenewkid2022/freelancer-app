const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { LightningClient } = require('lightning-client');
const { authenticateToken } = require('../middleware/auth');

// Lightning Client initialisieren
const lightning = new LightningClient(process.env.LIGHTNING_RPC);

// Stripe Checkout Session erstellen
router.post('/create-checkout-session', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Freelancer App Zahlung',
            },
            unit_amount: Math.round(amount * 100), // Cent zu Euro Konvertierung
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/payment/success`,
      cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe Fehler:', error);
    res.status(500).json({ error: 'Fehler bei der Zahlungsverarbeitung' });
  }
});

// Lightning Invoice erstellen
router.post('/create-lightning-invoice', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;
    
    // Konvertiere EUR zu Satoshis (vereinfachte Berechnung)
    const btcPrice = 40000; // Sollte dynamisch von einer API geholt werden
    const amountInSats = Math.round((amount / btcPrice) * 100000000);

    const invoice = await lightning.createInvoice({
      amount: amountInSats,
      description: `Freelancer App Zahlung - ${amount} EUR`,
      expiry: 3600, // 1 Stunde Gültigkeit
    });

    res.json({
      paymentRequest: invoice.paymentRequest,
      paymentHash: invoice.paymentHash,
    });
  } catch (error) {
    console.error('Lightning Fehler:', error);
    res.status(500).json({ error: 'Fehler bei der Lightning Invoice Erstellung' });
  }
});

// Lightning Zahlungsstatus prüfen
router.get('/check-payment/:paymentHash', authenticateToken, async (req, res) => {
  try {
    const { paymentHash } = req.params;
    const invoice = await lightning.lookupInvoice(paymentHash);

    res.json({
      paid: invoice.settled,
      amount: invoice.amountPaid,
    });
  } catch (error) {
    console.error('Lightning Fehler:', error);
    res.status(500).json({ error: 'Fehler beim Prüfen des Zahlungsstatus' });
  }
});

module.exports = router; 