import { prisma } from '@/lib/prisma'
import { ORDER_CATEGORY_SEED } from '@/lib/orders/seed-data'

export async function ensureOrderCategoriesSeeded(organizationId: string) {
  const count = await prisma.itemCategory.count({
    where: { organizationId },
  })

  if (count > 0) return count

  await prisma.itemCategory.createMany({
    data: ORDER_CATEGORY_SEED.map((item) => ({
      organizationId,
      name: item.name,
      description: item.description,
      color: item.color,
    })),
  })

  return ORDER_CATEGORY_SEED.length
}
