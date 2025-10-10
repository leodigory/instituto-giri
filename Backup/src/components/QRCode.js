import React from "react";
import "./QRCode.css";

const QRCodeComponent = ({ value, size = 128, level = "M" }) => {
  return (
    <div className="qr-code-container">
      <div className="qr-placeholder" style={{ width: size, height: size }}>
        <span>QR: {value}</span>
      </div>
    </div>
  );
};

export default QRCodeComponent;
