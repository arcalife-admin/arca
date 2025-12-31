'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AppointmentForm } from '@/components/appointments/AppointmentForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Patient } from '@/types/database';
import { treatmentTypes } from '@/data/treatmentTypes';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, isWithinInterval, addMonths, endOfMonth, startOfMonth, addDays, isSameDay } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Appointment, PendingAppointment } from '@/types/appointment';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { useSession } from 'next-auth/react';
import { Settings, ArrowLeft, ArrowRight, Calendar as CalendarIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { convertPendingToAppointment } from '@/lib/appointments';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EnhancedAppointmentForm } from '@/components/appointments/EnhancedAppointmentForm';
import { AppointmentStatusMetadata, getStatusDisplay } from '@/types/appointment-status';

const daysOfWeek = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

import { enUS } from 'date-fns/locale';
const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date) => startOfWeek(date, { weekStartsOn: 1 }), // 1 represents Monday
  getDay,
  locales
});

const DnDCalendar = withDragAndDrop(Calendar);

type ClipboardAction = 'copy' | 'cut' | null;
type ClipboardData = {
  appointment: Appointment;
  action: ClipboardAction;
} | null;

type PendingContextMenuState = { x: number; y: number; pending: PendingAppointment } | null;

export default function TodayAppointments() {
  const { data: session } = useSession();
  const router = useRouter();
  const [pendingAppointments, setPendingAppointments] = useState<PendingAppointment[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Partial<Appointment> | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [practitioners, setPractitioners] = useState<any[]>([]);
  const [practitionerSchedule, setPractitionerSchedule] = useState<{ [day: string]: string[] }>({});
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedPractitionerId, setSelectedPractitionerId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tooltipData, setTooltipData] = useState<{ content: React.ReactNode; x: number; y: number } | null>(null);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout>();
  const tooltipPositionRef = useRef<{ x: number; y: number } | null>(null);
  const isOverAppointmentRef = useRef(false);
  const [scheduleRules, setScheduleRules] = useState<any[]>([]);
  const [availablePractitionerIds, setAvailablePractitionerIds] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<number>(3);
  const [searchQuery, setSearchQuery] = useState('');
  const [calendarColor, setCalendarColor] = useState<string | null>(null);
  const [colorLoaded, setColorLoaded] = useState(false);
  const [visibleDays, setVisibleDays] = useState<string[]>(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);
  const tooltipAnimationFrame = useRef<number>();
  const [clipboardData, setClipboardData] = useState<ClipboardData>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    appointment: Appointment;
  } | null>(null);
  const [slotContextMenu, setSlotContextMenu] = useState<{
    x: number;
    y: number;
    slotDate: Date;
    resourceId: string | null;
  } | null>(null);
  const calendarContainerRef = useRef<HTMLDivElement>(null);
  const [pendingContextMenu, setPendingContextMenu] = useState<PendingContextMenuState>(null);

  useEffect(() => {
    const fetchColor = async () => {
      const res = await fetch('/api/calendar-settings/personal');
      if (res.ok) {
        const data = await res.json();
        if (data?.color) {
          setCalendarColor(data.color);
          document.documentElement.style.setProperty('--calendar-today-bg', data.color);
        } else {
          setCalendarColor('#adaae1');
          document.documentElement.style.setProperty('--calendar-today-bg', '#adaae1');
        }
        if (data?.visibleDays) {
          setVisibleDays(data.visibleDays);
        }
      } else {
        setCalendarColor('#adaae1');
        document.documentElement.style.setProperty('--calendar-today-bg', '#adaae1');
      }
      setColorLoaded(true);
    };
    fetchColor();
  }, []);

  useEffect(() => {
    if (calendarColor) {
      document.documentElement.style.setProperty('--calendar-today-bg', calendarColor);
    }
  }, [calendarColor]);

  const getAvailablePractitioners = (date: Date) => {
    // Find applicable schedule rules for the given date
    const applicableRules = scheduleRules.filter(rule => {
      const ruleStart = new Date(rule.startDate);
      const ruleEnd = new Date(rule.endDate);
      return isWithinInterval(date, { start: ruleStart, end: ruleEnd });
    });

    if (applicableRules.length === 0) {
      return practitioners; // If no rules apply, show all practitioners
    }

    // Get the day of week for the date
    const dayOfWeek = format(date, 'EEEE');

    // Find practitioners assigned for this day
    const availablePractitioners = new Set<string>();

    applicableRules.forEach(rule => {
      if (rule.repeatType === 'weekly' && rule.daysOfWeek.includes(dayOfWeek)) {
        // For weekly rules, check the schedule for the specific day
        const daySchedule = rule.schedule?.[dayOfWeek];
        if (daySchedule) {
          Object.values(daySchedule).forEach((room: any) => {
            if (room.userId) {
              availablePractitioners.add(room.userId);
            }
          });
        }
      } else if (rule.repeatType === 'daily') {
        // For daily rules, check the 'ALL' schedule
        const allSchedule = rule.schedule?.['ALL'];
        if (allSchedule) {
          Object.values(allSchedule).forEach((room: any) => {
            if (room.userId) {
              availablePractitioners.add(room.userId);
            }
          });
        }
      }
    });

    // If no practitioners are assigned in the rules, show all practitioners
    if (availablePractitioners.size === 0) {
      return practitioners;
    }

    // Filter practitioners based on the schedule rules
    return practitioners.filter(p => availablePractitioners.has(p.id));
  };

  const getAvailableResourcesForCurrentDate = () => {
    const practitionerIdSet = new Set(availablePractitionerIds);
    return resources.filter(resource => practitionerIdSet.has(resource.resourceId));
  };

  useEffect(() => {
    if (session?.user?.id) {
      setSelectedPractitionerId(session.user.id);
      setAvailablePractitionerIds([session.user.id]);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchPractitioners();
    fetchPatients();
    fetchPendingAppointments();
    fetchScheduleRules();
    fetchCalendarSettings();
  }, []);

  useEffect(() => {
    if (selectedPractitionerId) {
      fetchAppointments();
    }
  }, [selectedPractitionerId]);

  useEffect(() => {
    const practitioners = getAvailablePractitioners(currentDate);
    setAvailablePractitionerIds(practitioners.map(p => p.id));
  }, [currentDate, scheduleRules]);

  const fetchPractitioners = async () => {
    try {
      // Always use the logged-in user as the sole practitioner for the day view
      if (!session?.user?.id) return;

      setPractitioners([{ id: session.user.id, name: `${session.user.firstName} ${session.user.lastName}` || 'You' }]);
      setAvailablePractitionerIds([session.user.id]);

      // Initialize practitioner schedule if empty
      setPractitionerSchedule(prev => {
        if (Object.keys(prev).length === 0) {
          const initial: { [day: string]: string[] } = {};
          daysOfWeek.forEach(day => { initial[day] = [session.user.id]; });
          return initial;
        }
        return prev;
      });
    } catch (error) {
      toast.error('Failed to initialize practitioner information');
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await fetch('/api/patients');
      const data = await response.json();
      setPatients(data);
    } catch (error) {
      toast.error('Failed to fetch patients');
    }
  };

  const fetchPendingAppointments = async () => {
    try {
      const response = await fetch('/api/pending-appointments');
      const data = await response.json();
      setPendingAppointments(data);
    } catch (error) {
      toast.error('Failed to fetch pending appointments');
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/appointments'); // No filters
      const data = await response.json();
      setAppointments(data);
    } catch (error) {
      toast.error('Failed to fetch appointments');
    }
  };

  const fetchScheduleRules = async () => {
    try {
      const response = await fetch('/api/calendar-settings');
      if (response.ok) {
        const data = await response.json();
        setScheduleRules(data);
      }
    } catch (error) {
      console.error('Error fetching schedule rules:', error);
    }
  };

  const fetchCalendarSettings = async () => {
    try {
      const response = await fetch('/api/calendar-settings/personal');
      if (response.ok) {
        const data = await response.json();
        if (data?.color) {
          setCalendarColor(data.color);
          document.documentElement.style.setProperty('--calendar-today-bg', data.color);
        }
        if (data?.visibleDays) {
          setVisibleDays(data.visibleDays);
        }
      }
    } catch (error) {
      console.error('Error fetching calendar settings:', error);
    }
  };

  // Broadcast to other panes that appointments changed
  function broadcastRefresh() {
    try {
      localStorage.setItem('appointments_refresh', Date.now().toString());
    } catch { }
  }

  const handleFormSubmit = async (appointment: Partial<Appointment>) => {
    try {
      const payload = {
        ...appointment,
        startTime: appointment.startTime instanceof Date ? appointment.startTime.toISOString() : appointment.startTime,
        endTime: appointment.endTime instanceof Date ? appointment.endTime.toISOString() : appointment.endTime,
        patientId: appointment.patientId,
        practitionerId: appointment.practitionerId,
        status: appointment.status || 'SCHEDULED'
      };

      const response = await fetch('/api/appointments', {
        method: appointment.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to save appointment');
      // Always refresh appointments from the server after save
      await fetchAppointments();
      toast.success(`Appointment ${appointment.id ? 'updated' : 'created'} successfully`);
      setIsFormOpen(false);
      broadcastRefresh();
    } catch (error) {
      toast.error('Failed to save appointment');
      fetchAppointments();
    }
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setSelectedAppointment(null);
    setSelectedDate(null);
  };

  const resources = practitioners.map(practitioner => ({
    resourceId: practitioner.id,
    resourceTitle: practitioner.name,
  }));

  const events = appointments
    .filter(appt => appt.startTime && appt.endTime)
    .map(appt => {
      const patient = patients.find(p => p.id === appt.patientId);
      const title = patient
        ? `${patient.firstName} ${patient.lastName}`
        : 'Unknown Patient';

      const type = typeof appt.type === 'object' && appt.type !== null
        ? appt.type
        : treatmentTypes.find(t => t.name === String(appt.type));

      return {
        id: appt.id,
        title,
        start: new Date(appt.startTime),
        end: new Date(appt.endTime),
        resourceId: appt.practitionerId,
        allDay: false,
        appointment: appt,
        patient,
        tooltip: [
          <span key="type" style={{ color: type?.color || '#60a5fa' }}>
            {type?.name || 'Appointment'}
          </span>,
          appt.notes && <div key="notes">{appt.notes}</div>,
          patient?.phone && <div key="phone">{patient.phone}</div>
        ].filter(Boolean)
      };
    });

  const filteredResources = getAvailableResourcesForCurrentDate();
  const filteredEvents = events.filter(event => {
    // Filter by search query
    if (!searchQuery.trim()) return true;
    const search = searchQuery.trim().toLowerCase();
    const patient = event.patient;
    if (!patient) return false;

    return [
      `${patient.firstName} ${patient.lastName}`,
      patient.email || '',
      patient.phone || '',
      patient.address || '',
      patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : '',
    ].some(field => String(field).toLowerCase().includes(search));
  });

  // Disable the default context menu globally
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    window.addEventListener('contextmenu', handleContextMenu);
    return () => window.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  // Update handleDateSelect to immediately paste if clipboardData exists and it's a right-click
  const handleDateSelect = (selectInfo: any) => {
    const date = new Date(selectInfo.start);
    // If right-click and clipboardData exists, immediately paste
    if (selectInfo.action === 'contextMenu' && clipboardData) {
      // Paste the appointment at this cell
      const duration = clipboardData.appointment.duration || 30;
      const endTime = new Date(date.getTime() + duration * 60000);
      handleFormSubmit({
        ...clipboardData.appointment,
        id: undefined,
        startTime: date,
        endTime,
        practitionerId: selectInfo.resourceId || clipboardData.appointment.practitionerId,
      });
      // If it was a cut, clear clipboard after paste
      if (clipboardData.action === 'cut') setClipboardData(null);
      return;
    }
    if (selectInfo.action === 'contextMenu') {
      setContextMenu({
        x: selectInfo.clientX,
        y: selectInfo.clientY,
        appointment: {
          startTime: date,
          endTime: new Date(date.getTime() + 30 * 60000),
          practitionerId: selectInfo.resourceId || selectedPractitionerId,
        } as Appointment,
      });
      return;
    }
    // Left-click: open modal as usual
    setSelectedDate(date);
    setSelectedAppointment(null);
    setIsFormOpen(true);
  };

  const handleViewChange = (newView: string) => {
    // No-op since we only support day view
  };

  const clearTooltip = () => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = undefined;
    }
    setTooltipData(null);
    tooltipPositionRef.current = null;
    isOverAppointmentRef.current = false;
  };

  useEffect(() => {
    const handleGlobal = (e: MouseEvent) => {
      const tooltipElement = document.querySelector('.tooltip-container');
      if (tooltipElement?.contains(e.target as Node)) {
        return;
      }
      clearTooltip();
    };

    const handleScroll = () => clearTooltip();
    const handleResize = () => clearTooltip();
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearTooltip();
      }
    };

    window.addEventListener('mousedown', handleGlobal);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('mousedown', handleGlobal);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  // Function to set date range
  const handleDateRange = (months: number) => {
    setDateRange(months);
  };

  // Update this function to refresh resources when date changes
  const handleDateChange = (date: Date) => {
    setCurrentDate(date);
  };

  // Calculate the date range limits
  const getDateRangeLimits = () => {
    const start = new Date();
    const end = addMonths(new Date(), dateRange);
    return { start, end };
  };

  // Update date range when it changes
  useEffect(() => {
    // Always fetch appointments since we're in day view
    fetchAppointments();
  }, [dateRange]);

  // Handle adding a pending appointment to a practitioner's calendar
  const handleAddToPractitioner = async (appointment: any, practitionerId: string) => {
    try {
      const result = await convertPendingToAppointment(appointment, practitionerId);
      if (result) {
        toast.success('Appointment assigned successfully');
        fetchPendingAppointments();
        fetchAppointments();
      } else {
        toast.error('Failed to assign appointment');
      }
    } catch (error) {
      toast.error('Error assigning appointment');
    }
  };

  const updateTooltipPosition = (x: number, y: number) => {
    if (tooltipAnimationFrame.current) {
      cancelAnimationFrame(tooltipAnimationFrame.current);
    }

    tooltipAnimationFrame.current = requestAnimationFrame(() => {
      setTooltipData(prev => prev && ({
        ...prev,
        x,
        y
      }));
    });
  };

  // NEW: Send confirmation email to patient
  const handleSendConfirmationEmail = async (appointment: Appointment) => {
    try {
      const res = await fetch('/api/appointments/send-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: appointment.patientId }),
      });
      if (!res.ok) throw new Error('Request failed');
      toast.success('Confirmation email sent');
    } catch (error) {
      console.error('Error sending confirmation email', error);
      toast.error('Failed to send confirmation email');
    }
  };

  // NEW: Print ticket helper
  const handlePrintTicket = (appointment: Appointment, includeAllFuture: boolean) => {
    try {
      const now = new Date();
      const patientAppointments = appointments.filter(a => a.patientId === appointment.patientId && new Date(a.startTime) >= now);
      const list = includeAllFuture ? patientAppointments : [appointment];
      const patient = patients.find(p => p.id === appointment.patientId);
      const html = `<!DOCTYPE html>
        <html><head><title>Appointment Ticket</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { font-size: 20px; margin-bottom: 10px; }
          ul { list-style: none; padding: 0; }
          li { margin-bottom: 6px; }
        </style></head><body>
        <h1>${patient ? `${patient.firstName} ${patient.lastName}` : 'Patient'} – Appointments</h1>
        <ul>
          ${list.map(appt => `<li><strong>${new Date(appt.startTime).toLocaleString()}</strong> – ${appt.type}</li>`).join('')}
        </ul>
        </body></html>`;
      const printWindow = window.open('', '_blank', 'width=600,height=800');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        // Delay print slightly to ensure content is rendered
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    } catch (error) {
      console.error('Error printing ticket', error);
      toast.error('Failed to print ticket');
    }
  };

  const ContextMenu = ({ x, y, appointment, onClose }: {
    x: number;
    y: number;
    appointment: Appointment;
    onClose: () => void;
  }) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
          onClose();
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const handleOpenPatientCard = () => {
      if (appointment.patientId && window.parent) {
        // TodayAppointments is designed to be embedded, so always use DynamicPane messaging
        window.parent.postMessage({
          type: 'openPane',
          pane: 'patient',
          patientId: appointment.patientId
        }, '*');
        onClose();
      }
    };

    const handleSendToPending = async () => {
      try {
        // Create a clean pending appointment object with proper date handling
        const pendingAppointmentData = {
          patientId: appointment.patientId,
          type: appointment.type,
          duration: appointment.duration || 30, // Ensure we have a default duration
          notes: appointment.notes,
          status: 'PENDING',
          priority: 'medium',
          startTime: appointment.startTime instanceof Date ? appointment.startTime.toISOString() : appointment.startTime,
          endTime: appointment.endTime instanceof Date ? appointment.endTime.toISOString() : appointment.endTime,
          practitionerId: null
        };

        const response = await fetch('/api/pending-appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pendingAppointmentData),
        });

        if (!response.ok) throw new Error('Failed to create pending appointment');

        // Delete the original appointment
        await fetch(`/api/appointments?id=${appointment.id}`, {
          method: 'DELETE',
        });

        // Update both lists immediately
        await Promise.all([
          fetchAppointments(),
          fetchPendingAppointments()
        ]);

        toast.success('Appointment moved to pending');
        broadcastRefresh();
        onClose();
      } catch (error) {
        console.error('Error creating pending appointment:', error);
        toast.error('Failed to move appointment to pending');
      }
    };

    const handleCopy = () => {
      setClipboardData({ appointment, action: 'copy' });
      onClose();
    };

    const handleCut = () => {
      setClipboardData({ appointment, action: 'cut' });
      onClose();
    };

    const handlePaste = async () => {
      if (!clipboardData) return;

      try {
        const response = await fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...clipboardData.appointment,
            id: undefined, // Remove the ID to create a new appointment
            startTime: appointment.startTime,
            endTime: appointment.endTime,
            practitionerId: appointment.practitionerId,
          }),
        });

        if (!response.ok) throw new Error('Failed to paste appointment');

        if (clipboardData.action === 'cut') {
          // Delete the original appointment
          await fetch(`/api/appointments?id=${clipboardData.appointment.id}`, {
            method: 'DELETE',
          });
          setClipboardData(null);
        }

        toast.success('Appointment pasted successfully');
        // Immediately fetch appointments to update the calendar
        await fetchAppointments();
        onClose();
      } catch (error) {
        toast.error('Failed to paste appointment');
      }
    };

    return (
      <div
        ref={menuRef}
        className="fixed z-[9999] bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[150px]"
        style={{ left: x, top: y }}
      >
        <button
          className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm font-medium text-blue-600"
          onClick={handleOpenPatientCard}
        >
          Open patient card
        </button>
        <button
          className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
          onClick={handleSendToPending}
        >
          Send to pending
        </button>
        <button
          className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
          onClick={handleCopy}
        >
          Copy
        </button>
        <button
          className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
          onClick={handleCut}
        >
          Cut
        </button>
        {clipboardData && (
          <button
            className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
            onClick={handlePaste}
          >
            Paste
          </button>
        )}
        {/* NEW OPTIONS */}
        <button
          className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
          onClick={() => { handleSendConfirmationEmail(appointment); onClose(); }}
        >
          Send confirmation email
        </button>
        <button
          className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
          onClick={() => { handlePrintTicket(appointment, false); onClose(); }}
        >
          Print ticket (selected)
        </button>
        <button
          className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
          onClick={() => { handlePrintTicket(appointment, true); onClose(); }}
        >
          Print ticket (all future)
        </button>
      </div>
    );
  };

  // Add a handler to show the custom context menu on empty space
  const handleCalendarContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only trigger if not right-clicking on an appointment (let appointment handler take precedence)
    // We'll always show the menu for simplicity
    e.preventDefault();
    if (clipboardData) {
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        appointment: {
          // Provide a minimal appointment object for paste
          startTime: currentDate,
          endTime: new Date(currentDate.getTime() + 30 * 60000),
          practitionerId: null,
        } as Appointment,
      });
    }
  };

  // Helper to compute slot date from mouse position within a column
  const getSlotDateFromPosition = (e: MouseEvent, columnEl: HTMLElement | null): Date => {
    const dayDate = columnEl?.getAttribute('data-date')
      ? new Date(columnEl.getAttribute('data-date')!)
      : new Date(currentDate);

    // Our calendar shows from 6:00 to 22:00
    const minMinutes = 6 * 60;
    const maxMinutes = 22 * 60;
    const totalMinutes = maxMinutes - minMinutes;

    if (!columnEl) return new Date(dayDate);

    const rect = columnEl.getBoundingClientRect();
    const yPct = Math.min(Math.max((e.clientY - rect.top) / rect.height, 0), 1);
    const minutesFromStart = Math.floor((yPct * totalMinutes) / 5) * 5; // round to 5-min slot
    const minutesOfDay = minMinutes + minutesFromStart;

    const date = new Date(dayDate);
    date.setHours(0, 0, 0, 0);
    date.setMinutes(minutesOfDay);
    return date;
  };

  // Add right-click support for empty calendar cells
  useEffect(() => {
    const handleSlotContextMenu = (e: MouseEvent) => {
      // Ignore event cells
      if ((e.target as HTMLElement).closest('.rbc-event')) return;

      // Ensure click inside calendar
      if (!calendarContainerRef.current || !calendarContainerRef.current.contains(e.target as Node)) return;

      e.preventDefault();

      // Identify column element (time column/day slot)
      const colEl = (e.target as HTMLElement).closest('.rbc-time-column, .rbc-day-slot') as HTMLElement | null;
      if (!colEl) return;

      const resourceId = selectedPractitionerId;
      const slotDate = getSlotDateFromPosition(e, colEl);

      setSlotContextMenu({
        x: e.clientX,
        y: e.clientY,
        slotDate,
        resourceId,
      });
      setContextMenu(null);
    };
    document.addEventListener('contextmenu', handleSlotContextMenu, true);
    return () => document.removeEventListener('contextmenu', handleSlotContextMenu, true);
  }, [clipboardData, selectedPractitionerId, currentDate]);

  // Minimal context menu for empty slots
  const SlotContextMenu = ({ x, y, slotDate, resourceId, onClose }: {
    x: number;
    y: number;
    slotDate: Date;
    resourceId: string | null;
    onClose: () => void;
  }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
      const handleOutside = (ev: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(ev.target as Node)) {
          onClose();
        }
      };
      document.addEventListener('mousedown', handleOutside);
      return () => document.removeEventListener('mousedown', handleOutside);
    }, [onClose]);

    return (
      <div
        ref={menuRef}
        className="fixed z-[9999] bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[100px]"
        style={{ left: x, top: y }}
      >
        <button
          className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm disabled:opacity-50"
          disabled={!clipboardData}
          onClick={async () => {
            if (!clipboardData) return;
            const duration = clipboardData.appointment.duration || 30;
            const endTime = new Date(slotDate.getTime() + duration * 60000);
            await handleFormSubmit({
              ...clipboardData.appointment,
              id: undefined,
              startTime: slotDate,
              endTime,
              practitionerId: resourceId,
              status: 'SCHEDULED',
            });
            if (clipboardData.action === 'cut') setClipboardData(null);
            onClose();
          }}
        >
          Paste
        </button>
      </div>
    );
  };

  const PendingMenu = ({ x, y, pending, onClose }: { x: number; y: number; pending: PendingAppointment; onClose: () => void }) => {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => { const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) { onClose(); } }; document.addEventListener('mousedown', handler); return () => document.removeEventListener('mousedown', handler); }, [onClose]);
    return (
      <div ref={ref} className="fixed z-[9999] bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[120px]" style={{ left: x, top: y }}>
        <button className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm" onClick={() => { setClipboardData({ appointment: pending as any, action: 'copy' }); onClose(); }}>Copy</button>
        <button className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm" onClick={() => { setClipboardData({ appointment: pending as any, action: 'cut' }); onClose(); }}>Cut</button>
      </div>
    );
  };

  // Auto-refresh when other panes broadcast changes
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'appointments_refresh') {
        fetchAppointments();
        fetchPendingAppointments();
      }
      if (e.key === 'calendar_settings_refresh') {
        fetchCalendarSettings();
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  // --- Helpers for text contrast ------------------------------------------------
  const isLightColor = (color: string) => {
    const hex = color.replace('#', '');
    if (hex.length !== 6) return false;
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return brightness > 128;
  };

  const getTextColor = (backgroundColor: string) => {
    if (!backgroundColor || backgroundColor === 'transparent') return 'white';
    return isLightColor(backgroundColor) ? '#333333' : 'white';
  };

  // --- Inject CSS needed for the custom text overlay ----------------------------
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const styleTag = document.createElement('style');
    styleTag.id = 'appointment-content-styles';
    styleTag.textContent = `
      /* ------------------------------------------------------------------ */
      /* GLOBAL CALENDAR FIXES (keep in sync with Appointments page)        */
      /* ------------------------------------------------------------------ */

      /* 1. Completely hide the all-day row */
      .rbc-allday-cell,
      .rbc-allday-events,
      .rbc-row-content,
      .rbc-allday-cell-content,
      .rbc-allday-event {
        display: none !important;
        height: 0 !important;
        max-height: 0 !important;
        overflow: hidden !important;
      }
      .rbc-time-view .rbc-allday-cell { display: none !important; }

      /* 2. Resize handle tweaks – thinner edges & hide ≡ glyph */
      .rbc-addons-dnd-resize-ns-anchor {
        position: absolute !important;
        left: 0 !important;
        width: 100% !important;
        height: 2px !important;
        z-index: 400 !important;
        pointer-events: auto !important;
      }
      .rbc-addons-dnd-resize-ns-anchor:first-of-type { top: -1px !important; cursor: ns-resize !important; }
      .rbc-addons-dnd-resize-ns-anchor:last-of-type  { bottom: -1px !important; cursor: ns-resize !important; }
      .rbc-addons-dnd-resize-ns-icon { display: none !important; }

      /* 3. Hide the built-in event label/time */
      .rbc-event .rbc-event-label { display: none !important; }

      /* 4. Our custom overlay for text */
      .custom-text-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: flex-start;
        pointer-events: none;
        z-index: 5;
        font-size: 11px;
        line-height: 1.2;
        font-weight: 600;
        overflow: hidden;
        word-wrap: break-word;
        white-space: normal;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
      }
    `;
    document.head.appendChild(styleTag);

    return () => {
      const existing = document.getElementById('appointment-content-styles');
      if (existing) existing.remove();
    };
  }, []);

  // --- Dynamic column background based on personal colour -----------------------
  useEffect(() => {
    if (!calendarColor) return;

    // Build 15% & 30% opacity hex values (assumes 6-digit hex)
    const light = calendarColor.length === 7 ? `${calendarColor}15` : calendarColor;
    const dark = calendarColor.length === 7 ? `${calendarColor}30` : calendarColor;

    let styleEl = document.getElementById('todayappointments-bg') as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'todayappointments-bg';
      document.head.appendChild(styleEl);
    }

    styleEl.textContent = `
      /* Uniform light tint for all time slots & column */
      .rbc-time-column,
      .rbc-day-slot,
      .rbc-time-slot,
      .rbc-timeslot-group,
      .rbc-time-header-content { background-color: ${light} !important; }

      /* If React-Big-Calendar still marks today with .rbc-today keep a darker tint */
      .rbc-today,
      .rbc-today .rbc-time-slot,
      .rbc-today .rbc-timeslot-group { background-color: ${dark} !important; }
    `;

    return () => { styleEl && styleEl.remove(); };
  }, [calendarColor]);

  return (
    <div className="flex h-full">
      {!colorLoaded ? (
        <div className="flex-1 flex items-center justify-center">
          <div>Loading...</div>
        </div>
      ) : (
        <div
          ref={calendarContainerRef}
          className="flex-1 "
          style={{ userSelect: 'none' }}
        >
          <DnDCalendar
            key={`${calendarColor}-${visibleDays.join(',')}`}
            localizer={localizer}
            events={filteredEvents}
            resourceIdAccessor="resourceId"
            resourceTitleAccessor="resourceTitle"
            defaultView={Views.DAY}
            view={Views.DAY}
            views={{ day: true }}
            tooltipAccessor={null}
            step={5}
            timeslots={4}
            min={new Date(0, 0, 0, 6, 0)}
            max={new Date(0, 0, 0, 22, 0)}
            selectable
            date={currentDate}
            onNavigate={handleDateChange}
            onView={handleViewChange}
            onSelectSlot={(selectInfo) => {
              if (selectInfo.action === 'contextMenu') {
                handleDateSelect(selectInfo);
              } else {
                handleDateSelect(selectInfo);
              }
            }}
            toolbar={false}
            onSelectEvent={event => {
              clearTooltip();
              setSelectedAppointment(event.appointment);
              setIsFormOpen(true);
            }}
            style={{ height: 'calc(100vh - 65px)' }}
            eventPropGetter={event => {
              let type = event.appointment?.type || event.type;
              if (typeof type === 'string') {
                type = treatmentTypes.find(t => t.name === type || t.id === type);
              }

              let color: string;
              if (event.appointment?.isReservation || event.appointment?.appointmentType === 'RESERVATION') {
                color = event.appointment?.reservationColor || '#3b82f6';
              } else {
                color = type?.color || calendarColor || '#60a5fa';
              }

              const appointmentDuration = event.appointment?.duration || 0;
              const isShortAppointment = appointmentDuration <= 20;

              const textColor = isLightColor(color) ? '#333333' : '#fff';

              return {
                style: {
                  backgroundColor: color,
                  color: textColor,
                  border: '1px solid #222',
                  transition: 'all 0.15s ease-in-out',
                  transform: 'translateZ(0)',
                },
                className: isShortAppointment ? 'short-appointment no-time-display' : 'no-time-display',
              };
            }}
            components={{
              event: ({ event }) => {
                const eventRef = useRef<HTMLDivElement>(null);

                const handleMouseMove = (e: React.MouseEvent) => {
                  if (!eventRef.current) return;
                  const rect = eventRef.current.getBoundingClientRect();
                  const inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
                  if (!inside) {
                    clearTooltip();
                    return;
                  }
                  if (tooltipData) updateTooltipPosition(e.clientX + 10, e.clientY + 10);
                };

                const handleMouseEnter = (e: React.MouseEvent) => {
                  clearTooltip();
                  const type = typeof event.appointment?.type === 'object' && event.appointment?.type !== null
                    ? event.appointment.type
                    : treatmentTypes.find(t => t.name === String(event.appointment?.type));
                  const typeName = type?.name || 'Appointment';
                  const typeColor = type?.color || '#60a5fa';

                  const tooltipContent = (
                    <div className="space-y-1">
                      <div className="font-semibold text-sm" style={{ color: typeColor }}>
                        {typeName}
                      </div>
                      {event.patient ? (
                        <div className="text-sm font-medium text-gray-900">
                          {event.patient.firstName} {event.patient.lastName}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600 italic">Reservation</div>
                      )}
                      {event.appointment?.notes && (
                        <div className="text-sm text-gray-700 max-w-[250px]">
                          <strong>Notes:</strong> {event.appointment.notes}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 border-t pt-1">
                        Duration: {event.appointment?.duration || 30} minutes
                      </div>
                    </div>
                  );

                  setTimeout(() => {
                    setTooltipData({ content: tooltipContent, x: e.clientX + 15, y: e.clientY - 10 });
                  }, 100);
                };

                const handleContextMenu = (e: React.MouseEvent) => {
                  e.preventDefault();
                  setContextMenu({ x: e.clientX, y: e.clientY, appointment: event.appointment });
                };

                useEffect(() => {
                  const listener = (e: MouseEvent) => {
                    if (!eventRef.current || !tooltipData) return;
                    const rect = eventRef.current.getBoundingClientRect();
                    const inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
                    if (!inside) clearTooltip();
                  };
                  window.addEventListener('mousemove', listener);
                  return () => window.removeEventListener('mousemove', listener);
                }, [tooltipData]);

                const appointmentDuration = event.appointment?.duration || 0;
                const isShort = appointmentDuration <= 20;

                // --- Build overlay text -----------------------------------------------------
                const overlay = (() => {
                  const type = typeof event.appointment?.type === 'object' && event.appointment?.type !== null
                    ? event.appointment.type
                    : treatmentTypes.find(t => t.name === String(event.appointment?.type));
                  let bg = type?.color || '#60a5fa';
                  if (event.appointment?.isReservation || event.appointment?.appointmentType === 'RESERVATION') {
                    bg = event.appointment?.reservationColor || '#3b82f6';
                  }
                  const textColor = getTextColor(bg);

                  const patient = event.patient;
                  const appt = event.appointment;
                  const isReservation = !patient || appt?.isReservation;
                  const hasLinkedPatient = isReservation && appt?.patientId;

                  // Check if patient has no insurance (for emoji indicator)
                  const hasNoInsurance = patient && !patient.healthInsurance;

                  // Get appointment status display
                  const statusDisplay = appt?.appointmentStatus
                    ? getStatusDisplay(appt.appointmentStatus as AppointmentStatusMetadata)
                    : '';

                  const patientIcon = hasLinkedPatient ? (
                    <div
                      style={{ position: 'absolute', top: 2, right: 2, fontSize: '14px', cursor: 'pointer', zIndex: 300 }}
                      title="Open patient"
                      onClick={(e) => { e.stopPropagation(); window.open(`/dashboard/patients/${appt.patientId}`, '_blank'); }}
                    >👤</div>
                  ) : null;

                  if (hasLinkedPatient) {
                    return (
                      <>
                        {patientIcon}
                        <div style={{ padding: '4px', fontSize: '12px', color: textColor, fontWeight: 'bold' }}>{appt?.notes || 'Reservation'}</div>
                      </>
                    );
                  }

                  if (isReservation) {
                    return (
                      <div style={{ fontSize: '12px', color: textColor, fontWeight: 'bold', padding: '4px' }}>
                        {appt?.notes || 'Reservation'}
                      </div>
                    );
                  }

                  const combined = isShort && appt?.notes ? `${statusDisplay}${hasNoInsurance ? '💳 ' : ''}${event.title} – ${appt.notes}` : null;
                  return (
                    <div style={{
                      fontSize: isShort ? '12px' : '13px',
                      color: textColor,
                      padding: isShort ? '2px' : '4px',
                      height: '100%',
                      width: '100%'
                    }}>
                      {combined || `${statusDisplay}${hasNoInsurance ? '💳 ' : ''}${event.title}`}
                      {!combined && appt?.notes && (
                        <div style={{ fontSize: '11px', opacity: 0.9, fontWeight: 'normal' }}>{appt.notes}</div>
                      )}
                    </div>
                  );
                })();

                return (
                  <div
                    ref={eventRef}
                    className={`h-full w-full p-1 relative ${clipboardData?.appointment.id === event.appointment.id && clipboardData.action === 'cut' ? 'opacity-50 border-dashed' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      clearTooltip();
                      setSelectedAppointment(event.appointment);
                      setIsFormOpen(true);
                    }}
                    onContextMenu={handleContextMenu}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={() => clearTooltip()}
                    onMouseMove={handleMouseMove}
                  >
                    <div className="custom-text-overlay">{overlay}</div>
                  </div>
                );
              },
            }}
            resources={filteredResources}
            draggableAccessor={() => true}
            onEventDrop={({ event, start, end, resourceId }) => {
              const newDuration = Math.round((end.getTime() - start.getTime()) / 60000);
              handleFormSubmit({
                ...event.appointment,
                startTime: start,
                endTime: end,
                duration: newDuration,
                practitionerId: resourceId,
              });
            }}
            onEventResize={({ event, start, end }) => {
              const newDuration = Math.round((end.getTime() - start.getTime()) / 60000);
              handleFormSubmit({
                ...event.appointment,
                startTime: start,
                endTime: end,
                duration: newDuration,
              });
            }}
            dragFromOutsideItem={(item) => {
              try {
                const dataRaw = (window.event as DragEvent)?.dataTransfer?.getData('text/plain');
                if (!dataRaw) return null;

                const data = JSON.parse(dataRaw);
                if (data?.type === 'PENDING') {
                  const pending = pendingAppointments.find(p => p.id === data.appointmentId);
                  if (!pending) return null;

                  const type = typeof pending.type === 'object' && pending.type !== null
                    ? pending.type
                    : treatmentTypes.find(t => t.name === String(pending.type));
                  const duration = type?.duration || 30;

                  return {
                    id: pending.id,
                    title: pending.patient?.name || 'Unknown patient',
                    start: new Date(),
                    end: new Date(Date.now() + duration * 60000),
                    resourceId: null,
                    appointment: pending,
                    type: type
                  };
                }
                return null;
              } catch (error) {
                console.error('Error in dragFromOutsideItem:', error);
                return null;
              }
            }}
            onDropFromOutside={({ start, end, resource }) => {
              try {
                const dataRaw = (window.event as DragEvent)?.dataTransfer?.getData('text/plain');
                if (!dataRaw) return;

                const data = JSON.parse(dataRaw);
                if (data?.type === 'PENDING') {
                  const pending = pendingAppointments.find(p => p.id === data.appointmentId);
                  if (!pending) return;

                  const practitionerId = resource?.resourceId || resource;
                  const type = typeof pending.type === 'object' && pending.type !== null
                    ? pending.type
                    : treatmentTypes.find(t => t.name === String(pending.type));
                  const duration = pending.duration || type?.duration || 30;
                  const endTime = new Date(start.getTime() + duration * 60000);

                  handleFormSubmit({
                    patientId: pending.patientId,
                    practitionerId,
                    startTime: start,
                    endTime: endTime,
                    duration,
                    type: type || treatmentTypes.find(t => t.name === String(pending.type)) || treatmentTypes[0],
                    status: 'SCHEDULED',
                    notes: pending.notes
                  }).then(() => {
                    fetch(`/api/pending-appointments?id=${pending.id}`, {
                      method: 'DELETE'
                    }).then(() => {
                      fetchPendingAppointments();
                    });
                  });
                }
              } catch (error) {
                console.error('Error in onDropFromOutside:', error);
              }
            }}
            dayLayoutAlgorithm="no-overlap"
            formats={{
              weekdayFormat: (date, culture, localizer) => {
                const day = localizer.format(date, 'EEEE', culture).toLowerCase();
                return visibleDays.includes(day) ? localizer.format(date, 'EEEE', culture) : '';
              },
              eventTimeRangeFormat: () => '',
              eventTimeRangeStartFormat: () => '',
              eventTimeRangeEndFormat: () => '',
              timeGutterFormat: (date, culture, localizer) => localizer.format(date, 'HH:mm', culture),
              selectRangeFormat: () => '',
              agendaTimeFormat: () => '',
              agendaTimeRangeFormat: () => '',
              dayFormat: 'dd',
              dayRangeHeaderFormat: () => '',
              dayHeaderFormat: (date, culture, localizer) => {
                return localizer.format(date, 'EEEE dd/MM', culture);
              },
              monthHeaderFormat: 'MMMM yyyy',
            }}
            dayPropGetter={(date) => {
              const day = format(date, 'EEEE').toLowerCase();
              const isToday = isSameDay(date as Date, new Date());

              // If this is today, use the user's preferred calendar color at reduced opacity
              let extraStyle: React.CSSProperties = {};
              if (isToday && calendarColor) {
                const bg = calendarColor.length === 7 ? `${calendarColor}30` : calendarColor;
                extraStyle = {
                  backgroundColor: bg,
                };
              }

              return {
                className: visibleDays.includes(day) ? '' : 'hidden',
                style: {
                  display: visibleDays.includes(day) ? 'block' : 'none',
                  ...extraStyle,
                },
              };
            }}
            slotPropGetter={(date) => {
              // Shade every slot (since day-view is always the selected date) using lighter opacity
              if (calendarColor) {
                const bg = calendarColor.length === 7 ? `${calendarColor}15` : calendarColor;
                return { style: { backgroundColor: bg } };
              }
              return {};
            }}
          />
        </div>
      )}

      {tooltipData && (
        <div
          className="fixed z-[9999] bg-white text-black p-2 rounded shadow-lg border text-sm whitespace-pre-wrap pointer-events-none"
          style={{
            left: tooltipData.x,
            top: tooltipData.y,
            opacity: 1,
            transform: 'translate3d(0, 0, 0)',
            transition: 'transform 0.1s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.1s ease-in-out',
            willChange: 'transform',
          }}
        >
          {tooltipData.content}
        </div>
      )}

      {/* Appointment Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px] bg-background">
          <DialogHeader>
            <DialogTitle>
              {selectedAppointment ? 'Edit Appointment' : 'New Appointment'}
            </DialogTitle>
            <DialogDescription>
              {selectedAppointment
                ? 'Edit the details of your appointment.'
                : 'Fill in the details to create a new appointment.'}
            </DialogDescription>
          </DialogHeader>
          <EnhancedAppointmentForm
            initialData={selectedAppointment || undefined}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            patients={patients as any}
            familyGroups={[]}
            selectedDate={selectedDate}
            initialPractitionerId={selectedPractitionerId}
            practitioners={selectedDate ? getAvailablePractitioners(selectedDate) : practitioners}
          />
          <div className="flex justify-center mt-4">
            {selectedAppointment ? (
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  className="w-10 h-10 p-0"
                  onClick={async () => {
                    try {
                      const response = await fetch(`/api/appointments?id=${selectedAppointment.id}`, {
                        method: 'DELETE',
                      });
                      if (!response.ok) throw new Error('Failed to delete appointment');
                      toast.success('Appointment deleted successfully');
                      setIsFormOpen(false);
                      await fetchAppointments();
                    } catch (error) {
                      toast.error('Failed to delete appointment');
                    }
                  }}
                >
                  🗑️
                </Button>
                <Button variant="outline" onClick={handleFormCancel}>
                  ❌
                </Button>
                <Button type="submit" form="appointment-form">
                  💾
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleFormCancel}>
                  ❌
                </Button>
                <Button type="submit" form="appointment-form">
                  💾
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          appointment={contextMenu.appointment}
          onClose={() => setContextMenu(null)}
        />
      )}
      {slotContextMenu && (
        <SlotContextMenu
          x={slotContextMenu.x}
          y={slotContextMenu.y}
          slotDate={slotContextMenu.slotDate}
          resourceId={slotContextMenu.resourceId}
          onClose={() => setSlotContextMenu(null)}
        />
      )}
      {pendingContextMenu && (
        <PendingMenu x={pendingContextMenu.x} y={pendingContextMenu.y} pending={pendingContextMenu.pending} onClose={() => setPendingContextMenu(null)} />
      )}
    </div>
  );
}
