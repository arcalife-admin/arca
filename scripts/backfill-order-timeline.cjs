const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    include: {
      items: true,
      orderedBy: true,
    },
  });
  for (const order of orders) {
    // CREATED event
    const createdExists = await prisma.orderTimelineEvent.findFirst({ where: { orderId: order.id, type: 'CREATED' } });
    if (!createdExists) {
      await prisma.orderTimelineEvent.create({
        data: {
          orderId: order.id,
          type: 'CREATED',
          message: `Order ${order.orderNumber} created`,
          createdById: order.orderedById,
          createdAt: order.createdAt,
        },
      });
    }
    // Status event
    if (order.status && order.status !== 'DRAFT') {
      const statusExists = await prisma.orderTimelineEvent.findFirst({ where: { orderId: order.id, type: order.status } });
      if (!statusExists) {
        await prisma.orderTimelineEvent.create({
          data: {
            orderId: order.id,
            type: order.status,
            message: `Order status is ${order.status}`,
            createdById: order.orderedById,
            createdAt: order.updatedAt,
          },
        });
      }
    }
    // Item received events
    for (const item of order.items) {
      if (item.isReceived) {
        const itemExists = await prisma.orderTimelineEvent.findFirst({ where: { orderId: order.id, type: 'ITEM_RECEIVED', orderItemId: item.id } });
        if (!itemExists) {
          await prisma.orderTimelineEvent.create({
            data: {
              orderId: order.id,
              orderItemId: item.id,
              type: 'ITEM_RECEIVED',
              message: `Received ${item.quantityReceived || item.quantity} unit(s)`,
              createdAt: item.receivedAt || item.updatedAt,
            },
          });
        }
      }
    }
  }
  console.log('Backfill complete!');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect()); 