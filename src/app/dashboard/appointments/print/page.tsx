'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { treatmentTypes } from '@/data/treatmentTypes';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

// Configure the date-fns localiser (same as main calendar)
const locales = { 'en-US': require('date-fns/locale/en-US') };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales,
});

const calendarFormats = {
  timeGutterFormat: (date: Date, culture: any, localizer: any) => localizer.format(date, 'HH:mm', culture),
  eventTimeRangeFormat: () => '',
  eventTimeRangeStartFormat: () => '',
  eventTimeRangeEndFormat: () => '',
};

export default function PrintCalendarPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Practitioners to print for (comma-separated ids)
  const practitionerIds = useMemo(() => {
    const raw = searchParams.get('practitionerIds') || '';
    return raw.split(',').filter(Boolean);
  }, [searchParams]);

  // Date to print (ISO yyyy-mm-dd) – default: tomorrow
  const dateStr = useMemo(() => {
    const raw = searchParams.get('date');
    if (raw) return raw;
    const tmrw = new Date();
    tmrw.setDate(tmrw.getDate() + 1);
    return tmrw.toISOString().split('T')[0];
  }, [searchParams]);

  // Printer is purely cosmetic – we only display it in header if provided
  const printer = searchParams.get('printer') || 'Demo printer';

  const [practitioners, setPractitioners] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);

  // Fetch practitioners once
  useEffect(() => {
    const fetchPractitioners = async () => {
      const res = await fetch('/api/practitioners');
      const data = await res.json();
      setPractitioners(data.filter((p: any) => practitionerIds.includes(p.id)));
    };
    if (practitionerIds.length) fetchPractitioners();
  }, [practitionerIds]);

  // Fetch appointments for each practitioner for the selected day
  useEffect(() => {
    const fetchDayAppointments = async () => {
      const start = `${dateStr}T00:00:00.000Z`;
      const end = `${dateStr}T23:59:59.999Z`;

      const promises = practitionerIds.map(async (id) => {
        const res = await fetch(`/api/appointments?practitionerId=${id}&startDate=${start}&endDate=${end}`);
        return res.json();
      });

      const results = await Promise.all(promises);
      setAppointments(results.flat());
    };
    if (practitionerIds.length) fetchDayAppointments();
  }, [practitionerIds, dateStr]);

  // Build events array for calendar
  const eventsByPractitioner: Record<string, any[]> = useMemo(() => {
    const map: Record<string, any[]> = {};
    appointments.forEach((appt: any) => {
      const patientName = appt.patient ? `${appt.patient.firstName} ${appt.patient.lastName}` : 'Reservation';
      const notes = appt.notes ? ` – ${appt.notes}` : '';
      const title = `${patientName}${notes}`;
      const event = {
        id: appt.id,
        title,
        start: new Date(appt.startTime),
        end: new Date(appt.endTime),
        allDay: false,
      };
      if (!map[appt.practitionerId]) map[appt.practitionerId] = [];
      map[appt.practitionerId].push(event);
    });
    return map;
  }, [appointments]);

  // Simple colour helper for treatment types
  const getEventColor = (event: any) => {
    const appt = appointments.find((a) => a.id === event.id);
    if (!appt) return '#60a5fa';
    let type = appt.type;
    if (typeof type !== 'string') {
      type = treatmentTypes.find((t) => t.name === type?.name)?.color;
    } else {
      type = treatmentTypes.find((t) => t.name === type)?.color;
    }
    return type || '#60a5fa';
  };

  // Print style – one page per practitioner
  const printStyles = `
    @media print {
      .print-page { page-break-after: always; }
    }
  `;

  return (
    <div className="p-4">
      <style>{printStyles}</style>
      <div className="print:hidden mb-4 flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>
      <h1 className="text-xl font-semibold mb-4">Print preview – {new Date(dateStr).toLocaleDateString()} ({printer})</h1>

      {practitionerIds.map((id) => {
        const practitioner = practitioners.find((p) => p.id === id);
        const name = practitioner ? `${practitioner.firstName} ${practitioner.lastName}` : id;
        const events = eventsByPractitioner[id] || [];
        return (
          <div key={id} className="print-page mb-8 border p-4 shadow-sm" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto' }}>
            <h2 className="text-lg font-medium mb-2 text-center">{name}</h2>
            <Calendar
              localizer={localizer}
              events={events}
              defaultView={Views.DAY}
              view={Views.DAY}
              date={new Date(dateStr)}
              toolbar={false}
              timeslots={2}
              step={30}
              min={new Date(0, 0, 0, 6, 0)}
              max={new Date(0, 0, 0, 22, 0)}
              style={{ height: '250mm' }}
              formats={calendarFormats}
              eventPropGetter={(event) => {
                const bg = getEventColor(event);
                return {
                  style: {
                    backgroundColor: bg,
                    color: '#fff',
                    border: '1px solid #1e1e1e',
                    fontSize: '10px',
                  },
                };
              }}
            />
          </div>
        );
      })}
    </div>
  );
} 