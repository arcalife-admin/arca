import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface PaymentRequest {
  procedureIds: string[];
  paymentMethod: 'CASH' | 'CARD';
  sendEmail: boolean;
  printInvoice: boolean;
}

// Helper function to round amount for cash payments
function roundForCash(amount: number): number {
  // Round to nearest 0.05 (5 cents) for cash payments
  return Math.round(amount * 20) / 20;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body: PaymentRequest = await request.json();
    const { procedureIds, paymentMethod, sendEmail, printInvoice } = body;
    const patientId = params.id;

    if (!procedureIds || procedureIds.length === 0) {
      return NextResponse.json(
        { error: 'No procedures selected for payment' },
        { status: 400 }
      );
    }

    // Fetch the procedures to be paid
    const procedures = await prisma.dentalProcedure.findMany({
      where: {
        id: { in: procedureIds },
        patientId: patientId,
        isPaid: false, // Only allow payment of unpaid procedures
      },
      include: {
        code: true,
        patient: true,
      },
    });

    if (procedures.length === 0) {
      return NextResponse.json(
        { error: 'No valid unpaid procedures found' },
        { status: 400 }
      );
    }

    // Calculate total amount
    let totalAmount = 0;
    for (const procedure of procedures) {
      const procedureAmount = (procedure.code.rate || 0) * (procedure.quantity || 1);
      totalAmount += procedureAmount;
    }

    // Apply cash rounding if payment method is cash
    const finalAmount = paymentMethod === 'CASH' ? roundForCash(totalAmount) : totalAmount;

    // Update procedures as paid
    const updatePromises = procedures.map((procedure) => {
      const procedureAmount = (procedure.code.rate || 0) * (procedure.quantity || 1);
      // For cash payments, distribute the rounded amount proportionally
      const adjustedAmount = paymentMethod === 'CASH'
        ? (procedureAmount / totalAmount) * finalAmount
        : procedureAmount;

      return prisma.dentalProcedure.update({
        where: { id: procedure.id },
        data: {
          isPaid: true,
          paymentAmount: adjustedAmount,
          paymentMethod: paymentMethod,
          paidAt: new Date(),
          invoiceEmail: sendEmail,
          invoicePrinted: printInvoice,
        },
      });
    });

    await Promise.all(updatePromises);

    // Generate invoice data
    const invoiceData = {
      invoiceNumber: `INV-${Date.now()}`,
      patientName: `${procedures[0].patient.firstName} ${procedures[0].patient.lastName}`,
      procedures: procedures.map((proc) => ({
        code: proc.code.code,
        description: proc.code.description,
        quantity: proc.quantity || 1,
        rate: proc.code.rate || 0,
        amount: (proc.code.rate || 0) * (proc.quantity || 1),
      })),
      subtotal: totalAmount,
      finalAmount: finalAmount,
      paymentMethod: paymentMethod,
      cashRounding: paymentMethod === 'CASH' ? finalAmount - totalAmount : 0,
      paidAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: `Payment processed successfully. ${procedures.length} procedure(s) marked as paid.`,
      invoiceData,
      totalAmount: finalAmount,
      proceduresUpdated: procedures.length,
    });

  } catch (error) {
    console.error('Payment processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  }
} 