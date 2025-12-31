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

    const settings = await prisma.userFinanceSettings.findUnique({
      where: { userId: session.user.id }
    })

    if (!settings) {
      // Create default settings if none exist
      const defaultSettings = await prisma.userFinanceSettings.create({
        data: {
          userId: session.user.id,
          vatPercentage: 21.0,
          incomeTaxReservePercentage: 30.0,
          preferredCurrency: 'EUR'
        }
      })
      return NextResponse.json(defaultSettings)
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching finance settings:', error)
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

    const settings = await prisma.userFinanceSettings.upsert({
      where: { userId: session.user.id },
      update: {
        vatPercentage: data.vatPercentage,
        incomeTaxReservePercentage: data.incomeTaxReservePercentage,
        monthlyIncomeGoal: data.monthlyIncomeGoal,
        quarterlyIncomeGoal: data.quarterlyIncomeGoal,
        preferredCurrency: data.preferredCurrency,
        accountantName: data.accountantName,
        accountantEmail: data.accountantEmail
      },
      create: {
        userId: session.user.id,
        vatPercentage: data.vatPercentage || 21.0,
        incomeTaxReservePercentage: data.incomeTaxReservePercentage || 30.0,
        monthlyIncomeGoal: data.monthlyIncomeGoal,
        quarterlyIncomeGoal: data.quarterlyIncomeGoal,
        preferredCurrency: data.preferredCurrency || 'EUR',
        accountantName: data.accountantName,
        accountantEmail: data.accountantEmail
      }
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating finance settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 