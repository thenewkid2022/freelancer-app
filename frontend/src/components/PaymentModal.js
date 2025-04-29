import React, { useState, useEffect } from 'react';
import { Modal, Tabs, Button, message, Alert, Radio, Space } from 'antd';
import { QRCodeSVG } from 'qrcode.react';
import { createStripePayment, createLightningInvoice, checkLightningPayment } from '../services/paymentService';
import { CreditCardOutlined, ThunderboltOutlined } from '@ant-design/icons';

const { TabPane } = Tabs;

const PaymentModal = ({ visible, onClose, amount, plan }) => {
  const [loading, setLoading] = useState(false);
  const [lightningInvoice, setLightningInvoice] = useState(null);
  const [paymentHash, setPaymentHash] = useState(null);
  const [checkingInterval, setCheckingInterval] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('stripe');

  useEffect(() => {
    return () => {
      if (checkingInterval) {
        clearInterval(checkingInterval);
      }
    };
  }, [checkingInterval]);

  // Reset state when modal is opened/closed
  useEffect(() => {
    if (!visible) {
      setLightningInvoice(null);
      setPaymentHash(null);
      if (checkingInterval) {
        clearInterval(checkingInterval);
      }
    }
  }, [visible]);

  const handleStripePayment = async () => {
    try {
      setLoading(true);
      const response = await createStripePayment(amount, plan);
      window.location.href = response.url;
    } catch (error) {
      message.error('Fehler bei der Stripe-Zahlung');
      console.error('Stripe Fehler:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLightningPayment = async () => {
    try {
      setLoading(true);
      const response = await createLightningInvoice(amount, plan);
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
      console.error('Lightning Fehler:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = () => {
    if (paymentMethod === 'stripe') {
      handleStripePayment();
    } else {
      handleLightningPayment();
    }
  };

  return (
    <Modal
      title="Zahlungsmethode auswählen"
      visible={visible}
      onCancel={onClose}
      footer={null}
      width={500}
    >
      <div className="payment-modal-content">
        <div className="plan-info" style={{ marginBottom: '20px', textAlign: 'center' }}>
          <h3>{plan} Plan</h3>
          <p className="amount">CHF {amount}</p>
        </div>

        <Radio.Group
          onChange={(e) => setPaymentMethod(e.target.value)}
          value={paymentMethod}
          style={{ width: '100%', marginBottom: '20px' }}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Radio.Button value="stripe" style={{ width: '100%', height: 'auto', padding: '16px' }}>
              <Space>
                <CreditCardOutlined style={{ fontSize: '24px' }} />
                <div>
                  <div style={{ fontWeight: 'bold' }}>Kreditkarte</div>
                  <div style={{ fontSize: '12px' }}>Zahlen Sie sicher mit Ihrer Kreditkarte via Stripe</div>
                </div>
              </Space>
            </Radio.Button>
            <Radio.Button value="lightning" style={{ width: '100%', height: 'auto', padding: '16px' }}>
              <Space>
                <ThunderboltOutlined style={{ fontSize: '24px' }} />
                <div>
                  <div style={{ fontWeight: 'bold' }}>Bitcoin Lightning</div>
                  <div style={{ fontSize: '12px' }}>Schnelle und kostengünstige Zahlung via Bitcoin Lightning</div>
                </div>
              </Space>
            </Radio.Button>
          </Space>
        </Radio.Group>

        {paymentMethod === 'lightning' && lightningInvoice && (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <QRCodeSVG value={lightningInvoice} size={200} />
            <p style={{ marginTop: '10px' }}>
              Scannen Sie den QR-Code mit Ihrer Lightning Wallet
            </p>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Button
            type="primary"
            size="large"
            onClick={handlePayment}
            loading={loading}
            icon={paymentMethod === 'stripe' ? <CreditCardOutlined /> : <ThunderboltOutlined />}
          >
            {paymentMethod === 'stripe' ? 'Mit Kreditkarte bezahlen' : 'Lightning-Rechnung erstellen'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PaymentModal; 