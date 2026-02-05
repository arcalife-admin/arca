"use client";

import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';

interface DynamicPaneProps {
  className?: string;
}

export interface DynamicPaneRef {
  navigateTo: (pane: string, patientId?: string) => void;
}

const pageOptions = [
  { label: '🏠 Dashboard', value: 'dashboard' },
  { label: '📅 Week Calendar', value: 'weekCalendar' },
  { label: '⚙️📅 Calendar Settings', value: 'calendarSettings' },
  { label: '👥 Patients', value: 'patients' },
  { label: '📸 Imaging', value: 'imaging' },
  { label: '💬 Chat', value: 'chat' },
  { label: '💊 Pharmacology', value: 'pharmacology' },
  { label: '💰 Finance', value: 'finance' },
  { label: '📦 Orders', value: 'orders' },
  { label: '✅ Tasks', value: 'tasks' },
  { label: '📞 Phone Calls', value: 'phoneCalls' },
  { label: '⚙️👤 Personal Settings', value: 'personalSettings' },
  // { label: '⚙️🏢 Organization Settings', value: 'organizationSettings' },
];

const pathMap: Record<string, string> = {
  dashboard: '/dashboard',
  patients: '/dashboard/patients',
  calendarSettings: '/dashboard/calendar-settings',
  imaging: '/dashboard/imaging',
  chat: '/dashboard/chat',
  pharmacology: '/dashboard/pharma-guide',
  finance: '/dashboard/finance',
  orders: '/dashboard/orders',
  tasks: '/dashboard/tasks',
  phoneCalls: '/dashboard/phone-calls',
  personalSettings: '/dashboard/profile',
  organizationSettings: '/dashboard/settings',
};

const DynamicPane = forwardRef<DynamicPaneRef, DynamicPaneProps>(({ className }, ref) => {
  const [selected, setSelected] = useState('dashboard');
  const [patientId, setPatientId] = useState<string | null>(null);

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
    return <p className="p-4">Unknown selection</p>;
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
          <option value="">Select a pane</option>
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