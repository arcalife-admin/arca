import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month'; // month, quarter, year

    // Calculate date range
    let startDate: Date;
    let endDate: Date = new Date();

    switch (period) {
      case 'quarter':
        const quarterStart = Math.floor(endDate.getMonth() / 3) * 3;
        startDate = new Date(endDate.getFullYear(), quarterStart, 1);
        break;
      case 'year':
        startDate = new Date(endDate.getFullYear(), 0, 1);
        break;
      default: // month
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    }

    // Get orders in the specified period
    const orders = await prisma.order.findMany({
      where: {
        organizationId: session.user.organizationId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        vendor: true,
        items: {
          include: {
            category: true,
          },
        },
      },
    });

    // Get requests in the specified period
    const requests = await prisma.orderRequest.findMany({
      where: {
        organizationId: session.user.organizationId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        category: true,
        vendor: true,
      },
    });

    // Calculate total spending
    const totalSpending = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const averageOrderValue = orders.length > 0 ? totalSpending / orders.length : 0;

    // Spending by vendor
    const spendingByVendor = orders.reduce((acc, order) => {
      const vendorName = order.vendor.name;
      acc[vendorName] = (acc[vendorName] || 0) + order.totalAmount;
      return acc;
    }, {} as Record<string, number>);

    // Orders by status
    const ordersByStatus = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Most ordered items
    const itemFrequency = orders.flatMap(order => order.items).reduce((acc, item) => {
      const key = item.itemName;
      if (!acc[key]) {
        acc[key] = {
          name: item.itemName,
          totalQuantity: 0,
          totalSpent: 0,
          orderCount: 0,
          category: item.category?.name || 'Uncategorized',
        };
      }
      acc[key].totalQuantity += item.quantity;
      acc[key].totalSpent += item.totalPrice;
      acc[key].orderCount += 1;
      return acc;
    }, {} as Record<string, any>);

    const topItems = Object.values(itemFrequency)
      .sort((a: any, b: any) => b.totalQuantity - a.totalQuantity)
      .slice(0, 10);

    // Requests by urgency
    const requestsByUrgency = requests.reduce((acc, request) => {
      acc[request.urgency] = (acc[request.urgency] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Monthly trends (for the past 12 months)
    const monthlyTrends = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthOrders = await prisma.order.findMany({
        where: {
          organizationId: session.user.organizationId,
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      });

      const monthRequests = await prisma.orderRequest.findMany({
        where: {
          organizationId: session.user.organizationId,
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      });

      monthlyTrends.push({
        month: date.toISOString().slice(0, 7), // YYYY-MM
        orderCount: monthOrders.length,
        requestCount: monthRequests.length,
        totalSpent: monthOrders.reduce((sum, order) => sum + order.totalAmount, 0),
      });
    }

    // Delivery performance
    const deliveredOrders = orders.filter(order =>
      order.status === 'DELIVERED' || order.status === 'COMPLETED'
    );

    const onTimeDeliveries = deliveredOrders.filter(order => {
      if (!order.expectedDelivery || !order.actualDelivery) return false;
      return order.actualDelivery <= order.expectedDelivery;
    }).length;

    const deliveryPerformance = deliveredOrders.length > 0
      ? (onTimeDeliveries / deliveredOrders.length) * 100
      : 0;

    // Category analysis
    const categorySpending = orders.flatMap(order => order.items).reduce((acc, item) => {
      const categoryName = item.category?.name || 'Uncategorized';
      if (!acc[categoryName]) {
        acc[categoryName] = {
          name: categoryName,
          totalSpent: 0,
          itemCount: 0,
        };
      }
      acc[categoryName].totalSpent += item.totalPrice;
      acc[categoryName].itemCount += item.quantity;
      return acc;
    }, {} as Record<string, any>);

    // Smart restock suggestions based on ordering patterns
    const restockSuggestions = Object.values(itemFrequency)
      .filter((item: any) => item.orderCount >= 2) // Items ordered multiple times
      .map((item: any) => {
        const avgDaysBetweenOrders = period === 'year' ? 365 / item.orderCount :
          period === 'quarter' ? 90 / item.orderCount :
            30 / item.orderCount;

        return {
          ...item,
          avgDaysBetweenOrders: Math.round(avgDaysBetweenOrders),
          nextOrderSuggestion: new Date(Date.now() + avgDaysBetweenOrders * 24 * 60 * 60 * 1000),
          riskLevel: avgDaysBetweenOrders < 7 ? 'high' : avgDaysBetweenOrders < 30 ? 'medium' : 'low',
        };
      })
      .sort((a: any, b: any) => a.avgDaysBetweenOrders - b.avgDaysBetweenOrders)
      .slice(0, 5);

    return NextResponse.json({
      period,
      startDate,
      endDate,
      summary: {
        totalOrders: orders.length,
        totalRequests: requests.length,
        totalSpending,
        averageOrderValue,
        deliveryPerformance: Math.round(deliveryPerformance),
      },
      spendingByVendor,
      ordersByStatus,
      requestsByUrgency,
      topItems,
      monthlyTrends,
      categorySpending: Object.values(categorySpending),
      restockSuggestions,
    });
  } catch (error) {
    console.error('Error fetching order analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order analytics' },
      { status: 500 }
    );
  }
} 