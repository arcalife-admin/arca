"use client";

import React, { useState, useEffect } from 'react';

interface DynamicPaneProps {
  className?: string;
}

const pageOptions = [
  { label: '📅 Week Calendar', value: 'weekCalendar' },
  { label: '⚙️📅 Calendar Settings', value: 'calendarSettings' },
  { label: '👥 Patients', value: 'patients' },
  { label: '🦷 Imaging', value: 'imaging' },
  { label: '💬 Chat', value: 'chat' },
  { label: '💊 Pharmacology', value: 'pharmacology' },
  { label: '💰 Finance', value: 'finance' },
  { label: '📦 Orders', value: 'orders' },
  { label: '🎧 Radio', value: 'radio' },
  { label: '⏰ Timer', value: 'timer' },
  { label: '✅ Tasks', value: 'tasks' },
  { label: '📞 Phone Calls', value: 'phoneCalls' },
  { label: '⚙️👤 Personal Settings', value: 'personalSettings' },
  // { label: '⚙️🏢 Organization Settings', value: 'organizationSettings' },
];

const pathMap: Record<string, string> = {
  patients: '/dashboard/patients',
  calendarSettings: '/dashboard/calendar-settings',
  imaging: '/dashboard/imaging',
  chat: '/dashboard/chat',
  pharmacology: '/dashboard/pharma-guide',
  finance: '/dashboard/finance',
  orders: '/dashboard/orders',
  radio: '/dashboard/radio',
  timer: '/dashboard/timer',
  tasks: '/dashboard/tasks',
  phoneCalls: '/dashboard/phone-calls',
  personalSettings: '/dashboard/profile',
  organizationSettings: '/dashboard/settings',
};

const DynamicPane: React.FC<DynamicPaneProps> = ({ className }) => {
  const [selected, setSelected] = useState('weekCalendar');
  const [patientId, setPatientId] = useState<string | null>(null);

  // Allow embedded pages (rendered inside the iframe) to ask the parent
  // DynamicPane to switch the currently displayed pane. They can do this by
  // calling: `window.parent.postMessage({ type: 'openPane', pane: '<value>' }, '*')`.
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

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
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
};

export default DynamicPane; 