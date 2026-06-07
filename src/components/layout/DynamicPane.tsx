"use client";

import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { usePathname } from 'next/navigation';

interface DynamicPaneProps {
  className?: string;
}

export interface DynamicPaneRef {
  navigateTo: (pane: string, patientId?: string) => void;
}

const pageOptions = [
  { label: '🏠 Panou principal', value: 'dashboard' },
  { label: '📅 Calendar săptămânal', value: 'weekCalendar' },
  { label: '⚙️📅 Setări calendar', value: 'calendarSettings' },
  { label: '👥 Pacienți', value: 'patients' },
  { label: '💬 Chat', value: 'chat' },
  { label: '💊 Farmacologie', value: 'pharmacology' },
  { label: '💰 Finanțe', value: 'finance' },
  { label: '📦 Comenzi', value: 'orders' },
  { label: '✅ Sarcini', value: 'tasks' },
  { label: '📞 Apeluri telefonice', value: 'phoneCalls' },
  { label: '⚙️👤 Setări personale', value: 'personalSettings' },
  { label: '🛠️ Panou manager', value: 'manager' },
  // { label: '⚙️🏢 Organization Settings', value: 'organizationSettings' },
];

const pathMap: Record<string, string> = {
  dashboard: '/dashboard',
  patients: '/dashboard/patients',
  calendarSettings: '/dashboard/calendar-settings',
  chat: '/dashboard/chat',
  pharmacology: '/dashboard/pharma-guide',
  finance: '/dashboard/finance',
  orders: '/dashboard/orders',
  tasks: '/dashboard/tasks',
  phoneCalls: '/dashboard/phone-calls',
  personalSettings: '/dashboard/profile',
  manager: '/dashboard/manager',
  organizationSettings: '/dashboard/settings',
};

function pathnameToPane(pathname: string): { pane: string; patientId?: string } {
  if (pathname === '/dashboard') {
    return { pane: 'dashboard' };
  }

  const patientMatch = pathname.match(/^\/dashboard\/patients\/([^/]+)$/);
  if (patientMatch && patientMatch[1] !== 'new') {
    return { pane: 'patient', patientId: patientMatch[1] };
  }

  if (pathname.startsWith('/dashboard/appointments')) {
    return { pane: 'weekCalendar' };
  }

  // Match longest paths first — /dashboard/profile must not match /dashboard
  const entries = Object.entries(pathMap)
    .filter(([pane]) => pane !== 'dashboard')
    .sort(([, a], [, b]) => b.length - a.length);

  for (const [pane, path] of entries) {
    if (pathname === path || pathname.startsWith(`${path}/`)) {
      return { pane };
    }
  }

  return { pane: 'dashboard' };
}

const DynamicPane = forwardRef<DynamicPaneRef, DynamicPaneProps>(({ className }, ref) => {
  const pathname = usePathname();
  const [selected, setSelected] = useState('dashboard');
  const [patientId, setPatientId] = useState<string | null>(null);

  // Keep the workspace pane in sync with URL navigation (e.g. profile, manager links)
  useEffect(() => {
    const { pane, patientId: pid } = pathnameToPane(pathname);
    setSelected(pane);
    setPatientId(pane === 'patient' && pid ? pid : null);
  }, [pathname]);

  // Expose navigation method via ref
  useImperativeHandle(ref, () => ({
    navigateTo: (pane: string, patientIdParam?: string) => {
      setSelected(pane);
      if (pane === 'patient' && patientIdParam) {
        setPatientId(patientIdParam);
      } else {
        setPatientId(null);
      }
    }
  }));

  // Allow embedded pages (rendered inside the iframe) to ask the parent
  // DynamicPane to switch the currently displayed pane. They can do this by
  // calling: `window.parent.postMessage({ type: 'openPane', pane: '<value>' }, '*')`.
  // Also supports CustomEvent for same-window communication.
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'openPane' && typeof event.data.pane === 'string') {
        setSelected(event.data.pane);
        // Handle patient-specific navigation
        if (event.data.pane === 'patient' && event.data.patientId) {
          setPatientId(event.data.patientId);
        } else {
          setPatientId(null);
        }
      }
    };

    const handleCustomEvent = (event: CustomEvent) => {
      if (event.detail?.type === 'openPane' && typeof event.detail.pane === 'string') {
        setSelected(event.detail.pane);
        // Handle patient-specific navigation
        if (event.detail.pane === 'patient' && event.detail.patientId) {
          setPatientId(event.detail.patientId);
        } else {
          setPatientId(null);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('dynamicPaneNavigate', handleCustomEvent as EventListener);
    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('dynamicPaneNavigate', handleCustomEvent as EventListener);
    };
  }, []);

  const renderContent = () => {
    let src: string | undefined;

    if (selected === 'weekCalendar') {
      src = '/dashboard/appointments?view=week&embed=1';
    } else if (selected === 'patient' && patientId) {
      src = `/dashboard/patients/${patientId}?embed=1`;
    } else if (pathMap[selected]) {
      src = `${pathMap[selected]}?embed=1`;
    }

    if (src) {
      return (
        <iframe
          key={src}
          src={src}
          className="w-full h-full border-0 block"
          title={selected}
        />
      );
    }
    return <p className="p-4">Selecție necunoscută</p>;
  };

  return (
    <div className={`flex flex-col h-full w-full ${className || ''}`.trim()}>
      {/* Selector */}
      <div className="border-b p-1 bg-gray-50">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="w-full p-1 border rounded"
        >
          <option value="">Selectați un panou</option>
          {pageOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-hidden bg-white">{renderContent()}</div>
    </div>
  );
});

DynamicPane.displayName = 'DynamicPane';

export default DynamicPane; 