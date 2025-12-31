'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EnhancedAppointmentForm } from '@/components/appointments/EnhancedAppointmentForm';
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
import { Settings, ArrowLeft, ArrowRight, Calendar as CalendarIcon, Printer, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { convertPendingToAppointment } from '@/lib/appointments';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { AppointmentStatusType, AppointmentStatusMetadata, APPOINTMENT_STATUS_CONFIGS, getStatusDisplay, getStatusTooltip } from '@/types/appointment-status';
import { RunningLateModal, ImportantNoteModal, StatusConfirmationModal, ClearImportantModal } from '@/components/appointments/AppointmentStatusModals';
import { logActivityClient, LOG_ACTIONS, ENTITY_TYPES, LOG_SEVERITY } from '@/lib/activity-logger';
import QuickFindEmptySpotModal from '@/components/appointments/QuickFindEmptySpotModal';
import {
  fetchLeaveBlocks,
  isTimeSlotBlocked,
  LeaveBlock,
  getSlotPropGetterWithLeaveBlocking,
  convertLeaveBlocksToEvents,
  CalendarEvent
} from '@/lib/calendar-leave-integration';
import { useClipboard } from '@/hooks/use-clipboard';

const daysOfWeek = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const locales = { 'en-US': require('date-fns/locale/en-US') };
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

// Custom appointment content component that handles all display cases
function AppointmentContent({
  event,
  appointmentDuration,
  isShortAppointment,
  getTextColor,
  treatmentTypes,
  onPatientClick
}: {
  event: any;
  appointmentDuration: number;
  isShortAppointment: boolean;
  getTextColor: (color: string) => string;
  treatmentTypes: any[];
  onPatientClick: (patientId: string) => void;
}) {
  const eventRef = useRef<HTMLDivElement>(null);
  const { clipboardData } = useClipboard();

  // If this is a leave block, render nothing inside it. The styling is handled by eventPropGetter.
  if (event.isLeaveBlock) {
    return <div className="h-full w-full" />;
  }

  const { appointment } = event;
  const patient = appointment?.patient;

  // Get the appointment type and its color for dynamic text color
  const type = typeof event.appointment?.type === 'object' && event.appointment?.type !== null
    ? event.appointment.type
    : treatmentTypes.find(t => t.name === String(event.appointment?.type));
  const backgroundColor = type?.color || '#60a5fa';
  const textColor = getTextColor(backgroundColor);
  const shadowColor = textColor === 'white' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)';

  const isReservation = !patient || appointment?.isReservation;

  // Check if patient has no insurance (for emoji indicator)
  const hasNoInsurance = patient && !patient.healthInsurance;

  // Base text styles
  const baseTextStyle = {
    color: textColor,
    textShadow: `0 1px 3px ${shadowColor}`,
    fontWeight: 'bold' as const,
    lineHeight: '1.2' as const
  };

  // Check if this is a reservation with a connected patient
  const isReservationWithPatient = isReservation && appointment?.patientId;



  if (isReservationWithPatient) {
    // Reservation with patient - show person icon button
    return (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto',
          cursor: 'pointer',
          color: textColor,
          textShadow: `0 1px 3px ${shadowColor}`,
          fontSize: '16px',
          fontWeight: 'bold',
          lineHeight: '1.2',
          zIndex: 15
        }}
        onClick={(e) => {
          e.stopPropagation();
          onPatientClick(appointment.patientId);
        }}
      >
        👤
      </div>
    );
  }

  if (isReservation) {
    // Regular reservation - show only notes
    return (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px',
          overflow: 'hidden',
          pointerEvents: 'none',
          color: textColor,
          textShadow: `0 1px 3px ${shadowColor}`,
          fontSize: isShortAppointment ? '10px' : '11px',
          fontWeight: 'bold',
          lineHeight: '1.2',
          zIndex: 15
        }}
      >
        <span style={{
          color: textColor,
          textShadow: `0 1px 3px ${shadowColor}`,
          fontWeight: 'bold',
          fontSize: 'inherit'
        }}>
          {appointment?.notes || 'Reservation'}
        </span>
      </div>
    );
  }

  // Regular appointment with patient
  if (isShortAppointment) {
    // Short appointment (≤20 minutes) - show "Patient Name - Notes" horizontally
    const displayText = appointment?.notes
      ? `${event.title} - ${appointment.notes}`
      : event.title;

    return (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          padding: '4px',
          overflow: 'hidden',
          pointerEvents: 'none',
          color: textColor,
          textShadow: `0 1px 3px ${shadowColor}`,
          fontSize: '10px',
          fontWeight: 'bold',
          lineHeight: '1.2',
          zIndex: 15,
          position: 'relative'
        }}
      >
        {hasNoInsurance && (
          <div style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            fontSize: '14px',
            zIndex: 20,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '3px',
            padding: '1px 3px',
            border: '1px solid #333'
          }}>
            💳
          </div>
        )}
        <span style={{
          color: textColor,
          textShadow: `0 1px 3px ${shadowColor}`,
          fontWeight: 'bold',
          fontSize: 'inherit'
        }}>
          {displayText}
        </span>
      </div>
    );
  }

  // Normal appointment (>20 minutes) - show patient name and notes vertically
  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '4px',
        overflow: 'hidden',
        pointerEvents: 'none',
        color: textColor,
        textShadow: `0 1px 3px ${shadowColor}`,
        fontWeight: 'bold',
        lineHeight: '1.2',
        zIndex: 15,
        position: 'relative'
      }}
    >
      {hasNoInsurance && (
        <div style={{
          position: 'absolute',
          top: '2px',
          right: '2px',
          fontSize: '14px',
          zIndex: 20,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '3px',
          padding: '1px 3px',
          border: '1px solid #333'
        }}>
          💳
        </div>
      )}
      <div
        style={{
          fontSize: '11px',
          lineHeight: '1.3',
          color: textColor,
          textShadow: `0 1px 3px ${shadowColor}`,
          fontWeight: 'bold'
        }}
      >
        {event.title}
      </div>
      {appointment?.notes && (
        <div
          style={{
            fontSize: '9px',
            lineHeight: '1.2',
            opacity: 0.9,
            color: textColor,
            textShadow: `0 1px 3px ${shadowColor}`,
            fontWeight: 'normal',
            marginTop: '2px'
          }}
        >
          {appointment.notes}
        </div>
      )}
    </div>
  );
}

export default function AppointmentsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [view, setView] = useState<'day' | 'week'>('day');
  const [pendingAppointments, setPendingAppointments] = useState<PendingAppointment[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Partial<Appointment> | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [practitioners, setPractitioners] = useState<any[]>([]);
  const [practitionerSchedule, setPractitionerSchedule] = useState<{ [day: string]: string[] }>({});
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [familyGroups, setFamilyGroups] = useState<any[]>([]);
  const [individualPatients, setIndividualPatients] = useState<any[]>([]);
  const [selectedPractitionerId, setSelectedPractitionerId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tooltipData, setTooltipData] = useState<{ content: React.ReactNode; x: number; y: number } | null>(null);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout>();
  const tooltipPositionRef = useRef<{ x: number; y: number } | null>(null);
  const isOverAppointmentRef = useRef(false);
  const [scheduleRules, setScheduleRules] = useState<any[]>([]);
  const [availablePractitionerIds, setAvailablePractitionerIds] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<number>(3); // Default to 3 months
  const [searchQuery, setSearchQuery] = useState('');
  const [calendarColor, setCalendarColor] = useState<string | null>(null);
  const [practitionerColors, setPractitionerColors] = useState<Record<string, string>>({});
  const [leaveBlocks, setLeaveBlocks] = useState<LeaveBlock[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
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
  const [selectedAppointmentPractitionerId, setSelectedAppointmentPractitionerId] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedPrintPractitionerIds, setSelectedPrintPractitionerIds] = useState<string[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>('Save as PDF');
  const [printDate, setPrintDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // tomorrow
    if (d.getDay() === 0) { // Sunday = 0
      d.setDate(d.getDate() + 1); // skip to Monday
    }
    d.setHours(0, 0, 0, 0);
    return d;
  });
  // Detect if this page is rendered inside an iframe (embed=1 query param)
  const isEmbed = typeof window !== 'undefined' && window.location.search.includes('embed=1');
  // Use a smaller vertical offset when embedded to utilise the full pane height
  const calendarHeight = isEmbed ? 'calc(100vh - 120px)' : 'calc(100vh - 200px)';

  // Status modal states
  const [runningLateModal, setRunningLateModal] = useState<{ isOpen: boolean; appointment: Appointment | null }>({ isOpen: false, appointment: null });
  const [importantNoteModal, setImportantNoteModal] = useState<{ isOpen: boolean; appointment: Appointment | null }>({ isOpen: false, appointment: null });
  const [statusConfirmationModal, setStatusConfirmationModal] = useState<{ isOpen: boolean; appointment: Appointment | null; statusType: AppointmentStatusType | null }>({ isOpen: false, appointment: null, statusType: null });
  const [clearImportantModal, setClearImportantModal] = useState<{ isOpen: boolean; appointment: Appointment | null }>({ isOpen: false, appointment: null });
  const [isQuickFindModalOpen, setIsQuickFindModalOpen] = useState(false);
  const [selectedPendingForQuickFind, setSelectedPendingForQuickFind] = useState<any>(null);
  const [isSchedulingQuickFind, setIsSchedulingQuickFind] = useState(false);

  const formatLocalDate = (date: Date) => {
    const tzOffset = date.getTimezoneOffset() * 60000; // ms
    const localISO = new Date(date.getTime() - tzOffset).toISOString();
    return localISO.split('T')[0];
  };

  useEffect(() => {
    const fetchColor = async () => {
      // Get personal color for the logged-in user (for default settings)
      const res = await fetch('/api/calendar-settings/personal');
      if (res.ok) {
        const data = await res.json();
        if (data?.color) {
          setCalendarColor(data.color);
        } else {
          setCalendarColor('#ffffff');
        }
        if (data?.visibleDays) {
          setVisibleDays(data.visibleDays);
        }
      } else {
        setCalendarColor('#ffffff');
      }
      setColorLoaded(true);
    };
    fetchColor();
  }, [session?.user?.id]);

  // useEffect(() => {
  //   if (calendarColor) {
  //     // document.documentElement.style.setProperty('--calendar-today-bg', calendarColor);
  //   }
  // }, [calendarColor]);

  // Minimal CSS approach - only what's needed for text visibility
  useEffect(() => {
    const appointmentStyles = document.createElement('style');
    appointmentStyles.id = 'appointment-content-styles';
    appointmentStyles.textContent = `
      /* HIDE ALL-DAY ROW COMPLETELY */
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
      
      /* Hide the allday slot completely */
      .rbc-time-view .rbc-allday-cell {
        display: none !important;
      }
      
      /* Custom text overlay with strong visibility */
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
        pointer-events: none; /* let clicks fall through to calendar/resize handle */
        z-index: 5;
        font-size: 11px;
        line-height: 1.2;
        font-weight: 600;
        overflow: hidden;
        word-wrap: break-word;
        white-space: normal;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8), 1px -1px 2px rgba(0,0,0,0.8), -1px 1px 2px rgba(0,0,0,0.8);
      }

      .custom-text-overlay .patient-name {
        font-weight: 700;
        margin-bottom: 1px;
        display: block;
        width: 100%;
        text-shadow: inherit;
      }

      .custom-text-overlay .appointment-notes {
        font-size: 10px;
        opacity: 1;
        display: block;
        width: 100%;
        text-shadow: inherit;
      }

      /* Ensure our custom content shows with maximum visibility */
      .rbc-event .custom-text-overlay {
        display: flex !important;
        visibility: visible !important;
        opacity: 1 !important;
      }

      .rbc-event .custom-text-overlay * {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        color: inherit !important;
      }

      /* Make clickable elements work */
      .custom-text-overlay .clickable {
        pointer-events: auto;
      }

      /* Keep default time label hidden */
      .rbc-event .rbc-event-label {
        display: none;
      }

      /* Make resize handles easier to grab but only at edges (4px) */
      .rbc-addons-dnd-resize-ns-anchor {
        position: absolute !important;
        left: 0 !important;
        width: 100% !important;
        height: 2px !important;   /* ultra-thin edge */
        z-index: 400 !important;
        pointer-events: auto !important;
      }

      /* TOP grip */
      .rbc-addons-dnd-resize-ns-anchor:first-of-type {
        top: -1px !important;
        cursor: ns-resize !important;
      }

      /* BOTTOM grip */
      .rbc-addons-dnd-resize-ns-anchor:last-of-type {
        bottom: -1px !important;
        cursor: ns-resize !important;
      }

      /* Hide the decorative "≡" glyph inside the anchors */
      .rbc-addons-dnd-resize-ns-icon {
        display: none !important;
      }
    `;
    document.head.appendChild(appointmentStyles);

    return () => {
      const el = document.getElementById('appointment-content-styles');
      if (el) el.remove();
    };
  }, []);

  // REMOVED: Complex CSS styling - replaced with simple solution above

  // REMOVED: More complex styling - using simple solution instead

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
    if (view === 'week' && selectedPractitionerId) {
      return resources.filter(doc => doc.resourceId === selectedPractitionerId);
    }
    const practitionerIdSet = new Set(availablePractitionerIds);
    return resources.filter(resource => practitionerIdSet.has(resource.resourceId));
  };

  useEffect(() => {
    if (session?.user?.id) {
      setSelectedPractitionerId(session.user.id);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    const initializeData = async () => {
      // Fetch practitioners first and wait for completion (includes color loading)
      await fetchPractitioners();

      // Then fetch other data in parallel
      fetchPatients();
      fetchFamilies();
      fetchPendingAppointments();
      fetchScheduleRules();
      fetchCalendarSettings();
      fetchLeaveBlocksData();
    };

    initializeData();
  }, []);

  useEffect(() => {
    if (selectedPractitionerId) {
      fetchAppointments();
    }
  }, [selectedPractitionerId, view]);

  useEffect(() => {
    // Merge leave blocks into current calendarEvents WITHOUT referencing `events` (avoids TDZ)
    const leaveEvents = convertLeaveBlocksToEvents(leaveBlocks);
    setCalendarEvents((prev) => {
      const nonLeave = prev.filter((ev) => !(ev as any).isLeaveBlock);
      return [...nonLeave, ...leaveEvents];
    });
  }, [leaveBlocks]);

  // Update calendarEvents when appointments change
  useEffect(() => {
    // Convert appointments to calendar events
    const appointmentEvents = appointments
      .filter(appt => appt.startTime && appt.endTime)
      .map(appt => {
        const patient = patients.find(p => p.id === appt.patientId);

        // If there's a patient, show patient name
        // If no patient (reservation), show the note
        let title;
        if (patient) {
          title = `${patient.firstName} ${patient.lastName}`;
        } else {
          // No patient - this is a reservation, show the note
          title = appt.notes || 'Reservation';
        }



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

    // Merge with leave events
    const leaveEvents = convertLeaveBlocksToEvents(leaveBlocks);
    const allEvents = [...appointmentEvents, ...leaveEvents];

    console.log('Calendar Events Update:', {
      appointmentsCount: appointments.length,
      appointmentEventsCount: appointmentEvents.length,
      leaveEventsCount: leaveEvents.length,
      totalEventsCount: allEvents.length,
      appointmentIds: appointmentEvents.map(e => e.id)
    });

    setCalendarEvents(allEvents);
  }, [appointments, patients, leaveBlocks]);

  useEffect(() => {
    const practitioners = getAvailablePractitioners(currentDate);
    setAvailablePractitionerIds(practitioners.map(p => p.id));
  }, [currentDate, scheduleRules]);

  const fetchPractitioners = async () => {
    try {
      // Fetch practitioners
      const response = await fetch('/api/practitioners');
      const data = await response.json();
      setPractitioners(data);
      setPractitionerSchedule(prev => {
        if (Object.keys(prev).length === 0) {
          const initial: { [day: string]: string[] } = {};
          daysOfWeek.forEach(day => { initial[day] = data.map((d: any) => d.id); });
          return initial;
        }
        return prev;
      });

      // Fetch color settings for each practitioner
      const colorMap: Record<string, string> = {};

      // Sequential fetches to avoid rate limiting
      for (const practitioner of data) {
        try {
          const colorRes = await fetch(`/api/calendar-settings/personal?userId=${practitioner.id}`);

          if (colorRes.ok) {
            const colorData = await colorRes.json();
            colorMap[practitioner.id] = colorData.color || '#ffffff';
          } else {
            colorMap[practitioner.id] = '#ffffff';
          }
        } catch (error) {
          console.error(`Error fetching color for ${practitioner.id}:`, error);
          colorMap[practitioner.id] = '#ffffff';
        }
      }
      setPractitionerColors(colorMap);

      // Apply the colors to calendar columns immediately
      applyPractitionerColorsToDOM(colorMap);
    } catch (error) {
      console.error('Error fetching practitioners:', error);
      toast.error('Failed to fetch practitioners');
    }
  };

  // Helper function to directly apply colors to DOM elements
  const applyPractitionerColorsToDOM = (colorMap: Record<string, string>) => {
    // Create or update our color stylesheet
    let styleEl = document.getElementById('practitioner-column-colors');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'practitioner-column-colors';
      document.head.appendChild(styleEl);
    }



    // Generate CSS for each practitioner
    const cssRules = Object.entries(colorMap).map(([practitionerId, color]) => {

      return `
        /* Base column styles for practitioner ${practitionerId} */
        .rbc-time-column[data-resource-id="${practitionerId}"],
        .rbc-day-slot[data-resource-id="${practitionerId}"],
        .rbc-header[data-resource-id="${practitionerId}"],
        [data-resource-id="${practitionerId}"] {
          background-color: ${color}15 !important;
        }
        
        /* Today's column specific styling */
        .rbc-today.rbc-time-column[data-resource-id="${practitionerId}"],
        .rbc-today.rbc-day-slot[data-resource-id="${practitionerId}"],
        .rbc-today [data-resource-id="${practitionerId}"] {
          background-color: ${color}30 !important;
        }
        
        /* Time slots within columns */
        .rbc-time-column[data-resource-id="${practitionerId}"] .rbc-timeslot-group,
        .rbc-time-column[data-resource-id="${practitionerId}"] .rbc-time-slot,
        [data-resource-id="${practitionerId}"] .rbc-timeslot-group,
        [data-resource-id="${practitionerId}"] .rbc-time-slot {
          background-color: ${color}15 !important;
        }
        
        /* Today's time slots */
        .rbc-today.rbc-time-column[data-resource-id="${practitionerId}"] .rbc-time-slot,
        .rbc-today.rbc-day-slot[data-resource-id="${practitionerId}"],
        .rbc-today [data-resource-id="${practitionerId}"] .rbc-time-slot {
          background-color: ${color}30 !important;
        }
        
        /* Header styles */
        .rbc-time-header-content[data-resource-id="${practitionerId}"] {
          background-color: ${color}15 !important;
        }
        
        /* Today's header styles */
        .rbc-today .rbc-time-header-content[data-resource-id="${practitionerId}"] {
          background-color: ${color}30 !important;
        }
      `;
    }).join('\n');

    styleEl.textContent = cssRules;
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

  const fetchFamilies = async () => {
    try {
      const response = await fetch('/api/families');
      const data = await response.json();
      setFamilyGroups(data.familyGroups || []);
      setIndividualPatients(data.individualPatients || []);
    } catch (error) {
      console.error('Error fetching families:', error);
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
        setCalendarColor(data.color || '#ffffff');

        // Don't override practitioner colors here - they're set in fetchPractitioners
        // This was causing the issue where only one practitioner color was shown
      } else {
        setCalendarColor('#ffffff');
      }
    } catch (error) {
      console.error('Error fetching calendar settings:', error);
      setCalendarColor('#ffffff');
    }
  };

  const fetchLeaveBlocksData = async () => {
    try {
      const blocks = await fetchLeaveBlocks();
      setLeaveBlocks(blocks);
    } catch (error) {
      console.error('Error fetching leave blocks:', error);
    }
  };

  // Broadcast to other panes that appointments changed
  function broadcastRefresh() {
    try {
      localStorage.setItem('appointments_refresh', Date.now().toString());
    } catch { }
  }



  const handleFormSubmit = async (appointment: any) => {
    try {
      // Handle family appointments
      if (appointment.isFamilyAppointment && appointment.familyAppointmentRequest) {
        const { familyAppointmentRequest } = appointment;
        const { selectedPatientCodes, ...baseAppointment } = familyAppointmentRequest;

        // Create multiple appointments, one for each family member in sequence

        const promises = selectedPatientCodes.map(async (patientCode: string, index: number) => {
          // Try to find patient by both ID and any identifying field
          const patient = patients.find(p =>
            p.id === patientCode ||
            (p as any).patientCode === patientCode ||
            `${p.firstName} ${p.lastName}` === patientCode
          );
          if (!patient) {
            console.error('Patient not found for code/ID:', patientCode, 'Available patients:', patients.map(p => ({ id: p.id, name: `${p.firstName} ${p.lastName}` })));
            return;
          }


          // Calculate sequential start times: each appointment starts when the previous one ends
          const appointmentStartTime = new Date(baseAppointment.startTime.getTime() + (index * baseAppointment.duration * 60000));
          const appointmentEndTime = new Date(appointmentStartTime.getTime() + baseAppointment.duration * 60000);

          const appointmentData = {
            ...baseAppointment,
            patientId: patient.id,
            endTime: appointmentEndTime,
            startTime: appointmentStartTime.toISOString(),
            status: 'SCHEDULED',
            appointmentType: 'FAMILY',
            type: baseAppointment.type
          };



          const response = await fetch('/api/appointments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(appointmentData),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Family appointment API error:', { status: response.status, error: errorText });
            throw new Error(`Failed to create family appointment: ${response.status} ${errorText}`);
          }

          const result = await response.json();

          return result;
        });

        await Promise.all(promises);
        toast.success(`Family appointments created successfully`);

        // Log family appointment creation
        await logActivityClient({
          action: LOG_ACTIONS.CREATE_APPOINTMENT,
          entityType: ENTITY_TYPES.APPOINTMENT,
          description: `Created ${selectedPatientCodes.length} family appointments for ${selectedPatientCodes.length} patients`,
          details: {
            appointmentCount: selectedPatientCodes.length,
            duration: baseAppointment.duration,
            practitionerId: baseAppointment.practitionerId,
            appointmentType: 'FAMILY'
          },
          page: '/dashboard/appointments',
          severity: LOG_SEVERITY.INFO
        });
      }
      // Handle reservations (both new and editing)
      else if (appointment.isReservation && appointment.reservationRequest) {
        const { reservationRequest } = appointment;


        // If editing, use PUT with direct data structure
        if (selectedAppointment?.id) {
          const updateData = {
            id: selectedAppointment.id,
            practitionerId: reservationRequest.practitionerId,
            startTime: reservationRequest.startTime instanceof Date ? reservationRequest.startTime.toISOString() : reservationRequest.startTime,
            endTime: new Date(reservationRequest.startTime.getTime() + reservationRequest.duration * 60000).toISOString(),
            duration: reservationRequest.duration,
            notes: reservationRequest.notes,
            status: 'SCHEDULED',
            appointmentType: 'RESERVATION',
            isReservation: true,
            reservationColor: reservationRequest.reservationColor,
            // Include patientId if connected to a patient (null if none)
            patientId: reservationRequest.patientId || null
          };



          const response = await fetch('/api/appointments', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Reservation update API error:', { status: response.status, error: errorText });
            throw new Error(`Failed to update reservation: ${response.status} ${errorText}`);
          }

          const result = await response.json();

          toast.success('Reservation updated successfully');

          // Log reservation update
          await logActivityClient({
            action: LOG_ACTIONS.UPDATE_APPOINTMENT,
            entityType: ENTITY_TYPES.APPOINTMENT,
            entityId: selectedAppointment.id,
            description: `Updated reservation - ${reservationRequest.notes || 'No description'}`,
            details: {
              duration: reservationRequest.duration,
              practitionerId: reservationRequest.practitionerId,
              appointmentType: 'RESERVATION',
              color: reservationRequest.reservationColor
            },
            page: '/dashboard/appointments',
            appointmentId: selectedAppointment.id,
            severity: LOG_SEVERITY.INFO
          });
        } else {
          // Creating new reservation - use POST with reservation structure


          const response = await fetch('/api/appointments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(appointment), // Send the full structure with isReservation and reservationRequest
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Reservation create API error:', { status: response.status, error: errorText });
            throw new Error(`Failed to create reservation: ${response.status} ${errorText}`);
          }

          const result = await response.json();

          toast.success('Reservation created successfully');

          // Log reservation creation
          await logActivityClient({
            action: LOG_ACTIONS.CREATE_APPOINTMENT,
            entityType: ENTITY_TYPES.APPOINTMENT,
            entityId: result.id,
            description: `Created new reservation - ${appointment.reservationRequest?.notes || 'No description'}`,
            details: {
              duration: appointment.reservationRequest?.duration,
              practitionerId: appointment.reservationRequest?.practitionerId,
              appointmentType: 'RESERVATION',
              color: appointment.reservationRequest?.reservationColor
            },
            page: '/dashboard/appointments',
            appointmentId: result.id,
            severity: LOG_SEVERITY.INFO
          });
        }
      }
      // Handle regular appointments
      else {
        console.log('handleFormSubmit: Processing as regular appointment');
        const payload = {
          ...appointment,
          startTime: appointment.startTime instanceof Date ? appointment.startTime.toISOString() : appointment.startTime,
          endTime: appointment.endTime instanceof Date ? appointment.endTime.toISOString() : appointment.endTime,
          patientId: appointment.patientId,
          practitionerId: appointment.practitionerId,
          status: appointment.status || 'SCHEDULED',
          type: appointment.type,
          // Include reservation color for updates
          ...(appointment.reservationColor && { reservationColor: appointment.reservationColor })
        };



        console.log('handleFormSubmit: Sending payload to API:', payload);

        const response = await fetch('/api/appointments', {
          method: appointment.id ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        console.log('handleFormSubmit: API response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('handleFormSubmit: API error:', errorText);
          throw new Error(`Failed to save appointment: ${response.status} ${errorText}`);
        }
        const result = await response.json();
        toast.success(`Appointment ${appointment.id ? 'updated' : 'created'} successfully`);

        // Log appointment creation or update
        const patient = appointment.patientId ? await fetch(`/api/patients/${appointment.patientId}`).then(r => r.json()).catch(() => null) : null;
        await logActivityClient({
          action: appointment.id ? LOG_ACTIONS.UPDATE_APPOINTMENT : LOG_ACTIONS.CREATE_APPOINTMENT,
          entityType: ENTITY_TYPES.APPOINTMENT,
          entityId: appointment.id || result.id,
          description: `${appointment.id ? 'Updated' : 'Created'} appointment for ${patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient'}`,
          details: {
            duration: appointment.duration,
            practitionerId: appointment.practitionerId,
            appointmentType: appointment.appointmentType || 'REGULAR',
            startTime: appointment.startTime,
            endTime: appointment.endTime,
            status: appointment.status
          },
          page: '/dashboard/appointments',
          patientId: appointment.patientId,
          appointmentId: appointment.id || result.id,
          severity: LOG_SEVERITY.INFO
        });
      }

      // Always refresh appointments from the server after save
      await fetchAppointments();
      setIsFormOpen(false);
      broadcastRefresh();
    } catch (error) {
      console.error('Error saving appointment:', error);
      toast.error('Failed to save appointment');
      fetchAppointments();
    }
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setSelectedAppointment(null);
    setSelectedDate(null);
    setSelectedAppointmentPractitionerId(null);
  };

  const resources = practitioners.map(practitioner => ({
    resourceId: practitioner.id,
    resourceTitle: practitioner.firstName + ' ' + practitioner.lastName,
  }));



  // Helper function to determine if a color is light or dark
  const isLightColor = (color: string) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return brightness > 128;
  };

  // Helper function to get optimal text color
  const getTextColor = (backgroundColor: string) => {
    if (!backgroundColor || backgroundColor === 'transparent') {
      return 'white';
    }
    return isLightColor(backgroundColor) ? '#333333' : 'white';
  };

  const effectivePractitionerId = view === 'week' ? selectedPractitionerId : null;
  const filteredResources = getAvailableResourcesForCurrentDate();
  const filteredEvents = calendarEvents.filter(event => {
    // Filter by practitioner if in week view
    if (view === 'week' && event.resourceId !== effectivePractitionerId) {
      return false;
    }

    // Filter by visible days
    const eventDay = format(event.start, 'EEEE').toLowerCase();
    if (!visibleDays.includes(eventDay)) {
      return false;
    }

    // Filter by search query
    if (!searchQuery.trim()) return true;
    const search = searchQuery.trim().toLowerCase();
    const patient = (event as any).patient;
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

    // Check if the selected slot is blocked by leave
    const slotStart = new Date(selectInfo.start);
    const slotEnd = new Date(selectInfo.end || slotStart.getTime() + 30 * 60 * 1000);

    const blockCheck = isTimeSlotBlocked(selectInfo.start, slotStart, slotEnd, selectInfo.resourceId, leaveBlocks);

    if (blockCheck.isBlocked) {
      toast.error(blockCheck.reason || 'Cannot create appointment during approved leave time');
      return;
    }

    // Ensure calendar colors are applied correctly after interactions
    const reapplyColors = () => {
      // Trigger a reapplication of colors when the user interacts with calendar
      if (Object.keys(practitionerColors).length > 0) {


        // Force removal of any conflicting styles
        const conflictingStyles = [
          'today-calendar-styles',
          'column-direct-styles',
          'practitioner-column-colors',
          'today-column-override'
        ];

        conflictingStyles.forEach(id => {
          const el = document.getElementById(id);
          if (el) el.remove();
        });

        // Reapply in the correct order
        setTimeout(() => {
          applyPractitionerColorsToDOM(practitionerColors);

          // Find today columns and directly style them
          const todayColumns = document.querySelectorAll('.rbc-today[data-resource-id]');
          todayColumns.forEach(column => {
            const resourceId = column.getAttribute('data-resource-id');
            if (resourceId && practitionerColors[resourceId]) {
              const color = practitionerColors[resourceId];

              (column as HTMLElement).setAttribute('style',
                `background-color: ${color}30 !important;`);
            }
          });
        }, 50);
      }
    };

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

      // Reapply colors after interaction
      reapplyColors();
      return;
    }

    if (selectInfo.action === 'contextMenu') {
      setContextMenu({
        x: selectInfo.clientX,
        y: selectInfo.clientY,
        appointment: {
          startTime: date,
          endTime: new Date(date.getTime() + 30 * 60 * 1000),
          practitionerId: selectInfo.resourceId || selectedPractitionerId,
        } as Appointment,
      });

      // Reapply colors after interaction
      reapplyColors();
      return;
    }

    // Left-click: open modal as usual
    setSelectedDate(date);
    setSelectedAppointment(null);
    setSelectedAppointmentPractitionerId(selectInfo.resourceId || selectedPractitionerId);
    setIsFormOpen(true);

    // Reapply colors after interaction
    reapplyColors();
  };

  const handleViewChange = (newView: string) => {
    const isWeekView = newView === Views.WEEK;
    setView(isWeekView ? 'week' : 'day');
    if (isWeekView && !selectedPractitionerId && session?.user?.id) {
      setSelectedPractitionerId(session.user.id);
    }

    // Re-apply colors after view change, as the DOM structure changes
    setTimeout(() => {
      if (Object.keys(practitionerColors).length > 0) {

        applyPractitionerColorsToDOM(practitionerColors);

        // Directly apply colors to today's column after view change
        const today = new Date();
        const isCurrentDateToday = isSameDay(currentDate, today);

        if (isCurrentDateToday) {


          // Give DOM time to update
          setTimeout(() => {
            // Find today's columns in the DOM
            const todayColumns = document.querySelectorAll('.rbc-today[data-resource-id]');
            todayColumns.forEach((column) => {
              const resourceId = column.getAttribute('data-resource-id');
              if (resourceId && practitionerColors[resourceId]) {
                const color = practitionerColors[resourceId];


                // Apply color directly to the element
                (column as HTMLElement).style.backgroundColor = `${color}30`;
                (column as HTMLElement).style.borderLeft = `4px solid ${color}`;

                // Also apply to time slots
                const timeSlots = column.querySelectorAll('.rbc-time-slot');
                timeSlots.forEach(slot => {
                  (slot as HTMLElement).style.backgroundColor = `${color}25`;
                });
              }
            });
          }, 300);
        }
      }
    }, 200);
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

    // Re-apply practitioner colors after date change (which may affect DOM)
    setTimeout(() => {
      if (Object.keys(practitionerColors).length > 0) {
        applyPractitionerColorsToDOM(practitionerColors);

        // Extra step: directly target and color today's column
        const today = new Date();
        const isCurrentDateToday = isSameDay(date, today);

        console.log(`HandleDateChange: navigated to ${date.toDateString()}, isCurrentDateToday=${isCurrentDateToday}`);

        // Apply colors to all columns based on whether we're viewing today
        const allColumns = document.querySelectorAll('[data-resource-id]');
        allColumns.forEach((column) => {
          const resourceId = column.getAttribute('data-resource-id');
          if (resourceId && practitionerColors[resourceId]) {
            const color = practitionerColors[resourceId];
            console.log(`DIRECT DOM UPDATE for column ${resourceId}: applying color ${color}, isToday=${isCurrentDateToday}`);

            // Apply color based on whether we're viewing today's date
            (column as HTMLElement).style.backgroundColor = isCurrentDateToday ? `${color}30` : `${color}15`;

            // Also apply to time slots
            const timeSlots = column.querySelectorAll('.rbc-time-slot');
            timeSlots.forEach(slot => {
              (slot as HTMLElement).style.backgroundColor = isCurrentDateToday ? `${color}30` : `${color}15`;
            });
          }
        });
      }
    }, 100);
  };

  // Calculate the date range limits
  const getDateRangeLimits = () => {
    const start = new Date();
    const end = addMonths(new Date(), dateRange);
    return { start, end };
  };

  // Update date range when it changes
  useEffect(() => {
    // If we're in a view where the range matters, fetch more data if needed
    if (view === 'week' || view === 'day') {
      fetchAppointments();
    }
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
          ${list.map(appt => {
        const dateStr = new Date(appt.startTime).toLocaleString(undefined, {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
        const typeName = typeof appt.type === 'object' && appt.type !== null ? (appt.type as any).name ?? 'Appointment' : appt.type;
        return `<li><strong>${dateStr}</strong> – ${typeName}</li>`;
      }).join('')}
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

  // Status update handlers
  const handleStatusUpdate = async (appointment: Appointment, statusType: AppointmentStatusType) => {
    const config = APPOINTMENT_STATUS_CONFIGS[statusType];

    if (config.requiresInput) {
      if (config.inputType === 'minutes') {
        setRunningLateModal({ isOpen: true, appointment });
      } else if (config.inputType === 'note') {
        setImportantNoteModal({ isOpen: true, appointment });
      }
    } else {
      // No confirmation needed - directly update status
      const statusData: AppointmentStatusMetadata = {
        type: statusType,
        timestamp: new Date()
      };
      await updateAppointmentStatus(appointment.id, statusData);
    }
  };

  const updateAppointmentStatusWithNotes = async (appointmentId: string, statusData: AppointmentStatusMetadata, importantNote: string) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: statusData,
          mergeWithNotes: true,
          importantNote: importantNote
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      const result = await response.json();
      toast.success(`Status updated to "${result.statusConfig.label}"`);

      // Refresh appointments to show the new status and updated notes
      await fetchAppointments();
      broadcastRefresh();
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast.error('Failed to update appointment status');
    }
  };

  const handleRunningLateConfirm = async (minutes: number) => {
    if (!runningLateModal.appointment) return;

    const statusData: AppointmentStatusMetadata = {
      type: 'running_late',
      minutesLate: minutes,
      timestamp: new Date()
    };

    await updateAppointmentStatus(runningLateModal.appointment.id, statusData);
  };

  const handleImportantNoteConfirm = async (note: string) => {
    if (!importantNoteModal.appointment) return;

    const statusData: AppointmentStatusMetadata = {
      type: 'important',
      importantNote: note,
      timestamp: new Date()
    };

    await updateAppointmentStatusWithNotes(importantNoteModal.appointment.id, statusData, note);
  };

  const handleStatusConfirmationConfirm = async () => {
    if (!statusConfirmationModal.appointment || !statusConfirmationModal.statusType) return;

    const statusData: AppointmentStatusMetadata = {
      type: statusConfirmationModal.statusType,
      timestamp: new Date()
    };

    await updateAppointmentStatus(statusConfirmationModal.appointment.id, statusData);
  };

  const updateAppointmentStatus = async (appointmentId: string, statusData: AppointmentStatusMetadata) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusData })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      const result = await response.json();
      toast.success(`Status updated to "${result.statusConfig.label}"`);

      // Refresh appointments to show the new status
      await fetchAppointments();
      broadcastRefresh();
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast.error('Failed to update appointment status');
    }
  };

  const handleClearStatus = async (appointmentId: string) => {
    // Check if this appointment has an important status
    const appointment = appointments.find(a => a.id === appointmentId);
    if (appointment?.appointmentStatus &&
      (appointment.appointmentStatus as AppointmentStatusMetadata).type === 'important') {
      // Show modal to ask about clearing notes
      setClearImportantModal({ isOpen: true, appointment });
      return;
    }

    // Regular clear for non-important statuses
    await performClearStatus(appointmentId, false);
  };

  const performClearStatus = async (appointmentId: string, clearNotes: boolean) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/status`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clearNotes })
      });

      if (!response.ok) {
        throw new Error('Failed to clear status');
      }

      toast.success('Status cleared');

      // Refresh appointments to show the cleared status
      await fetchAppointments();
      broadcastRefresh();
    } catch (error) {
      console.error('Error clearing appointment status:', error);
      toast.error('Failed to clear appointment status');
    }
  };

  const handleClearImportantConfirm = async (clearNotes: boolean) => {
    if (!clearImportantModal.appointment) return;
    await performClearStatus(clearImportantModal.appointment.id, clearNotes);
    setClearImportantModal({ isOpen: false, appointment: null });
  };

  const handleQuickDelete = async (appointmentId: string) => {
    try {
      const response = await fetch(`/api/appointments?id=${appointmentId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete appointment');

      toast.success('Appointment deleted successfully');
      await fetchAppointments();
      broadcastRefresh();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast.error('Failed to delete appointment');
    }
  };

  const ContextMenu = ({ x, y, appointment, onClose }: {
    x: number;
    y: number;
    appointment: Appointment;
    onClose: () => void;
  }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const submenuRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const [showStatusSubmenu, setShowStatusSubmenu] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x, y });
    const [submenuPosition, setSubmenuPosition] = useState({ x: 0, y: 0 });
    const submenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const isInsideMainMenu = menuRef.current && menuRef.current.contains(event.target as Node);
        const isInsideSubmenu = submenuRef.current && submenuRef.current.contains(event.target as Node);

        if (!isInsideMainMenu && !isInsideSubmenu) {
          onClose();
        }
      };

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }, [onClose]);

    // Cleanup timeout on unmount
    useEffect(() => {
      return () => {
        if (submenuTimeoutRef.current) {
          clearTimeout(submenuTimeoutRef.current);
        }
      };
    }, []);

    // Calculate menu position to ensure it stays within viewport
    useEffect(() => {
      if (menuRef.current) {
        const rect = menuRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let adjustedX = x;
        let adjustedY = y;

        // Check right boundary (using fixed width of 180px)
        if (x + 180 > viewportWidth) {
          adjustedX = viewportWidth - 180 - 10;
        }

        // Check left boundary
        if (adjustedX < 10) {
          adjustedX = 10;
        }

        // Check bottom boundary
        if (y + rect.height > viewportHeight) {
          adjustedY = viewportHeight - rect.height - 10;
        }

        // Check top boundary
        if (adjustedY < 10) {
          adjustedY = 10;
        }

        setMenuPosition({ x: adjustedX, y: adjustedY });
      }
    }, [x, y]);

    // Calculate submenu position
    useEffect(() => {
      if (showStatusSubmenu && menuRef.current) {
        const menuRect = menuRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Find the Status menu item position more accurately
        const statusItem = menuRef.current.querySelector('[data-status-trigger]') as HTMLElement;
        const statusRect = statusItem ? statusItem.getBoundingClientRect() : menuRect;

        let submenuX = menuRect.right + 2; // Minimal gap from main menu
        let submenuY = statusRect.top; // Align with Status item

        const estimatedSubmenuWidth = 220;
        const estimatedSubmenuHeight = 320; // Account for all status options

        // Check right boundary - if submenu would go off-screen, position it to the left
        if (submenuX + estimatedSubmenuWidth > viewportWidth) {
          submenuX = menuRect.left - estimatedSubmenuWidth - 2;
        }

        // Check left boundary if we positioned it to the left
        if (submenuX < 10) {
          submenuX = 10;
        }

        // Check bottom boundary - if submenu would go off bottom, position it higher
        if (submenuY + estimatedSubmenuHeight > viewportHeight) {
          submenuY = viewportHeight - estimatedSubmenuHeight - 10;
        }

        // Check top boundary
        if (submenuY < 10) {
          submenuY = 10;
        }

        setSubmenuPosition({ x: submenuX, y: submenuY });
      }
    }, [showStatusSubmenu]);

    const showSubmenu = () => {
      if (submenuTimeoutRef.current) {
        clearTimeout(submenuTimeoutRef.current);
      }
      setShowStatusSubmenu(true);
    };

    const hideSubmenu = () => {
      submenuTimeoutRef.current = setTimeout(() => {
        setShowStatusSubmenu(false);
      }, 150); // Small delay to allow mouse movement
    };

    const cancelHideSubmenu = () => {
      if (submenuTimeoutRef.current) {
        clearTimeout(submenuTimeoutRef.current);
      }
    };

    const handleOpenPatientCard = () => {
      if (appointment.patientId) {
        // Check if in iframe
        const isEmbed = typeof window !== 'undefined' && window.location.search.includes('embed=1');
        if (isEmbed && window.parent) {
          // Send message to parent to open patient in a new pane
          window.parent.postMessage({
            type: 'openPane',
            pane: 'patient',
            patientId: appointment.patientId
          }, '*');
        } else {
          // Navigate directly
          router.push(`/dashboard/patients/${appointment.patientId}`);
        }
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
      <>
        <div
          ref={menuRef}
          className="fixed z-[9999] bg-white rounded-lg shadow-lg border border-gray-200 py-1 w-[180px]"
          style={{ left: menuPosition.x, top: menuPosition.y }}
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
          <button
            className="w-full px-4 py-2 text-left hover:bg-red-100 text-red-600 text-sm"
            onClick={() => {
              handleQuickDelete(appointment.id);
              onClose();
            }}
          >
            Delete
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

          {/* STATUS SUBMENU TRIGGER */}
          <div className="border-t border-gray-200 my-1"></div>
          <div
            data-status-trigger
            className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm flex items-center justify-between cursor-pointer relative"
            onMouseEnter={showSubmenu}
            onMouseLeave={hideSubmenu}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">⚙️</span>
              <span>Status</span>
              {appointment.appointmentStatus && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                  {getStatusDisplay(appointment.appointmentStatus as AppointmentStatusMetadata)}
                </span>
              )}
            </div>
            <span className="text-gray-400">›</span>
          </div>
        </div>

        {/* STATUS SUBMENU */}
        {showStatusSubmenu && (
          <div
            ref={submenuRef}
            className="fixed z-[10000] bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[220px] max-h-[320px] overflow-y-auto"
            style={{
              left: submenuPosition.x,
              top: submenuPosition.y,
              maxHeight: `${Math.min(320, window.innerHeight - submenuPosition.y - 20)}px`
            }}
            onMouseEnter={cancelHideSubmenu}
            onMouseLeave={hideSubmenu}
          >
            {/* Current status display and clear option */}
            {appointment.appointmentStatus && (
              <>
                <div className="px-4 py-2 text-sm text-gray-600 bg-gray-50 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span>{getStatusDisplay(appointment.appointmentStatus as AppointmentStatusMetadata)}</span>
                    <span>{APPOINTMENT_STATUS_CONFIGS[(appointment.appointmentStatus as AppointmentStatusMetadata).type]?.label}</span>
                  </span>
                  <button
                    className="text-xs text-red-500 hover:text-red-700"
                    onClick={() => {
                      handleClearStatus(appointment.id);
                      onClose();
                    }}
                  >
                    Clear
                  </button>
                </div>
                <div className="border-t border-gray-200 my-1"></div>
              </>
            )}

            {/* Status options */}
            {Object.values(APPOINTMENT_STATUS_CONFIGS)
              .filter(config => config.type !== 'default')
              .map((config) => (
                <button
                  key={config.type}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm flex items-center gap-2"
                  onClick={() => {
                    handleStatusUpdate(appointment, config.type);
                    onClose();
                  }}
                >
                  <span className="text-base">{config.icon}</span>
                  <span>{config.label}</span>
                </button>
              ))}
          </div>
        )}
      </>
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

      // Try direct attribute first
      const allCols = Array.from(calendarContainerRef.current.querySelectorAll('.rbc-time-column, .rbc-day-slot')) as HTMLElement[];
      const colIndex = allCols.indexOf(colEl);

      let resourceId: string | null;
      if (view === 'week') {
        // In week view columns are days; practitioner already selected
        resourceId = selectedPractitionerId;
      } else {
        // Day view columns represent practitioners after the time gutter
        const resourceIndex = Math.max(0, colIndex - 1); // skip gutter
        resourceId = colEl.getAttribute('data-resource-id') || (colEl as any).dataset?.resourceId || resources[resourceIndex]?.resourceId || selectedPractitionerId;
      }

      // Compute clicked time (6:00 – 22:00 range rounded to 5-min)
      const rect = colEl.getBoundingClientRect();
      const pct = Math.min(Math.max((e.clientY - rect.top) / rect.height, 0), 1);
      const minMinutes = 6 * 60;
      const totalMinutes = 16 * 60; // 6 -> 22 = 16 hours
      const minutesFromStart = Math.floor((pct * totalMinutes) / 5) * 5;
      const minutesOfDay = minMinutes + minutesFromStart;
      let slotDate: Date;
      if (view === 'week') {
        const dayOffset = Math.max(0, colIndex - 1); // first day column after gutter is offset 0
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        slotDate = addDays(weekStart, dayOffset);
      } else {
        const baseDateStr = colEl.getAttribute('data-date');
        slotDate = baseDateStr ? new Date(baseDateStr) : new Date(currentDate);
      }
      slotDate.setHours(0, 0, 0, 0);
      slotDate.setMinutes(minutesOfDay);

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
  }, [clipboardData, selectedPractitionerId, currentDate, view]);

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
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  // Listen for leave requests refresh (personal blocked times)
  useEffect(() => {
    const handler = () => {
      fetchLeaveBlocksData();
      fetchAppointments();
    };
    window.addEventListener('leave_requests_refresh', handler);
    return () => window.removeEventListener('leave_requests_refresh', handler);
  }, []);

  // Create and inject specific styles for each practitioner column
  const columnStylesCSS = useMemo(() => {
    if (!colorLoaded || Object.keys(practitionerColors).length === 0) return '';

    return Object.entries(practitionerColors).map(([practitionerId, color]) => `
      /* TimeslotGroup styles for practitioner ${practitionerId} */
      .rbc-timeslot-group[data-resource-id="${practitionerId}"],
      [data-resource-id="${practitionerId}"] .rbc-timeslot-group {
        background-color: ${color}15 !important;
      }
      
      /* Today's TimeslotGroup styles for practitioner ${practitionerId} */
      .rbc-today .rbc-timeslot-group[data-resource-id="${practitionerId}"],
      .rbc-today [data-resource-id="${practitionerId}"] .rbc-timeslot-group {
        background-color: ${color}30 !important;
      }
    `).join('\n');
  }, [practitionerColors, colorLoaded]);

  // Apply column colors directly to time slots using CSS
  useEffect(() => {
    if (!colorLoaded || Object.keys(practitionerColors).length === 0) return;

    // Create a style element for direct CSS injection
    const styleEl = document.createElement('style');
    styleEl.id = 'calendar-column-colors';

    // Create CSS rules for each practitioner
    const cssRules = Object.entries(practitionerColors).map(([practitionerId, color]) => `
      /* Target all elements in this practitioner's column */
      .rbc-time-header-content[data-resource-id="${practitionerId}"],
      .rbc-time-column[data-resource-id="${practitionerId}"],
      .rbc-day-slot[data-resource-id="${practitionerId}"] {
        background-color: ${color}15 !important;
      }
      
      /* Target today's column - FIXED TO USE /30 */
      .rbc-today.rbc-time-column[data-resource-id="${practitionerId}"],
      .rbc-today.rbc-day-slot[data-resource-id="${practitionerId}"] {
        background-color: ${color}30 !important;
      }
    `).join('\n');

    styleEl.textContent = cssRules;
    document.head.appendChild(styleEl);

    return () => {
      const el = document.getElementById('calendar-column-colors');
      if (el) el.remove();
    };
  }, [practitionerColors, colorLoaded]);

  // REMOVED: All complex DOM manipulation useEffects - replaced with simple CSS solution above

  // REMOVED: MutationObserver and direct DOM styling 

  // REMOVED: Force color corrections - using simple approach instead

  // Simple direct color application - fix for React Big Calendar not applying data-resource-id
  useEffect(() => {
    if (!colorLoaded || Object.keys(practitionerColors).length === 0) return;

    const applyColorsByPosition = () => {
      // Find all time columns (exclude the time gutter)
      const timeColumns = document.querySelectorAll('.rbc-time-column');
      const daySlots = document.querySelectorAll('.rbc-day-slot');

      // CENTER THE PRACTITIONER HEADERS - Apply Tailwind classes to outer .rbc-header divs
      const headers = document.querySelectorAll('.rbc-header');
      headers.forEach((header) => {
        // Add the Tailwind classes that the user confirmed work
        header.classList.add('max-w-full', 'flex', 'justify-center');
      });

      // ROBUST TODAY DETECTION - compare currentDate with actual today
      const today = new Date();
      const isCurrentDateToday = isSameDay(currentDate, today);

      if (view === 'week' && selectedPractitionerId) {
        // In week view: columns are days, apply selected practitioner's color to all days
        const selectedColor = practitionerColors[selectedPractitionerId];

        if (selectedColor) {
          // Apply to time columns (skip first one which is the time gutter)
          timeColumns.forEach((column, index) => {
            if (index === 0) return; // Skip time gutter

            // Use the robust date-based today detection
            const columnColor = isCurrentDateToday ? `${selectedColor}30` : `${selectedColor}15`;
            console.log(`🎯 Week view: column ${index} -> ${columnColor} (isCurrentDateToday=${isCurrentDateToday})`);

            (column as HTMLElement).style.setProperty('background-color', columnColor, 'important');
            (column as HTMLElement).style.setProperty('background', columnColor, 'important');
          });

          // Apply to day slots
          daySlots.forEach((slot, index) => {
            const slotColor = isCurrentDateToday ? `${selectedColor}30` : `${selectedColor}15`;
            (slot as HTMLElement).style.setProperty('background-color', slotColor, 'important');
            (slot as HTMLElement).style.setProperty('background', slotColor, 'important');
          });

          // Fix today's header specifically
          const todayHeader = document.querySelector(`.rbc-header.rbc-today`);
          if (todayHeader) {
            console.log(`Week view: fixing today's header with color ${selectedColor}`);
            (todayHeader as HTMLElement).style.setProperty('background-color', `${selectedColor}30`, 'important');
          }
        }
      } else {
        // Day view: columns are practitioners
        const practitionerIds = filteredResources.map(r => r.resourceId);

        // For day view, we only need to check if we're currently viewing today
        const isViewingToday = isCurrentDateToday;

        // Apply colors to time columns (skip first one which is the time gutter)
        timeColumns.forEach((column, index) => {
          // Skip the time gutter column (index 0)
          if (index === 0) return;

          const practitionerIndex = index - 1;
          const practitionerId = practitionerIds[practitionerIndex];
          const color = practitionerColors[practitionerId];

          if (color) {
            // In day view, if we're viewing today, all practitioner columns should be darker

            (column as HTMLElement).style.setProperty('background-color', isViewingToday ? `${color}30` : `${color}15`, 'important');
            (column as HTMLElement).style.setProperty('background', isViewingToday ? `${color}30` : `${color}15`, 'important');
            (column as HTMLElement).setAttribute('data-resource-id', practitionerId);
          }
        });

        // Apply colors to day slots as well
        daySlots.forEach((slot, index) => {
          const practitionerId = practitionerIds[index];
          const color = practitionerColors[practitionerId];

          if (color) {
            (slot as HTMLElement).style.setProperty('background-color', isViewingToday ? `${color}30` : `${color}15`, 'important');
            (slot as HTMLElement).style.setProperty('background', isViewingToday ? `${color}30` : `${color}15`, 'important');
            (slot as HTMLElement).setAttribute('data-resource-id', practitionerId);
          }
        });
      }
    };

    // Apply immediately
    applyColorsByPosition();

    // Reapply when DOM changes
    const observer = new MutationObserver(() => {
      setTimeout(applyColorsByPosition, 100);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false
    });

    return () => {
      observer.disconnect();
    };
  }, [practitionerColors, colorLoaded, filteredResources, currentDate]);

  const PrintModal = () => {
    const printers = ['HP LaserJet', 'Canon iR', 'Epson', 'Save as PDF'];

    const togglePractitioner = (id: string, checked: boolean) => {
      setSelectedPrintPractitionerIds(prev => {
        if (checked) {
          return Array.from(new Set([...prev, id]));
        } else {
          return prev.filter(pid => pid !== id);
        }
      });
    };

    const handlePreview = () => {
      const practitionerIds = (selectedPrintPractitionerIds.length ? selectedPrintPractitionerIds : practitioners.map(p => p.id)).join(',');
      const dateStr = formatLocalDate(printDate);
      const url = `/dashboard/appointments/print?practitionerIds=${practitionerIds}&date=${dateStr}&printer=${encodeURIComponent(selectedPrinter)}`;
      router.push(url);
      setIsPrintModalOpen(false);
    };

    return (
      <Dialog open={isPrintModalOpen} onOpenChange={setIsPrintModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-background">
          <DialogHeader>
            <DialogTitle>Print calendars</DialogTitle>
            <DialogDescription>Select the practitioners and printer, then preview.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="font-medium mb-1">Printer</div>
              <Select value={selectedPrinter} onValueChange={setSelectedPrinter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select printer" />
                </SelectTrigger>
                <SelectContent>
                  {printers.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="font-medium mb-1">Practitioners</div>
              <ScrollArea className="h-48 pr-2">
                <div className="space-y-2">
                  {practitioners.map(prac => {
                    const id = prac.id;
                    const checked = selectedPrintPractitionerIds.includes(id);
                    return (
                      <label key={id} className="flex items-center space-x-2 cursor-pointer">
                        <Checkbox id={`print-${id}`} checked={checked} onCheckedChange={(c) => togglePractitioner(id, Boolean(c))} />
                        <span>{prac.firstName} {prac.lastName}</span>
                      </label>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            <div>
              <div className="font-medium mb-1">Date</div>
              <Input
                type="date"
                value={formatLocalDate(printDate)}
                onChange={(e) => {
                  const newDate = new Date(e.target.value);
                  if (!isNaN(newDate.getTime())) {
                    setPrintDate(newDate);
                  }
                }}
                className="w-full"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsPrintModalOpen(false)}>Cancel</Button>
            <Button onClick={handlePreview}>Preview</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="flex h-full">
      {!colorLoaded || Object.keys(practitionerColors).length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div>Loading...</div>
        </div>
      ) : (
        <>
          <div
            ref={calendarContainerRef}
            className="flex-1 px-4"
            style={{ userSelect: 'none' }}
          >
            <Card className="p-4">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="font-medium">
                      Jump to:
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newDate = addMonths(currentDate, 3);
                        handleDateChange(newDate);
                      }}
                    >
                      +3 Months
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newDate = addMonths(currentDate, 6);
                        handleDateChange(newDate);
                      }}
                    >
                      +6 Months
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newDate = addMonths(currentDate, 12);
                        handleDateChange(newDate);
                      }}
                    >
                      +1 Year
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="text"
                      placeholder="Search patients..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-[200px]"
                    />
                  </div>
                  {view === 'week' && (
                    <div className="flex items-center space-x-2">
                      <div className="font-medium">Practitioner:</div>
                      <Select
                        value={selectedPractitionerId || ''}
                        onValueChange={(value) => setSelectedPractitionerId(value)}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Select practitioner" />
                        </SelectTrigger>
                        <SelectContent>
                          {practitioners.map((practitioner) => (
                            <SelectItem key={practitioner.id} value={practitioner.id}>
                              {practitioner.firstName} {practitioner.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedPendingForQuickFind(null);
                      setIsQuickFindModalOpen(true);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Search className="h-4 w-4" />
                    Quick Find
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsPrintModalOpen(true)}
                  >
                    <Printer className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      // If this page is embedded in an iframe (embed=1) we don't
                      // want to navigate inside the iframe. Instead, ask the
                      // parent DynamicPane to switch to the Calendar Settings
                      // pane.
                      const isEmbed = typeof window !== 'undefined' && window.location.search.includes('embed=1');
                      if (isEmbed && window.parent) {
                        window.parent.postMessage({ type: 'openPane', pane: 'calendarSettings' }, '*');
                      } else {
                        router.push('/dashboard/calendar-settings');
                      }
                    }}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <DnDCalendar
                key={`${calendarColor}-${visibleDays.join(',')}-${JSON.stringify(practitionerColors)}`}
                localizer={localizer}
                events={filteredEvents}
                eventPropGetter={(event) => {
                  if (event.isLeaveBlock) {
                    return {
                      className: 'leave-block-event',
                      style: {
                        backgroundImage: `repeating-linear-gradient(
                          45deg,
                          rgba(107,114,128,0.35) 0px,
                          rgba(107,114,128,0.35) 10px,
                          rgba(107,114,128,0.15) 10px,
                          rgba(107,114,128,0.15) 20px
                        )`,
                        backgroundColor: 'rgba(107,114,128,0.2)',
                        border: 'none',
                        pointerEvents: 'none',
                        cursor: 'not-allowed',
                        color: '#fff',
                        fontStyle: 'italic',
                      },
                    };
                  }

                  // Get the treatment type and its color
                  const type = typeof event.appointment?.type === 'object' && event.appointment?.type !== null
                    ? event.appointment.type
                    : treatmentTypes.find(t => t.name === String(event.appointment?.type));

                  // Use reservation color if it's a reservation, otherwise use treatment type color
                  let backgroundColor = type?.color || '#3174ad';
                  if (event.appointment?.isReservation || event.appointment?.appointmentType === 'RESERVATION') {
                    backgroundColor = event.appointment?.reservationColor || '#3b82f6';
                  }

                  return {
                    style: {
                      backgroundColor,
                      borderColor: backgroundColor,
                    },
                  };
                }}
                draggableAccessor={(event) => !event.isLeaveBlock}
                resizableAccessor={(event) => !event.isLeaveBlock}
                resourceIdAccessor="resourceId"
                resourceTitleAccessor="resourceTitle"
                defaultView={Views.DAY}
                view={view === 'week' ? Views.WEEK : Views.DAY}
                views={{ day: true, week: true }}
                tooltipAccessor={null}
                step={5}
                timeslots={2}
                min={new Date(0, 0, 0, 6, 0)}
                max={new Date(0, 0, 0, 22, 0)}
                allDaySlot={false}
                showAllDay={false}
                selectable
                date={currentDate}
                onNavigate={handleDateChange}
                onView={handleViewChange}
                onSelectSlot={(selectInfo) => {
                  console.log('DEBUG: onSelectSlot called with:', selectInfo);
                  if (selectInfo.action === 'contextMenu') {
                    handleDateSelect(selectInfo);
                  } else {
                    handleDateSelect(selectInfo);
                  }
                }}
                toolbar={true}
                onSelectEvent={event => {
                  clearTooltip();
                  setSelectedAppointment(event.appointment);
                  setIsFormOpen(true);
                }}
                style={{ height: calendarHeight }}
                components={{
                  event: ({ event }) => {
                    const eventRef = useRef<HTMLDivElement>(null);

                    const handleMouseMove = (e: React.MouseEvent) => {
                      if (!eventRef.current) return;

                      const rect = eventRef.current.getBoundingClientRect();
                      const isInside =
                        e.clientX >= rect.left &&
                        e.clientX <= rect.right &&
                        e.clientY >= rect.top &&
                        e.clientY <= rect.bottom;

                      if (!isInside) {
                        clearTooltip();
                        return;
                      }

                      if (tooltipData) {
                        updateTooltipPosition(e.clientX + 10, e.clientY + 10);
                      }
                    };

                    const handleMouseEnter = (e: React.MouseEvent) => {
                      // Clear any existing tooltip first
                      clearTooltip();

                      // Handle leave block tooltips
                      if (event.isLeaveBlock) {
                        const tooltipContent = (
                          <div className="space-y-1">
                            <div className="font-semibold text-sm text-gray-900">
                              {event.title}
                            </div>
                            <div className="text-xs text-gray-500">
                              Blocked Time
                            </div>
                          </div>
                        );

                        setTimeout(() => {
                          setTooltipData({
                            content: tooltipContent,
                            x: e.clientX + 15,
                            y: e.clientY - 10
                          });
                        }, 100);
                        return;
                      }

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
                            <div className="text-sm text-gray-600 italic">
                              Reservation
                            </div>
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

                      // Add a small delay to prevent flickering
                      console.log('TOOLTIP DEBUG: Creating tooltip for', {
                        eventId: event.id,
                        title: event.title,
                        typeName,
                        hasNotes: !!event.appointment?.notes
                      });

                      setTimeout(() => {
                        setTooltipData({
                          content: tooltipContent,
                          x: e.clientX + 15,
                          y: e.clientY - 10
                        });
                        console.log('TOOLTIP DEBUG: Tooltip shown');
                      }, 100);
                    };

                    const handleContextMenu = (e: React.MouseEvent) => {
                      e.preventDefault();
                      setContextMenu({
                        x: e.clientX,
                        y: e.clientY,
                        appointment: event.appointment,
                      });
                    };

                    useEffect(() => {
                      const handleGlobalMouseMove = (e: MouseEvent) => {
                        if (!eventRef.current || !tooltipData) return;

                        const rect = eventRef.current.getBoundingClientRect();
                        const isInside =
                          e.clientX >= rect.left &&
                          e.clientX <= rect.right &&
                          e.clientY >= rect.top &&
                          e.clientY <= rect.bottom;

                        if (!isInside) {
                          clearTooltip();
                        }
                      };

                      window.addEventListener('mousemove', handleGlobalMouseMove);
                      return () => {
                        window.removeEventListener('mousemove', handleGlobalMouseMove);
                      };
                    }, [tooltipData]);

                    const appointmentDuration = event.appointment?.duration || 0;
                    const isShortAppointment = appointmentDuration <= 20;

                    console.log('EVENT WRAPPER DEBUG:', {
                      eventId: event.id,
                      title: event.title,
                      duration: appointmentDuration,
                      isShortAppointment,
                      hasPatient: !!event.patient
                    });

                    return (
                      <div
                        ref={eventRef}
                        className={`h-full w-full p-1 relative ${clipboardData?.appointment?.id === event.appointment?.id && clipboardData?.action === 'cut'
                          ? 'opacity-50 border-dashed'
                          : ''
                          }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          clearTooltip();
                          // Don't open appointment form for leave blocks
                          if (!event.isLeaveBlock) {
                            setSelectedAppointment(event.appointment);
                            setIsFormOpen(true);
                          }
                        }}
                        onContextMenu={handleContextMenu}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={() => clearTooltip()}
                        onMouseMove={handleMouseMove}
                      >
                        {/* PROTECTED TEXT DISPLAY */}
                        <div className="custom-text-overlay">
                          {(() => {
                            // Handle leave blocks (personal blocked times and regular leave)
                            if (event.isLeaveBlock) {
                              return (
                                <div style={{
                                  position: 'absolute',
                                  top: 6,
                                  left: 4,
                                  right: 4,
                                  bottom: 6,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '14px',
                                  color: 'white',
                                  fontWeight: 'bold',
                                  textAlign: 'center',
                                  padding: '4px',
                                  zIndex: 200,
                                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                                  overflow: 'hidden',
                                  wordWrap: 'break-word',
                                  whiteSpace: 'normal'
                                }}>
                                  {event.title}
                                </div>
                              );
                            }

                            const type = typeof event.appointment?.type === 'object' && event.appointment?.type !== null
                              ? event.appointment.type
                              : treatmentTypes.find(t => t.name === String(event.appointment?.type));

                            // Use reservation color if it's a reservation, otherwise use treatment type color
                            let backgroundColor = type?.color || '#60a5fa';
                            if (event.appointment?.isReservation || event.appointment?.appointmentType === 'RESERVATION') {
                              backgroundColor = event.appointment?.reservationColor || '#3b82f6';
                            }

                            const textColor = getTextColor(backgroundColor);

                            const patient = event.patient;
                            const appointment = event.appointment;
                            const isReservation = !patient || appointment?.isReservation;
                            const isReservationWithPatient = isReservation && appointment?.patientId;

                            const patientIcon = isReservationWithPatient ? (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: 2,
                                  right: 2,
                                  fontSize: '14px',
                                  cursor: 'pointer',
                                  pointerEvents: 'auto',
                                  zIndex: 300,
                                }}
                                title="Open patient"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`/dashboard/patients/${appointment.patientId}`, '_blank');
                                }}
                              >
                                👤
                              </div>
                            ) : null;

                            if (isReservationWithPatient) {
                              // Show reservation text + icon
                              return (
                                <>
                                  {patientIcon}
                                  <div style={{
                                    position: 'relative',
                                    padding: '4px',
                                    fontSize: '12px',
                                    color: textColor,
                                    fontWeight: 'bold',
                                    textShadow: `1px 1px 2px ${textColor === 'white' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)'}`
                                  }}>
                                    {appointment?.notes || 'Reservation'}
                                  </div>
                                </>
                              );
                            }

                            if (isReservation) {
                              const reservationText = appointment?.notes || '🚫 Reservation 🚫';
                              console.log('RESERVATION TEXT DEBUG:', {
                                eventId: event.id,
                                text: reservationText,
                                textColor,
                                backgroundColor
                              });

                              return (
                                <div style={{
                                  position: 'absolute',
                                  top: 6,
                                  left: 4,
                                  right: 4,
                                  bottom: 6,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '16px',
                                  color: textColor,
                                  fontWeight: 'bold',
                                  textAlign: 'center',
                                  padding: '4px',
                                  zIndex: 200,
                                  textShadow: `1px 1px 2px ${textColor === 'white' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)'}`
                                }}>
                                  {reservationText}
                                </div>
                              );
                            }

                            // Regular patient appointments - always show in consistent format
                            console.log('APPOINTMENT TEXT DEBUG:', {
                              eventId: event.id,
                              patientName: event.title,
                              notes: appointment?.notes,
                              textColor,
                              backgroundColor,
                              duration: appointmentDuration,
                              isShort: isShortAppointment
                            });

                            // Check if patient has no insurance (for emoji indicator)
                            const hasNoInsurance = patient && !patient.healthInsurance;

                            // Get appointment status display
                            const statusDisplay = appointment?.appointmentStatus
                              ? getStatusDisplay(appointment.appointmentStatus as AppointmentStatusMetadata)
                              : '';

                            // Increase font sizes for better readability
                            const containerFontSize = isShortAppointment ? '12px' : '13px';
                            const noteFontSize = isShortAppointment ? '11px' : '11px';
                            const layout = isShortAppointment ? 'horizontal' : 'vertical';

                            // Compact padding for horizontal (short) layout
                            const blockPadding = isShortAppointment ? '2px' : '4px';
                            const nameMarginRight = isShortAppointment ? '2px' : '4px';

                            // For short appointments show "Name – Notes" on one line
                            const shortCombinedText = isShortAppointment && appointment?.notes
                              ? `${statusDisplay}${hasNoInsurance ? '💳 ' : ''}${event.title} – ${appointment.notes}`
                              : null;

                            return (
                              <div style={{
                                position: 'absolute',
                                top: 6,
                                left: 4,
                                right: 4,
                                bottom: 6,
                                display: 'flex',
                                flexDirection: layout === 'horizontal' ? 'row' : 'column',
                                alignItems: layout === 'horizontal' ? 'center' : 'flex-start',
                                justifyContent: 'flex-start',
                                padding: blockPadding,
                                fontSize: containerFontSize,
                                color: textColor,
                                fontWeight: 'bold',
                                zIndex: 200,
                                textShadow: `1px 1px 2px ${textColor === 'white' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)'}`,
                                lineHeight: '1.2',
                                overflow: 'hidden'
                              }}>
                                <div style={{
                                  marginBottom: layout === 'vertical' ? '2px' : '0',
                                  marginRight: layout === 'horizontal' ? nameMarginRight : '0',
                                  display: 'block',
                                  visibility: 'visible',
                                  opacity: '1'
                                }}>
                                  {!shortCombinedText ? `${statusDisplay}${hasNoInsurance ? '💳 ' : ''}${event.title}` : shortCombinedText}
                                </div>
                                {(!shortCombinedText && appointment?.notes) && (
                                  <div style={{
                                    fontSize: noteFontSize,
                                    opacity: 0.9,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    fontWeight: 'normal',
                                    display: 'block',
                                    visibility: 'visible'
                                  }}>
                                    {appointment.notes}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  },
                  resourceHeader: ({ resource }) => {
                    // Custom resource header with color
                    const color = practitionerColors[resource.resourceId] || calendarColor;
                    return (
                      <div
                        className="rbc-header max-w-full"
                        data-practitioner-id={resource.resourceId}
                        data-resource-id={resource.resourceId}
                        style={{
                          backgroundColor: `${color}30`
                        }}
                      >
                        <span>{resource.resourceTitle}</span>
                      </div>
                    );
                  },
                  timeGutterHeader: () => {
                    // Keep time gutter header consistent with resource headers
                    return (
                      <div
                        className="rbc-header max-w-full"
                        style={{ backgroundColor: '#ffffff' }}
                      >
                        <span>Time</span>
                      </div>
                    );
                  },
                  // Add data-resource-id to time columns for CSS targeting
                  timeSlotWrapper: ({ children, ...props }) => {
                    // timeSlotWrapper doesn't reliably receive resource info in React Big Calendar
                    // We'll rely on CSS-based solutions instead
                    return (
                      <div className="rbc-time-slot-wrapper">
                        {children}
                      </div>
                    );
                  },
                  // Custom time gutter cell to add resource ID attributes
                  timeGutterCell: (props) => {
                    // Time gutter doesn't actually get resource props, just the time
                    const { date } = props;
                    return (
                      <div
                        data-date={date.toISOString()}
                        className="time-gutter-cell"
                      >
                        {format(date, 'HH:mm')}
                      </div>
                    );
                  },
                  // Custom time indicator with practitioner color
                  now: ({ resourceId, ...restProps }) => {
                    // Always prioritize practitioner's custom color from database
                    const color = resourceId && practitionerColors[resourceId]
                      ? practitionerColors[resourceId]
                      : calendarColor || '#ffffff';

                    return (
                      <div
                        {...restProps}
                        className="rbc-current-time-indicator"
                        data-resource-id={resourceId} // Add resourceId for CSS targeting
                        style={{
                          backgroundColor: color,
                          height: '2px', // Make the time indicator more visible
                          zIndex: 5 // Ensure it's above other elements
                        }}
                      />
                    );
                  },
                  // Style individual day columns
                  dayWrapper: ({ resource, children }) => {
                    if (resource) {
                      const color = practitionerColors[resource.resourceId];

                      if (color) {
                        return (
                          <div
                            style={{
                              backgroundColor: `${color}15`, // dayWrapper always light
                              height: '100%'
                            }}
                            data-practitioner-id={resource.resourceId}
                          >
                            {children}
                          </div>
                        );
                      }
                    }
                    return <>{children}</>;
                  },

                  // Add a wrapper for resources to style entire columns
                  resourceWrapper: ({ resource, children }) => {
                    if (!resource) return <>{children}</>;

                    const color = practitionerColors[resource.resourceId];

                    if (color) {
                      return (
                        <div
                          className="resource-wrapper"
                          style={{
                            height: '100%',
                            backgroundColor: `${color}10`
                          }}
                          data-resource-id={resource.resourceId}
                        >
                          {children}
                        </div>
                      );
                    }
                    return <>{children}</>;
                  },
                  slotPropGetter: (date, resourceId) => {
                    // Style each time slot according to the practitioner's custom color from CalendarSettings
                    if (resourceId) {
                      // Get the practitioner's specific color from their calendar settings
                      const color = practitionerColors[resourceId];
                      const isToday = isSameDay(date, new Date());



                      // Only apply styles if we have a valid practitioner color
                      if (color) {
                        return {
                          'data-resource-id': resourceId,
                          'data-is-today': isToday ? 'true' : 'false',
                          className: `practitioner-slot practitioner-${resourceId} ${isToday ? 'today-slot' : ''}`,
                          style: {
                            backgroundColor: `${color}${isToday ? '30' : '15'} !important`,
                            position: 'relative',
                            background: `${color}${isToday ? '30' : '15'} !important`,
                            // Use CSS custom properties to force the color
                            '--practitioner-color': color,
                            '--practitioner-bg': `${color}${isToday ? '30' : '15'}`,
                            '--practitioner-border': `${isToday ? color : `${color}40`}`,
                          }
                        };
                      }
                    }
                    return {};
                  },
                  slotGroupPropGetter: (date, resourceId) => {
                    // This prop getter is specifically for slot groups (rows of time slots)
                    if (resourceId) {
                      const color = practitionerColors[resourceId];
                      const isToday = isSameDay(date, new Date());

                      // Log what color we're using for slot groups
                      if (isToday) {
                        console.log(`SLOT GROUP for ${resourceId}: using color ${color}, practitionerColors:`, practitionerColors);
                      }

                      // Only apply style if we have a valid practitioner color
                      if (color) {
                        return {
                          className: `custom-time-slot-group ${isToday ? 'is-today' : ''}`,
                          'data-resource-id': resourceId,
                          style: {
                            backgroundColor: `${color}${isToday ? '30' : '15'}`,
                            position: 'relative',
                          }
                        };
                      }
                    }
                    return {};
                  }
                }}
                resources={filteredResources}
                onEventDrop={async ({ event, start, end, resourceId }) => {
                  const newDuration = Math.round((end.getTime() - start.getTime()) / 60000);

                  // Log the drag operation
                  const patient = patients.find(p => p.id === event.appointment.patientId);
                  await logActivityClient({
                    action: LOG_ACTIONS.DRAG_APPOINTMENT,
                    entityType: ENTITY_TYPES.APPOINTMENT,
                    entityId: event.appointment.id,
                    description: `Moved appointment for ${patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient'} to ${start.toLocaleString()}`,
                    details: {
                      previousStartTime: event.appointment.startTime,
                      newStartTime: start.toISOString(),
                      previousEndTime: event.appointment.endTime,
                      newEndTime: end.toISOString(),
                      duration: newDuration,
                      practitionerId: resourceId,
                      oldPractitionerId: event.appointment.practitionerId
                    },
                    page: '/dashboard/appointments',
                    patientId: event.appointment.patientId,
                    appointmentId: event.appointment.id,
                    severity: LOG_SEVERITY.INFO
                  });

                  handleFormSubmit({
                    ...event.appointment,
                    startTime: start,
                    endTime: end,
                    duration: newDuration,
                    practitionerId: resourceId,
                  });
                }}
                onEventResize={async ({ event, start, end }) => {
                  const newDuration = Math.round((end.getTime() - start.getTime()) / 60000);

                  // Log the resize operation
                  const patient = patients.find(p => p.id === event.appointment.patientId);
                  await logActivityClient({
                    action: LOG_ACTIONS.RESIZE_APPOINTMENT,
                    entityType: ENTITY_TYPES.APPOINTMENT,
                    entityId: event.appointment.id,
                    description: `Resized appointment for ${patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient'} from ${event.appointment.duration}min to ${newDuration}min`,
                    details: {
                      previousDuration: event.appointment.duration,
                      newDuration: newDuration,
                      previousStartTime: event.appointment.startTime,
                      newStartTime: start.toISOString(),
                      previousEndTime: event.appointment.endTime,
                      newEndTime: end.toISOString()
                    },
                    page: '/dashboard/appointments',
                    patientId: event.appointment.patientId,
                    appointmentId: event.appointment.id,
                    severity: LOG_SEVERITY.INFO
                  });

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

                      // Create new appointment instead of updating
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
                        // Delete the pending appointment after successful creation
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
                  // OVERRIDE ALL TIME FORMATS TO RETURN EMPTY STRINGS - NO TIMES ANYWHERE
                  eventTimeRangeFormat: () => '',
                  eventTimeRangeStartFormat: () => '',
                  eventTimeRangeEndFormat: () => '',
                  timeGutterFormat: (date, culture, localizer) => localizer.format(date, 'HH:mm', culture), // Keep time gutter for navigation
                  selectRangeFormat: () => '',
                  agendaTimeFormat: () => '',
                  agendaTimeRangeFormat: () => '',
                  dayFormat: 'dd',
                  dayRangeHeaderFormat: () => '',
                  dayHeaderFormat: (date, culture, localizer) => {
                    return localizer.format(date, 'EEEE dd/MM', culture);
                  },
                  monthHeaderFormat: 'MMMM yyyy'
                }}
                dayPropGetter={(date, resourceId) => {
                  // Style each day column according to the practitioner's color from CalendarSettings
                  const day = format(date, 'EEEE').toLowerCase();
                  const isToday = isSameDay(date, new Date());
                  const isVisible = visibleDays.includes(day);

                  if (resourceId) {
                    // Always use the practitioner's specific color from the CalendarSettings table
                    const color = practitionerColors[resourceId];



                    // Only apply styles if we have a valid practitioner color
                    if (color) {
                      return {
                        className: isVisible ? 'rbc-day-with-custom-bg' : 'hidden',
                        'data-resource-id': resourceId,
                        'data-is-today': isToday ? 'true' : 'false',
                        style: {
                          display: isVisible ? 'block' : 'none',
                          backgroundColor: `${color}${isToday ? '30' : '15'}`, // Today darker, others light
                          position: 'relative'
                        }
                      };
                    }
                  }

                  return {
                    className: isVisible ? '' : 'hidden',
                    style: {
                      display: isVisible ? 'block' : 'none'
                    }
                  };
                }}
                slotPropGetter={(date, resourceId) => {
                  // Check if this slot is blocked by leave
                  const slotStart = new Date(date);
                  const slotEnd = new Date(date.getTime() + 30 * 60 * 1000); // 30 minutes later

                  const blockCheck = isTimeSlotBlocked(date, slotStart, slotEnd, resourceId, leaveBlocks);

                  if (blockCheck.isBlocked) {
                    const showIcon = slotStart.getMinutes() === 30; // show icon on half-hour slots only
                    const className = `leave-blocked-slot${showIcon ? ' leave-blocked-icon' : ''}`;

                    // Create a custom overlay element
                    setTimeout(() => {
                      const slots = document.querySelectorAll(`.${className.replace(' ', '.')}`);
                      slots.forEach((slot: any) => {
                        if (!slot.querySelector('.leave-overlay')) {
                          const overlay = document.createElement('div');
                          overlay.className = 'leave-overlay';
                          overlay.style.cssText = `
                            position: absolute !important;
                            top: 0 !important;
                            left: 0 !important;
                            right: 0 !important;
                            bottom: 0 !important;
                            width: 100% !important;
                            height: 100% !important;
                            background: #2d3748 !important;
                            z-index: 999999 !important;
                            pointer-events: none !important;
                            opacity: 0.9 !important;
                          `;
                          if (showIcon) {
                            overlay.innerHTML = '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 16px; z-index: 1000000;"></div>';
                          }
                          slot.style.position = 'relative';
                          slot.appendChild(overlay);
                        }
                      });
                    }, 100);

                    return {
                      className,
                      style: {
                        position: 'relative',
                        cursor: 'not-allowed',
                        pointerEvents: 'none',
                      },
                      title: blockCheck.reason || 'This time slot is blocked due to approved leave',
                    };
                  }

                  return {};
                }}
              />
            </Card>
          </div>

          {tooltipData && (
            <div
              className="fixed z-[9999] bg-white text-black p-3 rounded-lg shadow-xl border border-gray-200 text-sm pointer-events-none max-w-sm"
              style={{
                left: Math.min(tooltipData.x, window.innerWidth - 300),
                top: Math.max(10, tooltipData.y - 10),
                opacity: 1,
                transform: 'translate3d(0, 0, 0)',
                transition: 'all 0.2s cubic-bezier(0.23, 1, 0.32, 1)',
                willChange: 'transform, opacity',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
              }}
            >
              {tooltipData.content}
            </div>
          )}

          {/* Pending Appointments Mini-Calendar */}
          <div className="w-80 border-l bg-background my-4 rounded-lg">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Pending Appointments</h2>
            </div>
            <div className="h-[calc(100vh-200px)] overflow-auto">
              <div className="p-2">
                {pendingAppointments.length === 0 ? (
                  <p className="text-muted-foreground p-4">No pending appointments</p>
                ) : (
                  <div className="space-y-2">
                    {pendingAppointments.map((appointment) => {
                      const type = typeof appointment.type === 'object' && appointment.type !== null
                        ? appointment.type
                        : treatmentTypes.find(t => t.name === String(appointment.type));
                      const patient = patients.find(p => p.id === appointment.patientId);
                      return (
                        <div
                          key={appointment.id}
                          className="p-2 rounded cursor-move"
                          style={{
                            backgroundColor: type?.color || '#888888',
                            color: '#fff',
                            border: '1px solid #222',
                            transition: 'all 0.15s ease-in-out',
                            transform: 'translateZ(0)',
                          }}
                          draggable
                          onContextMenu={(e) => { e.preventDefault(); setPendingContextMenu({ x: e.clientX, y: e.clientY, pending: appointment }); }}
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', JSON.stringify({
                              type: 'PENDING',
                              appointmentId: appointment.id
                            }));
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="font-medium">
                                {patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown patient'}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-xs opacity-75">
                                {appointment.createdAt ? new Date(appointment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : ''}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedPendingForQuickFind(appointment);
                                  setIsQuickFindModalOpen(true);
                                }}
                                className="h-6 w-6 p-0"
                              >
                                <Search className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-sm mt-1">
                            {typeof appointment.type === 'string' ? appointment.type : appointment.type?.name || ''}
                          </div>
                          {appointment.notes && (
                            <p className="text-xs opacity-75 mt-1">{appointment.notes}</p>
                          )}
                          {appointment.duration && (
                            <p className="text-xs opacity-75 mt-1">Duration: {appointment.duration} minutes</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Appointment Form Dialog */}
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent className="sm:max-w-[600px] bg-background">
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
                patients={[
                  ...individualPatients.map((p) => ({
                    id: p.id,
                    patientCode: p.patientCode,
                    firstName: p.firstName,
                    lastName: p.lastName,
                    dateOfBirth: p.dateOfBirth,
                    email: p.email,
                    phone: p.phone,
                    familyHeadCode: p.familyHeadCode,
                    familyPosition: p.familyPosition,
                    isDisabled: p.isDisabled
                  })),
                  ...familyGroups.flatMap(family =>
                    family.patients.map((p) => ({
                      id: p.id,
                      patientCode: p.patientCode,
                      firstName: p.firstName,
                      lastName: p.lastName,
                      dateOfBirth: p.dateOfBirth,
                      email: p.email,
                      phone: p.phone,
                      familyHeadCode: p.familyHeadCode,
                      familyPosition: p.familyPosition,
                      isDisabled: p.isDisabled
                    }))
                  )
                ]}
                familyGroups={familyGroups}
                selectedDate={selectedDate}
                initialPractitionerId={selectedAppointmentPractitionerId || selectedPractitionerId}
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
          {isPrintModalOpen && <PrintModal />}

          {/* Status Modals */}
          <RunningLateModal
            isOpen={runningLateModal.isOpen}
            onClose={() => setRunningLateModal({ isOpen: false, appointment: null })}
            onConfirm={handleRunningLateConfirm}
            patientName={runningLateModal.appointment?.patient ? runningLateModal.appointment.patient.name : 'Patient'}
          />

          <ImportantNoteModal
            isOpen={importantNoteModal.isOpen}
            onClose={() => setImportantNoteModal({ isOpen: false, appointment: null })}
            onConfirm={handleImportantNoteConfirm}
            patientName={importantNoteModal.appointment?.patient ? importantNoteModal.appointment.patient.name : 'Patient'}
          />

          <StatusConfirmationModal
            isOpen={statusConfirmationModal.isOpen}
            onClose={() => setStatusConfirmationModal({ isOpen: false, appointment: null, statusType: null })}
            onConfirm={handleStatusConfirmationConfirm}
            statusType={statusConfirmationModal.statusType || 'default'}
            patientName={statusConfirmationModal.appointment?.patient ? statusConfirmationModal.appointment.patient.name : 'Patient'}
          />

          <ClearImportantModal
            isOpen={clearImportantModal.isOpen}
            onClose={() => setClearImportantModal({ isOpen: false, appointment: null })}
            onConfirm={handleClearImportantConfirm}
            patientName={clearImportantModal.appointment?.patient ? clearImportantModal.appointment.patient.name : 'Patient'}
          />

          {/* Quick Find Empty Spot Modal */}
          <QuickFindEmptySpotModal
            isOpen={isQuickFindModalOpen}
            onClose={() => {
              setIsQuickFindModalOpen(false);
              setSelectedPendingForQuickFind(null);
              setIsSchedulingQuickFind(false);
            }}
            onSpotFound={async (appointments) => {
              if (isSchedulingQuickFind) return;
              setIsSchedulingQuickFind(true);
              try {
                console.log('QuickFind: Received appointments to create:', appointments);

                // Create all appointments
                for (const appointment of appointments) {
                  console.log('QuickFind: Creating appointment:', appointment);
                  await handleFormSubmit(appointment);
                }

                // If this was triggered from a pending appointment, remove it
                if (selectedPendingForQuickFind) {
                  await fetch(`/api/pending-appointments?id=${selectedPendingForQuickFind.id}`, {
                    method: 'DELETE',
                  });
                  await fetchPendingAppointments();
                }

                // Refresh appointments to show the new ones in the calendar
                await fetchAppointments();

                // Broadcast refresh to other components
                broadcastRefresh();

                toast.success(`Successfully scheduled ${appointments.length} appointment${appointments.length > 1 ? 's' : ''}`);
              } catch (error) {
                console.error('Error scheduling appointments:', error);
                toast.error('Failed to schedule appointments');
              } finally {
                setIsSchedulingQuickFind(false);
              }
            }}
            pendingAppointment={selectedPendingForQuickFind}
            patients={[
              ...individualPatients.map((p) => ({
                id: p.id,
                patientCode: p.patientCode,
                firstName: p.firstName,
                lastName: p.lastName,
                dateOfBirth: p.dateOfBirth,
                email: p.email,
                phone: p.phone,
                familyHeadCode: p.familyHeadCode,
                familyPosition: p.familyPosition,
                isDisabled: p.isDisabled
              })),
              ...familyGroups.flatMap(family =>
                family.patients.map((p) => ({
                  id: p.id,
                  patientCode: p.patientCode,
                  firstName: p.firstName,
                  lastName: p.lastName,
                  dateOfBirth: p.dateOfBirth,
                  email: p.email,
                  phone: p.phone,
                  familyHeadCode: p.familyHeadCode,
                  familyPosition: p.familyPosition,
                  isDisabled: p.isDisabled
                }))
              )
            ]}
            practitioners={practitioners}
            existingAppointments={appointments}
            leaveBlocks={leaveBlocks}
          />
        </>
      )}
    </div>
  );
}
