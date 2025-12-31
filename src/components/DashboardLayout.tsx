'use client';

import React, { useState, ReactNode, Suspense, useEffect } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname, useSearchParams } from 'next/navigation'

// New imports for layout
import SplitPane from '@/components/layout/SplitPane'
import TodayAppointments from '@/components/TodayAppointments'

interface DashboardLayoutProps {
  children: ReactNode
}

interface LayoutPropsWithSearchParams {
  children: ReactNode;
  isEmbed: boolean;
  isWorkspace: boolean;
  pathname: string | null;
}

// This component safely uses useSearchParams inside Suspense
function LayoutWithSearchParams({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const isEmbed = searchParams.get('embed') === '1';
  const isWorkspace = pathname?.includes('/workspace');

  return (
    <main className={`${isEmbed || isWorkspace || pathname?.includes('/patients/') ? '' : 'max-w-8xl mx-auto py-6 sm:px-6 lg:px-8'}`}>
      {children}
    </main>
  );
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { data: session } = useSession()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const pathname = usePathname()
  const [avatarColor, setAvatarColor] = useState("#cfdbff") // Default color matches Prisma schema

  // Fetch user's calendar settings for the avatar color
  useEffect(() => {
    const fetchUserSettings = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch('/api/calendar-settings/personal');
          if (response.ok) {
            const data = await response.json();
            // Set the color regardless of whether data.color exists or not
            // The API already returns the default color if no settings exist
            setAvatarColor(data.color || "#cfdbff");
          }
        } catch (error) {
          // Fall back to default color on error
          console.error('Error fetching calendar settings:', error);
        }
      }
    };

    fetchUserSettings();
  }, [session?.user?.id]);

  // Calculate what will be displayed in the UI
  const displayName = session?.user?.firstName || 'User'
  const getInitials = () => {
    // First try firstName and lastName
    if (session?.user?.firstName && session?.user?.lastName) {
      return `${session.user.firstName[0]}${session.user.lastName[0]}`.toUpperCase();
    }

    // Then try email (first letter + another letter)
    if (session?.user?.email) {
      const emailParts = session.user.email.split('@');
      if (emailParts[0].length > 1) {
        return `${emailParts[0][0]}${emailParts[0][1]}`.toUpperCase();
      }
      return emailParts[0][0].toUpperCase();
    }

    // Fallback
    return 'U';
  };

  const initials = getInitials();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Patients', href: '/dashboard/patients' },
    { name: 'Families', href: '/dashboard/families' },
    { name: 'Appointments', href: '/dashboard/appointments' },
    { name: 'Settings', href: '/dashboard/settings' },
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/dashboard" className="text-xl font-bold text-blue-600">
                  Dentiva
                </Link>
              </div>
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
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center">
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
                >
                  <span className="mr-2">Hello, {displayName}</span>
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: avatarColor }}
                  >
                    {initials}
                  </div>
                </button>
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <Link
                      href="/dashboard/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Your Profile
                    </Link>
                    <button
                      onClick={() => signOut()}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Content area with resizable today-appointments side panel */}
      <div style={{ height: 'calc(100vh - 4rem)' /* 4rem ~= 64px (nav height) */ }}>
        <SplitPane
          initialPrimarySize={750}
          minPrimarySize={400}
          direction="horizontal"
          children={[
            <main className="w-full h-full overflow-auto p-6 bg-gray-50" key="main">
              {children}
            </main>,
            <TodayAppointments key="today-appointments" />
          ]}
        />
      </div>
    </div>
  )
}

function DashboardMainContent({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="p-4">Loading content...</div>}>
      <LayoutWithSearchParams {...{
        children: (
          <main className="max-w-8xl py-6 sm:px-6 lg:px-8">
            {children}
          </main>
        )
      }}>
        {children}
      </LayoutWithSearchParams>
    </Suspense>
  );
}

export { DashboardMainContent };
export default DashboardLayout; 