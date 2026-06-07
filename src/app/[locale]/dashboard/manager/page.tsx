'use client'

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { invalidateEurToRonRateCache } from '@/hooks/useEurToRonRate'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Button,
} from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Input,
} from '@/components/ui/input'
import {
  Label,
} from '@/components/ui/label'
import {
  Textarea,
} from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Badge,
} from '@/components/ui/badge'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Users,
  UserPlus,
  UserX,
  Calendar,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings,
  Eye,
  EyeOff,
  Plus,
  RefreshCw,
  Filter,
  Mail,
  Phone,
  MapPin,
  Edit2,
  Trash2,
  MessageSquare,
  CalendarDays,
  FileText,
  CheckSquare,
  Square,
  Download,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { appAlert } from '@/lib/app-alert'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { format } from 'date-fns'
import { ContextMenu } from '@/components/ui/context-menu'
import DayOverrideModal from '@/components/calendar/DayOverrideModal'
import DayOfWeekOverrideModal from '@/components/calendar/DayOfWeekOverrideModal'
import WeekEditorModal from '@/components/calendar/WeekEditorModal'
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
  Legend,
  Area,
  AreaChart,
} from 'recharts'
import {
  Switch,
} from '@/components/ui/switch'
import * as XLSX from 'xlsx'
import ExcelJS from 'exceljs'

// Chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C']

// Types
interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  role: string
  isActive: boolean
  isDisabled: boolean
  disabledMotiv?: string
  disabledAt?: string
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
  disabledByUser?: {
    id: string
    firstName: string
    lastName: string
  }
  _count: {
    appointments: number
    createdTasks: number
    completedTasks: number
    dentalProcedures: number
    leaveRequests: number
  }
}

interface LeaveRequest {
  id: string
  title: string
  description?: string
  leaveType: string
  startDate: string
  endDate: string
  isPartialDay: boolean
  startTime?: string
  endTime?: string
  totalDays: number
  status: string
  reviewComentarii?: string
  hasAlternative: boolean
  alternativeStartDate?: string
  alternativeEndDate?: string
  alternativeComentarii?: string
  alternativeAccepted?: boolean
  createdAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    role: string
  }
  reviewedBy?: {
    id: string
    firstName: string
    lastName: string
  }
}

interface Analytics {
  period: string
  startDate: string
  endDate: string
  organization: {
    id: string
    name: string
    employeeCount: number
    createdAt: string
  }
  summary: {
    totalUsers: number
    activeUsers: number
    disabledUsers: number
    newUsersThisPeriod: number
    totalPatients: number
    activePatients: number
    newPatientsThisPeriod: number
    totalAppointments: number
    totalTasks: number
    completedTasksThisPeriod: number
    totalLeaveRequests: number
    pendingLeaveRequests: number
    averageAppointmentDuration: number
    totalRevenue: number
    revenueThisPeriod: number
    revenueAnteriorPeriod: number
  }
  usersByRole: Array<{ role: string; count: number }>
  appointmentsByStatus: Array<{ status: string; count: number }>
  appointmentsByPractitioner: Array<{
    practitionerId: string
    practitionerName: string
    practitionerRole: string
    appointmentCount: number
  }>
  tasksByStatus: Array<{ status: string; count: number }>
  tasksByPrioritate: Array<{ priority: string; count: number }>
  leaveRequestsByStatus: Array<{ status: string; count: number }>
  leaveRequestsByType: Array<{ type: string; count: number }>
  topPractitioners: Array<{
    practitionerId: string
    practitionerName: string
    practitionerRole: string
    appointmentCount: number
  }>
  dailyTrends: Array<{
    date: string
    appointments: number
    tasks: number
  }>
  revenueTrends: Array<{
    date: string
    revenue: number
    appointments: number
  }>
  userActivity: {
    activeUsers: number
    inactiveUsers: number
    totalUsers: number
    activePercentage: number
    inactivePercentage: number
  }
  recentActivity: {
    appointments: Array<any>
    tasks: Array<any>
    leaveRequests: Array<any>
  }
}

interface Practitioner {
  id: string;
  firstName: string;
  lastName: string;
  isDisabled?: boolean;
  calendarSettings?: {
    color: string;
  };
}

interface ClinicSchedule {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  roomCount: number;
  isActive: boolean;
  roomAssignments: RoomAssignmentDB[];
  otherWorkerSchedules: OtherWorkerScheduleDB[];
  scheduleOverrides?: ScheduleOverrideDB[];
  roomShifts?: RoomShiftDB[];
}

interface RoomShiftDB {
  id: string;
  roomNumber: number;
  practitionerId: string;
  sidePractitionerId?: string;
  startTime: string;
  endTime: string;
  date?: string;
  dayOfWeek?: string;
  priority: number;
  isOverride: boolean;
  reason?: string;
  practitioner: Practitioner;
  sidePractitioner?: Practitioner;
}

interface RoomAssignmentDB {
  id: string;
  roomNumber: number;
  mainPractitionerId?: string;
  sidePractitionerId?: string;
  startTime: string;
  endTime: string;
  workingDays: string[];
  mainPractitioner?: Practitioner;
  sidePractitioner?: Practitioner;
}

interface OtherWorkerScheduleDB {
  id: string;
  practitionerId: string;
  startTime: string;
  endTime: string;
  workingDays: string[];
  practitioner: Practitioner;
}

interface ScheduleOverrideDB {
  id: string;
  date: string;
  roomNumber?: number;
  practitionerId?: string;
  startTime?: string;
  endTime?: string;
  isUnavailable: boolean;
  reason?: string;
  practitioner?: Practitioner;
}

interface ScheduleRule {
  id: string;
  startDate: string;
  endDate: string;
  repeatType: 'daily' | 'weekly' | 'monthly' | 'yearly';
  daysOfWeek: string[];
}

// Helper function to determine text color based on background
const getContrastYIQ = (hexcolor?: string): string => {
  if (!hexcolor) return '000000'
  hexcolor = hexcolor.replace('#', '')
  if (hexcolor.length === 3) {
    hexcolor = hexcolor.split('').map(char => char + char).join('')
  }
  const r = parseInt(hexcolor.substr(0, 2), 16)
  const g = parseInt(hexcolor.substr(2, 2), 16)
  const b = parseInt(hexcolor.substr(4, 2), 16)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 128 ? '000000' : 'FFFFFF'
}

// Helper to normalize hex colors for Excel styles
const normalizeHex = (hex: string): string => hex.replace('#', '').toUpperCase()

// Convert #RRGGBB (or shorthand #RGB) to 8-digit ARGB (FFRRGGBB) required by Excel styles
const toARGB = (hex: string): string => {
  if (!hex) return 'FFFFFFFF'
  let clean = hex.replace('#', '').toUpperCase()
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('')
  }
  if (clean.length === 6) {
    clean = 'FF' + clean
  }
  if (clean.length === 8) {
    return clean
  }
  return 'FFFFFFFF'
}

// NOTE: Excel fills often work fine with plain 6-digit hex (RRGGBB). We'll use normalizeHex for all colors.

export default function ManagerPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [users, setUsers] = useState<User[]>([])
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [analyticsFilter, setAnalyticsFilter] = useState('month')

  // Personal Manager Notițe & Links states
  const [personalNotițe, setPersonalNotițe] = useState('')
  const [personalLinks, setPersonalLinks] = useState<Array<{ id: string; title: string; url: string }>>([])
  const [newLinkTitle, setNewLinkTitle] = useState('')
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null)
  const [notesLoading, setNotesLoading] = useState(false)

  // User management states
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userActionDialog, setUserActionDialog] = useState<{ isOpen: boolean; action: string; user: User | null }>({
    isOpen: false,
    action: '',
    user: null
  })
  const [disableMotiv, setDisableMotiv] = useState('')

  // Leave request states
  const [selectedLeaveRequest, setSelectedLeaveRequest] = useState<LeaveRequest | null>(null)
  const [leaveActionDialog, setLeaveActionDialog] = useState(false)
  const [reviewComentarii, setReviewComentarii] = useState('')
  const [alternativeStartDate, setAlternativeStartDate] = useState('')
  const [alternativeEndDate, setAlternativeEndDate] = useState('')
  const [alternativeComentarii, setAlternativeComentarii] = useState('')

  // Jurnale de activitate states
  const [logs, setLogs] = useState<any[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [logFilters, setLogFilters] = useState({
    userId: 'all',
    action: '',
    entityType: 'all',
    page: '',
    severity: 'all',
    startDate: '',
    endDate: '',
  })
  const [logsPage, setLogsPage] = useState(1)
  const [logsTotalPages, setLogsTotalPages] = useState(1)
  const [selectedLogs, setSelectedLogs] = useState<string[]>([])
  const [deleteLogsDialog, setDeleteLogsDialog] = useState(false)

  // Calendar Planning states
  const [practitioners, setPractitioners] = useState<(Practitioner & { isDisabled?: boolean })[]>([])
  const [roomCount, setRoomCount] = useState<number>(1)
  const [openingDays, setOpeningDays] = useState<string[]>(['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'])
  const [eurToRonRate, setEurToRonRate] = useState<number>(5.26)
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [selectedScheduleTab, setSelectedScheduleTab] = useState<string>('room-1')
  const [defaultWorkingHours, setDefaultWorkingHours] = useState({ start: '09:00', end: '17:00' })
  const [activeSchedule, setActiveSchedule] = useState<ClinicSchedule | null>(null)
  const [scheduleLoading, setScheduleLoading] = useState(false)

  // Room assignments: array of room configs
  const [roomAssignments, setRoomAssignments] = useState<Array<{
    mainPractitioner?: string
    sidePractitioner?: string
    startTime: string
    endTime: string
    workingDays: string[]
  }>>([])

  // Other workers not assigned to rooms
  const [otherWorkers, setOtherWorkers] = useState<Array<{
    practitionerId: string
    startTime: string
    endTime: string
    workingDays: string[]
  }>>([])

  // Room shifts for flexible scheduling
  const [roomShifts, setRoomShifts] = useState<RoomShiftDB[]>([])

  // Schedule overrides for specific days
  const [scheduleOverrides, setScheduleOverrides] = useState<Record<string, any>>({})
  const [editSpecificDayDialog, setEditSpecificDayDialog] = useState(false)
  const [selectedEditDate, setSelectedEditDate] = useState<string>('')
  const [includeWeekends, setIncludeWeekends] = useState(true)

  // UI state for shifts management
  const [showAdvancedShifts, setShowAdvancedShifts] = useState(false)
  const [addShiftDialog, setAddShiftDialog] = useState({
    isOpen: false,
    roomNumber: 1,
  })
  const [weekEditorDialog, setWeekEditorDialog] = useState({
    isOpen: false,
    roomNumber: 1,
  })
  const [resetScheduleDialog, setResetScheduleDialog] = useState(false)

  // Day override modal states
  const [dayOverrideModal, setDayOverrideModal] = useState({
    isOpen: false,
    selectedDate: null as Date | null,
    selectedRoomNumber: undefined as number | undefined,
    selectedPractitionerId: undefined as string | undefined,
    initialStartTime: undefined as string | undefined,
    initialEndTime: undefined as string | undefined,
  })

  // Day of week override modal states (for recurring weekly patterns)
  const [dayOfWeekOverrideModal, setDayOfWeekOverrideModal] = useState({
    isOpen: false,
    selectedDayOfWeek: '' as string,
    selectedRoomNumber: undefined as number | undefined,
    selectedPractitionerId: undefined as string | undefined,
    initialStartTime: undefined as string | undefined,
    initialEndTime: undefined as string | undefined,
  })

  // Ensure we only perform the heavy initial fetch once (prevents reload spinner on tab focus)
  const initialDataLoaded = useRef(false)

  // Check user permissions & run the heavy initial fetch only once
  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user) {
      router.push('/login')
      return
    }

    const userRole = session.user.role
    if (userRole !== 'ORGANIZATION_OWNER' && userRole !== 'MANAGER') {
      toast({
        title: 'Acces refuzat',
        description: 'Nu aveți permisiunea de a accesa această pagină.',
        variant: 'destructive',
      })
      router.push('/dashboard')
      return
    }

    // Only load data the first time we mount. Tab focus re-authentication will no longer trigger a full reload.
    if (!initialDataLoaded.current) {
      fetchAllData()
      fetchOrganizationSettings()
      initialDataLoaded.current = true
    }
  }, [session, status, router])

  // Fetch logs when the logs tab becomes active
  useEffect(() => {
    if (activeTab === 'logs' && !loading) {
      fetchLogs()
    }
  }, [activeTab])

  // Fetch calendar planning data when the calendar-planning tab becomes active
  useEffect(() => {
    if (activeTab === 'calendar-planning' && !loading) {
      fetchPractitioners()
      initializeCalendarData()
    }
  }, [activeTab, loading])

  // Initialize room assignments when room count changes
  useEffect(() => {
    if (roomCount > roomAssignments.length) {
      const newAssignments = [...roomAssignments]
      for (let i = roomAssignments.length; i < roomCount; i++) {
        newAssignments.push({
          startTime: defaultWorkingHours.start,
          endTime: defaultWorkingHours.end,
          workingDays: ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri']
        })
      }
      setRoomAssignments(newAssignments)
    } else if (roomCount < roomAssignments.length) {
      setRoomAssignments(roomAssignments.slice(0, roomCount))
    }

    // Update selected tab if needed
    if (selectedScheduleTab && !selectedScheduleTab.startsWith('room-')) {
      setSelectedScheduleTab('room-1')
    } else if (selectedScheduleTab) {
      const roomNum = parseInt(selectedScheduleTab.split('-')[1])
      if (roomNum > roomCount) {
        setSelectedScheduleTab('room-1')
      }
    }
  }, [roomCount, roomAssignments.length, defaultWorkingHours])

  // Auto-save room count when it changes (with debounce to avoid excessive API calls)
  useEffect(() => {
    if (roomCount > 0) {
      const timer = setTimeout(() => {
        saveRoomCount(roomCount)
      }, 500) // Debounce for 500ms

      return () => clearTimeout(timer)
    }
  }, [roomCount])

  // Auto-save opening days when they change (with debounce to avoid excessive API calls)
  useEffect(() => {
    if (openingDays.length > 0) {
      const timer = setTimeout(() => {
        saveOrganizationSettings({ openingDays })
      }, 500) // Debounce for 500ms

      return () => clearTimeout(timer)
    }
  }, [openingDays])

  useEffect(() => {
    if (eurToRonRate > 0) {
      const timer = setTimeout(() => {
        saveOrganizationSettings({ eurToRonRate })
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [eurToRonRate])



  const fetchOrganizationSettings = async () => {
    try {
      const response = await fetch('/api/organization-settings')
      if (response.ok) {
        const data = await response.json()
        setRoomCount(data.roomCount || 1)
        setOpeningDays(data.openingDays || ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'])
        setEurToRonRate(typeof data.eurToRonRate === 'number' ? data.eurToRonRate : 5.26)
      }
    } catch (error) {
      console.error('Error fetching organization settings:', error)
      // Fallback to localStorage if API fails
      const savedRoomCount = localStorage.getItem('clinic-room-count')
      if (savedRoomCount && parseInt(savedRoomCount) > 0) {
        setRoomCount(parseInt(savedRoomCount))
      }
      const savedOpeningDays = localStorage.getItem('clinic-opening-days')
      if (savedOpeningDays) {
        try {
          setOpeningDays(JSON.parse(savedOpeningDays))
        } catch (e) {
          setOpeningDays(['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'])
        }
      }
    }
  }

  const saveOrganizationSettings = async (settings: {
    roomCount?: number
    openingDays?: string[]
    eurToRonRate?: number
  }) => {
    try {
      const response = await fetch('/api/organization-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        throw new Error('Salvarea organization settings')
      }
      if (settings.eurToRonRate !== undefined) {
        invalidateEurToRonRateCache()
      }
      // Silent save - no toast needed for auto-save
    } catch (error) {
      console.error('Error saving organization settings:', error)
      // Keep localStorage as fallback - only show error for serious issues
      if (settings.roomCount) {
        localStorage.setItem('clinic-room-count', settings.roomCount.toString())
      }
      if (settings.openingDays) {
        localStorage.setItem('clinic-opening-days', JSON.stringify(settings.openingDays))
      }
    }
  }

  // Legacy function for backwards compatibility
  const saveRoomCount = async (newRoomCount: number) => {
    await saveOrganizationSettings({ roomCount: newRoomCount })
  }

  const fetchAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchUsers(),
        fetchLeaveRequests(),
        fetchAnalytics()
      ])
      if (activeTab === 'logs') {
        await fetchLogs()
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsers([]) // Ensure users is always an array
    }
  }

  const fetchLeaveRequests = async () => {
    try {
      const response = await fetch('/api/leave-requests?managerView=true')
      if (response.ok) {
        const data = await response.json()
        setLeaveRequests(data.leaveRequests)
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/manager/analytics?period=${analyticsFilter}`)
      if (response.ok) {
        const analytics = await response.json()

        // Add mock revenue data if not provided by API yet
        if (!analytics.summary.totalRevenue) {
          analytics.summary.totalRevenue = Math.floor(Math.random() * 100000) + 50000
          analytics.summary.revenueThisPeriod = Math.floor(Math.random() * 50000) + 25000
          analytics.summary.revenueAnteriorPeriod = Math.floor(Math.random() * 40000) + 20000
        }

        // Add mock revenue trends if not provided by API yet
        if (!analytics.revenueTrends || analytics.revenueTrends.length === 0) {
          analytics.revenueTrends = analytics.dailyTrends?.map((trend, index) => ({
            date: trend.date,
            revenue: Math.floor(Math.random() * 5000) + 2000 + (index * 100),
            appointments: trend.appointments
          })) || []
        }

        // Add user activity data if not provided by API yet
        if (!analytics.userActivity) {
          const totalUsers = analytics.summary.totalUsers
          const activeUsers = analytics.summary.activeUsers
          const inactiveUsers = totalUsers - activeUsers
          analytics.userActivity = {
            activeUsers,
            inactiveUsers,
            totalUsers,
            activePercentage: Math.round((activeUsers / totalUsers) * 100),
            inactivePercentage: Math.round((inactiveUsers / totalUsers) * 100)
          }
        }

        setAnalytics(analytics)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }

  // Personal Notițe & Links Functions
  const fetchPersonalNotițe = async () => {
    try {
      const response = await fetch('/api/manager/personal-notes')
      if (response.ok) {
        const data = await response.json()
        setPersonalNotițe(data.notes || '')
        setPersonalLinks(data.links || [])
      }
    } catch (error) {
      console.error('Error fetching personal notes:', error)
    }
  }

  const savePersonalNotițe = async (notes: string) => {
    if (notesLoading) return
    setNotesLoading(true)
    try {
      const response = await fetch('/api/manager/personal-notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })
      if (!response.ok) {
        throw new Error('Salvarea notes')
      }
    } catch (error) {
      console.error('Error saving personal notes:', error)
      toast({
        title: 'Eroare',
        description: 'Salvarea notițelor a eșuat. Se va reîncerca automat.',
        variant: 'destructive'
      })
    } finally {
      setNotesLoading(false)
    }
  }

  const addPersonalLink = async () => {
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) {
      toast({
        title: 'Eroare',
        description: 'Introduceți titlul și URL-ul',
        variant: 'destructive'
      })
      return
    }

    try {
      const response = await fetch('/api/manager/personal-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addLink',
          title: newLinkTitle.trim(),
          url: newLinkUrl.trim(),
        }),
      })

      if (response.ok) {
        const { link } = await response.json()
        setPersonalLinks(prev => [...prev, link])
        setNewLinkTitle('')
        setNewLinkUrl('')
        toast({ title: 'Succes', description: 'Link adăugat cu succes' })
      }
    } catch (error) {
      console.error('Error adding link:', error)
      toast({
        title: 'Eroare',
        description: 'Adăugarea linkului a eșuat',
        variant: 'destructive'
      })
    }
  }

  const updatePersonalLink = async (linkId: string, title: string, url: string) => {
    try {
      const response = await fetch('/api/manager/personal-notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateLink',
          linkId,
          title: title.trim(),
          url: url.trim(),
        }),
      })

      if (response.ok) {
        setPersonalLinks(prev => prev.map(link =>
          link.id === linkId ? { ...link, title: title.trim(), url: url.trim() } : link
        ))
        setEditingLinkId(null)
        toast({ title: 'Succes', description: 'Link actualizat cu succes' })
      }
    } catch (error) {
      console.error('Error updating link:', error)
      toast({
        title: 'Eroare',
        description: 'Actualizarea linkului a eșuat',
        variant: 'destructive'
      })
    }
  }

  const deletePersonalLink = async (linkId: string) => {
    try {
      const response = await fetch('/api/manager/personal-notes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkId }),
      })

      if (response.ok) {
        setPersonalLinks(prev => prev.filter(link => link.id !== linkId))
        toast({ title: 'Succes', description: 'Link șters cu succes' })
      }
    } catch (error) {
      console.error('Error deleting link:', error)
      toast({
        title: 'Eroare',
        description: 'Ștergerea linkului a eșuat',
        variant: 'destructive'
      })
    }
  }

  // Auto-save personal notes when they change (with debounce)
  useEffect(() => {
    if (personalNotițe && !loading) {
      const timer = setTimeout(() => {
        savePersonalNotițe(personalNotițe)
      }, 1000) // Debounce for 1 second

      return () => clearTimeout(timer)
    }
  }, [personalNotițe, loading])

  // Fetch personal notes and links on mount
  useEffect(() => {
    if (activeTab === 'overview' && !loading) {
      fetchPersonalNotițe()
    }
  }, [activeTab, loading])

  const fetchPractitioners = async () => {
    try {
      const response = await fetch('/api/manager/practitioners?includeColors=true')
      if (response.ok) {
        const data = await response.json()
        setPractitioners(data)
      }
    } catch (error) {
      console.error('Error fetching practitioners:', error)
      toast({ title: 'Eroare', description: 'Încărcarea practicienilor a eșuat', variant: 'destructive' })
    }
  }

  const fetchActiveSchedule = async () => {
    setScheduleLoading(true)
    try {
      const response = await fetch('/api/clinic-schedule/active')
      if (response.ok) {
        const data = await response.json()
        if (data.schedule) {
          const schedule = data.schedule
          setActiveSchedule(schedule)

          // Update state with loaded schedule
          setStartDate(new Date(schedule.startDate))
          setEndDate(new Date(schedule.endDate))

          // Convert room assignments to UI format
          const uiRoomAssignments = schedule.roomAssignments.map((assignment: any) => ({
            mainPractitioner: assignment.mainPractitionerId || undefined,
            sidePractitioner: assignment.sidePractitionerId || undefined,
            startTime: assignment.startTime,
            endTime: assignment.endTime,
            workingDays: assignment.workingDays,
          }))

          // Fill remaining rooms if needed
          while (uiRoomAssignments.length < roomCount) {
            uiRoomAssignments.push({
              startTime: defaultWorkingHours.start,
              endTime: defaultWorkingHours.end,
              workingDays: ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri']
            })
          }

          setRoomAssignments(uiRoomAssignments)

          // Convert other worker schedules to UI format
          const uiOtherWorkers = schedule.otherWorkerSchedules.map((worker: any) => ({
            practitionerId: worker.practitionerId,
            startTime: worker.startTime,
            endTime: worker.endTime,
            workingDays: worker.workingDays,
          }))

          setOtherWorkers(uiOtherWorkers)

          // Load room shifts
          if (schedule.roomShifts) {
            setRoomShifts(schedule.roomShifts)
            setShowAdvancedShifts(schedule.roomShifts.length > 0)
          } else {
            setRoomShifts([])
            setShowAdvancedShifts(false)
          }
        } else {
          // No active schedule found, initialize with defaults
          setActiveSchedule(null)
          setRoomShifts([])
          setShowAdvancedShifts(false)
          initializeDefaultCalendarData()
        }
      } else {
        console.error('Failed to fetch active schedule')
        setActiveSchedule(null)
        initializeDefaultCalendarData()
      }
    } catch (error) {
      console.error('Error fetching active schedule:', error)
      setActiveSchedule(null)
      initializeDefaultCalendarData()
    } finally {
      setScheduleLoading(false)
    }
  }

  const initializeDefaultCalendarData = () => {
    try {
      // Set default dates
      const today = new Date()
      const nextWeek = new Date(today)
      nextWeek.setDate(today.getDate() + 7)

      if (!startDate) setStartDate(today)
      if (!endDate) setEndDate(nextWeek)

      // Initialize room assignments if empty
      if (roomAssignments.length === 0) {
        const initialAssignments = Array.from({ length: roomCount }, () => ({
          startTime: defaultWorkingHours.start,
          endTime: defaultWorkingHours.end,
          workingDays: ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri']
        }))
        setRoomAssignments(initialAssignments)
      }
    } catch (error) {
      console.error('Error initializing calendar data:', error)
    }
  }

  const initializeCalendarData = async () => {
    await fetchActiveSchedule()
  }

  const handleUserAction = async (userId: string, action: 'DISABLE' | 'ENABLE' | 'DELETE', reason?: string) => {
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action,
          reason,
        }),
      })

      if (response.ok) {
        toast({
          title: 'Succes',
          description: action === 'DISABLE'
            ? 'Utilizatorul a fost dezactivat cu succes.'
            : 'Utilizatorul a fost activat cu succes.',
        })
        fetchUsers() // Refresh users list
        setUserActionDialog({ isOpen: false, action: '', user: null })
        setDisableMotiv('')
      } else {
        const error = await response.json()
        toast({
          title: 'Eroare',
          description: error.error || (action === 'DISABLE'
            ? 'Utilizatorul nu a putut fi dezactivat.'
            : 'Utilizatorul nu a putut fi activat.'),
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error updating user:', error)
      toast({
        title: 'Eroare',
        description: action === 'DISABLE'
          ? 'Utilizatorul nu a putut fi dezactivat. Încercați din nou.'
          : 'Utilizatorul nu a putut fi activat. Încercați din nou.',
        variant: 'destructive',
      })
    }
  }

  const handleLeaveRequestAction = async (
    leaveRequestId: string,
    action: 'APPROVE' | 'DENY' | 'PROPOSE_ALTERNATIVE',
    reviewData?: any
  ) => {
    try {
      const response = await fetch('/api/leave-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leaveRequestId,
          type: 'review',
          action,
          ...reviewData,
        }),
      })

      if (response.ok) {
        toast({
          title: 'Succes',
          description: 'Cererea de concediu a fost actualizată cu succes.',
        })
        fetchLeaveRequests() // Refresh leave requests list
        setLeaveActionDialog(false)
        setSelectedLeaveRequest(null)
        setReviewComentarii('')
        setAlternativeStartDate('')
        setAlternativeEndDate('')
        setAlternativeComentarii('')
      } else {
        const error = await response.json()
        toast({
          title: 'Eroare',
          description: error.error || 'Actualizarea cererii de concediu a eșuat.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error updating leave request:', error)
      toast({
        title: 'Eroare',
        description: 'Actualizarea cererii de concediu a eșuat. Încercați din nou.',
        variant: 'destructive',
      })
    }
  }

  const handleLeaveCancel = async (leaveRequestId: string) => {
    try {
      const response = await fetch('/api/leave-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaveRequestId,
          type: 'review',
          action: 'DENY',
          reviewComentarii: 'Anulat de manager',
        }),
      });
      if (!response.ok) throw new Error('Failed');
      toast({ title: 'Succes', description: 'Cererea de concediu a fost anulată' });
      fetchLeaveRequests();
    } catch (err) {
      console.error(err);
      toast({ title: 'Eroare', description: 'Anularea cererii de concediu a eșuat', variant: 'destructive' });
    }
  };

  // New Calendar Planning Functions
  const handleQuickPeriod = (period: string) => {
    const today = new Date()
    let start = new Date(today)
    let end = new Date(today)

    switch (period) {
      case 'week':
        // This week (Monday to Sunday)
        const currentDay = today.getDay()
        const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay
        start = new Date(today)
        start.setDate(today.getDate() + distanceToMonday)
        end = new Date(start)
        end.setDate(start.getDate() + 6)
        break
      case 'month':
        // This month
        start = new Date(today.getFullYear(), today.getMonth(), 1)
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        break
      case 'nextWeek':
        // Următor week
        const nextWeekStart = new Date(today)
        nextWeekStart.setDate(today.getDate() + (7 - today.getDay() + 1) % 7 || 7)
        start = nextWeekStart
        end = new Date(start)
        end.setDate(start.getDate() + 6)
        break
      case 'nextMonth':
        // Următor month
        start = new Date(today.getFullYear(), today.getMonth() + 1, 1)
        end = new Date(today.getFullYear(), today.getMonth() + 2, 0)
        break
    }

    setStartDate(start)
    setEndDate(end)
  }

  const applyDefaultHours = () => {
    // Apply default hours to all room assignments
    const updatedAssignments = roomAssignments.map(assignment => ({
      ...assignment,
      startTime: defaultWorkingHours.start,
      endTime: defaultWorkingHours.end
    }))
    setRoomAssignments(updatedAssignments)

    // Apply to other workers too
    const updatedOtherWorkers = otherWorkers.map(worker => ({
      ...worker,
      startTime: defaultWorkingHours.start,
      endTime: defaultWorkingHours.end
    }))
    setOtherWorkers(updatedOtherWorkers)

    toast({ title: 'Succes', description: 'Orele implicite au fost aplicate tuturor angajaților' })
  }

  const handleRoomAssignment = (roomIndex: number, field: string, value: any) => {
    const updatedAssignments = [...roomAssignments]
    if (!updatedAssignments[roomIndex]) {
      updatedAssignments[roomIndex] = {
        startTime: defaultWorkingHours.start,
        endTime: defaultWorkingHours.end,
        workingDays: ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri']
      }
    }

    updatedAssignments[roomIndex] = {
      ...updatedAssignments[roomIndex],
      [field]: value
    }
    setRoomAssignments(updatedAssignments)
  }

  const handleWorkingDayToggle = (roomIndex: number, day: string) => {
    const updatedAssignments = [...roomAssignments]
    if (!updatedAssignments[roomIndex]) return

    const currentDays = updatedAssignments[roomIndex].workingDays || []
    const updatedDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day]

    updatedAssignments[roomIndex].workingDays = updatedDays
    setRoomAssignments(updatedAssignments)
  }

  const addOtherWorker = () => {
    setOtherWorkers([...otherWorkers, {
      practitionerId: '',
      startTime: defaultWorkingHours.start,
      endTime: defaultWorkingHours.end,
      workingDays: ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri']
    }])
  }

  // Room shifts management functions
  const addRoomShift = async (shiftData: {
    roomNumber: number
    practitionerId: string
    sidePractitionerId?: string
    startTime: string
    endTime: string
    date?: string
    dayOfWeek?: string
    priority?: number
    isOverride?: boolean
    reason?: string
  }) => {
    if (!activeSchedule) {
      toast({ title: 'Eroare', description: 'Niciun program activ găsit', variant: 'destructive' })
      return
    }

    try {
      const response = await fetch('/api/clinic-schedule/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduleId: activeSchedule.id,
          ...shiftData,
          priority: shiftData.priority || 0,
          isOverride: shiftData.isOverride || false,
        }),
      })

      if (response.ok) {
        const { shift } = await response.json()
        console.log('Shift created successfully:', shift)

        // Add the shift to local state immediately for quick UI update
        setRoomShifts(prev => [...prev, shift])

        // Also refresh the schedule to make sure we have the latest data from DB
        await fetchActiveSchedule()

        toast({ title: 'Succes', description: 'Tura a fost adăugată cu succes' })
      } else {
        const error = await response.json()
        console.error('Failed to create shift:', error)
        toast({ title: 'Eroare', description: error.error, variant: 'destructive' })
      }
    } catch (error) {
      console.error('Error adding shift:', error)
      toast({ title: 'Eroare', description: 'Adăugarea turei a eșuat', variant: 'destructive' })
    }
  }

  const removeRoomShift = async (shiftId: string) => {
    try {
      const response = await fetch(`/api/clinic-schedule/shifts?id=${shiftId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setRoomShifts(prev => prev.filter(shift => shift.id !== shiftId))
        toast({ title: 'Succes', description: 'Tura a fost eliminată cu succes' })
      } else {
        const error = await response.json()
        toast({ title: 'Eroare', description: error.error, variant: 'destructive' })
      }
    } catch (error) {
      console.error('Error removing shift:', error)
      toast({ title: 'Eroare', description: 'Eliminarea turei a eșuat', variant: 'destructive' })
    }
  }

  const getShiftsForRoom = (roomNumber: number) => {
    return roomShifts.filter(shift => shift.roomNumber === roomNumber)
  }

  const handleSaveWeekShifts = async (roomNumber: number, shifts: RoomShiftDB[]) => {
    if (!activeSchedule) {
      toast({ title: 'Eroare', description: 'Niciun program activ găsit', variant: 'destructive' })
      return
    }

    try {
      // First, remove all existing weekly shifts for this room
      const existingWeeklyShifts = roomShifts.filter(
        shift => shift.roomNumber === roomNumber && shift.dayOfWeek && !shift.date
      )

      // Șterge existing weekly shifts
      for (const shift of existingWeeklyShifts) {
        if (shift.id && !shift.id.startsWith('temp-')) {
          await fetch(`/api/clinic-schedule/shifts?id=${shift.id}`, {
            method: 'DELETE',
          })
        }
      }

      // Create new shifts
      const newShifts = []
      for (const shift of shifts) {
        if (!shift.id || shift.id.startsWith('temp-')) {
          const response = await fetch('/api/clinic-schedule/shifts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              scheduleId: activeSchedule.id,
              roomNumber,
              practitionerId: shift.practitionerId,
              sidePractitionerId: shift.sidePractitionerId,
              startTime: shift.startTime,
              endTime: shift.endTime,
              dayOfWeek: shift.dayOfWeek,
              priority: shift.priority,
              isOverride: shift.isOverride,
              reason: shift.reason,
            }),
          })

          if (response.ok) {
            const { shift: newShift } = await response.json()
            newShifts.push(newShift)
          }
        } else {
          newShifts.push(shift)
        }
      }

      // Update local state
      setRoomShifts(prev => [
        ...prev.filter(shift =>
          !(shift.roomNumber === roomNumber && shift.dayOfWeek && !shift.date)
        ),
        ...newShifts
      ])

      toast({ title: 'Succes', description: 'Programul săptămânal a fost salvat cu succes' })
    } catch (error) {
      console.error('Error saving week shifts:', error)
      throw error
    }
  }

  const removeOtherWorker = (index: number) => {
    const updated = otherWorkers.filter((_, i) => i !== index)
    setOtherWorkers(updated)
  }

  const handleOtherWorkerChange = (index: number, field: string, value: any) => {
    const updated = [...otherWorkers]
    updated[index] = { ...updated[index], [field]: value }
    setOtherWorkers(updated)
  }

  const handleOtherWorkerDayToggle = (index: number, day: string) => {
    const updated = [...otherWorkers]
    const currentDays = updated[index].workingDays || []
    const updatedDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day]

    updated[index].workingDays = updatedDays
    setOtherWorkers(updated)
  }

  const handleOpeningDayToggle = (day: string) => {
    const updatedOpeningDays = openingDays.includes(day)
      ? openingDays.filter(d => d !== day)
      : [...openingDays, day]

    setOpeningDays(updatedOpeningDays)
  }

  const isWorkerAssigned = (practitionerId: string) => {
    // Check if worker is assigned to any room
    const assignedInRooms = roomAssignments.some(
      assignment => assignment.mainPractitioner === practitionerId || assignment.sidePractitioner === practitionerId
    )

    // Check if worker is in other workers list
    const assignedInOthers = otherWorkers.some(worker => worker.practitionerId === practitionerId)

    return assignedInRooms || assignedInOthers
  }

  // Get only active practitioners for selection (exclude disabled ones)
  const getActivePractitioners = () => {
    return practitioners.filter(p => !p.isDisabled)
  }

  const generateSchedulePreview = useCallback(() => {
    if (!startDate || !endDate) return []

    // Build a quick lookup map for overrides: key = dateISO + room/practitioner
    const overrideMap: Record<string, ScheduleOverrideDB[]> = {}
    if (activeSchedule?.scheduleOverrides) {
      activeSchedule.scheduleOverrides.forEach((ov) => {
        const key = new Date(ov.date).toDateString()
        if (!overrideMap[key]) overrideMap[key] = []
        overrideMap[key].push(ov)
      })
    }

    // Build a lookup map for room shifts by day of week and specific dates
    const weeklyShiftsMap: Record<string, RoomShiftDB[]> = {} // key = roomNumber + dayOfWeek
    const specificShiftsMap: Record<string, RoomShiftDB[]> = {} // key = roomNumber + dateISO

    roomShifts.forEach((shift) => {
      if (shift.dayOfWeek && !shift.date) {
        // Weekly recurring shift
        const key = `${shift.roomNumber}-${shift.dayOfWeek}`
        if (!weeklyShiftsMap[key]) weeklyShiftsMap[key] = []
        weeklyShiftsMap[key].push(shift)
      } else if (shift.date) {
        // Specific date shift
        const key = `${shift.roomNumber}-${new Date(shift.date).toDateString()}`
        if (!specificShiftsMap[key]) specificShiftsMap[key] = []
        specificShiftsMap[key].push(shift)
      }
    })

    // Sort shifts by priority (highest first) and then by start time
    Object.values(weeklyShiftsMap).forEach(shifts => {
      shifts.sort((a, b) => b.priority - a.priority || a.startTime.localeCompare(b.startTime))
    })
    Object.values(specificShiftsMap).forEach(shifts => {
      shifts.sort((a, b) => b.priority - a.priority || a.startTime.localeCompare(b.startTime))
    })

    const preview = []
    const current = new Date(startDate)
    const end = new Date(endDate)

    while (current <= end) {
      const dayName = current.toLocaleDateString('ro-RO', { weekday: 'long' })
      if (!openingDays.includes(dayName)) {
        current.setDate(current.getDate() + 1)
        continue
      }
      const dateStr = current.toLocaleDateString('ro-RO', { month: 'short', day: 'numeric' })

      const overridesToday = overrideMap[current.toDateString()] || []

      // Generate room assignments for this day
      const rooms = roomAssignments.map((assignment, index) => {
        const roomNumber = index + 1
        const room = { shifts: [] as any[] }

        // Get shifts for this room and day
        const weeklyShiftsKey = `${roomNumber}-${dayName}`
        const specificShiftsKey = `${roomNumber}-${current.toDateString()}`

        const weeklyShifts = weeklyShiftsMap[weeklyShiftsKey] || []
        const specificShifts = specificShiftsMap[specificShiftsKey] || []

        // Combine and sort all shifts (specific shifts override weekly ones)
        const allShifts = [...specificShifts, ...weeklyShifts]
        const roomOverrides = overridesToday.filter(o => o.roomNumber === roomNumber)

        // If we have custom shifts, use them instead of base assignment
        if (allShifts.length > 0) {
          allShifts.forEach(shift => {
            // Check if this shift is overridden by schedule overrides
            const shiftOverride = roomOverrides.find(o =>
              o.practitionerId === shift.practitionerId && o.isUnavailable
            )

            if (!shiftOverride) {
              const mainPrac = practitioners.find(p => p.id === shift.practitionerId)
              const sidePrac = shift.sidePractitionerId ?
                practitioners.find(p => p.id === shift.sidePractitionerId) : null

              if (mainPrac) {
                // Apply any time overrides from schedule overrides
                const timeOverride = roomOverrides.find(o => o.practitionerId === shift.practitionerId)
                const startTime = timeOverride?.startTime || shift.startTime
                const endTime = timeOverride?.endTime || shift.endTime

                room.shifts.push({
                  main: {
                    name: `${mainPrac.firstName} ${mainPrac.lastName}`,
                    time: `${startTime} - ${endTime}`,
                    color: mainPrac.calendarSettings?.color || '#1976d2',
                    priority: shift.priority,
                    isOverride: shift.isOverride,
                    reason: shift.reason
                  },
                  side: sidePrac ? {
                    name: `${sidePrac.firstName} ${sidePrac.lastName}`,
                    time: `${startTime} - ${endTime}`,
                    color: sidePrac.calendarSettings?.color || '#388e3c',
                    priority: shift.priority,
                    isOverride: shift.isOverride,
                    reason: shift.reason
                  } : null
                })
              }
            }
          })
        } else {
          // Fallback to base room assignment if working day
          if (assignment.workingDays?.includes(dayName)) {
            const room_obj = { main: null as any, side: null as any }

            // Apply overrides with practitionerId first
            roomOverrides.filter(o => o.practitionerId && !o.isUnavailable).forEach(ov => {
              const prac = practitioners.find(p => p.id === ov.practitionerId)
              if (prac) {
                if (!room_obj.main) {
                  room_obj.main = {
                    name: `${prac.firstName} ${prac.lastName}`,
                    time: `${ov.startTime || assignment.startTime} - ${ov.endTime || assignment.endTime}`,
                    color: prac.calendarSettings?.color || '#1976d2'
                  }
                } else if (!room_obj.side) {
                  room_obj.side = {
                    name: `${prac.firstName} ${prac.lastName}`,
                    time: `${ov.startTime || assignment.startTime} - ${ov.endTime || assignment.endTime}`,
                    color: prac.calendarSettings?.color || '#388e3c'
                  }
                }
              }
            })

            const hasOverridePractitioners = roomOverrides.some(o => o.practitionerId && !o.isUnavailable)

            // Add base practitioners if no overrides
            if (!hasOverridePractitioners) {
              if (assignment.mainPractitioner) {
                const prac = practitioners.find(p => p.id === assignment.mainPractitioner)
                const ov = roomOverrides.find(o => o.practitionerId === assignment.mainPractitioner)
                if (prac && !ov?.isUnavailable) {
                  room_obj.main = {
                    name: `${prac.firstName} ${prac.lastName}`,
                    time: `${ov?.startTime || assignment.startTime} - ${ov?.endTime || assignment.endTime}`,
                    color: prac.calendarSettings?.color || '#1976d2'
                  }
                }
              }

              if (assignment.sidePractitioner) {
                const prac = practitioners.find(p => p.id === assignment.sidePractitioner)
                const ov = roomOverrides.find(o => o.practitionerId === assignment.sidePractitioner)
                if (prac && !ov?.isUnavailable) {
                  room_obj.side = {
                    name: `${prac.firstName} ${prac.lastName}`,
                    time: `${ov?.startTime || assignment.startTime} - ${ov?.endTime || assignment.endTime}`,
                    color: prac.calendarSettings?.color || '#388e3c'
                  }
                }
              }
            }

            if (room_obj.main || room_obj.side) {
              room.shifts.push(room_obj)
            }
          }
        }

        // Convert back to legacy format for compatibility
        const legacyRoom = { main: null as any, side: null as any }
        if (room.shifts.length > 0) {
          // Use the first shift for legacy compatibility
          legacyRoom.main = room.shifts[0].main
          legacyRoom.side = room.shifts[0].side
        }

        return { ...legacyRoom, shifts: room.shifts }
      })

      // Generate other workers for this day
      const dayOtherWorkers = otherWorkers
        .filter(worker => worker.workingDays?.includes(dayName) && worker.practitionerId)
        .map(worker => {
          const practitioner = practitioners.find(p => p.id === worker.practitionerId)
          if (!practitioner) return null

          const ov = overridesToday.find(o => o.practitionerId === worker.practitionerId && !o.roomNumber)
          const unavailable = ov?.isUnavailable
          const sTime = ov?.startTime || worker.startTime
          const eTime = ov?.endTime || worker.endTime

          if (unavailable) return null

          return {
            name: `${practitioner.firstName} ${practitioner.lastName}`,
            time: `${sTime} - ${eTime}`,
            color: practitioner.calendarSettings?.color || '#7b1fa2'
          }
        })
        .filter(Boolean)

      preview.push({
        date: dateStr,
        dayName,
        rooms,
        otherWorkers: dayOtherWorkers,
        actualDate: new Date(current)
      })

      current.setDate(current.getDate() + 1)
    }

    return preview
  }, [startDate, endDate, roomAssignments, otherWorkers, practitioners, openingDays, activeSchedule, roomShifts])

  // Memoize the schedule preview
  const schedulePreview = useMemo(() => generateSchedulePreview(), [generateSchedulePreview])

  const handleResetSchedule = async () => {
    try {
      setScheduleLoading(true)

      // If there's an active schedule, deactivate it and clear all related data
      if (activeSchedule) {
        // First, clear all schedule overrides for this schedule
        const overridesResponse = await fetch(`/api/clinic-schedule/overrides?scheduleId=${activeSchedule.id}`, {
          method: 'DELETE',
        })

        if (!overridesResponse.ok) {
          console.warn('Failed to clear schedule overrides, continuing with reset...')
        }

        // Then delete the schedule (this will cascade delete room assignments, shifts, etc.)
        await fetch(`/api/clinic-schedule/${activeSchedule.id}`, {
          method: 'DELETE',
        })
      }

      // Reset all local state to defaults
      setActiveSchedule(null)
      setRoomShifts([])
      setShowAdvancedShifts(false)
      setScheduleOverrides({}) // Clear local overrides state

      // Reset room assignments to defaults
      const defaultAssignments = Array.from({ length: roomCount }, () => ({
        startTime: defaultWorkingHours.start,
        endTime: defaultWorkingHours.end,
        workingDays: ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri']
      }))
      setRoomAssignments(defaultAssignments)

      // Clear other workers
      setOtherWorkers([])

      // Reset dates to default
      const today = new Date()
      const nextWeek = new Date(today)
      nextWeek.setDate(today.getDate() + 7)
      setStartDate(today)
      setEndDate(nextWeek)

      toast({
        title: 'Resetare program',
        description: 'Programul a fost resetat complet, inclusiv orele personalizate și excepțiile. Puteți configura acum un program nou.'
      })
    } catch (error) {
      console.error('Error resetting schedule:', error)
      toast({
        title: 'Resetare eșuată',
        description: 'Resetarea programului a eșuat. Încercați din nou.',
        variant: 'destructive'
      })
    } finally {
      setScheduleLoading(false)
    }
  }

  const handleSaveSchedule = async () => {
    try {
      if (!startDate || !endDate) {
        toast({ title: 'Eroare', description: 'Selectați datele de început și sfârșit', variant: 'destructive' })
        return
      }

      // Prepare room assignments with proper room numbers
      const formattedRoomAssignments = roomAssignments.map((assignment, index) => ({
        roomNumber: index + 1,
        mainPractitionerId: assignment.mainPractitioner || undefined,
        sidePractitionerId: assignment.sidePractitioner && assignment.sidePractitioner !== 'none' ? assignment.sidePractitioner : undefined,
        startTime: assignment.startTime,
        endTime: assignment.endTime,
        workingDays: assignment.workingDays,
      }))

      // Prepare other workers data
      const formattedOtherWorkers = otherWorkers.filter(worker => worker.practitionerId).map(worker => ({
        practitionerId: worker.practitionerId,
        startTime: worker.startTime,
        endTime: worker.endTime,
        workingDays: worker.workingDays,
      }))

      const scheduleData = {
        name: `Program ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        roomCount,
        roomAssignments: formattedRoomAssignments,
        otherWorkers: formattedOtherWorkers,
      }

      const response = await fetch('/api/clinic-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scheduleData),
      })

      if (response.ok) {
        const data = await response.json()
        toast({ title: 'Succes', description: 'Programul a fost salvat cu succes în baza de date' })

        // Refresh the schedule data from the server
        await fetchActiveSchedule()
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to save schedule')
      }
    } catch (error) {
      console.error('Error saving schedule:', error)
      toast({ title: 'Eroare', description: `Salvarea programului a eșuat: ${error.message}`, variant: 'destructive' })
    }
  }

  const handleExportSchedule = async () => {
    if (!startDate || !endDate) {
      toast({ title: 'Eroare', description: 'Setați mai întâi datele programului', variant: 'destructive' })
      return
    }

    try {
      const preview = generateSchedulePreview()
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Program clinică')

      // Define headers with separate columns for main and side practitioners
      const headers = ['📊 Săptămâna', '📅 Data', '📆 Zi']
      for (let i = 1; i <= roomCount; i++) {
        headers.push(`🏥 Sala ${i} - Principal`)
        headers.push(`🏥 Sala ${i} - Secundar`)
      }
      headers.push('👥 Alți angajați')

      // Helper function to get ISO week number
      const getISOWeek = (date: Date) => {
        const target = new Date(date.valueOf())
        const dayNr = (date.getDay() + 6) % 7
        target.setDate(target.getDate() - dayNr + 3)
        const firstThursday = new Date(target.getFullYear(), 0, 4)
        const dayDiff = (target.getTime() - firstThursday.getTime()) / 86400000
        return 1 + Math.ceil(dayDiff / 7)
      }

      let currentRow = 1

      // Title row
      const titleRow = worksheet.getRow(currentRow)
      titleRow.getCell(1).value = '🦷 Program clinică'
      titleRow.getCell(1).font = { size: 20, bold: true, color: { argb: 'FF34495E' } }
      titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.mergeCells(currentRow, 1, currentRow, headers.length)
      titleRow.height = 30
      currentRow++

      // Date range row
      const dateRow = worksheet.getRow(currentRow)
      const dateText = `${startDate.toLocaleDateString('ro-RO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })} - ${endDate.toLocaleDateString('ro-RO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}`
      dateRow.getCell(1).value = dateText
      dateRow.getCell(1).font = { size: 12, color: { argb: 'FF566573' } }
      dateRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.mergeCells(currentRow, 1, currentRow, headers.length)
      dateRow.height = 20
      currentRow++

      // Empty spacer row
      currentRow++

      // Header row
      const headerRow = worksheet.getRow(currentRow)
      headers.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1)
        cell.value = header
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4A90E2' } }
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFB0C4DE' } },
          bottom: { style: 'medium', color: { argb: 'FF4682B4' } },
          left: { style: 'thin', color: { argb: 'FFB0C4DE' } },
          right: { style: 'thin', color: { argb: 'FFB0C4DE' } }
        }
      })
      headerRow.height = 35
      currentRow++

      let currentWeek: number | null = null

      // Data rows
      preview.forEach((day, index) => {
        const weekNumber = getISOWeek(day.actualDate)
        const isNewWeek = currentWeek !== weekNumber
        currentWeek = weekNumber

        let isLastDayOfWeek = false
        if (index < preview.length - 1) {
          const nextDay = preview[index + 1]
          isLastDayOfWeek = weekNumber !== getISOWeek(nextDay.actualDate)
        } else {
          isLastDayOfWeek = true
        }

        const dataRow = worksheet.getRow(currentRow)
        const rowFill = index % 2 === 0 ? 'FFFFFFFF' : 'FFF8F9FA'

        // Week column
        const weekCell = dataRow.getCell(1)
        weekCell.value = isNewWeek ? `W${weekNumber}` : ''
        weekCell.font = { bold: true, size: 11 }
        weekCell.alignment = { horizontal: 'center', vertical: 'middle' }
        weekCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowFill } }

        // Date column
        const dateCell = dataRow.getCell(2)
        dateCell.value = day.date
        dateCell.font = { size: 10 }
        dateCell.alignment = { horizontal: 'center', vertical: 'middle' }
        dateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowFill } }

        // Day column
        const dayCell = dataRow.getCell(3)
        dayCell.value = day.dayName
        dayCell.font = { size: 10, bold: true }
        dayCell.alignment = { horizontal: 'center', vertical: 'middle' }
        dayCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowFill } }

        // Room columns - separate main and side practitioners
        day.rooms.forEach((room, roomIndex) => {
          const mainCellIndex = 4 + (roomIndex * 2)
          const sideCellIndex = 4 + (roomIndex * 2) + 1

          const mainCell = dataRow.getCell(mainCellIndex)
          const sideCell = dataRow.getCell(sideCellIndex)

          // Handle main practitioner
          if (room.shifts && room.shifts.length > 0) {
            const mainShifts = room.shifts.filter(s => s.main).map(s => s.main)
            if (mainShifts.length > 0) {
              const shift = mainShifts[0] // Use first main shift
              mainCell.value = `👨‍⚕️ ${shift.name}\n⏰ ${shift.time}`

              const bgColor = 'FF' + (shift.color || '#1976d2').replace('#', '').toUpperCase()
              mainCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }

              const fontColor = getContrastYIQ(bgColor.slice(2))
              mainCell.font = { color: { argb: 'FF' + fontColor }, size: 9, bold: true }
            } else {
              mainCell.value = 'Fără atribuire'
              mainCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } }
              mainCell.font = { color: { argb: 'FF666666' }, size: 9, italic: true }
            }
          } else {
            // Fallback to legacy format
            if (room.main) {
              mainCell.value = `👨‍⚕️ ${room.main.name}\n⏰ ${room.main.time}`

              const bgColor = 'FF' + (room.main.color || '#1976d2').replace('#', '').toUpperCase()
              mainCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }

              const fontColor = getContrastYIQ(bgColor.slice(2))
              mainCell.font = { color: { argb: 'FF' + fontColor }, size: 9, bold: true }
            } else {
              mainCell.value = 'Fără atribuire'
              mainCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } }
              mainCell.font = { color: { argb: 'FF666666' }, size: 9, italic: true }
            }
          }

          // Handle side practitioner
          if (room.shifts && room.shifts.length > 0) {
            const sideShifts = room.shifts.filter(s => s.side).map(s => s.side)
            if (sideShifts.length > 0) {
              const shift = sideShifts[0] // Use first side shift
              sideCell.value = `👩‍⚕️ ${shift.name}\n⏰ ${shift.time}`

              const bgColor = 'FF' + (shift.color || '#388e3c').replace('#', '').toUpperCase()
              sideCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }

              const fontColor = getContrastYIQ(bgColor.slice(2))
              sideCell.font = { color: { argb: 'FF' + fontColor }, size: 9, bold: true }
            } else {
              sideCell.value = 'Fără atribuire'
              sideCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } }
              sideCell.font = { color: { argb: 'FF666666' }, size: 9, italic: true }
            }
          } else {
            // Fallback to legacy format
            if (room.side) {
              sideCell.value = `👩‍⚕️ ${room.side.name}\n⏰ ${room.side.time}`

              const bgColor = 'FF' + (room.side.color || '#388e3c').replace('#', '').toUpperCase()
              sideCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }

              const fontColor = getContrastYIQ(bgColor.slice(2))
              sideCell.font = { color: { argb: 'FF' + fontColor }, size: 9, bold: true }
            } else {
              sideCell.value = 'Fără atribuire'
              sideCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } }
              sideCell.font = { color: { argb: 'FF666666' }, size: 9, italic: true }
            }
          }

          // Set alignment and borders for both cells
          [mainCell, sideCell].forEach(cell => {
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
              bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
              left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
              right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
            }
          })
        })

        // Alți angajați column
        const otherWorkersCell = dataRow.getCell(4 + (roomCount * 2))
        if (day.otherWorkers.length > 0) {
          // If multiple workers, show them separately or use first one's color
          const workerTexts = day.otherWorkers.map(w => `👤 ${w.name}\n⏰ ${w.time}`)
          otherWorkersCell.value = workerTexts.join('\n\n')

          // Use first worker's color
          const firstWorkerColor = day.otherWorkers[0].color
          const bgColor = 'FF' + (firstWorkerColor || '#7b1fa2').replace('#', '').toUpperCase()
          otherWorkersCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }

          const fontColor = getContrastYIQ(bgColor.slice(2))
          otherWorkersCell.font = { color: { argb: 'FF' + fontColor }, size: 9, bold: true }
        } else {
          otherWorkersCell.value = 'Niciunul'
          otherWorkersCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } }
          otherWorkersCell.font = { color: { argb: 'FF666666' }, size: 9, italic: true }
        }

        otherWorkersCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
        otherWorkersCell.border = {
          top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
        }

        // Add borders to date columns
        for (let col = 1; col <= 3; col++) {
          const cell = dataRow.getCell(col)
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
          }
        }

        dataRow.height = 60 // Increased height for better text display
        currentRow++

        // Add week separator
        if (isLastDayOfWeek && index < preview.length - 1) {
          const separatorRow = worksheet.getRow(currentRow)
          for (let col = 1; col <= headers.length; col++) {
            const cell = separatorRow.getCell(col)
            cell.border = {
              bottom: { style: 'medium', color: { argb: 'FF4682B4' } }
            }
          }
          separatorRow.height = 8
          currentRow++
        }
      })

      // Set column widths - increased for better display
      const columnWidths = [10, 18, 18] // Week, Date, Day (increased)
      for (let i = 0; i < roomCount; i++) {
        columnWidths.push(25) // Main practitioner (increased)
        columnWidths.push(25) // Side practitioner (increased)
      }
      columnWidths.push(35) // Other workers (increased)

      columnWidths.forEach((width, index) => {
        worksheet.getColumn(index + 1).width = width
      })

      // Generate and download the file
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `clinic-schedule-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast({
        title: '✨ Succes!',
        description: 'Programul colorat a fost exportat cu coloane separate pentru practicieni!',
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: 'Export eșuat',
        description: 'Exportul programului a eșuat. Încercați din nou.',
        variant: 'destructive'
      })
    }
  }

  const handlePrintSchedule = () => {
    window.print()
  }

  const handleEditSpecificDay = () => {
    // For now, just show a toast - this would open a modal to edit specific days
    toast({ title: 'În curând', description: 'Editarea zilelor specifice va fi disponibilă în curând' })
  }

  // Helper to determine default start/end given room/practitioner context and date
  const computeDefaultTimes = useCallback((roomNumber?: number, practitionerId?: string) => {
    let defaultStart = defaultWorkingHours.start
    let defaultEnd = defaultWorkingHours.end

    if (roomNumber) {
      const assignment = roomAssignments[roomNumber - 1]
      if (assignment) {
        defaultStart = assignment.startTime
        defaultEnd = assignment.endTime
      }
    }

    if (practitionerId) {
      const workerEntry = otherWorkers.find(w => w.practitionerId === practitionerId)
      if (workerEntry) {
        defaultStart = workerEntry.startTime
        defaultEnd = workerEntry.endTime
      } else {
        const assignmentForPract = roomAssignments.find(a => a.mainPractitioner === practitionerId || a.sidePractitioner === practitionerId)
        if (assignmentForPract) {
          defaultStart = assignmentForPract.startTime
          defaultEnd = assignmentForPract.endTime
        }
      }
    }

    // If there is an override for this exact date + context, use that
    return { defaultStart, defaultEnd }
  }, [defaultWorkingHours, roomAssignments, otherWorkers])

  const handleDayRightClick = useCallback((date: Date, roomNumber?: number, practitionerId?: string) => {
    const { defaultStart, defaultEnd } = computeDefaultTimes(roomNumber, practitionerId)

    // Determine practitioner if not explicitly provided (use main practitioner by default)
    let effectivePractitionerId = practitionerId
    if (!effectivePractitionerId && roomNumber) {
      const assignment = roomAssignments[roomNumber - 1]
      if (assignment) {
        effectivePractitionerId = assignment.mainPractitioner || assignment.sidePractitioner
      }
    }

    setDayOverrideModal({
      isOpen: true,
      selectedDate: date,
      selectedRoomNumber: roomNumber,
      selectedPractitionerId: effectivePractitionerId,
      initialStartTime: defaultStart,
      initialEndTime: defaultEnd,
    })
  }, [computeDefaultTimes])

  const handleOverrideCreated = useCallback(() => {
    // Refresh the schedule data
    fetchActiveSchedule()
    // Could also fetch specific overrides here if needed
  }, [])

  const handleDayOfWeekRightClick = useCallback((dayOfWeek: string, roomNumber?: number, practitionerId?: string) => {
    // Determine default hours based on current assignments
    const { defaultStart, defaultEnd } = computeDefaultTimes(roomNumber, practitionerId)

    setDayOfWeekOverrideModal({
      isOpen: true,
      selectedDayOfWeek: dayOfWeek,
      selectedRoomNumber: roomNumber,
      selectedPractitionerId: practitionerId,
      initialStartTime: defaultStart,
      initialEndTime: defaultEnd,
    })
  }, [computeDefaultTimes])

  const handleDayOfWeekOverrideCreated = useCallback(() => {
    // Refresh the schedule data
    fetchActiveSchedule()
    // Could also refresh room assignments here if needed
  }, [])

  const getDayContextMenuItems = useCallback((date: Date, roomNumber?: number, practitionerId?: string) => [
    {
      label: 'Setează ore personalizate',
      icon: <Clock className="h-4 w-4" />,
      onClick: () => handleDayRightClick(date, roomNumber, practitionerId)
    },
    {
      label: 'Marchează indisponibil',
      icon: <UserX className="h-4 w-4" />,
      onClick: () => {
        const { defaultStart, defaultEnd } = computeDefaultTimes(roomNumber, practitionerId)
        setDayOverrideModal({
          isOpen: true,
          selectedDate: date,
          selectedRoomNumber: roomNumber,
          selectedPractitionerId: practitionerId,
          initialStartTime: defaultStart,
          initialEndTime: defaultEnd,
        })
      }
    }
  ], [computeDefaultTimes])

  const getDayOfWeekContextMenuItems = useCallback((dayOfWeek: string, roomNumber?: number, practitionerId?: string) => [
    {
      label: `Setează orele pentru ${dayOfWeek}`,
      icon: <Clock className="h-4 w-4" />,
      onClick: () => handleDayOfWeekRightClick(dayOfWeek, roomNumber, practitionerId)
    },
    {
      label: `${dayOfWeek} indisponibil`,
      icon: <UserX className="h-4 w-4" />,
      onClick: () => {
        const { defaultStart, defaultEnd } = computeDefaultTimes(roomNumber, practitionerId)
        setDayOfWeekOverrideModal({
          isOpen: true,
          selectedDayOfWeek: dayOfWeek,
          selectedRoomNumber: roomNumber,
          selectedPractitionerId: practitionerId,
          initialStartTime: defaultStart,
          initialEndTime: defaultEnd,
        })
      }
    }
  ], [computeDefaultTimes])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': case 'ALTERNATIVE_ACCEPTED': return 'bg-green-500'
      case 'DENIED': case 'ALTERNATIVE_REJECTED': case 'CANCELLED': return 'bg-red-500'
      case 'PENDING': case 'ALTERNATIVE_PROPOSED': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  const getRoleColor = (role: string) => {
    const roleColors: { [key: string]: string } = {
      ORGANIZATION_OWNER: 'bg-purple-500',
      MANAGER: 'bg-blue-500',
      PLASTIC_SURGEON: 'bg-green-500',
      SURGEON: 'bg-teal-500',
      NURSE: 'bg-indigo-500',
      RECEPTIONIST: 'bg-pink-500',
      ASSISTANT: 'bg-orange-500',
      ANESTHESIOLOGIST: 'bg-emerald-500',
      AESTHETIC_NURSE: 'bg-cyan-500',
      MEDICAL_ASSISTANT: 'bg-yellow-500',
      COUNSELOR: 'bg-violet-500',
      PHOTOGRAPHER: 'bg-rose-500',
    }
    return roleColors[role] || 'bg-gray-500'
  }

  const formatRole = (role: string) => {
    const roleLabels: Record<string, string> = {
      ORGANIZATION_OWNER: 'Proprietar organizație',
      MANAGER: 'Manager',
      PLASTIC_SURGEON: 'Chirurg plastician',
      SURGEON: 'Chirurg',
      NURSE: 'Asistent medical',
      RECEPTIONIST: 'Recepționer',
      ASSISTANT: 'Asistent',
      ANESTHESIOLOGIST: 'Anestezist',
      AESTHETIC_NURSE: 'Asistent estetic',
      MEDICAL_ASSISTANT: 'Asistent medical',
      COUNSELOR: 'Consilier',
      PHOTOGRAPHER: 'Fotograf',
    }
    return roleLabels[role] ?? role
  }

  const formatLeaveType = (type: string) => {
    const leaveTypeLabels: Record<string, string> = {
      VACATION: 'Concediu de odihnă',
      SICK_LEAVE: 'Concediu medical',
      PERSONAL: 'Concediu personal',
      MATERNITY: 'Concediu de maternitate',
      PATERNITY: 'Concediu de paternitate',
      BEREAVEMENT: 'Concediu de deces',
      EMERGENCY: 'Urgență',
      UNPAID: 'Concediu fără plată',
      COMPENSATORY: 'Concediu compensatoriu',
      STUDY: 'Concediu de studii',
      OTHER: 'Altele',
    }
    return leaveTypeLabels[type] ?? type
  }

  const formatStatus = (status: string) => {
    const statusLabels: Record<string, string> = {
      PENDING: 'În așteptare',
      APPROVED: 'Aprobat',
      DENIED: 'Refuzat',
      CANCELLED: 'Anulat',
      ALTERNATIVE_PROPOSED: 'Alternativă propusă',
      ALTERNATIVE_ACCEPTED: 'Alternativă acceptată',
      ALTERNATIVE_REJECTED: 'Alternativă respinsă',
    }
    return statusLabels[status] ?? status
  }

  const formatEntityType = (entityType: string) => {
    const entityTypeLabels: Record<string, string> = {
      APPOINTMENT: 'Programări',
      PATIENT: 'Pacienți',
      TASK: 'Sarcini',
      USER: 'Utilizatori',
      DENTAL_CHART: 'Fișe dentare',
      NOTE: 'Notițe',
    }
    return entityTypeLabels[entityType] ?? entityType
  }

  const formatSeverity = (severity: string) => {
    const severityLabels: Record<string, string> = {
      DEBUG: 'Depanare',
      INFO: 'Informare',
      WARN: 'Avertisment',
      ERROR: 'Eroare',
      CRITICAL: 'Critic',
    }
    return severityLabels[severity] ?? severity
  }

  // Utility function to darken a hex color
  const darkenColor = (color: string, amount: number = 0.3): string => {
    if (!color || !color.startsWith('#')) return color

    // Remove the hash and convert to RGB
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)

    // Darken by reducing each component
    const darkenedR = Math.round(r * (1 - amount))
    const darkenedG = Math.round(g * (1 - amount))
    const darkenedB = Math.round(b * (1 - amount))

    // Convert back to hex
    const toHex = (n: number) => n.toString(16).padStart(2, '0')
    return `#${toHex(darkenedR)}${toHex(darkenedG)}${toHex(darkenedB)}`
  }

  // Jurnale de activitate functions
  const fetchLogs = async (page = 1, filters = logFilters) => {
    setLogsLoading(true)
    try {
      // Convert "all" values to empty strings for API
      const apiFilters = Object.fromEntries(
        Object.entries(filters).map(([key, value]) => [
          key,
          value === 'all' ? '' : value
        ])
      )

      const params = new URLSearchParams({
        limit: '50',
        offset: ((page - 1) * 50).toString(),
        ...Object.fromEntries(Object.entries(apiFilters).filter(([_, value]) => value))
      })

      const response = await fetch(`/api/logs?${params}`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs)
        setLogsTotalPages(data.totalPages)
        setLogsPage(page)
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
    } finally {
      setLogsLoading(false)
    }
  }

  const handleLogFilterChange = (filterName: string, value: string) => {
    const newFilters = { ...logFilters, [filterName]: value }
    setLogFilters(newFilters)
    fetchLogs(1, newFilters)
  }

  const handleDownloadLogs = async () => {
    try {
      // Convert "all" values to empty strings for API
      const apiFilters = Object.fromEntries(
        Object.entries(logFilters).map(([key, value]) => [
          key,
          value === 'all' ? '' : value
        ])
      )

      const params = new URLSearchParams(
        Object.fromEntries(Object.entries(apiFilters).filter(([_, value]) => value))
      )

      const response = await fetch(`/api/logs/download?${params}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)

        toast({
          title: 'Succes',
          description: 'Jurnalele au fost descărcate cu succes.',
        })
      }
    } catch (error) {
      console.error('Error downloading logs:', error)
      toast({
        title: 'Eroare',
        description: 'Descărcarea jurnalelor a eșuat.',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteLogs = async (logIds?: string[]) => {
    try {
      const params = new URLSearchParams()
      if (logIds && logIds.length > 0) {
        params.set('ids', logIds.join(','))
      } else {
        params.set('deleteAll', 'true')
        params.set('beforeDate', new Date().toISOString())
      }

      const response = await fetch(`/api/logs?${params}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: 'Succes',
          description: data.message,
        })
        fetchLogs(logsPage)
        setSelectedLogs([])
        setDeleteLogsDialog(false)
      }
    } catch (error) {
      console.error('Error deleting logs:', error)
      toast({
        title: 'Eroare',
        description: 'Ștergerea jurnalelor a eșuat.',
        variant: 'destructive',
      })
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'DEBUG': return 'bg-gray-100 text-gray-800'
      case 'INFO': return 'bg-blue-100 text-blue-800'
      case 'WARN': return 'bg-yellow-100 text-yellow-800'
      case 'ERROR': return 'bg-red-100 text-red-800'
      case 'CRITICAL': return 'bg-red-200 text-red-900'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return 'bg-green-100 text-green-800'
    if (action.includes('UPDATE') || action.includes('EDIT')) return 'bg-blue-100 text-blue-800'
    if (action.includes('DELETE') || action.includes('REMOVE')) return 'bg-red-100 text-red-800'
    if (action.includes('LOGIN') || action.includes('LOGOUT')) return 'bg-purple-100 text-purple-800'
    if (action.includes('VIEW') || action.includes('ACCESS')) return 'bg-gray-100 text-gray-800'
    return 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Panou manager</h1>
          <p className="mt-1 text-sm text-gray-500">
            Prezentare completă și gestionarea organizației dvs.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/manager/time-clock">
              <Clock className="h-4 w-4 mr-2" />
              Pontaj
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAllData()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reîmprospătează datele
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Prezentare generală</TabsTrigger>
          <TabsTrigger value="users">Gestionare utilizatori</TabsTrigger>
          <TabsTrigger value="leave-requests">Cereri de concediu</TabsTrigger>
          <TabsTrigger value="calendar-planning">Planificare calendar</TabsTrigger>
          <TabsTrigger value="logs">Jurnale de activitate</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Panou analitice</h2>
              <p className="text-sm text-gray-500">Prezentare generală cu analize în timp real, statistici și spațiu de lucru personal</p>
            </div>
            <Select value={analyticsFilter} onValueChange={(value) => {
              setAnalyticsFilter(value)
              fetchAnalytics()
            }}>
              <SelectTrigger className="w-[180px] border-2 border-blue-200 hover:border-blue-300 transition-colors">
                <SelectValue placeholder="Selectați perioada" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Săptămâna aceasta</SelectItem>
                <SelectItem value="month">Luna aceasta</SelectItem>
                <SelectItem value="quarter">Trimestrul acesta</SelectItem>
                <SelectItem value="year">Anul acesta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {analytics && (
            <>
              {/* Key Performance Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between text-white">
                        <div>
                          <p className="text-sm font-medium text-blue-100">Pacienți activi</p>
                          <p className="text-3xl font-bold">{analytics.summary.activePatients}</p>
                          <p className="text-xs text-blue-200 flex items-center mt-1">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            +{analytics.summary.newPatientsThisPeriod} noi {analyticsFilter === "week" ? "săptămâna aceasta" : analyticsFilter === "month" ? "luna aceasta" : analyticsFilter === "quarter" ? "trimestrul acesta" : "anul acesta"}
                          </p>
                        </div>
                        <div className="p-3 bg-white/20 rounded-full backdrop-blur">
                          <Users className="h-8 w-8 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Card className="bg-gradient-to-br from-green-500 to-emerald-600 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between text-white">
                        <div>
                          <p className="text-sm font-medium text-green-100">Venituri {analyticsFilter === "week" ? "săptămâna aceasta" : analyticsFilter === "month" ? "luna aceasta" : analyticsFilter === "quarter" ? "trimestrul acesta" : "anul acesta"}</p>
                          <p className="text-3xl font-bold">${analytics.summary.revenueThisPeriod?.toLocaleString() || '0'}</p>
                          <p className="text-xs text-green-200 flex items-center mt-1">
                            {analytics.summary.revenueThisPeriod > analytics.summary.revenueAnteriorPeriod ? (
                              <TrendingUp className="h-3 w-3 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 mr-1" />
                            )}
                            {analytics.summary.revenueAnteriorPeriod > 0
                              ? `${((analytics.summary.revenueThisPeriod - analytics.summary.revenueAnteriorPeriod) / analytics.summary.revenueAnteriorPeriod * 100).toFixed(1)}%`
                              : 'Nou'
                            } față de {analyticsFilter === "week" ? "săptămâna anterioară" : analyticsFilter === "month" ? "luna anterioară" : analyticsFilter === "quarter" ? "trimestrul anterior" : "anul anterior"}
                          </p>
                        </div>
                        <div className="p-3 bg-white/20 rounded-full backdrop-blur">
                          <BarChart3 className="h-8 w-8 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between text-white">
                        <div>
                          <p className="text-sm font-medium text-purple-100">Programări</p>
                          <p className="text-3xl font-bold">{analytics.summary.totalAppointments}</p>
                          <p className="text-xs text-purple-200 mt-1">{analyticsFilter === "week" ? "Săptămâna aceasta" : analyticsFilter === "month" ? "Luna aceasta" : analyticsFilter === "quarter" ? "Trimestrul acesta" : "Anul acesta"}</p>
                        </div>
                        <div className="p-3 bg-white/20 rounded-full backdrop-blur">
                          <Calendar className="h-8 w-8 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <Card className="bg-gradient-to-br from-orange-500 to-red-500 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between text-white">
                        <div>
                          <p className="text-sm font-medium text-orange-100">Eficiență personal</p>
                          <p className="text-3xl font-bold">94%</p>
                          <p className="text-xs text-orange-200 flex items-center mt-1">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            +2,1% îmbunătățire
                          </p>
                        </div>
                        <div className="p-3 bg-white/20 rounded-full backdrop-blur">
                          <CheckCircle className="h-8 w-8 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Main Dashboard Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* Analytics Charts - 3/4 width */}
                <div className="lg:col-span-3 space-y-6">

                  {/* Tendințe venituri organizație */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Card className="shadow-lg border-0 bg-white">
                      <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b">
                        <CardTitle className="flex items-center gap-2 text-xl">
                          <div className="p-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg">
                            <BarChart3 className="h-5 w-5 text-white" />
                          </div>
                          Tendințe venituri organizație
                        </CardTitle>
                        <CardDescription className="text-gray-600">Venitul total din toate procedurile și serviciile organizației</CardDescription>
                      </CardHeader>
                      <CardContent className="p-6">
                        <ResponsiveContainer width="100%" height={320}>
                          <AreaChart data={analytics.revenueTrends || []}>
                            <defs>
                              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                              </linearGradient>
                              <linearGradient id="appointmentGradient2" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis
                              dataKey="date"
                              stroke="#666"
                              fontSize={12}
                              tick={{ fill: '#666' }}
                            />
                            <YAxis
                              yAxisId="revenue"
                              orientation="left"
                              stroke="#10b981"
                              fontSize={12}
                              tick={{ fill: '#10b981' }}
                              tickFormatter={(value) => `$${value.toLocaleString()}`}
                            />
                            <YAxis
                              yAxisId="appointments"
                              orientation="right"
                              stroke="#3b82f6"
                              fontSize={12}
                              tick={{ fill: '#3b82f6' }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '12px',
                                boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1)'
                              }}
                              formatter={(value, name) => [
                                name === 'revenue' ? `$${Number(value).toLocaleString()}` : value,
                                name === 'revenue' ? 'Venituri' : 'Programări'
                              ]}
                            />
                            <Legend />
                            <Area
                              yAxisId="revenue"
                              type="monotone"
                              dataKey="revenue"
                              stroke="#10b981"
                              fillOpacity={1}
                              fill="url(#revenueGradient)"
                              name="Venituri"
                              strokeWidth={3}
                            />
                            <Area
                              yAxisId="appointments"
                              type="monotone"
                              dataKey="appointments"
                              stroke="#3b82f6"
                              fillOpacity={1}
                              fill="url(#appointmentGradient2)"
                              name="Programări"
                              strokeWidth={2}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Charts Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Appointment Status Pie Chart */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                    >
                      <Card className="shadow-lg border-0 bg-white">
                        <CardHeader className="bg-gradient-to-r from-pink-50 to-orange-50 border-b">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <div className="p-2 bg-gradient-to-r from-pink-500 to-orange-500 rounded-lg">
                              <BarChart3 className="h-4 w-4 text-white" />
                            </div>
                            Status programări
                          </CardTitle>
                          <CardDescription>Distribuția statusurilor programărilor</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                          <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                              <Pie
                                data={analytics.appointmentsByStatus}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="count"
                                stroke="#fff"
                                strokeWidth={2}
                              >
                                {analytics.appointmentsByStatus.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: '#fff',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </motion.div>

                    {/* User Activity Status */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                    >
                      <Card className="shadow-lg border-0 bg-white">
                        <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 border-b">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <div className="p-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg">
                              <Users className="h-4 w-4 text-white" />
                            </div>
                            Status activitate utilizatori
                          </CardTitle>
                          <CardDescription>Defalcare utilizatori activi vs. inactivi</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                          <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                              <Pie
                                data={[
                                  {
                                    name: 'Utilizatori activi',
                                    value: analytics.userActivity?.activeUsers || analytics.summary.activeUsers,
                                    percentage: analytics.userActivity?.activePercentage || Math.round((analytics.summary.activeUsers / analytics.summary.totalUsers) * 100)
                                  },
                                  {
                                    name: 'Utilizatori inactivi',
                                    value: analytics.userActivity?.inactiveUsers || (analytics.summary.totalUsers - analytics.summary.activeUsers),
                                    percentage: analytics.userActivity?.inactivePercentage || Math.round(((analytics.summary.totalUsers - analytics.summary.activeUsers) / analytics.summary.totalUsers) * 100)
                                  }
                                ]}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percentage }) => `${name}: ${percentage}%`}
                                outerRadius={90}
                                fill="#8884d8"
                                dataKey="value"
                                stroke="#fff"
                                strokeWidth={3}
                              >
                                <Cell fill="#10b981" />
                                <Cell fill="#ef4444" />
                              </Pie>
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: '#fff',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                                formatter={(value, name) => [
                                  `${value} utilizatori (${name === 'Utilizatori activi' ?
                                    analytics.userActivity?.activePercentage || Math.round((analytics.summary.activeUsers / analytics.summary.totalUsers) * 100) :
                                    analytics.userActivity?.inactivePercentage || Math.round(((analytics.summary.totalUsers - analytics.summary.activeUsers) / analytics.summary.totalUsers) * 100)
                                  }%)`,
                                  name
                                ]}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="flex justify-center mt-4 space-x-6">
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                              <span className="text-sm font-medium">Activi ({analytics.summary.activeUsers})</span>
                            </div>
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                              <span className="text-sm font-medium">Inactivi ({analytics.summary.totalUsers - analytics.summary.activeUsers})</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>

                  {/* Cei mai performanți */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    <Card className="shadow-lg border-0 bg-white">
                      <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <div className="p-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg">
                            <TrendingUp className="h-4 w-4 text-white" />
                          </div>
                          Cei mai performanți {analyticsFilter === "week" ? "Săptămâna aceasta" : analyticsFilter === "month" ? "Luna aceasta" : analyticsFilter === "quarter" ? "Trimestrul acesta" : "Anul acesta"}
                        </CardTitle>
                        <CardDescription>Cei mai productivi membri ai echipei</CardDescription>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {analytics.topPractitioners.slice(0, 5).map((practitioner, index) => (
                            <div key={practitioner.practitionerId} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-100 hover:shadow-md transition-all duration-200">
                              <div className="flex items-center space-x-4">
                                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm ${index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white' :
                                  index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white' :
                                    index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white' :
                                      'bg-gradient-to-r from-blue-400 to-blue-500 text-white'
                                  }`}>
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">{practitioner.practitionerName}</p>
                                  <p className="text-sm text-gray-500">{formatRole(practitioner.practitionerRole)}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-gray-900">{practitioner.appointmentCount}</p>
                                <p className="text-xs text-gray-500">programări</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* Manager Personal Section - 1/4 width */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="lg:col-span-1"
                >
                  <Card className="h-full shadow-xl border-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
                    <CardHeader className="border-b bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
                      <CardTitle className="flex items-center gap-2">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur">
                          <MessageSquare className="h-5 w-5" />
                        </div>
                        Spațiu de lucru manager
                        {notesLoading && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        )}
                      </CardTitle>
                      <CardDescription className="text-indigo-100">
                        Notițe private și linkuri rapide — salvate automat
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">

                      {/* Personal Notițe */}
                      <div>
                        <Label className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <Edit2 className="h-4 w-4" />
                          Notițe rapide
                        </Label>
                        <Textarea
                          value={personalNotițe}
                          onChange={(e) => setPersonalNotițe(e.target.value)}
                          placeholder="Notițe private... se salvează automat pe măsură ce scrieți!"
                          className="min-h-[140px] bg-white border-2 border-indigo-200 focus:border-indigo-400 focus:ring-indigo-400 rounded-lg shadow-sm resize-none"
                        />
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-xs text-green-600 font-medium">Se salvează automat</span>
                          </div>
                        </div>
                      </div>

                      {/* Linkuri rapide */}
                      <div>
                        <Label className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="h-auto p-0">
                            <CalendarDays className="h-4 w-4" />
                          </Button>
                          Linkuri rapide
                        </Label>

                        {/* Add New Link */}
                        <div className="space-y-3 mb-4 p-3 bg-white rounded-lg border-2 border-dashed border-indigo-200">
                          <Input
                            value={newLinkTitle}
                            onChange={(e) => setNewLinkTitle(e.target.value)}
                            placeholder="Titlul linkului..."
                            className="bg-white border-indigo-200 focus:border-indigo-400"
                          />
                          <div className="flex gap-2">
                            <Input
                              value={newLinkUrl}
                              onChange={(e) => setNewLinkUrl(e.target.value)}
                              placeholder="https://..."
                              className="flex-1 bg-white border-indigo-200 focus:border-indigo-400"
                            />
                            <Button
                              size="sm"
                              onClick={addPersonalLink}
                              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Links List */}
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {personalLinks.map((link) => (
                            <div key={link.id} className="p-3 bg-white rounded-lg border border-indigo-100 shadow-sm hover:shadow-md transition-all duration-200">
                              {editingLinkId === link.id ? (
                                <div className="space-y-2">
                                  <Input
                                    value={link.title}
                                    onChange={(e) => setPersonalLinks(prev =>
                                      prev.map(l => l.id === link.id ? { ...l, title: e.target.value } : l)
                                    )}
                                    className="text-sm h-8"
                                  />
                                  <Input
                                    value={link.url}
                                    onChange={(e) => setPersonalLinks(prev =>
                                      prev.map(l => l.id === link.id ? { ...l, url: e.target.value } : l)
                                    )}
                                    className="text-sm h-8"
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => updatePersonalLink(link.id, link.title, link.url)}
                                      className="h-7 px-3 text-xs bg-green-600 hover:bg-green-700"
                                    >
                                      Salvează
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setEditingLinkId(null)}
                                      className="h-7 px-3 text-xs"
                                    >
                                      Anulează
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between">
                                  <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 text-sm font-medium text-indigo-700 hover:text-indigo-900 truncate hover:underline"
                                    title={link.url}
                                  >
                                    {link.title}
                                  </a>
                                  <div className="flex gap-1 ml-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setEditingLinkId(link.id)}
                                      className="h-7 w-7 p-0 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                                    >
                                      <Edit2 className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => deletePersonalLink(link.id)}
                                      className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                          {personalLinks.length === 0 && (
                            <div className="text-center py-6">
                              <CalendarDays className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                              <p className="text-sm text-gray-500">
                                Niciun link rapid încă.<br />Adăugați unul mai sus!
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Activitate recentă */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <Card className="shadow-lg border-0 bg-white">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <div className="p-2 bg-gradient-to-r from-gray-500 to-blue-500 rounded-lg">
                        <Clock className="h-5 w-5 text-white" />
                      </div>
                      Activitate recentă
                    </CardTitle>
                    <CardDescription>Ultimele actualizări și notificări din organizația dvs.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {analytics.recentActivity.leaveRequests.slice(0, 5).map((request: any) => (
                        <div key={request.id} className="flex items-center space-x-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-100 hover:shadow-md transition-all duration-200">
                          <div className="p-3 bg-gradient-to-r from-orange-400 to-red-400 rounded-full">
                            <Calendar className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">
                              {request.userName} a solicitat {formatLeaveType(request.leaveType)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className={`${getStatusColor(request.status)} text-white`}>
                            {formatStatus(request.status)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}
        </TabsContent>

        {/* User Management Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Gestionare utilizatori</h2>
              <p className="text-sm text-gray-500">Gestionați utilizatorii din organizația dvs.</p>
            </div>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Adaugă utilizator
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilizator</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Stare</TableHead>
                    <TableHead>Statistici</TableHead>
                    <TableHead>Ultima autentificare</TableHead>
                    <TableHead className="text-right">Acțiuni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(users || []).map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {user.firstName[0]}{user.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.firstName} {user.lastName}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(user.role)}>
                          {formatRole(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <Mail className="h-3 w-3 mr-1" />
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="flex items-center text-sm">
                              <Phone className="h-3 w-3 mr-1" />
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {user.isDisabled ? (
                            <Badge variant="destructive">Dezactivat</Badge>
                          ) : user.isActive ? (
                            <Badge variant="default">Activ</Badge>
                          ) : (
                            <Badge variant="secondary">Inactiv</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          <div>Programări: {user._count.appointments}</div>
                          <div>Sarcini: {user._count.createdTasks}</div>
                          <div>Cereri de concediu: {user._count.leaveRequests}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.lastLoginAt ? (
                          <div className="text-sm">
                            {new Date(user.lastLoginAt).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Niciodată</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          {user.isDisabled ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setUserActionDialog({ isOpen: true, action: 'ENABLE', user })}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setUserActionDialog({ isOpen: true, action: 'DISABLE', user })}
                            >
                              <EyeOff className="h-4 w-4" />
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Șterge User</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Sigur doriți să ștergeți pe {user.firstName} {user.lastName}? Această acțiune nu poate fi anulată.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Anulează</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleUserAction(user.id, 'DELETE')}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Șterge
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>



        {/* Cereri de concediu Tab */}
        <TabsContent value="leave-requests" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Gestionare cereri de concediu</h2>
              <p className="text-sm text-gray-500">Revizuiți și gestionați cererile de concediu ale angajaților</p>
            </div>
            <div className="flex items-center space-x-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrați după status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate cererile</SelectItem>
                  <SelectItem value="pending">În așteptare</SelectItem>
                  <SelectItem value="approved">Aprobat</SelectItem>
                  <SelectItem value="denied">Refuzat</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Angajat</TableHead>
                    <TableHead>Tip concediu</TableHead>
                    <TableHead>Perioadă</TableHead>
                    <TableHead>Durată</TableHead>
                    <TableHead>Stare</TableHead>
                    <TableHead>Trimis</TableHead>
                    <TableHead className="text-right">Acțiuni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {request.user.firstName[0]}{request.user.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{request.user.firstName} {request.user.lastName}</p>
                            <p className="text-sm text-gray-500">{formatRole(request.user.role)}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {formatLeaveType(request.leaveType)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{new Date(request.startDate).toLocaleDateString()}</div>
                          <div className="text-gray-500">până la {new Date(request.endDate).toLocaleDateString()}</div>
                          {request.isPartialDay && (
                            <div className="text-xs text-blue-600">
                              {request.startTime} - {request.endTime}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">{request.totalDays} {request.totalDays === 1 ? 'zi' : 'zile'}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(request.status)}>
                          {formatStatus(request.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedLeaveRequest(request)
                              setLeaveActionDialog(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {request.status === 'PENDING' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleLeaveRequestAction(request.id, 'APPROVE', { reviewComentarii: 'Aprobat' })}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleLeaveRequestAction(request.id, 'DENY', { reviewComentarii: 'Respins' })}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {['APPROVED', 'ALTERNATIVE_ACCEPTED'].includes(request.status) && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleLeaveCancel(request.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Jurnale de activitate Tab */}
        <TabsContent value="logs" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Jurnale de activitate</h2>
              <p className="text-sm text-gray-500">Jurnal complet de audit al tuturor activităților din sistem</p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleDownloadLogs}>
                <Download className="h-4 w-4 mr-2" />
                Descarcă CSV
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteLogsDialog(true)}
                disabled={selectedLogs.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Șterge selectate ({selectedLogs.length})
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="user-filter">Utilizator</Label>
                  <Select value={logFilters.userId} onValueChange={(value) => handleLogFilterChange('userId', value === 'all' ? '' : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Toți utilizatorii" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toți utilizatorii</SelectItem>
                      {(users || []).map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName} {user.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="action-filter">Acțiune</Label>
                  <Input
                    id="action-filter"
                    placeholder="Filtrați după acțiune"
                    value={logFilters.action}
                    onChange={(e) => handleLogFilterChange('action', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="entity-filter">Tip entitate</Label>
                  <Select value={logFilters.entityType} onValueChange={(value) => handleLogFilterChange('entityType', value === 'all' ? '' : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Toate tipurile" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toate tipurile</SelectItem>
                      <SelectItem value="APPOINTMENT">Programări</SelectItem>
                      <SelectItem value="PATIENT">Pacienți</SelectItem>
                      <SelectItem value="TASK">Sarcini</SelectItem>
                      <SelectItem value="USER">Utilizatori</SelectItem>
                      <SelectItem value="DENTAL_CHART">Fișe dentare</SelectItem>
                      <SelectItem value="NOTE">Notițe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="severity-filter">Severitate</Label>
                  <Select value={logFilters.severity} onValueChange={(value) => handleLogFilterChange('severity', value === 'all' ? '' : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Toate severitățile" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toate severitățile</SelectItem>
                      <SelectItem value="DEBUG">Depanare</SelectItem>
                      <SelectItem value="INFO">Informare</SelectItem>
                      <SelectItem value="WARN">Avertisment</SelectItem>
                      <SelectItem value="ERROR">Eroare</SelectItem>
                      <SelectItem value="CRITICAL">Critic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="start-date">Data început</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={logFilters.startDate}
                    onChange={(e) => handleLogFilterChange('startDate', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="end-date">Data sfârșit</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={logFilters.endDate}
                    onChange={(e) => handleLogFilterChange('endDate', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="page-filter">Pagină</Label>
                  <Input
                    id="page-filter"
                    placeholder="Filtrați după pagină"
                    value={logFilters.page}
                    onChange={(e) => handleLogFilterChange('page', e.target.value)}
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setLogFilters({
                        userId: 'all',
                        action: '',
                        entityType: 'all',
                        page: '',
                        severity: 'all',
                        startDate: '',
                        endDate: '',
                      })
                      fetchLogs(1, {
                        userId: '',
                        action: '',
                        entityType: '',
                        page: '',
                        severity: '',
                        startDate: '',
                        endDate: '',
                      })
                    }}
                  >
                    Șterge filtrele
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logs Table */}
          <Card>
            <CardContent className="p-0">
              {logsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <div className="flex items-center">
                          {selectedLogs.length === logs.length && logs.length > 0 ? (
                            <CheckSquare
                              className="h-4 w-4 cursor-pointer"
                              onClick={() => setSelectedLogs([])}
                            />
                          ) : (
                            <Square
                              className="h-4 w-4 cursor-pointer"
                              onClick={() => setSelectedLogs(logs.map(log => log.id))}
                            />
                          )}
                        </div>
                      </TableHead>
                      <TableHead>Marcaj temporal</TableHead>
                      <TableHead>Utilizator</TableHead>
                      <TableHead>Acțiune</TableHead>
                      <TableHead>Entitate</TableHead>
                      <TableHead>Descriere</TableHead>
                      <TableHead>Severitate</TableHead>
                      <TableHead>Pagină</TableHead>
                      <TableHead>Detalii</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center">
                            {selectedLogs.includes(log.id) ? (
                              <CheckSquare
                                className="h-4 w-4 cursor-pointer text-blue-600"
                                onClick={() => setSelectedLogs(selectedLogs.filter(id => id !== log.id))}
                              />
                            ) : (
                              <Square
                                className="h-4 w-4 cursor-pointer"
                                onClick={() => setSelectedLogs([...selectedLogs, log.id])}
                              />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{new Date(log.createdAt).toLocaleDateString()}</div>
                            <div className="text-gray-500">{new Date(log.createdAt).toLocaleTimeString()}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{log.user.firstName} {log.user.lastName}</div>
                            <div className="text-gray-500">{formatRole(log.user.role)}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getActionColor(log.action)}>
                            {log.action.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{formatEntityType(log.entityType)}</div>
                            {log.entityId && <div className="text-gray-500 truncate max-w-20">{log.entityId}</div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm max-w-60">
                            <div className="truncate">{log.description}</div>
                            {log.patient && (
                              <div className="text-gray-500">
                                Pacient: {log.patient.firstName} {log.patient.lastName}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getSeverityColor(log.severity)}>
                            {formatSeverity(log.severity)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-500 max-w-24 truncate">
                            {log.page || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {log.details && Object.keys(log.details).length > 0 && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <FileText className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Detalii jurnal</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label>Acțiune</Label>
                                    <p className="text-sm">{log.action}</p>
                                  </div>
                                  <div>
                                    <Label>Descriere</Label>
                                    <p className="text-sm">{log.description}</p>
                                  </div>
                                  <div>
                                    <Label>Adresă IP</Label>
                                    <p className="text-sm">{log.ipAddress || 'Necunoscut'}</p>
                                  </div>
                                  <div>
                                    <Label>Agent utilizator</Label>
                                    <p className="text-sm break-all">{log.userAgent || 'Necunoscut'}</p>
                                  </div>
                                  <div>
                                    <Label>Detalii suplimentare</Label>
                                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                                      {JSON.stringify(log.details, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {logsTotalPages > 1 && (
            <div className="flex justify-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchLogs(logsPage - 1)}
                disabled={logsPage === 1}
              >
                Anterior
              </Button>
              <span className="flex items-center px-4 text-sm">
                Pagina {logsPage} din {logsTotalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchLogs(logsPage + 1)}
                disabled={logsPage === logsTotalPages}
              >
                Următor
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Calendar Planning Tab */}
        <TabsContent value="calendar-planning" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">Planificare calendar</h2>
                {scheduleLoading && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                )}
                {activeSchedule && (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Program activ încărcat
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500">
                Configurați programul clinicii cu atribuiri de săli și programul angajaților
                {activeSchedule && (
                  <span className="ml-2 font-medium text-blue-600">
                    • Încărcat: {activeSchedule.name}
                  </span>
                )}
              </p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => handleExportSchedule()}>
                <Download className="h-4 w-4 mr-2" />
                Export în Excel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setResetScheduleDialog(true)}
                disabled={scheduleLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Resetează programul
              </Button>
              <Button onClick={() => handleSaveSchedule()} disabled={scheduleLoading}>
                <CheckCircle className="h-4 w-4 mr-2" />
                {activeSchedule ? 'Actualizează programul' : 'Salvează programul'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Configuration Panel */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Setări clinică</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="room-count">Număr de săli</Label>
                    <Input
                      id="room-count"
                      type="number"
                      min="1"
                      max="20"
                      value={roomCount}
                      onChange={(e) => setRoomCount(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="eur-to-ron-rate">Curs de schimb (1 EUR = RON)</Label>
                    <Input
                      id="eur-to-ron-rate"
                      type="number"
                      min="0.01"
                      max="100"
                      step={0.01}
                      value={eurToRonRate}
                      onChange={(e) => setEurToRonRate(Number(e.target.value))}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Folosit pentru afișarea prețurilor procedurilor în lei, cu tooltip în euro.
                    </p>
                  </div>

                  <div>
                    <Label>Perioada programului</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <DatePicker
                        selected={startDate}
                        onChange={(date: Date) => setStartDate(date)}
                        className="w-full border rounded-md px-3 py-2"
                        placeholderText="Data de început"
                        dateFormat="MMM d, yyyy"
                      />
                      <DatePicker
                        selected={endDate}
                        onChange={(date: Date) => setEndDate(date)}
                        className="w-full border rounded-md px-3 py-2"
                        placeholderText="Data de sfârșit"
                        dateFormat="MMM d, yyyy"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Selectare rapidă perioadă</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickPeriod('week')}
                      >
                        Săptămâna aceasta
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickPeriod('month')}
                      >
                        Luna aceasta
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickPeriod('nextWeek')}
                      >
                        Următoarea săptămână
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickPeriod('nextMonth')}
                      >
                        Următoarea lună
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Program de lucru implicit</CardTitle>
                  <CardDescription>Setați orele implicite care se vor completa automat pentru toți angajații</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Input
                      type="time"
                      value={defaultWorkingHours.start}
                      onChange={(e) => setDefaultWorkingHours(prev => ({ ...prev, start: e.target.value }))}
                      className="flex-1"
                    />
                    <span>până la</span>
                    <Input
                      type="time"
                      value={defaultWorkingHours.end}
                      onChange={(e) => setDefaultWorkingHours(prev => ({ ...prev, end: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyDefaultHours()}
                    className="w-full"
                  >
                    Aplică tuturor
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Zile de deschidere</CardTitle>
                  <CardDescription>Selectați zilele în care clinica este deschisă</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      {['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'].map((day) => (
                        <Button
                          key={day}
                          variant={openingDays.includes(day) ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleOpeningDayToggle(day)}
                          className="justify-start"
                        >
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${openingDays.includes(day) ? 'bg-white' : 'bg-gray-400'}`} />
                            <span>{day}</span>
                          </div>
                        </Button>
                      ))}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {openingDays.length} zile selectate • Zilele neselectate vor fi ascunse din previzualizarea programului
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Schedule Setup Panel */}
            <div className="lg:col-span-2 space-y-4">
              {/* Room Assignments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Atribuiri săli</span>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant={showAdvancedShifts ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowAdvancedShifts(!showAdvancedShifts)}
                      >
                        {showAdvancedShifts ? 'Vizualizare simplă' : 'Ture avansate'}
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    {showAdvancedShifts
                      ? 'Creați mai multe ture pe sală cu practicieni și ore diferite'
                      : 'Atribuiți practicienii principal și secundar fiecărei săli (program implicit)'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="w-full mb-4">
                    <div className="bg-muted p-1 rounded-lg">
                      {Array.from({ length: Math.ceil(roomCount / 5) }, (_, rowIndex) => (
                        <div key={rowIndex} className="flex gap-1 mb-1 last:mb-0">
                          {Array.from({ length: Math.min(5, roomCount - rowIndex * 5) }, (_, colIndex) => {
                            const roomIndex = rowIndex * 5 + colIndex
                            const roomShiftsCount = getShiftsForRoom(roomIndex + 1).length
                            return (
                              <Button
                                key={roomIndex}
                                variant={selectedScheduleTab === `room-${roomIndex + 1}` ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setSelectedScheduleTab(`room-${roomIndex + 1}`)}
                                className="flex-1 transition-all relative"
                              >
                                Sala {roomIndex + 1}
                                {roomShiftsCount > 0 && (
                                  <Badge variant="secondary" className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">
                                    {roomShiftsCount}
                                  </Badge>
                                )}
                              </Button>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  </div>

                  {Array.from({ length: roomCount }, (_, roomIndex) => (
                    <div
                      key={roomIndex}
                      className={`space-y-4 ${selectedScheduleTab === `room-${roomIndex + 1}` ? 'block' : 'hidden'}`}
                    >
                      {!showAdvancedShifts ? (
                        // Simple View - Traditional room assignment
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Practician principal</Label>
                              <Select
                                value={roomAssignments[roomIndex]?.mainPractitioner || ''}
                                onValueChange={(value) => handleRoomAssignment(roomIndex, 'mainPractitioner', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selectați practicianul principal" />
                                </SelectTrigger>
                                <SelectContent>
                                  {getActivePractitioners().map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                      {p.firstName} {p.lastName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label>Practician secundar (opțional)</Label>
                              <Select
                                value={roomAssignments[roomIndex]?.sidePractitioner || 'none'}
                                onValueChange={(value) => handleRoomAssignment(roomIndex, 'sidePractitioner', value === 'none' ? undefined : value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selectați practicianul secundar" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">Niciunul</SelectItem>
                                  {getActivePractitioners().map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                      {p.firstName} {p.lastName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div>
                            <Label>Program de lucru pentru sala {roomIndex + 1}</Label>
                            <div className="flex items-center space-x-2 mt-1">
                              <Input
                                type="time"
                                value={roomAssignments[roomIndex]?.startTime || '09:00'}
                                onChange={(e) => handleRoomAssignment(roomIndex, 'startTime', e.target.value)}
                                className="flex-1"
                              />
                              <span>până la</span>
                              <Input
                                type="time"
                                value={roomAssignments[roomIndex]?.endTime || '17:00'}
                                onChange={(e) => handleRoomAssignment(roomIndex, 'endTime', e.target.value)}
                                className="flex-1"
                              />
                            </div>
                          </div>

                          <div>
                            <Label>Zile de lucru</Label>
                            <div className="flex flex-row gap-1 mt-2 overflow-x-auto pb-2">
                              {['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'].map((day) => (
                                <ContextMenu
                                  key={day}
                                  contextMenuItems={getDayOfWeekContextMenuItems(day, roomIndex + 1)}
                                >
                                  <Button
                                    variant={roomAssignments[roomIndex]?.workingDays?.includes(day) ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handleWorkingDayToggle(roomIndex, day)}
                                    className="cursor-context-menu min-w-12 flex-shrink-0"
                                  >
                                    {day.substring(0, 3)}
                                  </Button>
                                </ContextMenu>
                              ))}
                            </div>
                          </div>

                          <div className="flex justify-center pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowAdvancedShifts(true)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Adaugă ture personalizate pentru sala {roomIndex + 1}
                            </Button>
                          </div>
                        </>
                      ) : (
                        // Advanced View - Shift-based scheduling
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Ture sala {roomIndex + 1}</h4>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setWeekEditorDialog({ isOpen: true, roomNumber: roomIndex + 1 })}
                              >
                                <Calendar className="h-4 w-4 mr-2" />
                                Editor săptămânal
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => setAddShiftDialog({ isOpen: true, roomNumber: roomIndex + 1 })}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Adaugă tură
                              </Button>
                            </div>
                          </div>

                          {/* Display existing shifts for this room */}
                          <div className="space-y-2">
                            {getShiftsForRoom(roomIndex + 1).map((shift) => (
                              <div key={shift.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex-1">
                                  <div className="font-medium text-sm">
                                    {shift.practitioner.firstName} {shift.practitioner.lastName}
                                    {shift.sidePractitioner && (
                                      <span className="text-gray-500">
                                        {' '}+ {shift.sidePractitioner.firstName} {shift.sidePractitioner.lastName}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {shift.startTime} - {shift.endTime}
                                    {shift.date && (
                                      <span className="ml-2 text-blue-600">
                                        📅 {new Date(shift.date).toLocaleDateString()}
                                      </span>
                                    )}
                                    {shift.dayOfWeek && (
                                      <span className="ml-2 text-green-600">
                                        🔄 {shift.dayOfWeek}
                                      </span>
                                    )}
                                    {shift.isOverride && (
                                      <Badge variant="secondary" className="ml-2">Excepție</Badge>
                                    )}
                                  </div>
                                  {shift.reason && (
                                    <div className="text-xs text-gray-500 italic">{shift.reason}</div>
                                  )}
                                </div>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => removeRoomShift(shift.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}

                            {getShiftsForRoom(roomIndex + 1).length === 0 && (
                              <div className="text-center py-8 text-gray-500">
                                <div className="text-sm">Nu există ture personalizate pentru această sală</div>
                                <div className="text-xs">Se folosește atribuirea implicită a sălii, dacă este configurată</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Alți angajați */}
              <Card>
                <CardHeader>
                  <CardTitle>Alți angajați</CardTitle>
                  <CardDescription>Programați angajații neatribuiți unor săli specifice</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {otherWorkers.map((worker, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="grid grid-cols-3 gap-4 flex-1">
                            <div>
                              <Label>Angajat</Label>
                              <Select
                                value={worker.practitionerId}
                                onValueChange={(value) => handleOtherWorkerChange(index, 'practitionerId', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selectați angajatul" />
                                </SelectTrigger>
                                <SelectContent>
                                  {getActivePractitioners()
                                    .filter(p => !isWorkerAssigned(p.id) || p.id === worker.practitionerId)
                                    .map((p) => (
                                      <SelectItem key={p.id} value={p.id}>
                                        {p.firstName} {p.lastName}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label>Ora de început</Label>
                              <Input
                                type="time"
                                value={worker.startTime}
                                onChange={(e) => handleOtherWorkerChange(index, 'startTime', e.target.value)}
                              />
                            </div>

                            <div>
                              <Label>Ora de sfârșit</Label>
                              <Input
                                type="time"
                                value={worker.endTime}
                                onChange={(e) => handleOtherWorkerChange(index, 'endTime', e.target.value)}
                              />
                            </div>
                          </div>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeOtherWorker(index)}
                            className="ml-4"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div>
                          <Label>Zile de lucru</Label>
                          <div className="flex flex-row gap-2 mt-2 overflow-x-auto pb-2">
                            {['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'].map((day) => (
                              <ContextMenu
                                key={day}
                                contextMenuItems={getDayOfWeekContextMenuItems(day, undefined, worker.practitionerId)}
                              >
                                <Button
                                  variant={worker.workingDays?.includes(day) ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleOtherWorkerDayToggle(index, day)}
                                  className="cursor-context-menu min-w-12 flex-shrink-0"
                                >
                                  {day.substring(0, 3)}
                                </Button>
                              </ContextMenu>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}

                    <Button
                      variant="outline"
                      onClick={() => addOtherWorker()}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adaugă alt angajat
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Schedule Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Previzualizare program
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditSpecificDay()}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Editează zi specifică
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handlePrintSchedule()}>
                    <FileText className="h-4 w-4 mr-2" />
                    Tipărește programul
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-sm table-fixed">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-3 py-2 text-left font-medium w-20">Data</th>
                      <th className="border border-gray-300 px-3 py-2 text-left font-medium w-24">Zi</th>
                      {Array.from({ length: roomCount }, (_, i) => (
                        <th key={i} className="border border-gray-300 px-3 py-2 text-left font-medium w-40">
                          Sala {i + 1}
                        </th>
                      ))}
                      <th className="border border-gray-300 px-3 py-2 text-left font-medium w-48">Alți angajați</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedulePreview.map((day, index) => {
                      // Calculate the actual date for this row
                      const currentDate = day.actualDate

                      return (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <ContextMenu
                            contextMenuItems={getDayContextMenuItems(currentDate)}
                          >
                            <td className="border border-gray-300 px-2 py-2 font-medium cursor-context-menu w-20">
                              <div className="text-center">
                                <div className="text-sm font-bold text-gray-800">{day.date}</div>
                              </div>
                            </td>
                          </ContextMenu>
                          <td className="border border-gray-300 px-2 py-2 w-24">
                            <div className="text-center">
                              <div className="text-xs font-medium uppercase tracking-wide text-gray-600">
                                {day.dayName}
                              </div>
                            </div>
                          </td>
                          {day.rooms.map((room, roomIndex) => (
                            <ContextMenu
                              key={roomIndex}
                              contextMenuItems={getDayContextMenuItems(currentDate, roomIndex + 1)}
                            >
                              <td className="border border-gray-300 px-2 py-2 cursor-context-menu w-40">
                                <div className="space-y-1">
                                  {room.shifts && room.shifts.length > 0 ? (
                                    room.shifts.map((shift, shiftIndex) => (
                                      <div key={shiftIndex} className="space-y-1">
                                        {shift.main && (
                                          <div
                                            className="border rounded p-2"
                                            style={{
                                              backgroundColor: shift.main.color || '#1976d2',
                                              borderColor: darkenColor(shift.main.color || '#1976d2', 0.2)
                                            }}
                                          >
                                            <div
                                              className="font-medium text-xs truncate flex items-center"
                                              style={{ color: darkenColor(shift.main.color || '#1976d2', 0.4) }}
                                              title={shift.main.name}
                                            >
                                              {shift.main.name}
                                              {shift.main.reason && (
                                                <Badge variant="secondary" className="ml-1 text-xs h-4" title={`Suprascriere: ${shift.main.reason}`}>O</Badge>
                                              )}
                                              {shift.main.priority > 0 && (
                                                <Badge variant="outline" className="ml-1 text-xs h-4">P{shift.main.priority}</Badge>
                                              )}
                                            </div>
                                            <div className="text-xs font-mono" style={{ color: darkenColor(shift.main.color || '#1976d2', 0.6) }}>{shift.main.time}</div>
                                          </div>
                                        )}
                                        {shift.side && (
                                          <div
                                            className="border rounded p-2"
                                            style={{
                                              backgroundColor: shift.side.color || '#388e3c',
                                              borderColor: darkenColor(shift.side.color || '#388e3c', 0.2)
                                            }}
                                          >
                                            <div
                                              className="font-medium text-xs truncate flex items-center"
                                              style={{ color: darkenColor(shift.side.color || '#388e3c', 0.4) }}
                                              title={shift.side.name}
                                            >
                                              {shift.side.name}
                                              {shift.side.reason && (
                                                <Badge variant="secondary" className="ml-1 text-xs h-4" title={`Suprascriere: ${shift.side.reason}`}>O</Badge>
                                              )}
                                              {shift.side.priority > 0 && (
                                                <Badge variant="outline" className="ml-1 text-xs h-4">P{shift.side.priority}</Badge>
                                              )}
                                            </div>
                                            <div className="text-xs font-mono" style={{ color: darkenColor(shift.side.color || '#388e3c', 0.6) }}>{shift.side.time}</div>
                                          </div>
                                        )}
                                      </div>
                                    ))
                                  ) : (
                                    // Fallback to legacy format for compatibility
                                    <>
                                      {room.main && (
                                        <div
                                          className="border rounded p-2"
                                          style={{
                                            backgroundColor: room.main.color || '#1976d2',
                                            borderColor: darkenColor(room.main.color || '#1976d2', 0.2)
                                          }}
                                        >
                                          <div
                                            className="font-medium text-xs truncate"
                                            style={{ color: darkenColor(room.main.color || '#1976d2', 0.4) }}
                                            title={room.main.name}
                                          >
                                            👨‍⚕️ {room.main.name}
                                          </div>
                                          <div className="text-xs font-mono" style={{ color: darkenColor(room.main.color || '#1976d2', 0.6) }}>{room.main.time}</div>
                                        </div>
                                      )}
                                      {room.side && (
                                        <div
                                          className="border rounded p-2"
                                          style={{
                                            backgroundColor: room.side.color || '#388e3c',
                                            borderColor: darkenColor(room.side.color || '#388e3c', 0.2)
                                          }}
                                        >
                                          <div
                                            className="font-medium text-xs truncate"
                                            style={{ color: darkenColor(room.side.color || '#388e3c', 0.4) }}
                                            title={room.side.name}
                                          >
                                            {room.side.name}
                                          </div>
                                          <div className="text-xs font-mono" style={{ color: darkenColor(room.side.color || '#388e3c', 0.6) }}>{room.side.time}</div>
                                        </div>
                                      )}
                                      {!room.main && !room.side && (
                                        <div className="text-center py-4">
                                          <span className="text-gray-400 text-xs">Fără atribuire</span>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </td>
                            </ContextMenu>
                          ))}
                          <ContextMenu
                            contextMenuItems={getDayContextMenuItems(currentDate)}
                          >
                            <td className="border border-gray-300 px-2 py-2 cursor-context-menu w-48">
                              <div className="space-y-1">
                                {day.otherWorkers.map((worker, workerIndex) => (
                                  <div
                                    key={workerIndex}
                                    className="border rounded p-2"
                                    style={{
                                      backgroundColor: worker.color || '#7b1fa2',
                                      borderColor: darkenColor(worker.color || '#7b1fa2', 0.2)
                                    }}
                                  >
                                    <div
                                      className="font-medium text-xs truncate"
                                      style={{ color: darkenColor(worker.color || '#7b1fa2', 0.4) }}
                                      title={worker.name}
                                    >
                                      {worker.name}
                                    </div>
                                    <div className="text-xs font-mono" style={{ color: darkenColor(worker.color || '#7b1fa2', 0.6) }}>{worker.time}</div>
                                  </div>
                                ))}
                                {day.otherWorkers.length === 0 && (
                                  <div className="text-center py-4">
                                    <span className="text-gray-400 text-xs">Niciunul</span>
                                  </div>
                                )}
                              </div>
                            </td>
                          </ContextMenu>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Action Dialog */}
      <Dialog open={userActionDialog.isOpen} onOpenChange={(open) => setUserActionDialog({ ...userActionDialog, isOpen: open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {userActionDialog.action === 'DISABLE' ? 'Dezactivează utilizatorul' : 'Activează utilizatorul'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Sigur doriți să {userActionDialog.action === 'DISABLE' ? 'dezactivați' : 'activați'} pe {userActionDialog.user?.firstName} {userActionDialog.user?.lastName}?
            </p>
            {userActionDialog.action === 'DISABLE' && (
              <div>
                <Label htmlFor="reason">Motiv dezactivare</Label>
                <Textarea
                  id="reason"
                  value={disableMotiv}
                  onChange={(e) => setDisableMotiv(e.target.value)}
                  placeholder="Introduceți motivul dezactivării utilizatorului..."
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserActionDialog({ isOpen: false, action: '', user: null })}>
              Anulează
            </Button>
            <Button
              onClick={() => {
                if (userActionDialog.user) {
                  handleUserAction(
                    userActionDialog.user.id,
                    userActionDialog.action as 'DISABLE' | 'ENABLE',
                    userActionDialog.action === 'DISABLE' ? disableMotiv : undefined
                  )
                }
              }}
            >
              {userActionDialog.action === 'DISABLE' ? 'Dezactivează' : 'Activează'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave Request Review Dialog */}
      <Dialog open={leaveActionDialog} onOpenChange={setLeaveActionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Revizuire cerere de concediu</DialogTitle>
          </DialogHeader>
          {selectedLeaveRequest && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">{selectedLeaveRequest.title}</h3>
                <p className="text-sm text-gray-500">{selectedLeaveRequest.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Angajat</Label>
                  <p>{selectedLeaveRequest.user.firstName} {selectedLeaveRequest.user.lastName}</p>
                </div>
                <div>
                  <Label>Tip concediu</Label>
                  <p>{formatLeaveType(selectedLeaveRequest.leaveType)}</p>
                </div>
                <div>
                  <Label>Data început</Label>
                  <p>{new Date(selectedLeaveRequest.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label>Data sfârșit</Label>
                  <p>{new Date(selectedLeaveRequest.endDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label>Durată</Label>
                  <p>{selectedLeaveRequest.totalDays} zile</p>
                </div>
                <div>
                  <Label>Stare</Label>
                  <Badge className={getStatusColor(selectedLeaveRequest.status)}>
                    {formatStatus(selectedLeaveRequest.status)}
                  </Badge>
                </div>
              </div>

              {selectedLeaveRequest.status === 'PENDING' && (
                <div className="space-y-4 border-t pt-4">
                  <div>
                    <Label htmlFor="review-comments">Comentarii revizuire</Label>
                    <Textarea
                      id="review-comments"
                      value={reviewComentarii}
                      onChange={(e) => setReviewComentarii(e.target.value)}
                      placeholder="Adăugați comentarii despre decizia dvs..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Date alternative (opțional)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="alt-start">Început alternativ</Label>
                        <Input
                          id="alt-start"
                          type="date"
                          value={alternativeStartDate}
                          onChange={(e) => setAlternativeStartDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="alt-end">Sfârșit alternativ</Label>
                        <Input
                          id="alt-end"
                          type="date"
                          value={alternativeEndDate}
                          onChange={(e) => setAlternativeEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                    {(alternativeStartDate || alternativeEndDate) && (
                      <div>
                        <Label htmlFor="alt-comments">Comentarii alternative</Label>
                        <Textarea
                          id="alt-comments"
                          value={alternativeComentarii}
                          onChange={(e) => setAlternativeComentarii(e.target.value)}
                          placeholder="Explicați datele alternative..."
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveActionDialog(false)}>
              Închide
            </Button>
            {selectedLeaveRequest?.status === 'PENDING' && (
              <div className="flex space-x-2">
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (selectedLeaveRequest) {
                      handleLeaveRequestAction(selectedLeaveRequest.id, 'DENY', { reviewComentarii })
                    }
                  }}
                >
                  Respinge
                </Button>
                {(alternativeStartDate || alternativeEndDate) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (selectedLeaveRequest) {
                        handleLeaveRequestAction(selectedLeaveRequest.id, 'PROPOSE_ALTERNATIVE', {
                          reviewComentarii,
                          alternativeStartDate,
                          alternativeEndDate,
                          alternativeComentarii
                        })
                      }
                    }}
                  >
                    Propune alternativă
                  </Button>
                )}
                <Button
                  onClick={() => {
                    if (selectedLeaveRequest) {
                      handleLeaveRequestAction(selectedLeaveRequest.id, 'APPROVE', { reviewComentarii })
                    }
                  }}
                >
                  Aprobă
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Șterge Logs Confirmation Dialog */}
      <AlertDialog open={deleteLogsDialog} onOpenChange={setDeleteLogsDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Șterge jurnalele de activitate</AlertDialogTitle>
            <AlertDialogDescription>
              Sigur doriți să ștergeți {selectedLogs.length} jurnal(e) selectat(e)? Această acțiune nu poate fi anulată.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteLogs(selectedLogs)}
              className="bg-red-600 hover:bg-red-700"
            >
              Șterge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Day Override Modal */}
      <DayOverrideModal
        isOpen={dayOverrideModal.isOpen}
        onClose={() => setDayOverrideModal(prev => ({ ...prev, isOpen: false }))}
        scheduleId={activeSchedule?.id || null}
        selectedDate={dayOverrideModal.selectedDate}
        selectedRoomNumber={dayOverrideModal.selectedRoomNumber}
        selectedPractitionerId={dayOverrideModal.selectedPractitionerId}
        practitioners={getActivePractitioners()}
        roomCount={roomCount}
        initialStartTime={dayOverrideModal.initialStartTime}
        initialEndTime={dayOverrideModal.initialEndTime}
        onOverrideCreated={handleOverrideCreated}
      />

      {/* Day of Week Override Modal */}
      <DayOfWeekOverrideModal
        isOpen={dayOfWeekOverrideModal.isOpen}
        onClose={() => setDayOfWeekOverrideModal(prev => ({ ...prev, isOpen: false }))}
        scheduleId={activeSchedule?.id || null}
        selectedDayOfWeek={dayOfWeekOverrideModal.selectedDayOfWeek}
        selectedRoomNumber={dayOfWeekOverrideModal.selectedRoomNumber}
        selectedPractitionerId={dayOfWeekOverrideModal.selectedPractitionerId}
        practitioners={getActivePractitioners()}
        roomCount={roomCount}
        initialStartTime={dayOfWeekOverrideModal.initialStartTime}
        initialEndTime={dayOfWeekOverrideModal.initialEndTime}
        onOverrideCreated={handleDayOfWeekOverrideCreated}
      />

      {/* Adaugă tură Dialog */}
      <Dialog open={addShiftDialog.isOpen} onOpenChange={(open) => setAddShiftDialog(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adaugă tură pentru sala {addShiftDialog.roomNumber}</DialogTitle>
          </DialogHeader>
          <AddShiftForm
            roomNumber={addShiftDialog.roomNumber}
            practitioners={practitioners}
            onSubmit={async (shiftData) => {
              await addRoomShift(shiftData)
              setAddShiftDialog(prev => ({ ...prev, isOpen: false }))
            }}
            onCancel={() => setAddShiftDialog(prev => ({ ...prev, isOpen: false }))}
          />
        </DialogContent>
      </Dialog>

      {/* Editor săptămânal Modal */}
      <WeekEditorModal
        isOpen={weekEditorDialog.isOpen}
        onClose={() => setWeekEditorDialog(prev => ({ ...prev, isOpen: false }))}
        roomNumber={weekEditorDialog.roomNumber}
        practitioners={getActivePractitioners()}
        existingShifts={getShiftsForRoom(weekEditorDialog.roomNumber).map(shift => ({
          id: shift.id,
          roomNumber: shift.roomNumber,
          practitionerId: shift.practitionerId,
          sidePractitionerId: shift.sidePractitionerId,
          startTime: shift.startTime,
          endTime: shift.endTime,
          dayOfWeek: shift.dayOfWeek,
          date: shift.date,
          priority: shift.priority,
          isOverride: shift.isOverride,
          reason: shift.reason,
          practitioner: shift.practitioner,
          sidePractitioner: shift.sidePractitioner,
        }))}
        onSaveShifts={(shifts) => handleSaveWeekShifts(weekEditorDialog.roomNumber, shifts as RoomShiftDB[])}
      />

      {/* Resetează programul Confirmation Modal */}
      <AlertDialog open={resetScheduleDialog} onOpenChange={setResetScheduleDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <RefreshCw className="h-5 w-5" />
              Resetează programul
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>Sigur doriți să resetați programul? Aceasta va:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Șterge toate atribuirile sălilor</li>
                <li>Elimină toate turele personalizate</li>
                <li>Resetează ceilalți angajați</li>
                <li>Dezactivează programul curent</li>
              </ul>
              <p className="font-medium text-red-600">Această acțiune nu poate fi anulată!</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                handleResetSchedule()
                setResetScheduleDialog(false)
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Resetează programul
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}

// Adaugă tură Form Component
function AddShiftForm({
  roomNumber,
  practitioners,
  onSubmit,
  onCancel
}: {
  roomNumber: number
  practitioners: (Practitioner & { isDisabled?: boolean })[]
  onSubmit: (shiftData: any) => Promise<void>
  onCancel: () => void
}) {
  // Filter out disabled practitioners for shift creation
  const activePractitioners = practitioners.filter(p => !p.isDisabled)
  const [practitionerId, setPractitionerId] = useState('')
  const [sidePractitionerId, setSidePractitionerId] = useState('none')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [shiftType, setShiftType] = useState<'recurring' | 'specific'>('recurring')
  const [dayOfWeek, setDayOfWeek] = useState('Luni')
  const [date, setDate] = useState('')
  const [isOverride, setIsOverride] = useState(true)
  const [reason, setMotiv] = useState('')
  const [priority, setPrioritate] = useState(0)
  const [conflicts, setConflicts] = useState<any[]>([])

  // Check for time conflicts whenever time or date changes
  useEffect(() => {
    const checkTimeConflicts = () => {
      // This would need access to roomShifts from parent component
      // For now, we'll implement basic validation
      const timeStart = new Date(`2000-01-01T${startTime}:00`)
      const timeEnd = new Date(`2000-01-01T${endTime}:00`)

      if (timeStart >= timeEnd) {
        setConflicts([{ type: 'invalid_time', message: 'Ora de sfârșit trebuie să fie după ora de început' }])
      } else {
        setConflicts([])
      }
    }

    if (startTime && endTime) {
      checkTimeConflicts()
    }
  }, [startTime, endTime, dayOfWeek, date, shiftType])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!practitionerId || startTime >= endTime) {
      return
    }

    if (conflicts.length > 0 && !isOverride) {
      appAlert(
        `Probleme de validare detectate:\n${conflicts.map((c) => c.message).join('\n')}\n\nActivați „Suprascrie atribuirile existente” pentru a continua oricum.`,
        { title: 'Validare' }
      )
      return
    }

    const shiftData = {
      roomNumber,
      practitionerId,
      sidePractitionerId: sidePractitionerId === 'none' ? undefined : sidePractitionerId,
      startTime,
      endTime,
      ...(shiftType === 'specific' ? { date } : { dayOfWeek }),
      priority,
      isOverride,
      reason: reason || undefined,
    }

    await onSubmit(shiftData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Conflict warnings */}
      {conflicts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
          <div className="font-medium text-yellow-800 text-sm mb-1">⚠️ Probleme de validare:</div>
          {conflicts.map((conflict, index) => (
            <div key={index} className="text-yellow-700 text-sm">
              • {conflict.message}
            </div>
          ))}
          {!isOverride && (
            <div className="text-yellow-600 text-xs mt-2">
              Activați „Suprascrie atribuirile existente” pentru a continua oricum.
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="practitioner">Practician principal</Label>
          <Select value={practitionerId} onValueChange={setPractitionerId}>
            <SelectTrigger>
              <SelectValue placeholder="Selectați practicianul" />
            </SelectTrigger>
            <SelectContent>
              {activePractitioners.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.firstName} {p.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="sidePractitioner">Practician secundar (opțional)</Label>
          <Select value={sidePractitionerId} onValueChange={setSidePractitionerId}>
            <SelectTrigger>
              <SelectValue placeholder="Niciunul" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Niciunul</SelectItem>
              {activePractitioners
                .filter(p => p.id !== practitionerId)
                .map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.firstName} {p.lastName}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startTime">Ora de început</Label>
          <Input
            id="startTime"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="endTime">Ora de sfârșit</Label>
          <Input
            id="endTime"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label>Program tură</Label>
        <Select value={shiftType} onValueChange={(value: 'recurring' | 'specific') => setShiftType(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recurring">Recurent (în fiecare săptămână)</SelectItem>
            <SelectItem value="specific">Dată specifică</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {shiftType === 'recurring' ? (
        <div>
          <Label htmlFor="dayOfWeek">Ziua săptămânii</Label>
          <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'].map(day => (
                <SelectItem key={day} value={day}>{day}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div>
          <Label htmlFor="date">Dată specifică</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      )}



      <div>
        <Label htmlFor="priority">Prioritate (valoare mai mare = mai important)</Label>
        <Input
          id="priority"
          type="number"
          value={priority}
          onChange={(e) => setPrioritate(Number(e.target.value))}
          min="0"
          max="10"
        />
      </div>

      {isOverride && (
        <div>
          <Label htmlFor="reason">Motiv (opțional)</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setMotiv(e.target.value)}
            placeholder="De ce este necesară această tură?"
          />
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Anulează
        </Button>
        <Button type="submit" disabled={!practitionerId}>
          Adaugă tură
        </Button>
      </DialogFooter>
    </form>
  )
}