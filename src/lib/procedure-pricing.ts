import { prisma } from '@/lib/prisma';

/**
 * Resolve the unit price for a procedure code for a given user.
 * Priority: user override > catalog default > 0
 */
export async function resolveProcedurePrice(
  userId: string | null | undefined,
  codeId: string,
  catalogPrice: number | null | undefined
): Promise<number> {
  if (userId) {
    const userPrice = await prisma.userProcedurePrice.findUnique({
      where: { userId_codeId: { userId, codeId } },
    });
    if (userPrice) {
      return userPrice.price;
    }
  }
  return catalogPrice ?? 0;
}

/**
 * Calculate total cost for a procedure (unit price × quantity).
 */
export function calculateProcedureCost(unitPrice: number, quantity: number): number {
  return unitPrice * quantity;
}
