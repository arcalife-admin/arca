import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { CalendarDays, FileText, Download, Mail, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { BudgetGenerator } from '@/utils/budgetGenerator';

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

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  procedures: DentalProcedure[];
  patient: Patient;
  organization?: Organization;
  onEmailBudget?: (pdfBlob: Blob, filename: string) => void;
}

export function BudgetModal({
  isOpen,
  onClose,
  procedures,
  patient,
  organization,
  onEmailBudget
}: BudgetModalProps) {
  const [options, setOptions] = useState({
    includeNotes: true,
    includeToothNumbers: true,
    vatRate: 21,
    validityDays: 30,
    additionalNotes: ''
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPdf, setGeneratedPdf] = useState<Blob | null>(null);

  const calculateValidUntil = () => {
    const date = new Date();
    date.setDate(date.getDate() + options.validityDays);
    return date;
  };

  const calculateTotalCost = () => {
    const subtotal = procedures.reduce((sum, proc) => {
      const quantity = proc.quantity || 1;
      const rate = proc.code.rate || 0;
      return sum + (quantity * rate);
    }, 0);

    const vatAmount = subtotal * (options.vatRate / 100);
    return {
      subtotal,
      vatAmount,
      total: subtotal + vatAmount
    };
  };

  const validateProcedures = () => {
    if (procedures.length === 0) {
      toast.error('No procedures selected for budget');
      return false;
    }
    return true;
  };

  const handleDownload = async () => {
    if (!validateProcedures()) return;

    setIsGenerating(true);
    try {
      let pdfBlob = generatedPdf;

      if (!pdfBlob) {
        const validUntil = calculateValidUntil();
        const budgetOptions = {
          includeNotes: options.includeNotes,
          includeToothNumbers: options.includeToothNumbers,
          vatRate: options.vatRate / 100,
          validUntil,
          additionalNotes: options.additionalNotes.trim() || undefined
        };

        pdfBlob = BudgetGenerator.generateForEmail(
          patient,
          procedures,
          organization,
          budgetOptions
        );
        setGeneratedPdf(pdfBlob);
      }

      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `budget-${patient.patientCode}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Budget downloaded successfully');
    } catch (error) {
      console.error('Error downloading budget:', error);
      toast.error('Failed to download budget');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEmail = async () => {
    if (!validateProcedures()) return;

    setIsGenerating(true);
    try {
      let pdfBlob = generatedPdf;

      if (!pdfBlob) {
        const validUntil = calculateValidUntil();
        const budgetOptions = {
          includeNotes: options.includeNotes,
          includeToothNumbers: options.includeToothNumbers,
          vatRate: options.vatRate / 100,
          validUntil,
          additionalNotes: options.additionalNotes.trim() || undefined
        };

        pdfBlob = BudgetGenerator.generateForEmail(
          patient,
          procedures,
          organization,
          budgetOptions
        );
        setGeneratedPdf(pdfBlob);
      }

      if (onEmailBudget) {
        const filename = `budget-${patient.patientCode}-${new Date().toISOString().split('T')[0]}.pdf`;
        onEmailBudget(pdfBlob, filename);
        onClose(); // Close the modal after preparing email
        toast.success('Budget prepared for email');
      } else {
        toast.error('Email functionality not available');
      }
    } catch (error) {
      console.error('Error preparing budget for email:', error);
      toast.error('Failed to prepare budget for email');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = async () => {
    if (!validateProcedures()) return;

    setIsGenerating(true);
    try {
      let pdfBlob = generatedPdf;

      if (!pdfBlob) {
        const validUntil = calculateValidUntil();
        const budgetOptions = {
          includeNotes: options.includeNotes,
          includeToothNumbers: options.includeToothNumbers,
          vatRate: options.vatRate / 100,
          validUntil,
          additionalNotes: options.additionalNotes.trim() || undefined
        };

        pdfBlob = BudgetGenerator.generateForEmail(
          patient,
          procedures,
          organization,
          budgetOptions
        );
        setGeneratedPdf(pdfBlob);
      }

      const url = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
          URL.revokeObjectURL(url);
        };
      } else {
        URL.revokeObjectURL(url);
        toast.error('Unable to open print dialog. Please check your popup blocker.');
      }

      toast.success('Budget opened for printing');
    } catch (error) {
      console.error('Error printing budget:', error);
      toast.error('Failed to print budget');
    } finally {
      setIsGenerating(false);
    }
  };

  const totals = calculateTotalCost();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Treatment Budget
          </DialogTitle>
          <DialogDescription>
            Create a professional budget document for {procedures.length} selected procedure{procedures.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Patient & Cost Summary */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-sm text-gray-700">Patient</h4>
              <p className="text-sm">{patient.firstName} {patient.lastName}</p>
              <p className="text-xs text-gray-500">{patient.patientCode}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-gray-700">Estimated Cost</h4>
              <p className="text-lg font-bold text-green-600">€{totals.total.toFixed(2)}</p>
              <p className="text-xs text-gray-500">
                Subtotal: €{totals.subtotal.toFixed(2)} + VAT ({options.vatRate}%): €{totals.vatAmount.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Budget Options */}
          <div className="space-y-4">
            <h4 className="font-medium">Budget Options</h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeNotes"
                    checked={options.includeNotes}
                    onCheckedChange={(checked) =>
                      setOptions(prev => ({ ...prev, includeNotes: checked as boolean }))
                    }
                  />
                  <Label htmlFor="includeNotes" className="text-sm">Include procedure notes</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeToothNumbers"
                    checked={options.includeToothNumbers}
                    onCheckedChange={(checked) =>
                      setOptions(prev => ({ ...prev, includeToothNumbers: checked as boolean }))
                    }
                  />
                  <Label htmlFor="includeToothNumbers" className="text-sm">Include tooth numbers</Label>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="vatRate" className="text-sm">VAT Rate (%)</Label>
                  <Input
                    id="vatRate"
                    type="number"
                    min="0"
                    max="100"
                    step={0.1}
                    value={options.vatRate}
                    onChange={(e) => setOptions(prev => ({
                      ...prev,
                      vatRate: parseFloat(e.target.value) || 0
                    }))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="validityDays" className="text-sm">Valid for (days)</Label>
                  <Input
                    id="validityDays"
                    type="number"
                    min="1"
                    max="365"
                    value={options.validityDays}
                    onChange={(e) => setOptions(prev => ({
                      ...prev,
                      validityDays: parseInt(e.target.value) || 30
                    }))}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="additionalNotes" className="text-sm">Additional Notes (optional)</Label>
              <Textarea
                id="additionalNotes"
                placeholder="Add any additional notes or terms..."
                value={options.additionalNotes}
                onChange={(e) => setOptions(prev => ({
                  ...prev,
                  additionalNotes: e.target.value
                }))}
                className="mt-1 min-h-[80px]"
              />
            </div>
          </div>

          {/* Valid Until Info */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CalendarDays className="h-4 w-4" />
            <span>Budget will be valid until: {calculateValidUntil().toLocaleDateString()}</span>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handlePrint}
              disabled={isGenerating}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>

            <Button
              variant="outline"
              onClick={handleEmail}
              disabled={isGenerating}
            >
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>

            <Button
              onClick={handleDownload}
              disabled={isGenerating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Download className="h-4 w-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Download PDF'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 