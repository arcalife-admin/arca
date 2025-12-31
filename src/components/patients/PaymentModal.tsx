import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Banknote, Mail, Printer, Euro, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { printInvoice } from '@/lib/invoice';
import { useRouter } from 'next/navigation';

interface DentalProcedure {
  id: string;
  code: {
    code: string;
    description: string;
    rate: number | null;
  };
  quantity?: number;
  toothNumber?: number;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  procedures: DentalProcedure[];
  patientId: string;
  onPaymentComplete: () => void;
}

interface PaymentSimulationProps {
  paymentMethod: 'CASH' | 'CARD';
  amount: number;
  onComplete: () => void;
}

// Helper function to round amount for cash payments
function roundForCash(amount: number): number {
  return Math.round(amount * 20) / 20;
}

// Payment simulation component
function PaymentSimulation({ paymentMethod, amount, onComplete }: PaymentSimulationProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setIsProcessing(true);
    setProgress(0);

    const simulationTime = paymentMethod === 'CARD' ? 3000 : 2000; // Card takes longer
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / (simulationTime / 100));
        if (newProgress >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          setIsComplete(true);
          setTimeout(onComplete, 1000);
          return 100;
        }
        return newProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [paymentMethod, onComplete]);

  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
        <h3 className="text-lg font-semibold text-green-600 mb-2">Payment Successful!</h3>
        <p className="text-gray-600">€{amount.toFixed(2)} paid via {paymentMethod.toLowerCase()}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      {paymentMethod === 'CARD' ? (
        <>
          <CreditCard className="w-16 h-16 text-blue-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Processing Card Payment</h3>
          <p className="text-gray-600 mb-4">Please follow the prompts on the card reader</p>
          <div className="w-full max-w-xs">
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">{Math.round(progress)}% complete</p>
          </div>
          {isProcessing && (
            <div className="mt-4 space-y-2 text-sm text-gray-600">
              {progress < 30 && <p>🔒 Securing connection...</p>}
              {progress >= 30 && progress < 60 && <p>💳 Reading card...</p>}
              {progress >= 60 && progress < 90 && <p>🏦 Contacting bank...</p>}
              {progress >= 90 && <p>✅ Finalizing transaction...</p>}
            </div>
          )}
        </>
      ) : (
        <>
          <Banknote className="w-16 h-16 text-green-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Processing Cash Payment</h3>
          <p className="text-gray-600 mb-4">Counting cash received...</p>
          <div className="w-full max-w-xs">
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">{Math.round(progress)}% complete</p>
          </div>
          {isProcessing && (
            <div className="mt-4 space-y-2 text-sm text-gray-600">
              {progress < 50 && <p>💵 Counting cash...</p>}
              {progress >= 50 && progress < 80 && <p>✅ Verifying amount...</p>}
              {progress >= 80 && <p>📝 Recording transaction...</p>}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function PaymentModal({ isOpen, onClose, procedures, patientId, onPaymentComplete }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CARD');
  const [sendEmail, setSendEmail] = useState(false);
  const [shouldPrintInvoice, setShouldPrintInvoice] = useState(true);
  const [showSimulation, setShowSimulation] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  // Calculate amounts
  const subtotal = procedures.reduce((sum, proc) =>
    sum + ((proc.code.rate || 0) * (proc.quantity || 1)), 0
  );
  const finalAmount = paymentMethod === 'CASH' ? roundForCash(subtotal) : subtotal;
  const cashRounding = paymentMethod === 'CASH' ? finalAmount - subtotal : 0;

  const handlePayment = async () => {
    setShowSimulation(true);
  };

  const handlePaymentComplete = async () => {
    onClose(); // Close the payment modal immediately
    try {
      const response = await fetch(`/api/patients/${patientId}/dental-procedures/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          procedureIds: procedures.map(p => p.id),
          paymentMethod,
          sendEmail,
          printInvoice: shouldPrintInvoice,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Payment failed');
      }

      const result = await response.json();

      if (shouldPrintInvoice && result.invoiceData) {
        printInvoice(result.invoiceData);
      }

      if (sendEmail) {
        toast.success('Invoice will be sent to patient email');
      }

      toast.success(result.message);
      onPaymentComplete();
      router.refresh();

    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
      setShowSimulation(false);
    }
  };

  const handleClose = () => {
    if (showSimulation || isProcessing) return; // Prevent closing during payment
    onClose();
  };

  if (showSimulation) {
    return (
      <Dialog open={isOpen} onOpenChange={() => { }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Processing Payment</DialogTitle>
          </DialogHeader>

          <PaymentSimulation
            paymentMethod={paymentMethod}
            amount={finalAmount}
            onComplete={handlePaymentComplete}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Euro className="w-5 h-5" />
            Process Payment
          </DialogTitle>
          <DialogDescription>
            Complete payment for selected dental procedures
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Procedures Summary */}
          <div>
            <h3 className="font-medium mb-3">Procedures to Pay</h3>
            <div className="space-y-2">
              {procedures.map((procedure) => (
                <Card key={procedure.id} className="p-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      {procedure.toothNumber && (
                        <Badge variant="outline" className="text-xs">
                          {procedure.toothNumber}
                        </Badge>
                      )}
                      <span className="font-medium text-sm">{procedure.code.code}</span>
                      <span className="text-gray-600 text-sm">{procedure.code.description}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Qty: {procedure.quantity || 1}</p>
                      <p className="font-medium">€{((procedure.code.rate || 0) * (procedure.quantity || 1)).toFixed(2)}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          {/* Amount Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>€{subtotal.toFixed(2)}</span>
              </div>
              {cashRounding !== 0 && (
                <div className="flex justify-between text-sm text-orange-600">
                  <span>Cash Rounding:</span>
                  <span>{cashRounding > 0 ? '+' : ''}€{cashRounding.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>€{finalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div>
            <h3 className="font-medium mb-3">Payment Method</h3>
            <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as 'CASH' | 'CARD')}>
              <div className="grid grid-cols-2 gap-4">
                <Card className={`p-4 cursor-pointer ${paymentMethod === 'CARD' ? 'ring-2 ring-blue-500' : ''}`}>
                  <Label htmlFor="card" className="cursor-pointer">
                    <RadioGroupItem value="CARD" id="card" className="sr-only" />
                    <div className="flex flex-col items-center text-center space-y-2">
                      <CreditCard className="w-8 h-8 text-blue-500" />
                      <span className="font-medium">Card Payment</span>
                      <span className="text-sm text-gray-500">Exact amount</span>
                      <Badge variant="secondary" className="text-xs">€{subtotal.toFixed(2)}</Badge>
                    </div>
                  </Label>
                </Card>

                <Card className={`p-4 cursor-pointer ${paymentMethod === 'CASH' ? 'ring-2 ring-green-500' : ''}`}>
                  <Label htmlFor="cash" className="cursor-pointer">
                    <RadioGroupItem value="CASH" id="cash" className="sr-only" />
                    <div className="flex flex-col items-center text-center space-y-2">
                      <Banknote className="w-8 h-8 text-green-500" />
                      <span className="font-medium">Cash Payment</span>
                      <span className="text-sm text-gray-500">Rounded to nearest €0.05</span>
                      <Badge variant="secondary" className="text-xs">€{roundForCash(subtotal).toFixed(2)}</Badge>
                    </div>
                  </Label>
                </Card>
              </div>
            </RadioGroup>
          </div>

          {/* Invoice Options */}
          <div>
            <h3 className="font-medium mb-3">Invoice Options</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="email-invoice"
                  checked={sendEmail}
                  onCheckedChange={(checked) => setSendEmail(!!checked)}
                />
                <Label htmlFor="email-invoice" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email invoice to patient
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="print-invoice"
                  checked={shouldPrintInvoice}
                  onCheckedChange={(checked) => setShouldPrintInvoice(!!checked)}
                />
                <Label htmlFor="print-invoice" className="flex items-center gap-2">
                  <Printer className="w-4 h-4" />
                  Print invoice
                </Label>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          {paymentMethod === 'CASH' && cashRounding !== 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm text-orange-800">
                <strong>Cash Payment Note:</strong> The amount has been rounded {cashRounding > 0 ? 'up' : 'down'} by €{Math.abs(cashRounding).toFixed(2)} to the nearest 5 cents for easier cash handling.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handlePayment}
            disabled={isProcessing || (!sendEmail && !shouldPrintInvoice)}
            className="min-w-[120px]"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Pay €{finalAmount.toFixed(2)}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 