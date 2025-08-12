// Shared utilities and constants
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://united-tubes.inplsoftwares.online' 
  : 'http://localhost:3003';

export const FBR_API_URL = 'https://gw.fbr.gov.pk';

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR'
  }).format(amount);
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-PK');
};

export const generateInvoiceNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `INV-${timestamp}-${random}`;
};
