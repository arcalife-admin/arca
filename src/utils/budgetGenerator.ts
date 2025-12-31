import jsPDF from 'jspdf';

interface DentalCode {
  id: string;
  code: string;
  description: string;
  points: number | null;
  rate: number | null;
  category: string;
}

interface DentalProcedure {
  id: string;
  patientId: string;
  codeId: string;
  date: string;
  notes?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  code: DentalCode;
  practitioner?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  toothNumber?: number;
  quantity?: number;
}

interface Patient {
  id: string;
  patientCode: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  address: {
    display_name: string;
  };
}

interface Organization {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

interface BudgetOptions {
  includeNotes?: boolean;
  includeToothNumbers?: boolean;
  vatRate?: number;
  validUntil?: Date;
  additionalNotes?: string;
}

export class BudgetGenerator {
  private doc: jsPDF;

  constructor() {
    this.doc = new jsPDF();
  }

  generateBudget(
    patient: Patient,
    procedures: DentalProcedure[],
    organization?: Organization,
    options: BudgetOptions = {}
  ): Blob {
    const {
      includeNotes = true,
      includeToothNumbers = true,
      vatRate = 0.21, // Default 21% VAT
      validUntil,
      additionalNotes
    } = options;

    // Set up the document
    this.setupDocument();

    // Add header
    this.addHeader(organization);

    // Add patient information
    this.addPatientInfo(patient);

    // Add budget title and date
    this.addBudgetTitle(validUntil);

    // Add procedures table
    this.addProceduresTable(procedures, includeNotes, includeToothNumbers);

    // Add cost summary
    this.addCostSummary(procedures, vatRate);

    // Add footer with terms and additional notes
    this.addFooter(additionalNotes, validUntil);

    // Return the PDF as a blob
    return this.doc.output('blob');
  }

  private setupDocument(): void {
    this.doc.setFont('helvetica');
  }

  private addHeader(organization?: Organization): void {
    const pageWidth = this.doc.internal.pageSize.width;

    // Organization name
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    const orgName = organization?.name || 'Dental Practice';
    this.doc.text(orgName, pageWidth / 2, 25, { align: 'center' });

    // Organization details
    if (organization) {
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      let yPos = 35;

      if (organization.address) {
        this.doc.text(organization.address, pageWidth / 2, yPos, { align: 'center' });
        yPos += 5;
      }

      if (organization.phone || organization.email) {
        const contact = [organization.phone, organization.email].filter(Boolean).join(' | ');
        this.doc.text(contact, pageWidth / 2, yPos, { align: 'center' });
        yPos += 5;
      }

      if (organization.website) {
        this.doc.text(organization.website, pageWidth / 2, yPos, { align: 'center' });
      }
    }

    // Add line separator
    this.doc.setLineWidth(0.5);
    this.doc.line(20, 55, pageWidth - 20, 55);
  }

  private addPatientInfo(patient: Patient): void {
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Patient Information:', 20, 70);

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);

    const patientInfo = [
      `Name: ${patient.firstName} ${patient.lastName}`,
      `Date of Birth: ${new Date(patient.dateOfBirth).toLocaleDateString()}`,
      `Address: ${patient.address.display_name}`,
      ...(patient.phone ? [`Phone: ${patient.phone}`] : []),
      ...(patient.email ? [`Email: ${patient.email}`] : [])
    ];

    let yPos = 80;
    patientInfo.forEach(info => {
      this.doc.text(info, 20, yPos);
      yPos += 6;
    });
  }

  private addBudgetTitle(validUntil?: Date): void {
    const pageWidth = this.doc.internal.pageSize.width;

    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('TREATMENT BUDGET', pageWidth / 2, 135, { align: 'center' });

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 20, 145, { align: 'right' });

    if (validUntil) {
      this.doc.text(`Valid until: ${validUntil.toLocaleDateString()}`, pageWidth - 20, 155, { align: 'right' });
    }
  }

  private addProceduresTable(
    procedures: DentalProcedure[],
    includeNotes: boolean,
    includeToothNumbers: boolean
  ): void {
    const pageWidth = this.doc.internal.pageSize.width;
    const pageHeight = this.doc.internal.pageSize.height;
    const margin = 20;
    const tableWidth = pageWidth - (margin * 2);

    const startY = 165;
    let currentY = startY;

    // Calculate dynamic column widths to prevent overflow
    const availableWidth = tableWidth - 10; // Account for padding
    const baseColumns = [
      { key: 'code', header: 'Code', width: 22 },
      { key: 'description', header: 'Description', width: includeNotes ? 45 : 65 },
      ...(includeToothNumbers ? [{ key: 'tooth', header: 'Tooth', width: 18 }] : []),
      { key: 'qty', header: 'Qty', width: 12 },
      { key: 'rate', header: 'Rate (€)', width: 22 },
      { key: 'total', header: 'Total (€)', width: 22 },
      ...(includeNotes ? [{ key: 'notes', header: 'Notes', width: 28 }] : [])
    ];

    // Verify total width doesn't exceed available width
    const totalWidth = baseColumns.reduce((sum, col) => sum + col.width, 0);
    if (totalWidth > availableWidth) {
      // Scale down proportionally if needed
      const scale = availableWidth / totalWidth;
      baseColumns.forEach(col => col.width = Math.floor(col.width * scale));
    }

    // Table headers
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFillColor(41, 128, 185);
    this.doc.rect(margin, currentY, tableWidth, 8, 'F');

    this.doc.setTextColor(255);
    let xPos = margin + 5;
    baseColumns.forEach(col => {
      this.doc.text(col.header, xPos, currentY + 6);
      xPos += col.width;
    });

    currentY += 10;

    // Table rows
    this.doc.setTextColor(0);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);

    procedures.forEach((proc, index) => {
      const quantity = proc.quantity || 1;
      const rate = proc.code.rate || 0;
      const total = quantity * rate;

      // Alternate row colors
      if (index % 2 === 1) {
        this.doc.setFillColor(245, 245, 245);
        this.doc.rect(margin, currentY - 2, tableWidth, 8, 'F');
      }

      let xPos = margin + 5;

      // Code
      this.doc.text(proc.code.code, xPos, currentY + 4);
      xPos += baseColumns[0].width;

      // Description - smart truncation
      const descWidth = baseColumns[1].width;
      const maxChars = Math.floor(descWidth * 0.6); // Approximate chars per width
      const desc = proc.code.description.length > maxChars
        ? proc.code.description.substring(0, maxChars - 3) + '...'
        : proc.code.description;
      this.doc.text(desc, xPos, currentY + 4);
      xPos += baseColumns[1].width;

      // Tooth (if included)
      if (includeToothNumbers) {
        const toothText = proc.toothNumber ? proc.toothNumber.toString() : '-';
        this.doc.text(toothText, xPos + 5, currentY + 4, { align: 'center' });
        xPos += baseColumns.find(c => c.key === 'tooth')!.width;
      }

      // Quantity
      this.doc.text(quantity.toString(), xPos + 5, currentY + 4, { align: 'center' });
      xPos += baseColumns.find(c => c.key === 'qty')!.width;

      // Rate
      this.doc.text(rate.toFixed(2), xPos + baseColumns.find(c => c.key === 'rate')!.width - 5, currentY + 4, { align: 'right' });
      xPos += baseColumns.find(c => c.key === 'rate')!.width;

      // Total
      this.doc.text(total.toFixed(2), xPos + baseColumns.find(c => c.key === 'total')!.width - 5, currentY + 4, { align: 'right' });
      xPos += baseColumns.find(c => c.key === 'total')!.width;

      // Notes (if included)
      if (includeNotes && proc.notes) {
        const notesWidth = baseColumns.find(c => c.key === 'notes')!.width;
        const maxNotesChars = Math.floor(notesWidth * 0.5);
        const notes = proc.notes.length > maxNotesChars
          ? proc.notes.substring(0, maxNotesChars - 3) + '...'
          : proc.notes;
        this.doc.text(notes, xPos, currentY + 4);
      }

      currentY += 8;
    });

    // Store the final Y position for the cost summary
    (this.doc as any).lastAutoTable = { finalY: currentY };
  }

  private addCostSummary(procedures: DentalProcedure[], vatRate: number): void {
    const pageWidth = this.doc.internal.pageSize.width;
    const pageHeight = this.doc.internal.pageSize.height;
    const margin = 20;

    // Calculate totals
    const subtotal = procedures.reduce((sum, proc) => {
      const quantity = proc.quantity || 1;
      const rate = proc.code.rate || 0;
      return sum + (quantity * rate);
    }, 0);

    const vatAmount = subtotal * vatRate;
    const total = subtotal + vatAmount;

    // Get Y position after table
    const finalY = ((this.doc as any).lastAutoTable?.finalY || 200) + 20;

    // Summary box dimensions and position
    const boxWidth = 80;  // Reduced from 100 to prevent overlap
    const boxHeight = 50;
    const boxX = pageWidth - margin - boxWidth;

    // Add summary box with proper margins
    this.doc.setLineWidth(0.5);
    this.doc.setDrawColor(200, 200, 200);
    this.doc.rect(boxX, finalY, boxWidth, boxHeight);

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0);

    let yPos = finalY + 10;

    // Subtotal
    this.doc.text('Subtotal:', boxX + 5, yPos);
    this.doc.text(`€${subtotal.toFixed(2)}`, boxX + boxWidth - 5, yPos, { align: 'right' });

    yPos += 8;

    // VAT
    this.doc.text(`VAT (${(vatRate * 100).toFixed(0)}%):`, boxX + 5, yPos);
    this.doc.text(`€${vatAmount.toFixed(2)}`, boxX + boxWidth - 5, yPos, { align: 'right' });

    yPos += 10;

    // Total (bold)
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Total:', boxX + 5, yPos);
    this.doc.text(`€${total.toFixed(2)}`, boxX + boxWidth - 5, yPos, { align: 'right' });
  }

  private addFooter(additionalNotes?: string, validUntil?: Date): void {
    const pageWidth = this.doc.internal.pageSize.width;
    const pageHeight = this.doc.internal.pageSize.height;
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);

    let yPos = pageHeight - 60; // Position for footer content

    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0);

    // Terms and conditions
    const terms = [
      'Terms and Conditions:',
      '• This budget is valid for the period specified above',
      '• Prices are subject to change without prior notice',
      '• Treatment must be completed within the validity period',
      '• Payment is due upon completion of treatment',
      '• Additional costs may apply for complex cases'
    ];

    terms.forEach((term, index) => {
      if (index === 0) {
        this.doc.setFont('helvetica', 'bold');
      } else {
        this.doc.setFont('helvetica', 'normal');
      }

      this.doc.text(term, margin, yPos);
      yPos += 5;
    });

    // Additional notes (if provided)
    if (additionalNotes) {
      yPos += 5;
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Additional Notes:', margin, yPos);
      yPos += 5;

      this.doc.setFont('helvetica', 'normal');
      const notes = this.doc.splitTextToSize(additionalNotes, maxWidth);
      this.doc.text(notes, margin, yPos);
    }
  }

  // Method to generate and download PDF
  static generateAndDownload(
    patient: Patient,
    procedures: DentalProcedure[],
    organization?: Organization,
    options: BudgetOptions = {}
  ): void {
    const generator = new BudgetGenerator();
    const pdfBlob = generator.generateBudget(patient, procedures, organization, options);

    // Create download link
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `budget-${patient.patientCode}-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Method to generate PDF for email attachment
  static generateForEmail(
    patient: Patient,
    procedures: DentalProcedure[],
    organization?: Organization,
    options: BudgetOptions = {}
  ): Blob {
    const generator = new BudgetGenerator();
    return generator.generateBudget(patient, procedures, organization, options);
  }
} 