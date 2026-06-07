'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowLeft } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { HexColorPicker } from 'react-colorful';
import { Trash2 } from 'lucide-react';
import PersonalReservationForm from '@/components/calendar/PersonalReservationForm'

interface PersonalBlock {
  id: string;
  startTime: string;
  endTime: string;
  notes: string | null;
  isReservation: boolean;
  description?: string;
  isPartialDay?: boolean;
  startTimeStr?: string;
  endTimeStr?: string;
}

export default function CalendarSettingsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();

  // Personal Setări calendar
  const [calendarColor, setCalendarColor] = useState<string | null>(null);
  const [colorLoaded, setColorLoaded] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [visibleDays, setVisibleDays] = useState<string[]>(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);
  const [blockedTimes, setBlockedTimes] = useState<Array<{ day: string; start: string; end: string }>>([]);
  const [blockedDays, setBlockedDays] = useState<string[]>([]);

  // Personal reservation list
  const [personalBlocks, setPersonalBlocks] = useState<PersonalBlock[]>([]);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetchPersonalBlocks();
  }, [session]);

  const fetchPersonalBlocks = async () => {
    try {
      const response = await fetch('/api/leave-requests?view=user');
      if (!response.ok) throw new Error('Failed');
      const data = await response.json();
      // Filter for approved personal blocks (blocked times)
      const approvedBlocks = data.leaveRequests.filter((req: any) =>
        req.leaveType === 'PERSONAL' &&
        (req.status === 'APPROVED' || req.status === 'ALTERNATIVE_ACCEPTED')
      ).map((req: any) => ({
        id: req.id,
        startTime: req.startDate,
        endTime: req.endDate,
        notes: req.title,
        isReservation: true,
        description: req.description,
        isPartialDay: req.isPartialDay,
        startTimeStr: req.startTime,
        endTimeStr: req.endTime
      }));
      setPersonalBlocks(approvedBlocks);
    } catch (error) {
      console.error('Failed to fetch personal blocks:', error);
    }
  };

  const deletePersonalBlock = async (blockId: string) => {
    try {
      const response = await fetch('/api/leave-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaveRequestId: blockId,
          type: 'review',
          action: 'DENY',
          reviewComentarii: 'Anulat by user'
        })
      });
      if (!response.ok) throw new Error('Ștergerea');
      toast({ title: 'Succes', description: 'Perioada blocată a fost eliminată' });
      fetchPersonalBlocks();
      window.dispatchEvent(new CustomEvent('leave_requests_refresh'));
    } catch (error) {
      console.error('Failed to delete block:', error);
      toast({ title: 'Eroare', description: 'Eliminarea perioadei blocate a eșuat', variant: 'destructive' });
    }
  };

  // Determine if this page is being displayed inside an iframe from DynamicPane
  const isEmbed = typeof window !== 'undefined' && window.location.search.includes('embed=1');

  useEffect(() => {
    fetchColor();
  }, []);

  const fetchColor = async () => {
    const res = await fetch('/api/calendar-settings/personal');
    if (res.ok) {
      const data = await res.json();
      if (data?.color) setCalendarColor(data.color);
      else setCalendarColor('#4F46E5');
      if (data?.visibleDays) setVisibleDays(data.visibleDays);
      else setVisibleDays(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);
    } else {
      setCalendarColor('#4F46E5');
      setVisibleDays(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);
    }
    setColorLoaded(true);
  };

  const handlePersonalSettingsSave = async () => {
    try {
      const res = await fetch('/api/calendar-settings/personal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          color: calendarColor,
          visibleDays: visibleDays
        }),
      });
      if (!res.ok) throw new Error('Salvarea');
      toast({ title: 'Succes', description: 'Setările personale ale calendarului au fost salvate' });
      try {
        localStorage.setItem('calendar_settings_refresh', Date.now().toString());
      } catch { }
    } catch (e) {
      toast({ title: 'Eroare', description: 'Salvarea setărilor personale a eșuat', variant: 'destructive' });
    }
  };

  // Only render the color picker after loading
  if (!colorLoaded) return <div>Se încarcă...</div>;

  return (
    <div className="container mx-auto py-6">
      <div className="mb-4">
        {isEmbed ? (
          <Button
            variant="ghost"
            className="flex items-center gap-2"
            onClick={() => {
              // Ask the parent DynamicPane to switch back to the Week Calendar
              if (window.parent) {
                window.parent.postMessage({ type: 'openPane', pane: 'weekCalendar' }, '*');
              }
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            Înapoi la calendar
          </Button>
        ) : (
          <Link href="/dashboard/appointments">
            <Button variant="ghost" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Înapoi la programări
            </Button>
          </Link>
        )}
      </div>

      {/* Personal Setări calendar */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Setări personale calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {/* Calendar Color */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Culoare calendar</label>
              <div className="flex items-center gap-2">
                <div
                  className="w-10 h-10 rounded-md border cursor-pointer"
                  style={{ backgroundColor: calendarColor }}
                  onClick={() => setShowColorPicker(!showColorPicker)}
                />
                <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-[180px] justify-start text-left font-normal"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: calendarColor }}
                        />
                        <span>{calendarColor}</span>
                      </div>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3">
                    <HexColorPicker color={calendarColor!} onChange={setCalendarColor} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Visible Days */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Zile vizibile</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'monday', label: 'Luni' },
                  { value: 'tuesday', label: 'Marți' },
                  { value: 'wednesday', label: 'Miercuri' },
                  { value: 'thursday', label: 'Joi' },
                  { value: 'friday', label: 'Vineri' },
                  { value: 'saturday', label: 'Sâmbătă' },
                  { value: 'sunday', label: 'Duminică' }
                ].map((day) => (
                  <div key={day.value} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={day.value}
                      checked={visibleDays.includes(day.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setVisibleDays([...visibleDays, day.value]);
                        } else {
                          setVisibleDays(visibleDays.filter(d => d !== day.value));
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor={day.value} className="text-sm font-medium">
                      {day.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Timp blocats */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Intervale blocate</label>
              <div className="space-y-4">
                {blockedTimes.map((block, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Select
                      value={block.day}
                      onValueChange={(value) => {
                        const newBlocks = [...blockedTimes];
                        newBlocks[index].day = value;
                        setBlockedTimes(newBlocks);
                      }}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Zi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monday">Luni</SelectItem>
                        <SelectItem value="tuesday">Marți</SelectItem>
                        <SelectItem value="wednesday">Miercuri</SelectItem>
                        <SelectItem value="thursday">Joi</SelectItem>
                        <SelectItem value="friday">Vineri</SelectItem>
                        <SelectItem value="saturday">Sâmbătă</SelectItem>
                        <SelectItem value="sunday">Duminică</SelectItem>
                      </SelectContent>
                    </Select>
                    <input
                      type="time"
                      value={block.start}
                      onChange={(e) => {
                        const newBlocks = [...blockedTimes];
                        newBlocks[index].start = e.target.value;
                        setBlockedTimes(newBlocks);
                      }}
                      className="border rounded px-2 py-1"
                    />
                    <span>-</span>
                    <input
                      type="time"
                      value={block.end}
                      onChange={(e) => {
                        const newBlocks = [...blockedTimes];
                        newBlocks[index].end = e.target.value;
                        setBlockedTimes(newBlocks);
                      }}
                      className="border rounded px-2 py-1"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setBlockedTimes(blockedTimes.filter((_, i) => i !== index));
                      }}
                    >
                      Elimină
                    </Button>
                  </div>
                ))}
                {/* New reservation modal trigger */}
                <PersonalReservationForm onSubmit={() => {
                  fetchPersonalBlocks();
                  window.dispatchEvent(new CustomEvent('leave_requests_refresh'));
                }} />
              </div>
            </div>

            {/* Existing personal blocks list */}
            {personalBlocks.length > 0 && (
              <div className="mt-6 space-y-2">
                <h3 className="text-sm font-medium">Blocări existente</h3>
                <div className="border rounded-md divide-y">
                  {personalBlocks.map((block) => (
                    <div key={block.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{block.notes}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(block.startTime).toLocaleDateString()}
                          {block.startTime !== block.endTime && (
                            <> - {new Date(block.endTime).toLocaleDateString()}</>
                          )}
                          {block.isPartialDay && block.startTimeStr && block.endTimeStr && (
                            <> • {block.startTimeStr} - {block.endTimeStr}</>
                          )}
                        </div>
                        {block.description && (
                          <div className="text-xs text-gray-400 mt-1">{block.description}</div>
                        )}
                      </div>
                      <Button size="sm" variant="destructive" onClick={() => deletePersonalBlock(block.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Blocked Days */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Zile blocate</label>
              <Select
                value={blockedDays.join(',')}
                onValueChange={(value) => setBlockedDays(value ? value.split(',') : [])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectați zilele blocate" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="saturday,sunday">Weekend-uri</SelectItem>
                  <SelectItem value="sunday">Duminică</SelectItem>
                  <SelectItem value="saturday">Sâmbătă</SelectItem>
                  <SelectItem value="friday">Vineri</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end">
              <Button onClick={handlePersonalSettingsSave}>
                Salvează setările
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 