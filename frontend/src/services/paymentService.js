import { loadStripe } from '@stripe/stripe-js';
import api from './api';

// Stelle sicher, dass der Stripe Public Key aus den Umgebungsvariablen geladen wird
const STRIPE_PUBLIC_KEY = process.env.REACT_APP_STRIPE_PUBLIC_KEY;
if (!STRIPE_PUBLIC_KEY) {
  console.error('Stripe Public Key nicht gefunden! Bitte REACT_APP_STRIPE_PUBLIC_KEY in .env setzen');
}

const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);

export const paymentService = {
  // Stripe Zahlungsabwicklung
  async processStripePayment(amount, currency = 'eur') {
    try {
      // Hole Stripe Session vom Backend
      const response = await api.post('/payments/create-session', {
        amount,
        currency
      });

      const stripe = await stripePromise;
      const { error } = await stripe.redirectToCheckout({
        sessionId: response.data.sessionId
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Stripe Zahlungsfehler:', error);
      throw error;
    }
  },

  // Bitcoin Lightning Zahlungsabwicklung
  async processBitcoinPayment(amount, currency = 'chf') {
    try {
      // Hole Lightning Invoice vom Backend
      const response = await api.post('/payment/create-lightning-invoice', {
        amount,
        currency
      });

      const { paymentRequest, paymentHash } = response.data;

      // Prüfe ob WebLN verfügbar ist
      if (window.webln) {
        try {
          await window.webln.enable();
          await window.webln.sendPayment(paymentRequest);
          return { success: true, paymentHash };
        } catch (error) {
          console.error('WebLN Fehler:', error);
        }
      }

      // Fallback: Zeige QR-Code oder Payment Request
      return {
        success: false,
        paymentRequest,
        paymentHash
      };
    } catch (error) {
      console.error('Bitcoin Zahlungsfehler:', error);
      throw error;
    }
  },

  // Prüfe Zahlungsstatus
  async checkPaymentStatus(paymentHash) {
    try {
      const response = await api.get(`/payments/status/${paymentHash}`);
      return response.data;
    } catch (error) {
      console.error('Fehler beim Prüfen des Zahlungsstatus:', error);
      throw error;
    }
  },

  // Stripe Checkout Session erstellen
  createStripeSession: async (amount) => {
    try {
      const response = await api.post('/payments/create-checkout-session', { amount });
      return response.data;
    } catch (error) {
      throw new Error('Fehler beim Erstellen der Stripe Session');
    }
  },

  // Lightning Invoice erstellen
  createLightningInvoice: async (amount) => {
    try {
      const response = await api.post('/payment/create-lightning-invoice', { amount });
      return response.data;
    } catch (error) {
      throw new Error('Fehler bei der Erstellung der Lightning-Rechnung: ' + error.message);
    }
  },

  // Lightning Zahlungsstatus prüfen
  checkLightningPayment: async (paymentHash) => {
    try {
      const response = await api.get(`/payment/check-payment/${paymentHash}`);
      return response.data;
    } catch (error) {
      throw new Error('Fehler beim Überprüfen der Lightning-Zahlung: ' + error.message);
    }
  }
};

// Stripe Payment Handler
export const createStripePayment = async (amount, plan) => {
  try {
    console.log('Starting Stripe payment process...', { amount, plan });
    
    // Erstelle Stripe Checkout Session
    const response = await api.post('/payment/create-stripe-session', {
      amount,
      plan,
      currency: 'chf',
      success_url: `${window.location.origin}/payment/success`,
      cancel_url: `${window.location.origin}/payment/cancel`
    });

    console.log('Stripe session created:', response.data);

    // Hole Stripe Instance
    const stripe = await stripePromise;
    if (!stripe) {
      throw new Error('Stripe konnte nicht initialisiert werden');
    }

    // Redirect zu Stripe Checkout
    const { error } = await stripe.redirectToCheckout({
      sessionId: response.data.sessionId
    });

    if (error) {
      console.error('Stripe redirect error:', error);
      throw error;
    }

    return response.data;
  } catch (error) {
    console.error('Fehler beim Erstellen der Stripe-Zahlung:', error);
    throw error;
  }
};

export const createLightningInvoice = async (amount, plan) => {
  try {
    const response = await api.post('/payment/create-lightning-invoice', {
      amount,
      plan,
      currency: 'chf'
    });
    return response.data;
  } catch (error) {
    console.error('Fehler beim Erstellen der Lightning-Rechnung:', error);
    throw error;
  }
};

export const checkLightningPayment = async (paymentHash) => {
  try {
    const response = await api.get(`/payment/check-lightning-payment/${paymentHash}`);
    return response.data;
  } catch (error) {
    console.error('Fehler beim Überprüfen der Lightning-Zahlung:', error);
    throw error;
  }
}; 