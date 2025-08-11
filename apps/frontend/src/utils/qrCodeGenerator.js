// Simple QR code generator for invoices
// This is a basic implementation - in production, you might want to use a proper QR library

export const generateQRCode = (invoiceData) => {
  // Create QR code with just the invoice number
  const qrText = invoiceData.invoiceNumber || invoiceData.invoice_number || "";

  // For now, return a placeholder QR code
  // In a real implementation, you would use a QR code library like qrcode.js
  return `data:image/svg+xml;base64,${btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="white"/>
      <text x="50" y="50" text-anchor="middle" dy=".3em" font-size="8" fill="black">QR</text>
      <text x="50" y="60" text-anchor="middle" dy=".3em" font-size="6" fill="black">Code</text>
    </svg>
  `)}`;
};

export const generateInvoiceQRCode = (invoice) => {
  if (!invoice) return "";

  try {
    return generateQRCode(invoice);
  } catch (error) {
    console.error("Error generating QR code:", error);
    return "";
  }
};
