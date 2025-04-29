import React, { useState, useEffect } from 'react';
import { Modal, Tabs, Button, message, Alert } from 'antd';
import { QRCodeSVG } from 'qrcode.react';
import { createStripePayment, createLightningInvoice, checkLightningPayment } from '../services/paymentService';

const { TabPane } = Tabs;

const PaymentModal = ({ visible, onClose, amount }) => {
  const [loading, setLoading] = useState(false);
  const [lightningInvoice, setLightningInvoice] = useState(null);
  const [paymentHash, setPaymentHash] = useState(null);
  const [checkingInterval, setCheckingInterval] = useState(null);

  useEffect(() => {
    return () => {
      if (checkingInterval) {
        clearInterval(checkingInterval);
      }
    };
  }, [checkingInterval]);

  const handleStripePayment = async () => {
    try {
      setLoading(true);
      const response = await createStripePayment(amount);
      window.location.href = response.url;
    } catch (error) {
      message.error('Fehler bei der Stripe-Zahlung');
    } finally {
      setLoading(false);
    }
  };

  const handleLightningPayment = async () => {
    try {
      setLoading(true);
      const response = await createLightningInvoice(amount);
      setLightningInvoice(response.invoice);
      setPaymentHash(response.paymentHash);

      const interval = setInterval(async () => {
        try {
          const status = await checkLightningPayment(response.paymentHash);
          if (status.paid) {
            clearInterval(interval);
            message.success('Zahlung erfolgreich!');
            onClose();
          }
        } catch (error) {
          console.error('Fehler beim Überprüfen der Zahlung:', error);
        }
      }, 2000);

      setCheckingInterval(interval);
    } catch (error) {
      message.error('Fehler beim Erstellen der Lightning-Rechnung');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Zahlung"
      visible={visible}
      onCancel={onClose}
      footer={null}
      width={400}
    >
      <Tabs defaultActiveKey="1">
        <TabPane tab="Stripe" key="1">
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p>Betrag: {amount} EUR</p>
            <Button
              type="primary"
              onClick={handleStripePayment}
              loading={loading}
            >
              Mit Kreditkarte bezahlen
            </Button>
          </div>
        </TabPane>
        <TabPane tab="Lightning" key="2">
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Alert
              message="Demnächst verfügbar"
              description="Bitcoin Lightning Zahlungen werden in Kürze aktiviert."
              type="info"
              showIcon
              style={{ marginBottom: '20px' }}
            />
            <p>Betrag: {amount} EUR</p>
            <Button
              type="primary"
              onClick={handleLightningPayment}
              loading={loading}
              disabled={true}
            >
              Lightning-Rechnung erstellen
            </Button>
            {lightningInvoice && (
              <div>
                <QRCodeSVG value={lightningInvoice} size={200} />
                <p style={{ marginTop: '10px' }}>
                  Scannen Sie den QR-Code mit Ihrer Lightning Wallet
                </p>
              </div>
            )}
          </div>
        </TabPane>
      </Tabs>
    </Modal>
  );
};

export default PaymentModal; 