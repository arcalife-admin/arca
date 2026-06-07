import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface PaymentRequest {
  procedureIds: string[];
  paymentMethod: 'CASH' | 'CARD';
  sendEmail: boolean;
  printInvoice: boolean;
}

function roundForCash(amount: number): number {
  return Math.round(amount * 20) / 20;
}

function procedureAmount(procedure: {
  cost: number | null;
  quantity: number;
  code: { price: number | null };
}): number {
  if (typeof procedure.cost === 'number') {
    return procedure.cost;
  }
  return (procedure.code.price || 0) * (procedure.quantity || 1);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body: PaymentRequest = await request.json();
    const { procedureIds, paymentMethod, sendEmail, printInvoice } = body;
    const patientId = params.id;

    if (!procedureIds?.length) {
      return NextResponse.json(
        { error: 'Nu au fost selectate proceduri pentru plată' },
        { status: 400 }
      );
    }

    const procedures = await prisma.surgicalProcedure.findMany({
      where: {
        id: { in: procedureIds },
        patientId,
        isPaid: false,
      },
      include: {
        code: true,
        patient: true,
      },
    });

    if (procedures.length === 0) {
      return NextResponse.json(
        { error: 'Nu s-au găsit proceduri neplătite valide' },
        { status: 400 }
      );
    }

    const totalAmount = procedures.reduce((sum, p) => sum + procedureAmount(p), 0);
    const finalAmount = paymentMethod === 'CASH' ? roundForCash(totalAmount) : totalAmount;

    await Promise.all(
      procedures.map((procedure) => {
        const amount = procedureAmount(procedure);
        const adjustedAmount =
          paymentMethod === 'CASH' && totalAmount > 0
            ? (amount / totalAmount) * finalAmount
            : amount;

        return prisma.surgicalProcedure.update({
          where: { id: procedure.id },
          data: {
            isPaid: true,
            paymentAmount: adjustedAmount,
            paymentMethod,
            paidAt: new Date(),
            invoiceEmail: sendEmail,
            invoicePrinted: printInvoice,
          },
        });
      })
    );

    const invoiceData = {
      invoiceNumber: `INV-${Date.now()}`,
      patientName: `${procedures[0].patient.firstName} ${procedures[0].patient.lastName}`,
      procedures: procedures.map((proc) => ({
        code: proc.code.code,
        description: proc.code.description,
        quantity: proc.quantity || 1,
        rate: proc.code.price || 0,
        amount: procedureAmount(proc),
      })),
      subtotal: totalAmount,
      finalAmount,
      paymentMethod,
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
    return NextResponse.json({ error: 'Procesarea plății a eșuat' }, { status: 500 });
  }
}
