import React, { useState } from 'react';
import { paymentService } from '../services/paymentService';
import { Button, Card, Input, message } from 'antd';
import QRCode from 'qrcode.react';

const Payment = () => {
  const [amount, setAmount] = useState('');
  const [lightningInvoice, setLightningInvoice] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleStripePayment = async () => {
    try {
      setLoading(true);
      const { url } = await paymentService.createStripeSession(parseFloat(amount));
      window.location.href = url;
    } catch (error) {
      message.error('Fehler bei der Stripe-Zahlung');
    } finally {
      setLoading(false);
    }
  };

  const handleLightningPayment = async () => {
    try {
      setLoading(true);
      const response = await paymentService.createLightningInvoice(parseFloat(amount));
      setLightningInvoice(response);
      
      // Starte Polling für den Zahlungsstatus
      const checkPayment = async () => {
        const status = await paymentService.checkLightningPayment(response.paymentHash);
        if (status.settled) {
          message.success('Zahlung erfolgreich!');
          setLightningInvoice(null);
        }
      };

      const interval = setInterval(checkPayment, 5000);
      setTimeout(() => clearInterval(interval), 600000); // Timeout nach 10 Minuten
    } catch (error) {
      message.error('Fehler bei der Lightning-Zahlung');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
      <Card title="Zahlung">
        <Input
          type="number"
          placeholder="Betrag in EUR"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{ marginBottom: 20 }}
        />
        
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <Button 
            type="primary" 
            onClick={handleStripePayment}
            loading={loading}
            disabled={!amount}
          >
            Mit Kreditkarte zahlen
          </Button>
          
          <Button
            onClick={handleLightningPayment}
            loading={loading}
            disabled={!amount}
          >
            Mit Lightning zahlen
          </Button>
        </div>

        {lightningInvoice && (
          <div style={{ textAlign: 'center' }}>
            <QRCode value={lightningInvoice.paymentRequest} size={256} />
            <p style={{ marginTop: 10, wordBreak: 'break-all' }}>
              {lightningInvoice.paymentRequest}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Payment; 