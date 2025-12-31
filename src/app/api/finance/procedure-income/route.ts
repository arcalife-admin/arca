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

    // Fetch completed and in-progress dental procedures by the logged-in practitioner
    const completedProcedures = await prisma.dentalProcedure.findMany({
      where: {
        practitionerId: session.user.id,
        date: {
          gte: startDate,
          lte: endDate
        },
        // Include both completed and in-progress procedures for income calculation
        status: {
          in: ['completed', 'COMPLETED', 'IN_PROGRESS', 'in_progress']
        }
      },
      include: {
        code: true,
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            patientCode: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    // Transform procedures into income entries
    const procedureIncome = completedProcedures.map(procedure => {
      const quantity = (procedure as any).quantity || 1
      const amount = (procedure.code.rate || 0) * quantity

      return {
        id: `procedure_${procedure.id}`,
        amount: amount,
        description: `${procedure.code.code} - ${procedure.code.description}`,
        source: 'Dental Procedure',
        type: 'TREATMENT',
        date: procedure.date.toISOString(),
        procedureId: procedure.id,
        patientName: `${procedure.patient.firstName} ${procedure.patient.lastName}`,
        patientCode: procedure.patient.patientCode,
        codeId: procedure.code.id,
        quantity: quantity,
        unitRate: procedure.code.rate || 0,
        toothNumber: procedure.toothNumber,
        notes: procedure.notes
      }
    })

    // Calculate totals
    const totalProcedureIncome = procedureIncome.reduce((sum, item) => sum + item.amount, 0)

    // Group by procedure code for summary
    const procedureSummary = procedureIncome.reduce((acc, item) => {
      const key = item.description
      if (!acc[key]) {
        acc[key] = {
          description: item.description,
          count: 0,
          totalAmount: 0,
          unitRate: item.unitRate
        }
      }
      acc[key].count += item.quantity
      acc[key].totalAmount += item.amount
      return acc
    }, {} as Record<string, any>)

    // Group by month for trends
    const monthlyBreakdown = procedureIncome.reduce((acc, item) => {
      const month = new Date(item.date).toISOString().slice(0, 7) // YYYY-MM
      if (!acc[month]) {
        acc[month] = {
          month,
          income: 0,
          procedureCount: 0
        }
      }
      acc[month].income += item.amount
      acc[month].procedureCount += item.quantity
      return acc
    }, {} as Record<string, any>)

    return NextResponse.json({
      procedureIncome,
      totalProcedureIncome,
      procedureSummary: Object.values(procedureSummary),
      monthlyBreakdown: Object.values(monthlyBreakdown).sort((a, b) => a.month.localeCompare(b.month)),
      period,
      startDate,
      endDate,
      practitionerId: session.user.id
    })
  } catch (error) {
    console.error('Error fetching procedure income:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 