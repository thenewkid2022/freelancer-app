import React from 'react';
import QRCode from 'qrcode.react';

const QRCodeComponent = ({ value }) => {
  return (
    <div className="flex justify-center items-center p-4">
      <QRCode value={value} size={256} />
    </div>
  );
};

export default QRCodeComponent; 