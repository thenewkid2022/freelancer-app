import React, { useEffect } from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { CheckCircleOutlined } from '@ant-design/icons';

const PaymentSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Optional: Hier können Sie die Zahlung im Backend verifizieren
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Result
        icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
        status="success"
        title="Zahlung erfolgreich!"
        subTitle="Vielen Dank für Ihren Einkauf. Ihr Plan wurde erfolgreich aktiviert."
        extra={[
          <Button 
            type="primary" 
            onClick={() => navigate('/dashboard')}
            key="dashboard"
          >
            Zum Dashboard
          </Button>,
          <Button 
            onClick={() => navigate('/')}
            key="home"
          >
            Zur Startseite
          </Button>,
        ]}
      />
    </div>
  );
};

export default PaymentSuccess; 