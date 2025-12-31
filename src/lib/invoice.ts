interface InvoiceData {
  invoiceNumber: string;
  patientName: string;
  procedures: Array<{
    code: string;
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  subtotal: number;
  finalAmount: number;
  paymentMethod: 'CASH' | 'CARD';
  cashRounding: number;
  paidAt: string;
}

export function generateInvoiceHTML(invoiceData: InvoiceData): string {
  const now = new Date();

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice ${invoiceData.invoiceNumber}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 20px; 
          color: #333;
        }
        .header { 
          text-align: center; 
          margin-bottom: 30px; 
          border-bottom: 2px solid #eee; 
          padding-bottom: 20px;
        }
        .invoice-details { 
          display: flex; 
          justify-content: space-between; 
          margin-bottom: 30px; 
        }
        .patient-info, .invoice-info { 
          width: 45%; 
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-bottom: 20px; 
        }
        th, td { 
          border: 1px solid #ddd; 
          padding: 12px; 
          text-align: left; 
        }
        th { 
          background-color: #f5f5f5; 
          font-weight: bold; 
        }
        .total-row { 
          font-weight: bold; 
          background-color: #f9f9f9; 
        }
        .amount { 
          text-align: right; 
        }
        .footer { 
          margin-top: 30px; 
          text-align: center; 
          font-size: 12px; 
          color: #666; 
        }
        .payment-info { 
          background-color: #e8f5e8; 
          padding: 15px; 
          border-radius: 5px; 
          margin-top: 20px; 
        }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>DENTAL INVOICE</h1>
        <h3>Invoice #${invoiceData.invoiceNumber}</h3>
      </div>

      <div class="invoice-details">
        <div class="patient-info">
          <h3>Patient Information</h3>
          <p><strong>Name:</strong> ${invoiceData.patientName}</p>
          <p><strong>Date:</strong> ${new Date(invoiceData.paidAt).toLocaleDateString()}</p>
        </div>
        <div class="invoice-info">
          <h3>Payment Information</h3>
          <p><strong>Payment Method:</strong> ${invoiceData.paymentMethod}</p>
          <p><strong>Payment Date:</strong> ${new Date(invoiceData.paidAt).toLocaleString()}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>Description</th>
            <th>Qty</th>
            <th>Rate</th>
            <th class="amount">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${invoiceData.procedures.map(proc => `
            <tr>
              <td>${proc.code}</td>
              <td>${proc.description}</td>
              <td>${proc.quantity}</td>
              <td class="amount">€${proc.rate.toFixed(2)}</td>
              <td class="amount">€${proc.amount.toFixed(2)}</td>
            </tr>
          `).join('')}
          <tr class="total-row">
            <td colspan="4">Subtotal</td>
            <td class="amount">€${invoiceData.subtotal.toFixed(2)}</td>
          </tr>
          ${invoiceData.cashRounding !== 0 ? `
            <tr>
              <td colspan="4">Cash Rounding</td>
              <td class="amount">${invoiceData.cashRounding > 0 ? '+' : ''}€${invoiceData.cashRounding.toFixed(2)}</td>
            </tr>
          ` : ''}
          <tr class="total-row" style="font-size: 1.1em;">
            <td colspan="4"><strong>TOTAL PAID</strong></td>
            <td class="amount"><strong>€${invoiceData.finalAmount.toFixed(2)}</strong></td>
          </tr>
        </tbody>
      </table>

      <div class="payment-info">
        <h4>Payment Confirmation</h4>
        <p>This invoice confirms that payment of <strong>€${invoiceData.finalAmount.toFixed(2)}</strong> has been received via <strong>${invoiceData.paymentMethod.toLowerCase()}</strong> on ${new Date(invoiceData.paidAt).toLocaleString()}.</p>
        ${invoiceData.cashRounding !== 0 ? `
          <p><em>Note: Amount was rounded ${invoiceData.cashRounding > 0 ? 'up' : 'down'} by €${Math.abs(invoiceData.cashRounding).toFixed(2)} for cash payment convenience.</em></p>
        ` : ''}
      </div>

      <div class="footer">
        <p>Thank you for choosing our dental practice!</p>
        <p>Generated on ${now.toLocaleString()}</p>
      </div>
    </body>
    </html>
  `;
}

export function printInvoice(invoiceData: InvoiceData): void {
  const invoiceHTML = generateInvoiceHTML(invoiceData);

  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(invoiceHTML);
    printWindow.document.close();

    // Wait for content to load, then print and close
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  }
}

export function downloadInvoiceHTML(invoiceData: InvoiceData): void {
  const invoiceHTML = generateInvoiceHTML(invoiceData);

  // Create a blob and download link
  const blob = new Blob([invoiceHTML], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `invoice-${invoiceData.invoiceNumber}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
} 