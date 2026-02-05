'use client'

import React, { useEffect, useState, useRef, Suspense } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import CallPlayer from '@/components/CallPlayer'
import SafeSearchParams from '@/components/layout/SafeSearchParams'
import { useTaskReminders } from '@/hooks/useTaskReminders'
import { useCall } from '@/contexts/CallContext'
import { getCookie, setCookie } from '@/lib/cookies'
import SplitPane from '@/components/layout/SplitPane'
import TodayAppointments from '@/components/TodayAppointments'
import DynamicPane, { DynamicPaneRef } from '@/components/layout/DynamicPane'

const navigation = [
  { name: 'Patients', href: '/dashboard/patients', icon: '👥' },
  { name: 'Calendar', href: '/dashboard/appointments', icon: '📅' },
  { name: 'Imaging', href: '/dashboard/imaging', icon: '📸' },
  { name: 'Chat', href: '/dashboard/chat', icon: '💬' },

  { name: 'Instructions', href: '/dashboard/instructions', icon: '📖' },
  { name: 'Pharma Guide', href: '/dashboard/pharma-guide', icon: '💊' },

  { name: 'Finance', href: '/dashboard/finance', icon: '💰' },
  { name: 'Orders', href: '/dashboard/orders', icon: '📦' },
  { name: 'Tasks', href: '/dashboard/tasks', icon: '✅' },
  { name: 'Phone Calls', href: '/dashboard/phone-calls', icon: '📞' },
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

function DashboardLayoutContent({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false)
  const [avatarColor, setAvatarColor] = useState("#cfdbff") // Default color matches Prisma schema
  const [orgLogoUrl, setOrgLogoUrl] = useState<string | null>(null);
  const [isWorkspaceView, setIsWorkspaceView] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const dynamicPaneRef = useRef<DynamicPaneRef>(null)

  const { startCall } = useCall()

  // Check if this page is embedded in DynamicPane
  const isEmbedded = searchParams.get('embed') === '1'

  // Track iframe windows for state broadcasting
  const iframeWindows = useRef<Set<Window>>(new Set())

  // Initialize task reminders checking - always call the hook but pass isEmbedded flag
  useTaskReminders(isEmbedded)

  // Handle clicking outside user menu to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isUserMenuOpen])

  // Fetch user's calendar settings for the avatar color
  useEffect(() => {
    const fetchUserSettings = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch('/api/calendar-settings/personal');
          if (response.ok) {
            const data = await response.json();
            // Set the color regardless of whether data.color exists or not
            setAvatarColor(data.color || "#cfdbff");
          }
        } catch (error) {
          console.error('Error fetching calendar settings:', error);
        }
      }
    };

    fetchUserSettings();
  }, [session?.user?.id]);

  // Fetch organization logo URL
  useEffect(() => {
    const fetchOrganization = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch('/api/user/organization');
          if (response.ok) {
            const data = await response.json();
            setOrgLogoUrl(data.logoUrl || null);
          }
        } catch (error) {
          console.error('Error fetching organization:', error);
        }
      }
    };

    fetchOrganization();
  }, [session?.user?.id]);

  // Load workspace view preference from cookie
  useEffect(() => {
    const workspacePref = getCookie('workspaceViewEnabled');
    setIsWorkspaceView(workspacePref === 'true');
  }, []);

  // Handle workspace toggle
  const handleWorkspaceToggle = () => {
    const newValue = !isWorkspaceView;
    setIsWorkspaceView(newValue);
    setCookie('workspaceViewEnabled', newValue.toString());
  };

  // Listen for messages from embedded iframes and handle state synchronization
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const sourceWindow = event.source as Window;

      // Track iframe windows for broadcasting
      if (sourceWindow && sourceWindow !== window) {
        iframeWindows.current.add(sourceWindow);
      }

      if (event.data?.type === 'startCall') {
        // Handle call requests from iframe
        const { patientData } = event.data;
        if (patientData) {
          startCall(patientData);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [startCall]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  // If embedded, return minimal layout without navbar
  if (isEmbedded) {
    // Check if this is a patient detail page for special zoom treatment
    const isPatientDetailPage = pathname.startsWith('/dashboard/patients/') && pathname !== '/dashboard/patients'

    return (
      <div className="min-h-screen bg-gray-100">
        <SafeSearchParams {...{
          children: (
            <main className={`h-full ${isPatientDetailPage ? 'transform scale-[0.85] origin-top-left' : ''}`}>
              {children}
            </main>
          )
        }}>
        </SafeSearchParams>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="w-full px-2 bg-white shadow-sm">
        <div className="max-w-8xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                {isWorkspaceView ? (
                  <button
                    onClick={() => {
                      // Navigate DynamicPane to dashboard using ref
                      if (dynamicPaneRef.current) {
                        dynamicPaneRef.current.navigateTo('dashboard');
                      }
                    }}
                    className="cursor-pointer"
                  >
                    {orgLogoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={orgLogoUrl} alt="Organization Logo" className="h-8 w-auto" />
                    ) : (
                      <span className="text-lg font-bold">Dentiva</span>
                    )}
                  </button>
                ) : (
                  <Link href="/dashboard">
                    {orgLogoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={orgLogoUrl} alt="Organization Logo" className="h-8 w-auto" />
                    ) : (
                      <span className="text-lg font-bold">Dentiva</span>
                    )}
                  </Link>
                )}
              </div>
              {!isWorkspaceView && (
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`${pathname === item.href
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                        } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                    >
                      <span className="mr-2">{item.icon}</span>
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  Hello, {session?.user?.firstName}
                </span>
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <span className="sr-only">Open user menu</span>
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: avatarColor }}
                    >
                      {session?.user?.firstName ? (session?.user?.firstName[0] + session?.user?.lastName[0]).toUpperCase() : ''}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5"
                      >
                        <div className="py-1">
                          <button
                            onClick={handleWorkspaceToggle}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                          >
                            <span>🖥️ Workspace View</span>
                            <span className={`ml-2 ${isWorkspaceView ? 'text-blue-600' : 'text-gray-400'}`}>
                              {isWorkspaceView ? '✓' : ''}
                            </span>
                          </button>
                          <Link
                            href="/dashboard/profile"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            👤 Your Profile
                          </Link>
                          <Link
                            href="/dashboard/leave-requests"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            📅 Leave Requests
                          </Link>
                          {/* Manager View - Only for ORGANIZATION_OWNER and MANAGER */}
                          {(session?.user?.role === 'ORGANIZATION_OWNER' || session?.user?.role === 'MANAGER') && (
                            <Link
                              href="/dashboard/manager"
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                              🛠️ Manager View
                            </Link>
                          )}
                          <button
                            onClick={() => {
                              signOut({ callbackUrl: '/login' })
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            🚪 Sign out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
            {!isWorkspaceView && (
              <div className="-mr-2 flex items-center sm:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                >
                  <span className="sr-only">Open main menu</span>
                  <svg
                    className="h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMobileMenuOpen && !isWorkspaceView && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="sm:hidden"
            >
              <div className="pt-2 pb-3 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="block pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.name}
                  </Link>
                ))}
              </div>
              <div className="pt-4 pb-3 border-t border-gray-200">
                <div className="px-4">
                  <div className="text-base font-medium text-gray-800">
                    {session?.user?.firstName}
                  </div>
                  <div className="text-sm font-medium text-gray-500">
                    {session?.user?.email}
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <button
                    onClick={handleWorkspaceToggle}
                    className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 flex items-center justify-between"
                  >
                    <span>🖥️ Workspace View</span>
                    <span className={`ml-2 ${isWorkspaceView ? 'text-blue-600' : 'text-gray-400'}`}>
                      {isWorkspaceView ? '✓' : ''}
                    </span>
                  </button>
                  <Link
                    href="/dashboard/profile"
                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Your Profile
                  </Link>
                  <Link
                    href="/dashboard/leave-requests"
                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    📅 Leave Requests
                  </Link>
                  {/* Manager View - Only for ORGANIZATION_OWNER and MANAGER */}
                  {(session?.user?.role === 'ORGANIZATION_OWNER' || session?.user?.role === 'MANAGER') && (
                    <Link
                      href="/dashboard/manager"
                      className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      🛠️ Manager View
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      signOut({ callbackUrl: '/login' })
                    }}
                    className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main content with SafeSearchParams */}
      <SafeSearchParams {...{
        children: (
          <main className={isWorkspaceView
            ? "h-[calc(100vh-4rem)] overflow-hidden"
            : "max-w-8xl py-6 sm:px-6 lg:px-8"
          }>
            {isWorkspaceView ? (
              <SplitPane initialPrimarySize={300} minPrimarySize={250}>
                {/* Left – today appointments */}
                <TodayAppointments />
                {/* Right – dynamic pane */}
                <DynamicPane ref={dynamicPaneRef} />
              </SplitPane>
            ) : (
              children
            )}
          </main>
        )
      }}>
      </SafeSearchParams>

      {/* Call Player - Available on all dashboard pages */}
      <CallPlayer />
    </div>
  )
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>}>
      <DashboardLayoutContent children={children} />
    </Suspense>
  );
}