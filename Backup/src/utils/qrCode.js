

export const generateQRCode = async (data) => {
  return `QR:${data}`;
};

export const generateSaleQR = async (sale) => {
  return `VENDA:${sale.id}`;
};
