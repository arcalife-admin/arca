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

    // Get user's finance settings
    const settings = await prisma.userFinanceSettings.findUnique({
      where: { userId: session.user.id }
    })

    // Get income data
    const incomeData = await prisma.userIncome.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    // Get expense data
    const expenseData = await prisma.userExpense.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    // Calculate totals
    const totalIncome = incomeData.reduce((sum, item) => sum + item.amount, 0)
    const totalExpenses = expenseData.reduce((sum, item) => sum + item.amount, 0)
    const taxDeductibleExpenses = expenseData
      .filter(item => item.isTaxDeductible)
      .reduce((sum, item) => sum + (item.amount * item.taxDeductiblePercentage / 100), 0)

    const netIncome = totalIncome - totalExpenses
    const taxableIncome = totalIncome - taxDeductibleExpenses

    // Calculate tax estimates
    const vatPercentage = settings?.vatPercentage || 21
    const incomeTaxReservePercentage = settings?.incomeTaxReservePercentage || 30

    const vatAmount = totalIncome * vatPercentage / 100
    const incomeTaxReserve = netIncome * incomeTaxReservePercentage / 100
    const totalTaxBurden = vatAmount + incomeTaxReserve
    const afterTaxIncome = netIncome - incomeTaxReserve

    // Calculate category breakdown
    const expensesByCategory = expenseData.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount
      return acc
    }, {} as Record<string, number>)

    // Calculate monthly trends (last 6 months)
    const monthlyTrends = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)

      const monthIncome = await prisma.userIncome.aggregate({
        where: {
          userId: session.user.id,
          date: {
            gte: monthStart,
            lte: monthEnd
          }
        },
        _sum: { amount: true }
      })

      const monthExpenses = await prisma.userExpense.aggregate({
        where: {
          userId: session.user.id,
          date: {
            gte: monthStart,
            lte: monthEnd
          }
        },
        _sum: { amount: true }
      })

      monthlyTrends.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        income: monthIncome._sum.amount || 0,
        expenses: monthExpenses._sum.amount || 0,
        net: (monthIncome._sum.amount || 0) - (monthExpenses._sum.amount || 0)
      })
    }

    const summary = {
      period,
      startDate,
      endDate,
      totals: {
        totalIncome,
        totalExpenses,
        taxDeductibleExpenses,
        netIncome,
        taxableIncome,
        afterTaxIncome
      },
      taxes: {
        vatPercentage,
        vatAmount,
        incomeTaxReservePercentage,
        incomeTaxReserve,
        totalTaxBurden
      },
      expensesByCategory,
      monthlyTrends,
      goals: {
        monthlyGoal: settings?.monthlyIncomeGoal || 0,
        quarterlyGoal: settings?.quarterlyIncomeGoal || 0,
        goalProgress: settings?.monthlyIncomeGoal ? (totalIncome / settings.monthlyIncomeGoal) * 100 : 0
      }
    }

    return NextResponse.json(summary)
  } catch (error) {
    console.error('Error generating financial summary:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 