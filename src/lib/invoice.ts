import { printHtmlDocument } from '@/lib/print-html'

function formatPaymentMethod(method: 'CASH' | 'CARD'): string {
  return method === 'CARD' ? 'card' : 'numerar';
}

function formatInvoiceDate(value: string): string {
  return new Date(value).toLocaleDateString('ro-RO');
}

function formatInvoiceDateTime(value: string): string {
  return new Date(value).toLocaleString('ro-RO');
}

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
  const paymentMethodLabel = formatPaymentMethod(invoiceData.paymentMethod);
  const paidAtDate = formatInvoiceDate(invoiceData.paidAt);
  const paidAtDateTime = formatInvoiceDateTime(invoiceData.paidAt);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Factură ${invoiceData.invoiceNumber}</title>
      <style>
        @page {
          margin: 0;
          size: A4;
        }
        body { 
          font-family: Arial, sans-serif; 
          margin: 0;
          padding: 20px;
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
        <h1>FACTURĂ</h1>
        <h3>Factură nr. ${invoiceData.invoiceNumber}</h3>
      </div>

      <div class="invoice-details">
        <div class="patient-info">
          <h3>Informații pacient</h3>
          <p><strong>Nume:</strong> ${invoiceData.patientName}</p>
          <p><strong>Data:</strong> ${paidAtDate}</p>
        </div>
        <div class="invoice-info">
          <h3>Informații plată</h3>
          <p><strong>Metodă de plată:</strong> ${paymentMethodLabel}</p>
          <p><strong>Data plății:</strong> ${paidAtDateTime}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Cod</th>
            <th>Descriere</th>
            <th>Cant.</th>
            <th>Preț unitar</th>
            <th class="amount">Sumă</th>
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
              <td colspan="4">Rotunjire numerar</td>
              <td class="amount">${invoiceData.cashRounding > 0 ? '+' : ''}€${invoiceData.cashRounding.toFixed(2)}</td>
            </tr>
          ` : ''}
          <tr class="total-row" style="font-size: 1.1em;">
            <td colspan="4"><strong>TOTAL PLĂTIT</strong></td>
            <td class="amount"><strong>€${invoiceData.finalAmount.toFixed(2)}</strong></td>
          </tr>
        </tbody>
      </table>

      <div class="payment-info">
        <h4>Confirmare plată</h4>
        <p>Această factură confirmă că plata de <strong>€${invoiceData.finalAmount.toFixed(2)}</strong> a fost primită prin <strong>${paymentMethodLabel}</strong> la ${paidAtDateTime}.</p>
        ${invoiceData.cashRounding !== 0 ? `
          <p><em>Notă: Suma a fost rotunjită ${invoiceData.cashRounding > 0 ? 'în sus' : 'în jos'} cu €${Math.abs(invoiceData.cashRounding).toFixed(2)} pentru conveniența plății numerar.</em></p>
        ` : ''}
      </div>

      <div class="footer">
        <p>Vă mulțumim că ne-ați ales!</p>
        <p>Generat la ${now.toLocaleString('ro-RO')}</p>
      </div>
    </body>
    </html>
  `;
}

export function printInvoice(invoiceData: InvoiceData): void {
  printHtmlDocument(generateInvoiceHTML(invoiceData));
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