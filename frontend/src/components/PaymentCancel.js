import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { CloseCircleOutlined } from '@ant-design/icons';

const PaymentCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Result
        icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
        status="error"
        title="Zahlung abgebrochen"
        subTitle="Die Zahlung wurde abgebrochen. Sie können es jederzeit erneut versuchen."
        extra={[
          <Button 
            type="primary" 
            onClick={() => navigate('/pricing')}
            key="retry"
          >
            Erneut versuchen
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

export default PaymentCancel; 