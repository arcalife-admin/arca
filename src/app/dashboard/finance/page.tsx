'use client'

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Button
} from '@/components/ui/button'
import {
  Input
} from '@/components/ui/input'
import {
  Label
} from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Textarea
} from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs'
import {
  Progress
} from '@/components/ui/progress'
import {
  Badge
} from '@/components/ui/badge'
import {
  PlusCircle,
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  Calculator,
  Receipt,
  Mail,
  Target,
  Calendar,
  Euro,
  Upload
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts'

const EXPENSE_CATEGORIES = [
  'MATERIALS',
  'EQUIPMENT',
  'RENT',
  'UTILITIES',
  'INSURANCE',
  'MARKETING',
  'PROFESSIONAL_DEVELOPMENT',
  'TRAVEL',
  'MEALS',
  'SOFTWARE',
  'OFFICE_SUPPLIES',
  'PROFESSIONAL_SERVICES',
  'PHONE_INTERNET',
  'OTHER'
]

const INCOME_TYPES = [
  'TREATMENT',
  'CONSULTATION',
  'INSURANCE',
  'OTHER'
]

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function FinancePage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  // State for forms
  const [showIncomeModal, setShowIncomeModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState('month')

  // Form states
  const [incomeForm, setIncomeForm] = useState({
    amount: '',
    description: '',
    source: '',
    type: 'TREATMENT',
    date: new Date().toISOString().split('T')[0],
    invoiceNumber: '',
    clientName: ''
  })

  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    description: '',
    category: 'MATERIALS',
    vendor: '',
    isTaxDeductible: true,
    taxDeductiblePercentage: 100,
    date: new Date().toISOString().split('T')[0],
    receiptFileName: ''
  })

  const [settingsForm, setSettingsForm] = useState({
    vatPercentage: '21',
    incomeTaxReservePercentage: '30',
    monthlyIncomeGoal: '',
    quarterlyIncomeGoal: '',
    accountantName: '',
    accountantEmail: ''
  })

  // Fetch financial data
  const { data: financeSettings } = useQuery({
    queryKey: ['financeSettings'],
    queryFn: async () => {
      const response = await fetch('/api/finance/settings')
      if (!response.ok) throw new Error('Failed to fetch finance settings')
      return response.json()
    },
    enabled: !!session
  })

  // Fetch procedure-based income
  const { data: procedureIncomeData } = useQuery({
    queryKey: ['procedureIncome', selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/finance/procedure-income?period=${selectedPeriod}`)
      if (!response.ok) throw new Error('Failed to fetch procedure income')
      return response.json()
    },
    enabled: !!session
  })

  const { data: incomeData = [] } = useQuery({
    queryKey: ['income', selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/finance/income?period=${selectedPeriod}`)
      if (!response.ok) throw new Error('Failed to fetch income data')
      return response.json()
    },
    enabled: !!session
  })

  const { data: expenseData = [] } = useQuery({
    queryKey: ['expenses', selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/finance/expenses?period=${selectedPeriod}`)
      if (!response.ok) throw new Error('Failed to fetch expense data')
      return response.json()
    },
    enabled: !!session
  })

  const { data: financialSummary } = useQuery({
    queryKey: ['financialSummary', selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/finance/summary?period=${selectedPeriod}`)
      if (!response.ok) throw new Error('Failed to fetch financial summary')
      return response.json()
    },
    enabled: !!session
  })

  // Update settings form when data is loaded
  useEffect(() => {
    if (financeSettings) {
      setSettingsForm({
        vatPercentage: (financeSettings.vatPercentage || 21).toString(),
        incomeTaxReservePercentage: (financeSettings.incomeTaxReservePercentage || 30).toString(),
        monthlyIncomeGoal: financeSettings.monthlyIncomeGoal?.toString() || '',
        quarterlyIncomeGoal: financeSettings.quarterlyIncomeGoal?.toString() || '',
        accountantName: financeSettings.accountantName || '',
        accountantEmail: financeSettings.accountantEmail || ''
      })
    }
  }, [financeSettings])

  // Mutations
  const addIncomeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/finance/income', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to add income')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income'] })
      queryClient.invalidateQueries({ queryKey: ['financialSummary'] })
      setShowIncomeModal(false)
      setIncomeForm({
        amount: '',
        description: '',
        source: '',
        type: 'TREATMENT',
        date: new Date().toISOString().split('T')[0],
        invoiceNumber: '',
        clientName: ''
      })
    }
  })

  const addExpenseMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/finance/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to add expense')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['financialSummary'] })
      setShowExpenseModal(false)
      setExpenseForm({
        amount: '',
        description: '',
        category: 'MATERIALS',
        vendor: '',
        isTaxDeductible: true,
        taxDeductiblePercentage: 100,
        date: new Date().toISOString().split('T')[0],
        receiptFileName: ''
      })
    }
  })

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/finance/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to update settings')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financeSettings'] })
      queryClient.invalidateQueries({ queryKey: ['financialSummary'] })
      setShowSettingsModal(false)
    }
  })

  // Calculate key metrics
  const proceduralIncome = procedureIncomeData?.totalProcedureIncome || 0
  const manualIncome = incomeData.reduce((sum: number, item: any) => sum + item.amount, 0)
  const totalIncome = proceduralIncome + manualIncome
  const totalExpenses = expenseData.reduce((sum: number, item: any) => sum + item.amount, 0)
  const netIncome = totalIncome - totalExpenses
  const taxReserve = netIncome * (financeSettings?.incomeTaxReservePercentage || 30) / 100
  const afterTaxIncome = netIncome - taxReserve
  const monthlyGoal = financeSettings?.monthlyIncomeGoal || 0
  const goalProgress = monthlyGoal > 0 ? (totalIncome / monthlyGoal) * 100 : 0

  // Prepare chart data
  const expensesByCategory = EXPENSE_CATEGORIES.map(category => ({
    name: category.toLowerCase().replace('_', ' '),
    value: expenseData
      .filter((expense: any) => expense.category === category)
      .reduce((sum: number, expense: any) => sum + expense.amount, 0)
  })).filter(item => item.value > 0)

  const monthlyTrends = React.useMemo(() => {
    const last6Months = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthYear = date.toISOString().slice(0, 7)

      // Manual income for this month
      const monthManualIncome = incomeData
        .filter((item: any) => item.date.startsWith(monthYear))
        .reduce((sum: number, item: any) => sum + item.amount, 0)

      // Procedure income for this month
      const monthProcedureIncome = procedureIncomeData?.procedureIncome?.filter((item: any) =>
        item.date.startsWith(monthYear)
      ).reduce((sum: number, item: any) => sum + item.amount, 0) || 0

      // Total income for this month
      const monthTotalIncome = monthManualIncome + monthProcedureIncome

      const monthExpenses = expenseData
        .filter((item: any) => item.date.startsWith(monthYear))
        .reduce((sum: number, item: any) => sum + item.amount, 0)

      last6Months.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        income: monthTotalIncome,
        procedureIncome: monthProcedureIncome,
        manualIncome: monthManualIncome,
        expenses: monthExpenses,
        net: monthTotalIncome - monthExpenses
      })
    }
    return last6Months
  }, [incomeData, expenseData, procedureIncomeData])

  const handleIncomeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addIncomeMutation.mutate({
      ...incomeForm,
      amount: parseFloat(incomeForm.amount)
    })
  }

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addExpenseMutation.mutate({
      ...expenseForm,
      amount: parseFloat(expenseForm.amount)
    })
  }

  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateSettingsMutation.mutate({
      ...settingsForm,
      vatPercentage: parseFloat(settingsForm.vatPercentage.toString()),
      incomeTaxReservePercentage: parseFloat(settingsForm.incomeTaxReservePercentage.toString()),
      monthlyIncomeGoal: settingsForm.monthlyIncomeGoal ? parseFloat(settingsForm.monthlyIncomeGoal) : null,
      quarterlyIncomeGoal: settingsForm.quarterlyIncomeGoal ? parseFloat(settingsForm.quarterlyIncomeGoal) : null
    })
  }

  const exportReport = async (format: 'pdf' | 'csv' | 'xlsx') => {
    try {
      const response = await fetch(`/api/finance/export?format=${format}&period=${selectedPeriod}`)
      if (!response.ok) throw new Error('Failed to export report')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `financial-report-${selectedPeriod}.${format}`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Financial Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your practice finances, track income and expenses, and calculate tax obligations.
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setShowSettingsModal(true)}>
            Settings
          </Button>
        </div>
      </div>

      {/* Monthly Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalIncome.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {selectedPeriod === 'month' ? 'This month' : `This ${selectedPeriod}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalExpenses.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {selectedPeriod === 'month' ? 'This month' : `This ${selectedPeriod}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{netIncome.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Before tax reserves
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">After Tax</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{afterTaxIncome.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Tax reserve: €{taxReserve.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Goal Progress */}
      {monthlyGoal > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Monthly Goal Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>€{totalIncome.toFixed(2)} / €{monthlyGoal.toFixed(2)}</span>
                <span>{goalProgress.toFixed(1)}%</span>
              </div>
              <Progress value={Math.min(goalProgress, 100)} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Income Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Income Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Procedure Income (Automatic)</Label>
              <div className="text-2xl font-bold text-blue-600">
                €{proceduralIncome.toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground">
                From {procedureIncomeData?.procedureIncome?.length || 0} completed procedures
              </p>
            </div>
            <div className="space-y-2">
              <Label>Manual Income Entries</Label>
              <div className="text-2xl font-bold text-green-600">
                €{manualIncome.toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground">
                From {incomeData.length} manual entries
              </p>
            </div>
          </div>

          {/* Procedure Summary */}
          {procedureIncomeData?.procedureSummary && procedureIncomeData.procedureSummary.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium mb-3">Top Procedures</h4>
              <div className="space-y-2">
                {procedureIncomeData.procedureSummary.slice(0, 5).map((procedure: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium">{procedure.description}</span>
                      <span className="text-sm text-muted-foreground ml-2">({procedure.count}x)</span>
                    </div>
                    <span className="font-bold">€{procedure.totalAmount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Dialog open={showIncomeModal} onOpenChange={setShowIncomeModal}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Add Manual Income
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Income Entry</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleIncomeSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount (€)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step={0.01}
                    required
                    value={incomeForm.amount}
                    onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    required
                    value={incomeForm.date}
                    onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={incomeForm.description}
                  onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={incomeForm.type} onValueChange={(value) => setIncomeForm({ ...incomeForm, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INCOME_TYPES.map(type => (
                        <SelectItem key={type} value={type}>
                          {type.toLowerCase().replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="source">Source</Label>
                  <Input
                    id="source"
                    value={incomeForm.source}
                    onChange={(e) => setIncomeForm({ ...incomeForm, source: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="invoiceNumber">Invoice Number</Label>
                  <Input
                    id="invoiceNumber"
                    value={incomeForm.invoiceNumber}
                    onChange={(e) => setIncomeForm({ ...incomeForm, invoiceNumber: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="clientName">Client Name</Label>
                  <Input
                    id="clientName"
                    value={incomeForm.clientName}
                    onChange={(e) => setIncomeForm({ ...incomeForm, clientName: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowIncomeModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addIncomeMutation.isPending}>
                  {addIncomeMutation.isPending ? 'Adding...' : 'Add Income'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={showExpenseModal} onOpenChange={setShowExpenseModal}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Expense Entry</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expense-amount">Amount (€)</Label>
                  <Input
                    id="expense-amount"
                    type="number"
                    step={0.01}
                    required
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="expense-date">Date</Label>
                  <Input
                    id="expense-date"
                    type="date"
                    required
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="expense-description">Description</Label>
                <Input
                  id="expense-description"
                  required
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={expenseForm.category} onValueChange={(value) => setExpenseForm({ ...expenseForm, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>
                          {category.toLowerCase().replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="vendor">Vendor</Label>
                  <Input
                    id="vendor"
                    value={expenseForm.vendor}
                    onChange={(e) => setExpenseForm({ ...expenseForm, vendor: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="receipt">Receipt (Optional)</Label>
                <Input
                  id="receipt"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      // In a real implementation, you would upload the file to a storage service
                      // For now, we'll just store the filename
                      setExpenseForm({ ...expenseForm, receiptFileName: file.name })
                    }
                  }}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Upload receipt image or PDF (max 5MB)
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowExpenseModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addExpenseMutation.isPending}>
                  {addExpenseMutation.isPending ? 'Adding...' : 'Add Expense'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Button variant="outline" onClick={() => exportReport('pdf')}>
          <Download className="h-4 w-4 mr-2" />
          Export PDF
        </Button>

        <Button variant="outline" onClick={() => exportReport('csv')}>
          <FileText className="h-4 w-4 mr-2" />
          Export CSV
        </Button>

        <Button variant="outline" onClick={() => exportReport('xlsx')}>
          <FileText className="h-4 w-4 mr-2" />
          Export Excel
        </Button>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Timeline</CardTitle>
            <p className="text-sm text-muted-foreground">
              Last 6 months • Procedures: €{proceduralIncome.toFixed(2)} • Manual: €{manualIncome.toFixed(2)}
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value) => `€${Number(value).toFixed(2)}`}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  name="Total Income"
                />
                <Line
                  type="monotone"
                  dataKey="procedureIncome"
                  stroke="#1d4ed8"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Procedure Income"
                />
                <Line
                  type="monotone"
                  dataKey="manualIncome"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  name="Manual Income"
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Expenses"
                />
                <Line
                  type="monotone"
                  dataKey="net"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  name="Net Income"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Expense Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expensesByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: €${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expensesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `€${value}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tax Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Tax Calculator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>VAT to Pay</Label>
              <div className="text-2xl font-bold">
                €{(totalIncome * (financeSettings?.vatPercentage || 21) / 100).toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground">
                {financeSettings?.vatPercentage || 21}% of gross income
              </p>
            </div>
            <div className="space-y-2">
              <Label>Income Tax Reserve</Label>
              <div className="text-2xl font-bold">
                €{taxReserve.toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground">
                {financeSettings?.incomeTaxReservePercentage || 30}% of net income
              </p>
            </div>
            <div className="space-y-2">
              <Label>Total Tax Burden</Label>
              <div className="text-2xl font-bold">
                €{(totalIncome * (financeSettings?.vatPercentage || 21) / 100 + taxReserve).toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground">
                VAT + Income tax reserve
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="procedures" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="procedures">Procedures</TabsTrigger>
              <TabsTrigger value="manual">Manual Income</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
            </TabsList>
            <TabsContent value="procedures" className="space-y-4">
              {procedureIncomeData?.procedureIncome?.slice(0, 5).map((item: any) => (
                <div key={item.id} className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <p className="font-medium">{item.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(item.date).toLocaleDateString()} • {item.patientName} ({item.patientCode})
                      {item.toothNumber && ` • Tooth ${item.toothNumber}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">+€{item.amount.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">{item.quantity}x €{item.unitRate.toFixed(2)}</p>
                  </div>
                </div>
              ))}
              {(!procedureIncomeData?.procedureIncome || procedureIncomeData.procedureIncome.length === 0) && (
                <p className="text-center text-muted-foreground py-8">No completed procedures yet</p>
              )}
            </TabsContent>
            <TabsContent value="manual" className="space-y-4">
              {incomeData.slice(0, 5).map((item: any) => (
                <div key={item.id} className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <p className="font-medium">{item.description || 'Income'}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(item.date).toLocaleDateString()} • {item.type}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">+€{item.amount.toFixed(2)}</p>
                    {item.source && <p className="text-sm text-muted-foreground">{item.source}</p>}
                  </div>
                </div>
              ))}
              {incomeData.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No manual income entries yet</p>
              )}
            </TabsContent>
            <TabsContent value="expenses" className="space-y-4">
              {expenseData.slice(0, 5).map((item: any) => (
                <div key={item.id} className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <p className="font-medium">{item.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(item.date).toLocaleDateString()} • {item.category.toLowerCase().replace('_', ' ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">-€{item.amount.toFixed(2)}</p>
                    {item.isTaxDeductible && (
                      <Badge variant="secondary" className="text-xs">Tax Deductible</Badge>
                    )}
                  </div>
                </div>
              ))}
              {expenseData.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No expense entries yet</p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Settings Modal */}
      <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Financial Settings</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSettingsSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vatPercentage">VAT Percentage (%)</Label>
                <Input
                  id="vatPercentage"
                  type="number"
                  step={0.1}
                  required
                  value={settingsForm.vatPercentage}
                  onChange={(e) => setSettingsForm({ ...settingsForm, vatPercentage: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="incomeTaxReservePercentage">Income Tax Reserve (%)</Label>
                <Input
                  id="incomeTaxReservePercentage"
                  type="number"
                  step={0.1}
                  required
                  value={settingsForm.incomeTaxReservePercentage}
                  onChange={(e) => setSettingsForm({ ...settingsForm, incomeTaxReservePercentage: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="monthlyIncomeGoal">Monthly Income Goal (€)</Label>
                <Input
                  id="monthlyIncomeGoal"
                  type="number"
                  step={0.01}
                  value={settingsForm.monthlyIncomeGoal}
                  onChange={(e) => setSettingsForm({ ...settingsForm, monthlyIncomeGoal: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="quarterlyIncomeGoal">Quarterly Income Goal (€)</Label>
                <Input
                  id="quarterlyIncomeGoal"
                  type="number"
                  step={0.01}
                  value={settingsForm.quarterlyIncomeGoal}
                  onChange={(e) => setSettingsForm({ ...settingsForm, quarterlyIncomeGoal: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="accountantName">Accountant Name</Label>
              <Input
                id="accountantName"
                value={settingsForm.accountantName}
                onChange={(e) => setSettingsForm({ ...settingsForm, accountantName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="accountantEmail">Accountant Email</Label>
              <Input
                id="accountantEmail"
                type="email"
                value={settingsForm.accountantEmail}
                onChange={(e) => setSettingsForm({ ...settingsForm, accountantEmail: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowSettingsModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateSettingsMutation.isPending}>
                {updateSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
} 