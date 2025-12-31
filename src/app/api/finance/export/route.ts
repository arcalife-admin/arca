import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import ExcelJS from 'exceljs'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
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
    const settings = await (prisma as any).userFinanceSettings.findUnique({
      where: { userId: session.user.id }
    })

    // Get manual income data
    const incomeData = await (prisma as any).userIncome.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { date: 'desc' }
    })

    // Get procedure income data
    const procedureIncomeData = await prisma.dentalProcedure.findMany({
      where: {
        practitionerId: session.user.id,
        date: {
          gte: startDate,
          lte: endDate
        },
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
      orderBy: { date: 'desc' }
    })

    // Get expense data
    const expenseData = await (prisma as any).userExpense.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { date: 'desc' }
    })

    // Calculate totals
    const manualIncome = incomeData.reduce((sum, item) => sum + item.amount, 0)
    const procedureIncome = procedureIncomeData.reduce((sum, procedure) => {
      const quantity = (procedure as any).quantity || 1
      return sum + (procedure.code.rate * quantity)
    }, 0)
    const totalIncome = manualIncome + procedureIncome
    const totalExpenses = expenseData.reduce((sum, item) => sum + item.amount, 0)
    const netIncome = totalIncome - totalExpenses
    const taxReserve = netIncome * (settings?.incomeTaxReservePercentage || 30) / 100
    const vatAmount = totalIncome * (settings?.vatPercentage || 21) / 100

    if (format === 'csv') {
      // Generate CSV with UTF-8 BOM for proper Excel encoding
      let csvContent = '\uFEFF' + 'Financial Report\n'
      csvContent += `Period: ${period}\n`
      csvContent += `Date Range: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}\n`
      csvContent += '"NOTE: In Excel, select all data (Ctrl+A) and use Format > AutoFit Column Width for best display"\n\n'

      // Summary
      csvContent += '"SUMMARY"\n'
      csvContent += '"Manual Income";"€' + manualIncome.toFixed(2) + '"\n'
      csvContent += '"Procedure Income";"€' + procedureIncome.toFixed(2) + '"\n'
      csvContent += '"Total Income";"€' + totalIncome.toFixed(2) + '"\n'
      csvContent += '"Total Expenses";"€' + totalExpenses.toFixed(2) + '"\n'
      csvContent += '"Net Income";"€' + netIncome.toFixed(2) + '"\n'
      csvContent += '"VAT Amount";"€' + vatAmount.toFixed(2) + '"\n'
      csvContent += '"Tax Reserve";"€' + taxReserve.toFixed(2) + '"\n'
      csvContent += '"After Tax Income";"€' + (netIncome - taxReserve).toFixed(2) + '"\n\n'

      // Procedure income details
      csvContent += '\n' + '='.repeat(80) + '\n'
      csvContent += '"PROCEDURE INCOME DETAILS"\n'
      csvContent += '='.repeat(80) + '\n'
      csvContent += '"Date";"Code";"Description";"Patient";"Tooth";"Quantity";"Rate";"Total"\n'
      procedureIncomeData.forEach(procedure => {
        const quantity = (procedure as any).quantity || 1
        const total = procedure.code.rate * quantity
        csvContent += `"${procedure.date.toLocaleDateString()}";"${procedure.code.code}";"${procedure.code.description.replace(/"/g, '""')}";"${procedure.patient.firstName} ${procedure.patient.lastName}";"${procedure.toothNumber || ''}";"${quantity}";"€${procedure.code.rate.toFixed(2)}";"€${total.toFixed(2)}"\n`
      })

      // Manual income details
      csvContent += '\n' + '='.repeat(80) + '\n'
      csvContent += '"MANUAL INCOME DETAILS"\n'
      csvContent += '='.repeat(80) + '\n'
      csvContent += '"Date";"Description";"Amount";"Type";"Source";"Invoice Number";"Client Name"\n'
      incomeData.forEach(item => {
        csvContent += `"${item.date.toLocaleDateString()}";"${(item.description || '').replace(/"/g, '""')}";"€${item.amount.toFixed(2)}";"${item.type}";"${item.source || ''}";"${item.invoiceNumber || ''}";"${item.clientName || ''}"\n`
      })

      csvContent += '\n' + '='.repeat(80) + '\n'
      csvContent += '"EXPENSE DETAILS"\n'
      csvContent += '='.repeat(80) + '\n'
      csvContent += '"Date";"Description";"Amount";"Category";"Vendor";"Tax Deductible"\n'
      expenseData.forEach(item => {
        csvContent += `"${item.date.toLocaleDateString()}";"${item.description.replace(/"/g, '""')}";"€${item.amount.toFixed(2)}";"${item.category}";"${item.vendor || ''}";"${item.isTaxDeductible ? 'Yes' : 'No'}"\n`
      })

      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="financial-report-${period}.csv"`
        }
      })
    } else if (format === 'pdf') {
      // Generate PDF using jsPDF
      const doc = new jsPDF()

      // Header
      doc.setFontSize(20)
      doc.text('Financial Report', 20, 20)
      doc.setFontSize(12)
      doc.text(`Period: ${period.charAt(0).toUpperCase() + period.slice(1)}`, 20, 35)
      doc.text(`Date Range: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, 20, 45)

      // Summary table
      doc.setFontSize(14)
      doc.text('Summary', 20, 65)

      const summaryData = [
        ['Manual Income', `€${manualIncome.toFixed(2)}`],
        ['Procedure Income', `€${procedureIncome.toFixed(2)}`],
        ['Total Income', `€${totalIncome.toFixed(2)}`],
        ['Total Expenses', `€${totalExpenses.toFixed(2)}`],
        ['Net Income', `€${netIncome.toFixed(2)}`],
        [`VAT Amount (${settings?.vatPercentage || 21}%)`, `€${vatAmount.toFixed(2)}`],
        [`Tax Reserve (${settings?.incomeTaxReservePercentage || 30}%)`, `€${taxReserve.toFixed(2)}`],
        ['After Tax Income', `€${(netIncome - taxReserve).toFixed(2)}`]
      ]

        ; (autoTable as any)(doc, {
          head: [['Metric', 'Amount']],
          body: summaryData,
          startY: 70,
          styles: { fontSize: 10 },
          headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255], fontStyle: 'bold' }
        })

      let currentY = (doc as any).lastAutoTable.finalY + 20

      // Procedure Income Details
      if (procedureIncomeData.length > 0) {
        doc.setFontSize(14)
        doc.text('Procedure Income Details', 20, currentY)

        const procedureData = procedureIncomeData.map(procedure => {
          const quantity = (procedure as any).quantity || 1
          const total = procedure.code.rate * quantity
          return [
            procedure.date.toLocaleDateString(),
            procedure.code.code,
            procedure.code.description.substring(0, 30) + (procedure.code.description.length > 30 ? '...' : ''),
            `${procedure.patient.firstName} ${procedure.patient.lastName}`,
            procedure.toothNumber?.toString() || '',
            quantity.toString(),
            `€${procedure.code.rate.toFixed(2)}`,
            `€${total.toFixed(2)}`
          ]
        })

          ; (autoTable as any)(doc, {
            head: [['Date', 'Code', 'Description', 'Patient', 'Tooth', 'Qty', 'Rate', 'Total']],
            body: procedureData,
            startY: currentY + 5,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [46, 204, 113], textColor: [255, 255, 255], fontStyle: 'bold' }
          })

        currentY = (doc as any).lastAutoTable.finalY + 20
      }

      // Manual Income Details
      if (incomeData.length > 0) {
        doc.setFontSize(14)
        doc.text('Manual Income Details', 20, currentY)

        const manualIncomeData = incomeData.map(item => [
          item.date.toLocaleDateString(),
          item.description || '',
          `€${item.amount.toFixed(2)}`,
          item.type,
          item.source || '',
          item.invoiceNumber || '',
          item.clientName || ''
        ])

          ; (autoTable as any)(doc, {
            head: [['Date', 'Description', 'Amount', 'Type', 'Source', 'Invoice #', 'Client']],
            body: manualIncomeData,
            startY: currentY + 5,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [155, 89, 182], textColor: [255, 255, 255], fontStyle: 'bold' }
          })

        currentY = (doc as any).lastAutoTable.finalY + 20
      }

      // Add new page if needed for expenses
      if (currentY > 250) {
        doc.addPage()
        currentY = 20
      }

      // Expense Details
      if (expenseData.length > 0) {
        doc.setFontSize(14)
        doc.text('Expense Details', 20, currentY)

        const expenseTableData = expenseData.map(item => [
          item.date.toLocaleDateString(),
          item.description,
          `€${item.amount.toFixed(2)}`,
          item.category,
          item.vendor || '',
          item.isTaxDeductible ? 'Yes' : 'No'
        ])

          ; (autoTable as any)(doc, {
            head: [['Date', 'Description', 'Amount', 'Category', 'Vendor', 'Tax Deductible']],
            body: expenseTableData,
            startY: currentY + 5,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [231, 76, 60], textColor: [255, 255, 255], fontStyle: 'bold' }
          })
      }

      // Generate PDF buffer
      const pdfBuffer = doc.output('arraybuffer')

      return new Response(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="financial-report-${period}.pdf"`
        }
      })
    } else if (format === 'xlsx') {
      // Generate Excel file with proper formatting
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Financial Report')

      // Set minimum column widths (will auto-expand based on content)
      worksheet.columns = [
        { header: 'A', key: 'a', width: 10 },
        { header: 'B', key: 'b', width: 10 },
        { header: 'C', key: 'c', width: 15 },
        { header: 'D', key: 'd', width: 10 },
        { header: 'E', key: 'e', width: 8 },
        { header: 'F', key: 'f', width: 8 },
        { header: 'G', key: 'g', width: 10 },
        { header: 'H', key: 'h', width: 10 }
      ]

      // Header
      const titleRow = worksheet.addRow(['Financial Report'])
      titleRow.getCell(1).font = { bold: true, size: 16 }
      titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2980B9' } }
      titleRow.getCell(1).font.color = { argb: 'FFFFFFFF' }
      worksheet.mergeCells('A1:H1')

      const periodRow = worksheet.addRow([`Period: ${period.charAt(0).toUpperCase() + period.slice(1)}`])
      const dateRow = worksheet.addRow([`Date Range: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`])

      worksheet.addRow([]) // Empty row

      // Summary section
      const summaryHeaderRow = worksheet.addRow(['SUMMARY'])
      summaryHeaderRow.getCell(1).font = { bold: true, size: 14 }
      summaryHeaderRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2980B9' } }
      summaryHeaderRow.getCell(1).font.color = { argb: 'FFFFFFFF' }
      worksheet.mergeCells(`A${summaryHeaderRow.number}:B${summaryHeaderRow.number}`)

      // Summary data
      const summaryData = [
        ['Manual Income', `€${manualIncome.toFixed(2)}`],
        ['Procedure Income', `€${procedureIncome.toFixed(2)}`],
        ['Total Income', `€${totalIncome.toFixed(2)}`],
        ['Total Expenses', `€${totalExpenses.toFixed(2)}`],
        ['Net Income', `€${netIncome.toFixed(2)}`],
        [`VAT Amount (${settings?.vatPercentage || 21}%)`, `€${vatAmount.toFixed(2)}`],
        [`Tax Reserve (${settings?.incomeTaxReservePercentage || 30}%)`, `€${taxReserve.toFixed(2)}`],
        ['After Tax Income', `€${(netIncome - taxReserve).toFixed(2)}`]
      ]

      summaryData.forEach(([label, value]) => {
        const row = worksheet.addRow([label, value])
        row.getCell(1).font = { bold: true }
        row.getCell(2).font = { bold: true }
      })

      worksheet.addRow([]) // Empty row

      // Procedure Income Details
      if (procedureIncomeData.length > 0) {
        const procHeaderRow = worksheet.addRow(['PROCEDURE INCOME DETAILS'])
        procHeaderRow.getCell(1).font = { bold: true, size: 14 }
        procHeaderRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2ECC71' } }
        procHeaderRow.getCell(1).font.color = { argb: 'FFFFFFFF' }
        worksheet.mergeCells(`A${procHeaderRow.number}:H${procHeaderRow.number}`)

        const procSubHeaderRow = worksheet.addRow(['Date', 'Code', 'Description', 'Patient', 'Tooth', 'Quantity', 'Rate', 'Total'])
        procSubHeaderRow.eachCell(cell => {
          cell.font = { bold: true }
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F8F5' } }
        })

        procedureIncomeData.forEach(procedure => {
          const quantity = (procedure as any).quantity || 1
          const total = procedure.code.rate * quantity
          worksheet.addRow([
            procedure.date.toLocaleDateString(),
            procedure.code.code,
            procedure.code.description,
            `${procedure.patient.firstName} ${procedure.patient.lastName}`,
            procedure.toothNumber || '',
            quantity,
            `€${procedure.code.rate.toFixed(2)}`,
            `€${total.toFixed(2)}`
          ])
        })

        worksheet.addRow([]) // Empty row
      }

      // Manual Income Details
      if (incomeData.length > 0) {
        const manualHeaderRow = worksheet.addRow(['MANUAL INCOME DETAILS'])
        manualHeaderRow.getCell(1).font = { bold: true, size: 14 }
        manualHeaderRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF9B59B6' } }
        manualHeaderRow.getCell(1).font.color = { argb: 'FFFFFFFF' }
        worksheet.mergeCells(`A${manualHeaderRow.number}:G${manualHeaderRow.number}`)

        const manualSubHeaderRow = worksheet.addRow(['Date', 'Description', 'Amount', 'Type', 'Source', 'Invoice Number', 'Client Name'])
        manualSubHeaderRow.eachCell(cell => {
          cell.font = { bold: true }
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4ECF7' } }
        })

        incomeData.forEach(item => {
          worksheet.addRow([
            item.date.toLocaleDateString(),
            item.description || '',
            `€${item.amount.toFixed(2)}`,
            item.type,
            item.source || '',
            item.invoiceNumber || '',
            item.clientName || ''
          ])
        })

        worksheet.addRow([]) // Empty row
      }

      // Expense Details
      if (expenseData.length > 0) {
        const expenseHeaderRow = worksheet.addRow(['EXPENSE DETAILS'])
        expenseHeaderRow.getCell(1).font = { bold: true, size: 14 }
        expenseHeaderRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE74C3C' } }
        expenseHeaderRow.getCell(1).font.color = { argb: 'FFFFFFFF' }
        worksheet.mergeCells(`A${expenseHeaderRow.number}:F${expenseHeaderRow.number}`)

        const expenseSubHeaderRow = worksheet.addRow(['Date', 'Description', 'Amount', 'Category', 'Vendor', 'Tax Deductible'])
        expenseSubHeaderRow.eachCell(cell => {
          cell.font = { bold: true }
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDF2F2' } }
        })

        expenseData.forEach(item => {
          worksheet.addRow([
            item.date.toLocaleDateString(),
            item.description,
            `€${item.amount.toFixed(2)}`,
            item.category,
            item.vendor || '',
            item.isTaxDeductible ? 'Yes' : 'No'
          ])
        })
      }

      // Auto-fit all columns based on content
      worksheet.columns.forEach((column, index) => {
        let maxLength = 10; // Minimum width

        // Check all cells in this column to find the longest content
        worksheet.getColumn(index + 1).eachCell((cell) => {
          const cellValue = cell.value ? cell.value.toString() : '';
          if (cellValue.length > maxLength) {
            maxLength = cellValue.length;
          }
        });

        // Set width with some padding, but cap at reasonable maximum
        column.width = Math.min(Math.max(maxLength + 2, 10), 60);
      });

      // Generate Excel buffer
      const buffer = await workbook.xlsx.writeBuffer()

      return new Response(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="financial-report-${period}.xlsx"`
        }
      })
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
  } catch (error) {
    console.error('Error exporting financial report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 