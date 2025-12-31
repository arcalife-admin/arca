import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month'

    // Calculate date range based on period
    let startDate: Date
    let endDate: Date = new Date()

    switch (period) {
      case 'month':
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
        break
      case 'quarter':
        const quarterStart = Math.floor(endDate.getMonth() / 3) * 3
        startDate = new Date(endDate.getFullYear(), quarterStart, 1)
        break
      case 'year':
        startDate = new Date(endDate.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
    }

    const expenses = await prisma.userExpense.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    return NextResponse.json(expenses)
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    const expense = await prisma.userExpense.create({
      data: {
        userId: session.user.id,
        amount: data.amount,
        description: data.description,
        category: data.category,
        vendor: data.vendor,
        isTaxDeductible: data.isTaxDeductible ?? true,
        taxDeductiblePercentage: data.taxDeductiblePercentage ?? 100,
        date: new Date(data.date),
        receiptUrl: data.receiptUrl,
        receiptFileName: data.receiptFileName
      }
    })

    return NextResponse.json(expense)
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 })
    }

    // Verify the expense belongs to the user
    const expense = await prisma.userExpense.findUnique({
      where: { id }
    })

    if (!expense || expense.userId !== session.user.id) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    await prisma.userExpense.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Expense deleted successfully' })
  } catch (error) {
    console.error('Error deleting expense:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 