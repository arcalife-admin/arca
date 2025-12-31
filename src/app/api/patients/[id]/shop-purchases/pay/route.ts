import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

interface PaymentRequest {
  purchaseIds: string[];
  paymentMethod: 'CASH' | 'CARD';
  sendEmail: boolean;
  printInvoice: boolean;
}

// Helper function for cash rounding (same as in dental procedures)
function roundForCash(amount: number): number {
  return Math.round(amount * 20) / 20; // Round to nearest 0.05
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: PaymentRequest = await request.json();
    const { purchaseIds, paymentMethod, sendEmail, printInvoice } = body;
    const patientId = params.id;

    if (!purchaseIds || purchaseIds.length === 0) {
      return NextResponse.json(
        { error: 'No purchases selected for payment' },
        { status: 400 }
      );
    }

    // Fetch the purchases to be paid
    const purchases = await prisma.shopPurchase.findMany({
      where: {
        id: { in: purchaseIds },
        patientId: patientId,
        isPaid: false, // Only allow payment of unpaid purchases
        patient: {
          organizationId: session.user.organizationId,
        },
      },
      include: {
        product: true,
        patient: true,
      },
    });

    if (purchases.length === 0) {
      return NextResponse.json(
        { error: 'No valid unpaid purchases found' },
        { status: 400 }
      );
    }

    // Calculate total amount
    let totalAmount = 0;
    for (const purchase of purchases) {
      totalAmount += purchase.totalAmount;
    }

    // Apply cash rounding if payment method is cash
    const finalAmount = paymentMethod === 'CASH' ? roundForCash(totalAmount) : totalAmount;

    // Update purchases as paid
    const updatePromises = purchases.map((purchase) => {
      // For cash payments, distribute the rounded amount proportionally
      const adjustedAmount = paymentMethod === 'CASH'
        ? (purchase.totalAmount / totalAmount) * finalAmount
        : purchase.totalAmount;

      return prisma.shopPurchase.update({
        where: { id: purchase.id },
        data: {
          isPaid: true,
          paymentMethod: paymentMethod,
          paidAt: new Date(),
          invoiceEmail: sendEmail,
          invoicePrinted: printInvoice,
          // Update totalAmount with adjusted amount for cash payments
          totalAmount: adjustedAmount,
        },
      });
    });

    await Promise.all(updatePromises);

    // Generate invoice data
    const invoiceData = {
      invoiceNumber: `SHOP-INV-${Date.now()}`,
      patientName: `${purchases[0].patient.firstName} ${purchases[0].patient.lastName}`,
      purchases: purchases.map((purchase) => ({
        productName: purchase.product.name,
        description: purchase.product.description || '',
        quantity: purchase.quantity,
        unitPrice: purchase.unitPrice,
        totalAmount: purchase.totalAmount,
        notes: purchase.notes,
      })),
      subtotal: totalAmount,
      finalAmount: finalAmount,
      paymentMethod: paymentMethod,
      cashRounding: paymentMethod === 'CASH' ? finalAmount - totalAmount : 0,
      paidAt: new Date().toISOString(),
      type: 'SHOP_PURCHASE',
    };

    return NextResponse.json({
      success: true,
      message: `Payment processed successfully. ${purchases.length} item(s) marked as paid.`,
      invoiceData,
      totalAmount: finalAmount,
      purchasesUpdated: purchases.length,
    });

  } catch (error) {
    console.error('Shop payment processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  }
} 