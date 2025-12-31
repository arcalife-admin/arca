'use client'

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, ExternalLink, Trash2, Edit3 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { retryApiCall } from '@/lib/api-utils'

interface QuickLink {
  id: string
  title: string
  url: string
}

interface DashboardData {
  quickNote: string
  quickLinks: QuickLink[]
  updatedAt: string | null
}

const quickActions = [
  {
    name: 'Add New Patient',
    description: 'Register a new patient in the system',
    icon: '👤',
    href: '/dashboard/patients/new',
  },
  {
    name: 'Schedule Appointment',
    description: 'Book a new appointment',
    icon: '📅',
    href: '/dashboard/appointments/new',
  },
  {
    name: 'View Tasks',
    description: 'View all tasks',
    icon: '✅',
    href: '/dashboard/tasks',
  },
  {
    name: 'Open Latest Chat',
    description: 'Go to the most recent chat conversation',
    icon: '💬',
    href: '/dashboard/chat',
  },
]

export default function DashboardPage() {
  const [quickNote, setQuickNote] = useState('')
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>([])
  const [newLinkTitle, setNewLinkTitle] = useState('')
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [showAddLink, setShowAddLink] = useState(false)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Fetch dashboard data from API with retry logic
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery<DashboardData>({
    queryKey: ['dashboardData'],
    queryFn: async () => {
      return await retryApiCall(async () => {
        const response = await fetch('/api/user/dashboard')
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
        }
        return response.json()
      })
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  // Update dashboard data mutation with retry logic
  const updateDashboardMutation = useMutation({
    mutationFn: async (data: { quickNote?: string; quickLinks?: QuickLink[] }) => {
      return await retryApiCall(async () => {
        const response = await fetch('/api/user/dashboard', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
        }
        return response.json()
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] })
    },
    onError: (error) => {
      console.error('Error updating dashboard:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save changes. Please try again.',
        variant: 'destructive',
      })
    },
  })

  // Set local state when dashboard data is loaded
  useEffect(() => {
    if (dashboardData) {
      setQuickNote(dashboardData.quickNote)
      setQuickLinks(dashboardData.quickLinks)
    }
  }, [dashboardData])

  // Debounced save for quick note and quick links
  useEffect(() => {
    if (!dashboardData) return // Don't save until initial data is loaded

    const hasChanged =
      quickNote !== dashboardData.quickNote ||
      JSON.stringify(quickLinks) !== JSON.stringify(dashboardData.quickLinks)

    if (!hasChanged) return

    const timeoutId = setTimeout(() => {
      updateDashboardMutation.mutate({ quickNote, quickLinks })
    }, 1000) // 1 second debounce

    return () => clearTimeout(timeoutId)
  }, [quickNote, quickLinks, dashboardData, updateDashboardMutation])

  const addQuickLink = () => {
    if (newLinkTitle.trim() && newLinkUrl.trim()) {
      const newLink: QuickLink = {
        id: Date.now().toString(),
        title: newLinkTitle.trim(),
        url: newLinkUrl.trim().startsWith('http') ? newLinkUrl.trim() : `https://${newLinkUrl.trim()}`
      }
      setQuickLinks([...quickLinks, newLink])
      setNewLinkTitle('')
      setNewLinkUrl('')
      setShowAddLink(false)
    }
  }

  const removeQuickLink = (id: string) => {
    setQuickLinks(quickLinks.filter(link => link.id !== id))
  }

  // Fetch patients with retry logic
  const { data: patients = [], error: patientsError } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      return await retryApiCall(async () => {
        const response = await fetch('/api/patients')
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
        }
        return response.json()
      })
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  // Fetch tasks with retry logic
  const { data: tasksData, error: tasksError } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      return await retryApiCall(async () => {
        const response = await fetch('/api/tasks')
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
        }
        return response.json()
      })
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  const tasks = tasksData?.tasks || []

  // Fetch unread messages count with retry logic
  const { data: unreadMessagesData, error: chatError } = useQuery({
    queryKey: ['unreadMessages'],
    queryFn: async () => {
      return await retryApiCall(async () => {
        const response = await fetch('/api/chat')
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
        }
        const chatRooms = await response.json()

        // Calculate unread messages - this is a simplified approach
        // You might want to implement a proper unread messages API endpoint
        let unreadCount = 0
        for (const room of chatRooms) {
          if (room.lastMessage) {
            // For now, we'll count all messages from today as potentially unread
            const today = new Date().toDateString()
            const messageDate = new Date(room.lastMessage.timestamp).toDateString()
            if (messageDate === today) {
              unreadCount++
            }
          }
        }
        return { unreadCount, latestChatId: chatRooms[0]?.id }
      })
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  // Fetch today's appointments with retry logic
  const yyyyMmDd = new Date().toISOString().slice(0, 10)   // 2023-08-30
  const { data: todayAppointments = [], error: appointmentsError } = useQuery({
    queryKey: ['todayAppointments', yyyyMmDd],
    queryFn: async () => {
      return await retryApiCall(async () => {
        // Get today's date at start and end
        const today = new Date()
        const startDate = new Date(today.setHours(0, 0, 0, 0)).toISOString()
        const endDate = new Date(today.setHours(23, 59, 59, 999)).toISOString()

        const response = await fetch(`/api/appointments?startDate=${startDate}&endDate=${endDate}`)
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
        }
        return response.json()
      })
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  // Show error toasts for failed API calls
  useEffect(() => {
    if (patientsError) {
      toast({
        title: 'Error loading patients',
        description: patientsError instanceof Error ? patientsError.message : 'Failed to load patient data',
        variant: 'destructive',
      })
    }
  }, [patientsError, toast])

  useEffect(() => {
    if (tasksError) {
      toast({
        title: 'Error loading tasks',
        description: tasksError instanceof Error ? tasksError.message : 'Failed to load task data',
        variant: 'destructive',
      })
    }
  }, [tasksError, toast])

  useEffect(() => {
    if (chatError) {
      toast({
        title: 'Error loading chat data',
        description: chatError instanceof Error ? chatError.message : 'Failed to load chat data',
        variant: 'destructive',
      })
    }
  }, [chatError, toast])

  useEffect(() => {
    if (appointmentsError) {
      toast({
        title: 'Error loading appointments',
        description: appointmentsError instanceof Error ? appointmentsError.message : 'Failed to load appointment data',
        variant: 'destructive',
      })
    }
  }, [appointmentsError, toast])

  const stats = [
    { name: 'Total Patients', value: (patients?.length || 0).toString(), icon: '👥' },
    { name: 'Today\'s Appointments', value: (todayAppointments?.length || 0).toString(), icon: '📅' },
    { name: 'Pending Tasks', value: (tasks?.length || 0).toString(), icon: '✅' },
    { name: 'Unread Messages', value: (unreadMessagesData?.unreadCount || 0).toString(), icon: '💬' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back! Here's an overview of your practice.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">{stat.icon}</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Personal Tools Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Self-Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="h-fit"
        >
          <Card className="h-[240px] flex flex-col">
            <CardHeader className="flex flex-row items-center space-y-0 pb-3 flex-shrink-0">
              <Edit3 className="h-5 w-5 mr-2 text-blue-600" />
              <CardTitle className="text-lg">Quick Note</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-1 min-h-0">
              {isDashboardLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-sm text-gray-500">Loading your notes...</div>
                </div>
              ) : (
                <>
                  <Textarea
                    placeholder="Jot down quick notes, reminders, or thoughts..."
                    value={quickNote}
                    onChange={(e) => setQuickNote(e.target.value)}
                    className="resize-none flex-1 min-h-0"
                    disabled={updateDashboardMutation.isPending}
                  />
                  <p className="text-xs text-gray-500 mt-2 flex-shrink-0 flex items-center">
                    <span>Auto-saves to your personal account. Only visible to you.</span>
                    {updateDashboardMutation.isPending && (
                      <span className="ml-2 text-blue-500">Saving...</span>
                    )}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="h-fit relative"
        >
          {/* Floating Add Link Form */}
          {showAddLink && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-opacity-25 z-40"
                onClick={() => {
                  setShowAddLink(false)
                  setNewLinkTitle('')
                  setNewLinkUrl('')
                }}
              />
              {/* Floating Form */}
              <div className="absolute top-[-200px] left-[-10px] right-0 z-50 p-4 bg-gradient-to-b from-gray-300 to-blue-100 border rounded-lg shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-900">Add New Link</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAddLink(false)
                      setNewLinkTitle('')
                      setNewLinkUrl('')
                    }}
                    className="h-6 w-6 p-0"
                  >
                    ×
                  </Button>
                </div>
                <div className="space-y-2">
                  <Input
                    placeholder="Link title"
                    value={newLinkTitle}
                    onChange={(e) => setNewLinkTitle(e.target.value)}
                    autoFocus
                    disabled={updateDashboardMutation.isPending}
                  />
                  <Input
                    placeholder="URL (e.g., example.com)"
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !updateDashboardMutation.isPending) {
                        addQuickLink()
                      }
                    }}
                    disabled={updateDashboardMutation.isPending}
                  />
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={addQuickLink}
                      disabled={updateDashboardMutation.isPending}
                    >
                      Add Link
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowAddLink(false)
                        setNewLinkTitle('')
                        setNewLinkUrl('')
                      }}
                      disabled={updateDashboardMutation.isPending}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}

          <Card className="h-[240px] flex flex-col">
            <CardHeader className="flex flex-row items-center space-y-0 pb-3 flex-shrink-0">
              <ExternalLink className="h-5 w-5 mr-2 text-green-600" />
              <CardTitle className="text-lg">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-1 min-h-0">
              {isDashboardLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-sm text-gray-500">Loading your links...</div>
                </div>
              ) : (
                <>
                  {/* Scrollable Links Area */}
                  <div className="flex-1 overflow-y-auto space-y-2 min-h-0 pr-2">
                    {quickLinks.map((link) => (
                      <div key={link.id} className="flex items-center justify-between p-2 border rounded-md hover:bg-gray-50">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 flex-1 text-sm hover:text-blue-600 min-w-0"
                        >
                          <ExternalLink className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{link.title}</span>
                        </a>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeQuickLink(link.id)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700 flex-shrink-0 ml-2"
                          disabled={updateDashboardMutation.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}

                    {quickLinks.length === 0 && (
                      <div className="flex items-center justify-center h-full min-h-[100px]">
                        <p className="text-sm text-gray-500 text-center">
                          No quick links saved yet
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Add Button - Fixed at bottom */}
                  <div className="pt-3 border-t flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddLink(true)}
                      className="w-full"
                      disabled={showAddLink || updateDashboardMutation.isPending}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Quick Link
                    </Button>
                    {updateDashboardMutation.isPending && (
                      <p className="text-xs text-gray-500 text-center mt-2">
                        Saving changes...
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <motion.div
              key={action.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              className="bg-white overflow-hidden shadow rounded-lg"
            >
              <Link href={action.href} className="block p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">{action.icon}</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <h3 className="text-sm font-medium text-gray-900">
                      {action.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {action.description}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
        <div className="mt-4 bg-white shadow rounded-lg">
          <div className="p-5">
            <p className="text-sm text-gray-500 text-center">
              No recent activity to show
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 