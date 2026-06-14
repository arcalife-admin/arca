'use client'

import React, { useEffect, useState, useRef, Suspense } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import CallPlayer from '@/components/CallPlayer'
import SupportWidget from '@/components/SupportWidget'
import SafeSearchParams from '@/components/layout/SafeSearchParams'
import { useTaskReminders } from '@/hooks/useTaskReminders'
import { useCall } from '@/contexts/CallContext'
import { getCookie, setCookie } from '@/lib/cookies'
import SplitPane from '@/components/layout/SplitPane'
import TodayAppointments from '@/components/TodayAppointments'
import DynamicPane, { DynamicPaneRef } from '@/components/layout/DynamicPane'
const navigationItems = [
  { name: 'Calendar programări', href: '/dashboard/appointments', icon: '📅' },
  { name: 'Pacienți', href: '/dashboard/patients', icon: '👥' },
  { name: 'Ghid farmaceutic', href: '/dashboard/pharma-guide', icon: '💊' },
  { name: 'Mesaje', href: '/dashboard/chat', icon: '💬' },
  { name: 'Instrucțiuni', href: '/dashboard/instructions', icon: '📖' },
  { name: 'Sarcini', href: '/dashboard/tasks', icon: '✅' },
  { name: 'Apeluri', href: '/dashboard/phone-calls', icon: '📞' },
  { name: 'Comenzi', href: '/dashboard/orders', icon: '📦' },
]

function WorkspaceToggleMenuItem({
  isWorkspaceView,
  onToggle,
  label,
  className = 'px-4 py-2 text-sm text-gray-700',
}: {
  isWorkspaceView: boolean
  onToggle: () => void
  label: string
  className?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isWorkspaceView}
      onClick={onToggle}
      className={`w-full text-left hover:bg-gray-100 flex items-center justify-between ${className}`}
    >
      <span>🖥️ {label}</span>
      <span
        aria-hidden
        className={`inline-flex h-5 w-9 shrink-0 items-center overflow-hidden rounded-full p-0.5 transition-colors duration-200 ${
          isWorkspaceView ? 'bg-red-500' : 'bg-gray-300'
        }`}
      >
        <span
          className={`block h-3.5 w-3.5 shrink-0 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            isWorkspaceView ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </span>
    </button>
  )
}

interface DashboardLayoutProps {
  children: React.ReactNode
}

function DashboardLayoutContent({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [avatarColor, setAvatarColor] = useState("#cfdbff") // Default color matches Prisma schema
  const [orgLogoUrl, setOrgLogoUrl] = useState<string | null>(null);
  const [isWorkspaceView, setIsWorkspaceView] = useState(false)
  const [isInIframe, setIsInIframe] = useState(false)
  const dynamicPaneRef = useRef<DynamicPaneRef>(null)

  const { startCall } = useCall()

  // Embedded in DynamicPane (query param) or any iframe — never nest workspace view
  useEffect(() => {
    setIsInIframe(window.self !== window.top)
  }, [])

  const isEmbedded = searchParams.get('embed') === '1' || isInIframe
  const showWorkspaceView = isWorkspaceView && !isEmbedded
  const isIntakeTabletMode =
    pathname.startsWith('/dashboard/patients/new') && searchParams.get('mode') === 'tablet'
  const isPatientDetailPage =
    /^\/dashboard\/patients\/[^/]+$/.test(pathname) &&
    !pathname.startsWith('/dashboard/patients/new')
  const isPrintPage = pathname.endsWith('/print')

  // Track iframe windows for state broadcasting
  const iframeWindows = useRef<Set<Window>>(new Set())

  // Initialize task reminders checking - always call the hook but pass isEmbedded flag
  useTaskReminders(isEmbedded)

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

  // If embedded, print view, or clinic tablet intake, return minimal layout without navbar
  if (isEmbedded || isIntakeTabletMode || isPrintPage) {
    return (
      <div className={`${isPrintPage ? 'bg-white' : 'bg-gray-100'} ${isPatientDetailPage ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
        <SafeSearchParams {...{
          children: (
            <main className={`${isPatientDetailPage ? 'h-screen overflow-hidden' : isPrintPage ? 'min-h-screen overflow-auto' : 'h-full overflow-hidden'}`}>
              {isPatientDetailPage ? (
                // Scale down for the workspace pane while keeping layout + scroll sections viewport-sized
                <div className="h-full w-full overflow-hidden">
                  <div
                    className="origin-top-left scale-[0.85]"
                    style={{ width: 'calc(100% / 0.85)', height: 'calc(100% / 0.85)' }}
                  >
                    {children}
                  </div>
                </div>
              ) : (
                children
              )}
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
      <nav className="relative z-50 w-full px-2 bg-white shadow-sm print:hidden overflow-visible">
        <div className="max-w-8xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                {showWorkspaceView ? (
                  <button
                    onClick={() => {
                      router.push('/dashboard');
                    }}
                    className="cursor-pointer"
                  >
                    {orgLogoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={orgLogoUrl} alt="Arca Life" className="h-8 w-auto" />
                    ) : (
                      <span className="text-lg font-bold">Arca Life</span>
                    )}
                  </button>
                ) : (
                  <Link href="/dashboard">
                    {orgLogoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={orgLogoUrl} alt="Arca Life" className="h-8 w-auto" />
                    ) : (
                      <span className="text-lg font-bold">Arca Life</span>
                    )}
                  </Link>
                )}
              </div>
              {!showWorkspaceView && (
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  {navigationItems.map((item) => (
                    <Link
                      key={item.href}
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
                  Bună ziua, {session?.user?.firstName}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <span className="sr-only">Deschide meniul</span>
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: avatarColor }}
                      >
                        {session?.user?.firstName ? (session?.user?.firstName[0] + session?.user?.lastName[0]).toUpperCase() : ''}
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 z-[100]">
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/profile">
                        👤 Profilul meu
                      </Link>
                    </DropdownMenuItem>
                    {(session?.user?.role === 'ORGANIZATION_OWNER' || session?.user?.role === 'MANAGER') && (
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/manager">
                          🛠️ Panou manager
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onSelect={(event) => event.preventDefault()}
                      className="p-0 focus:bg-transparent data-[highlighted]:bg-transparent"
                    >
                      <WorkspaceToggleMenuItem
                        isWorkspaceView={isWorkspaceView}
                        onToggle={handleWorkspaceToggle}
                        label="Vizualizare spațiu de lucru"
                      />
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => signOut({ callbackUrl: '/login' })}
                    >
                      🚪 Deconectare
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            {!showWorkspaceView && (
              <div className="-mr-2 flex items-center sm:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                >
                  <span className="sr-only">Deschide meniul</span>
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
          {isMobileMenuOpen && !showWorkspaceView && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="sm:hidden"
            >
              <div className="pt-2 pb-3 space-y-1">
                {navigationItems.map((item) => (
                  <Link
                    key={item.href}
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
                  <Link
                    href="/dashboard/profile"
                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Profilul meu
                  </Link>
                  {(session?.user?.role === 'ORGANIZATION_OWNER' || session?.user?.role === 'MANAGER') && (
                    <Link
                      href="/dashboard/manager"
                      className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      🛠️ Panou manager
                    </Link>
                  )}
                  <WorkspaceToggleMenuItem
                    isWorkspaceView={isWorkspaceView}
                    onToggle={handleWorkspaceToggle}
                    label="Vizualizare spațiu de lucru"
                    className="px-4 py-2 text-base font-medium text-gray-500"
                  />
                  <button
                    onClick={() => {
                      signOut({ callbackUrl: '/login' })
                    }}
                    className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  >
                    Deconectare
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
          <main className={showWorkspaceView
            ? "relative z-0 h-[calc(100vh-4rem)] overflow-hidden"
            : isPatientDetailPage
              ? "relative z-0 h-[calc(100vh-4rem)] overflow-hidden px-2 py-1"
              : "relative z-0 max-w-8xl py-6 sm:px-6 lg:px-8"
          }>
            {showWorkspaceView ? (
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

      {/* Floating widgets - hidden when printing */}
      <div className="print:hidden">
        <SupportWidget />
        <CallPlayer />
      </div>
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