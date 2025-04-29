import { loadStripe } from '@stripe/stripe-js';
import api from './api';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

export const paymentService = {
  // Stripe Zahlungsabwicklung
  async processStripePayment(amount, currency = 'eur') {
    try {
      // Hole Stripe Session vom Backend
      const response = await api.post('/api/payments/create-session', {
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
  async processBitcoinPayment(amount, currency = 'eur') {
    try {
      // Hole Lightning Invoice vom Backend
      const response = await api.post('/api/payments/create-lightning-invoice', {
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
      const response = await api.get(`/api/payments/status/${paymentHash}`);
      return response.data;
    } catch (error) {
      console.error('Fehler beim Prüfen des Zahlungsstatus:', error);
      throw error;
    }
  },

  // Stripe Checkout Session erstellen
  createStripeSession: async (amount) => {
    try {
      const response = await api.post('/api/payments/create-checkout-session', { amount });
      return response.data;
    } catch (error) {
      throw new Error('Fehler beim Erstellen der Stripe Session');
    }
  },

  // Lightning Invoice erstellen
  createLightningInvoice: async (amount) => {
    try {
      const response = await api.post('/api/payments/create-lightning-invoice', { amount });
      return response.data;
    } catch (error) {
      throw new Error('Fehler bei der Erstellung der Lightning-Rechnung: ' + error.message);
    }
  },

  // Lightning Zahlungsstatus prüfen
  checkLightningPayment: async (paymentHash) => {
    try {
      const response = await api.get(`/api/payments/check-payment/${paymentHash}`);
      return response.data;
    } catch (error) {
      throw new Error('Fehler beim Überprüfen der Lightning-Zahlung: ' + error.message);
    }
  }
};

export const createStripePayment = async (amount, plan) => {
  try {
    const response = await api.post('/payment/create-stripe-session', {
      amount,
      plan,
      currency: 'chf'
    });
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