'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { format, addMinutes, isSameDay, startOfDay, endOfDay, isWithinInterval, addDays, isAfter, isBefore } from 'date-fns';
import { Calendar, Clock, User, Users, Plus, X, Search, CheckCircle, AlertCircle } from 'lucide-react';
import { Appointment, AppointmentType } from '@/types/appointment';
import { treatmentTypes } from '@/data/treatmentTypes';

interface QuickFindEmptySpotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSpotFound: (appointments: any[]) => void;
  pendingAppointment?: any; // For when called from pending appointments
  patients: any[];
  practitioners: any[];
  existingAppointments: Appointment[];
  leaveBlocks: any[];
}

interface CombiAppointment {
  id: string;
  type: AppointmentType;
  practitionerId: string;
  duration: number;
  order: number; // 1, 2, 3... for sequence
}

interface FoundSpot {
  date: Date;
  startTime: Date;
  endTime: Date;
  practitionerId: string;
  type: AppointmentType;
  duration: number;
  order?: number;
}

export default function QuickFindEmptySpotModal({
  isOpen,
  onClose,
  onSpotFound,
  pendingAppointment,
  patients,
  practitioners,
  existingAppointments,
  leaveBlocks
}: QuickFindEmptySpotModalProps) {
  const [searchMode, setSearchMode] = useState<'single' | 'combi'>('single');
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedPractitioner, setSelectedPractitioner] = useState<string>('');
  const [selectedPractitionerType, setSelectedPractitionerType] = useState<string>('ALL');
  const [searchDays, setSearchDays] = useState<number>(7);
  const [searchStartTime, setSearchStartTime] = useState<string>('08:00');
  const [searchEndTime, setSearchEndTime] = useState<string>('17:00');

  // Combi appointment state
  const [combiAppointments, setCombiAppointments] = useState<CombiAppointment[]>([
    {
      id: '1',
      type: treatmentTypes.find(t => t.name === 'Dental cleaning') || treatmentTypes[0],
      practitionerId: '',
      duration: 30,
      order: 1
    },
    {
      id: '2',
      type: treatmentTypes.find(t => t.name === 'Check-up') || treatmentTypes[1],
      practitionerId: '',
      duration: 15,
      order: 2
    }
  ]);

  const [foundSpots, setFoundSpots] = useState<FoundSpot[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Initialize with pending appointment data if provided
  useEffect(() => {
    if (pendingAppointment && isOpen) {
      setSelectedPatient(pendingAppointment.patientId || '');
      if (pendingAppointment.type) {
        const type = typeof pendingAppointment.type === 'object'
          ? pendingAppointment.type
          : treatmentTypes.find(t => t.name === pendingAppointment.type);
        if (type) {
          setCombiAppointments([{
            id: '1',
            type,
            practitionerId: pendingAppointment.practitionerId || '',
            duration: pendingAppointment.duration || type.duration,
            order: 1
          }]);
        }
      }
    }
  }, [pendingAppointment, isOpen]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchMode('single');
      setSelectedPatient('');
      setSelectedDate('');
      setSelectedTime('');
      setSelectedPractitioner('');
      setSelectedPractitionerType('ALL');
      setSearchDays(7);
      setSearchStartTime('08:00');
      setSearchEndTime('17:00');
      setFoundSpots([]);

      // Reset combiAppointments to default state - use a more neutral default
      setCombiAppointments([
        {
          id: '1',
          type: treatmentTypes.find(t => t.name === 'Check-up') || treatmentTypes[0],
          practitionerId: '',
          duration: 15,
          order: 1
        },
        {
          id: '2',
          type: treatmentTypes.find(t => t.name === 'Dental cleaning') || treatmentTypes[1],
          practitionerId: '',
          duration: 30,
          order: 2
        }
      ]);
    }
  }, [isOpen]);

  const addCombiAppointment = () => {
    const newOrder = combiAppointments.length + 1;
    setCombiAppointments([
      ...combiAppointments,
      {
        id: Date.now().toString(),
        type: treatmentTypes[0],
        practitionerId: '',
        duration: 30,
        order: newOrder
      }
    ]);
  };

  const removeCombiAppointment = (id: string) => {
    if (combiAppointments.length > 1) {
      setCombiAppointments(combiAppointments.filter(app => app.id !== id));
    }
  };

  const updateCombiAppointment = (id: string, field: keyof CombiAppointment, value: any) => {
    setCombiAppointments(combiAppointments.map(app =>
      app.id === id ? { ...app, [field]: value } : app
    ));
  };

  const reorderCombiAppointments = (id: string, newOrder: number) => {
    const updated = combiAppointments.map(app => {
      if (app.id === id) {
        return { ...app, order: newOrder };
      }
      return app;
    });

    // Reorder all appointments based on the change
    const sorted = updated.sort((a, b) => a.order - b.order);
    setCombiAppointments(sorted);
  };

  const isTimeSlotAvailable = (startTime: Date, endTime: Date, practitionerId: string): boolean => {
    // Check if slot conflicts with existing appointments
    const conflicts = existingAppointments.filter(app =>
      app.practitionerId === practitionerId &&
      isWithinInterval(startTime, { start: new Date(app.startTime), end: new Date(app.endTime) }) ||
      isWithinInterval(endTime, { start: new Date(app.startTime), end: new Date(app.endTime) }) ||
      isWithinInterval(new Date(app.startTime), { start: startTime, end: endTime })
    );

    if (conflicts.length > 0) return false;

    // Check if slot conflicts with leave blocks
    const leaveConflicts = leaveBlocks.filter(block => {
      if (block.practitionerId && block.practitionerId !== practitionerId) return false;

      const blockStart = new Date(block.startTime);
      const blockEnd = new Date(block.endTime);

      return isWithinInterval(startTime, { start: blockStart, end: blockEnd }) ||
        isWithinInterval(endTime, { start: blockStart, end: blockEnd }) ||
        isWithinInterval(blockStart, { start: startTime, end: endTime });
    });

    if (leaveConflicts.length > 0) return false;

    return true;
  };

  const findAvailableSpots = async () => {
    setIsSearching(true);
    setFoundSpots([]);

    try {
      const startDate = selectedDate ? new Date(selectedDate) : new Date();
      const searchEndDate = addDays(startDate, searchDays);

      const spots: FoundSpot[] = [];

      if (searchMode === 'single') {
        // Single appointment search
        const type = combiAppointments[0].type;
        const duration = combiAppointments[0].duration;
        const practitionerId = selectedPractitioner || combiAppointments[0].practitionerId;

        console.log('Using treatment type for search:', type);

        // Filter practitioners by type if specified
        let availablePractitioners = practitioners;
        if (selectedPractitionerType && selectedPractitionerType !== 'ALL') {
          availablePractitioners = practitioners.filter(p => p.role === selectedPractitionerType);
        }

        // If no specific practitioner is selected, search across all available practitioners
        if (!practitionerId) {
          if (availablePractitioners.length === 0) {
            toast.error('No practitioners found for the selected type');
            return;
          }

          // Search across all available practitioners
          for (const practitioner of availablePractitioners) {
            // Search through each day for this practitioner
            for (let day = 0; day < searchDays; day++) {
              const currentDate = addDays(startDate, day);

              // Skip if specific date is selected and this isn't it
              if (selectedDate && !isSameDay(currentDate, new Date(selectedDate))) {
                continue;
              }

              // Generate time slots for this day
              const [startHour, startMinute] = searchStartTime.split(':').map(Number);
              const [endHour, endMinute] = searchEndTime.split(':').map(Number);

              let currentTime = new Date(currentDate);
              currentTime.setHours(startHour, startMinute, 0, 0);

              const endTime = new Date(currentDate);
              endTime.setHours(endHour, endMinute, 0, 0);

              while (currentTime < endTime) {
                const slotEndTime = addMinutes(currentTime, duration);

                if (slotEndTime <= endTime && isTimeSlotAvailable(currentTime, slotEndTime, practitioner.id)) {
                  spots.push({
                    date: currentDate,
                    startTime: currentTime,
                    endTime: slotEndTime,
                    practitionerId: practitioner.id,
                    type,
                    duration
                  });
                }

                currentTime = addMinutes(currentTime, 15); // 15-minute intervals
              }
            }
          }
        } else {
          // Specific practitioner selected
          if (!availablePractitioners.find(p => p.id === practitionerId)) {
            toast.error('Selected practitioner is not available for the specified type');
            return;
          }

          // Search through each day
          for (let day = 0; day < searchDays; day++) {
            const currentDate = addDays(startDate, day);

            // Skip if specific date is selected and this isn't it
            if (selectedDate && !isSameDay(currentDate, new Date(selectedDate))) {
              continue;
            }

            // Generate time slots for this day
            const [startHour, startMinute] = searchStartTime.split(':').map(Number);
            const [endHour, endMinute] = searchEndTime.split(':').map(Number);

            let currentTime = new Date(currentDate);
            currentTime.setHours(startHour, startMinute, 0, 0);

            const endTime = new Date(currentDate);
            endTime.setHours(endHour, endMinute, 0, 0);

            while (currentTime < endTime) {
              const slotEndTime = addMinutes(currentTime, duration);

              if (slotEndTime <= endTime && isTimeSlotAvailable(currentTime, slotEndTime, practitionerId)) {
                spots.push({
                  date: currentDate,
                  startTime: currentTime,
                  endTime: slotEndTime,
                  practitionerId,
                  type,
                  duration
                });
              }

              currentTime = addMinutes(currentTime, 15); // 15-minute intervals
            }
          }
        }
      } else {
        // Combi appointment search
        const validAppointments = combiAppointments.filter(app => app.practitionerId);

        if (validAppointments.length < 2) {
          toast.error('Please select at least 2 practitioners for combination appointments');
          return;
        }

        // Sort by order
        const sortedAppointments = validAppointments.sort((a, b) => a.order - b.order);

        // Search through each day
        for (let day = 0; day < searchDays; day++) {
          const currentDate = addDays(startDate, day);

          if (selectedDate && !isSameDay(currentDate, new Date(selectedDate))) {
            continue;
          }

          const [startHour, startMinute] = searchStartTime.split(':').map(Number);
          const [endHour, endMinute] = searchEndTime.split(':').map(Number);

          let currentTime = new Date(currentDate);
          currentTime.setHours(startHour, startMinute, 0, 0);

          const endTime = new Date(currentDate);
          endTime.setHours(endHour, endMinute, 0, 0);

          while (currentTime < endTime) {
            let allSlotsAvailable = true;
            const foundCombiSpots: FoundSpot[] = [];

            // Check if all appointments in sequence can fit
            let checkTime = currentTime;

            for (const appointment of sortedAppointments) {
              const slotEndTime = addMinutes(checkTime, appointment.duration);

              if (slotEndTime > endTime) {
                allSlotsAvailable = false;
                break;
              }

              if (!isTimeSlotAvailable(checkTime, slotEndTime, appointment.practitionerId)) {
                allSlotsAvailable = false;
                break;
              }

              foundCombiSpots.push({
                date: currentDate,
                startTime: checkTime,
                endTime: slotEndTime,
                practitionerId: appointment.practitionerId,
                type: appointment.type,
                duration: appointment.duration,
                order: appointment.order
              });

              checkTime = slotEndTime;
            }

            if (allSlotsAvailable) {
              spots.push(...foundCombiSpots);
            }

            currentTime = addMinutes(currentTime, 15);
          }
        }
      }

      setFoundSpots(spots);

      if (spots.length === 0) {
        toast.info('No available spots found for the specified criteria');
      } else {
        toast.success(`Found ${spots.length} available spot${spots.length > 1 ? 's' : ''}`);

        // Auto-scroll to results after a short delay
        setTimeout(() => {
          if (resultsRef.current) {
            resultsRef.current.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }
        }, 100);
      }
    } catch (error) {
      console.error('Error finding spots:', error);
      toast.error('Error searching for available spots');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSpotSelected = (spots: FoundSpot[]) => {
    // Guard: prevent double-calling
    if (!spots || spots.length === 0) return;

    // For combi mode, group by order if needed (each step should be unique)
    let appointments: any[] = [];
    if (searchMode === 'combi') {
      // Group by order, so each step is a unique appointment
      const uniqueOrders = Array.from(new Set(spots.map(s => s.order)));
      appointments = uniqueOrders.map(order => {
        const spot = spots.find(s => s.order === order);
        if (!spot) return null;
        return {
          patientId: selectedPatient,
          practitionerId: spot.practitionerId,
          type: spot.type,
          startTime: spot.startTime,
          endTime: spot.endTime,
          duration: spot.duration,
          status: 'SCHEDULED' as const,
          notes: '',
          appointmentType: 'REGULAR' as const,
          isReservation: false,
          isFamilyAppointment: false
        };
      }).filter(Boolean);
    } else {
      // Single mode: just map all spots
      appointments = spots.map(spot => ({
        patientId: selectedPatient,
        practitionerId: spot.practitionerId,
        type: spot.type,
        startTime: spot.startTime,
        endTime: spot.endTime,
        duration: spot.duration,
        status: 'SCHEDULED' as const,
        notes: '',
        appointmentType: 'REGULAR' as const,
        isReservation: false,
        isFamilyAppointment: false
      }));
    }

    onSpotFound(appointments);
    onClose();
  };

  const selectedPatientName = patients.find(p => p.id === selectedPatient);
  const selectedPractitionerName = practitioners.find(p => p.id === selectedPractitioner);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Quick Find Empty Spot
          </DialogTitle>
          <DialogDescription>
            Find available time slots for appointments. Support both single appointments and combination appointments with multiple practitioners.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search Mode Selection */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Search Mode</Label>
            <div className="grid grid-cols-2 gap-4">
              <Card
                className={`p-4 cursor-pointer border-2 transition-colors ${searchMode === 'single' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                onClick={() => setSearchMode('single')}
              >
                <div className="flex flex-col items-center space-y-2">
                  <User className="h-8 w-8" />
                  <span className="font-medium">Single Appointment</span>
                  <span className="text-sm text-gray-500 text-center">One appointment with one practitioner</span>
                </div>
              </Card>

              <Card
                className={`p-4 cursor-pointer border-2 transition-colors ${searchMode === 'combi' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                onClick={() => setSearchMode('combi')}
              >
                <div className="flex flex-col items-center space-y-2">
                  <Users className="h-8 w-8" />
                  <span className="font-medium">Combination Appointment</span>
                  <span className="text-sm text-gray-500 text-center">Multiple appointments with different practitioners</span>
                </div>
              </Card>
            </div>
          </div>

          {/* Patient Selection */}
          <div className="space-y-2">
            <Label htmlFor="patient">Patient *</Label>
            <Select value={selectedPatient} onValueChange={setSelectedPatient}>
              <SelectTrigger>
                <SelectValue placeholder="Select patient" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.firstName} {patient.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPatientName && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Selected: {selectedPatientName.firstName} {selectedPatientName.lastName}
              </div>
            )}
          </div>

          {/* Search Criteria */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Specific Date (Optional)</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Specific Time (Optional)</Label>
              <Input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
              />
            </div>
          </div>

          {/* Search Range */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="searchDays">Search Days</Label>
              <Select value={searchDays.toString()} onValueChange={(value) => setSearchDays(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="3">3 days</SelectItem>
                  <SelectItem value="7">1 week</SelectItem>
                  <SelectItem value="14">2 weeks</SelectItem>
                  <SelectItem value="30">1 month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                type="time"
                value={searchStartTime}
                onChange={(e) => setSearchStartTime(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                type="time"
                value={searchEndTime}
                onChange={(e) => setSearchEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* Single Appointment Configuration */}
          {searchMode === 'single' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Single Appointment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Treatment Type</Label>
                    <Select
                      value={combiAppointments[0]?.type?.id || ''}
                      onValueChange={(value) => {
                        const type = treatmentTypes.find(t => t.id === value);
                        console.log('Treatment type selected:', value, 'Found type:', type);
                        if (type) {
                          // Force immediate update
                          setCombiAppointments(prev => prev.map(app =>
                            app.id === '1' ? { ...app, type, duration: type.duration } : app
                          ));
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select treatment" />
                      </SelectTrigger>
                      <SelectContent>
                        {treatmentTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: type.color }}
                              />
                              {type.name} ({type.duration}min)
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Duration (minutes)</Label>
                    <Input
                      type="number"
                      value={combiAppointments[0]?.duration || 30}
                      onChange={(e) => updateCombiAppointment('1', 'duration', Number(e.target.value))}
                      min={5}
                      step={5}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Practitioner Type (Optional)</Label>
                    <Select
                      value={selectedPractitionerType}
                      onValueChange={setSelectedPractitionerType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Any practitioner type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Any practitioner type</SelectItem>
                        <SelectItem value="DENTIST">Dentist</SelectItem>
                        <SelectItem value="HYGIENIST">Dental Hygienist</SelectItem>
                        <SelectItem value="ORTHODONTIST">Orthodontist</SelectItem>
                        <SelectItem value="PERIODONTOLOGIST">Periodontologist</SelectItem>
                        <SelectItem value="IMPLANTOLOGIST">Implantologist</SelectItem>
                        <SelectItem value="ENDODONTIST">Endodontist</SelectItem>
                        <SelectItem value="ANESTHESIOLOGIST">Anesthesiologist</SelectItem>
                        <SelectItem value="DENTAL_TECHNICIAN">Dental Technician</SelectItem>
                        <SelectItem value="DENTAL_LAB_TECHNICIAN">Dental Lab Technician</SelectItem>
                        <SelectItem value="ASSISTANT">Assistant</SelectItem>
                        <SelectItem value="RECEPTIONIST">Receptionist</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Practitioner</Label>
                    <Select
                      value={selectedPractitioner || combiAppointments[0]?.practitionerId || ''}
                      onValueChange={(value) => {
                        setSelectedPractitioner(value);
                        updateCombiAppointment('1', 'practitionerId', value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select practitioner" />
                      </SelectTrigger>
                      <SelectContent>
                        {practitioners
                          .filter(practitioner =>
                            !selectedPractitionerType || selectedPractitionerType === 'ALL' || practitioner.role === selectedPractitionerType
                          )
                          .map((practitioner) => (
                            <SelectItem key={practitioner.id} value={practitioner.id}>
                              {practitioner.firstName} {practitioner.lastName}
                              {practitioner.role && (
                                <span className="text-xs text-gray-500 ml-1">
                                  ({practitioner.role.replace('_', ' ').toLowerCase()})
                                </span>
                              )}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Combination Appointment Configuration */}
          {searchMode === 'combi' && (
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Combination Appointment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pb-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Configure multiple appointments that will be scheduled sequentially
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addCombiAppointment}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Appointment
                  </Button>
                </div>

                <div className="space-y-4">
                  {combiAppointments.map((appointment, index) => (
                    <Card key={appointment.id} className="p-4 bg-muted border border-gray-200 rounded-lg shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Step {appointment.order}</Badge>
                          {combiAppointments.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCombiAppointment(appointment.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4 items-center">
                        <div className="space-y-1">
                          <Label className="text-xs">Order</Label>
                          <Select
                            value={appointment.order.toString()}
                            onValueChange={(value) => reorderCombiAppointments(appointment.id, Number(value))}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {combiAppointments.map((_, i) => (
                                <SelectItem key={i + 1} value={(i + 1).toString()}>
                                  {i + 1}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Treatment</Label>
                          <Select
                            value={appointment.type?.id || ''}
                            onValueChange={(value) => {
                              const type = treatmentTypes.find(t => t.id === value);
                              if (type) {
                                setCombiAppointments(prev => prev.map(app =>
                                  app.id === appointment.id ? { ...app, type, duration: type.duration } : app
                                ));
                              }
                            }}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Select treatment" />
                            </SelectTrigger>
                            <SelectContent>
                              {treatmentTypes.map((type) => (
                                <SelectItem key={type.id} value={type.id}>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: type.color }}
                                    />
                                    {type.name} ({type.duration}min)
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Duration</Label>
                          <Input
                            type="number"
                            value={appointment.duration || 30}
                            onChange={(e) => setCombiAppointments(prev => prev.map(app =>
                              app.id === appointment.id ? { ...app, duration: Number(e.target.value) } : app
                            ))}
                            min={5}
                            step={5}
                            className="h-8"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Practitioner</Label>
                          <Select
                            value={appointment.practitionerId || ''}
                            onValueChange={(value) => setCombiAppointments(prev => prev.map(app =>
                              app.id === appointment.id ? { ...app, practitionerId: value } : app
                            ))}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Select practitioner" />
                            </SelectTrigger>
                            <SelectContent>
                              {practitioners.map((practitioner) => (
                                <SelectItem key={practitioner.id} value={practitioner.id}>
                                  {practitioner.firstName} {practitioner.lastName}
                                  {practitioner.role && (
                                    <span className="text-xs text-gray-500 ml-1">
                                      ({practitioner.role.replace('_', ' ').toLowerCase()})
                                    </span>
                                  )}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search Button */}
          <div className="flex justify-center">
            <Button
              onClick={findAvailableSpots}
              disabled={isSearching || !selectedPatient}
              className="px-8"
            >
              {isSearching ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Find Available Spots
                </>
              )}
            </Button>
          </div>

          {/* Results */}
          {searchMode === 'combi' && foundSpots.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
              <div className="font-semibold text-green-700 mb-2">
                ✓ Found {foundSpots.length} Available Spots
              </div>
              {/* Group spots by combination (sequential steps) */}
              {(() => {
                // Group spots by their starting time (first step)
                const groups: Record<string, FoundSpot[]> = {};
                foundSpots.forEach(spot => {
                  if (spot.order === 1) {
                    const key = spot.startTime.toISOString();
                    groups[key] = [spot];
                  }
                });
                // For each group, find the matching next steps
                Object.keys(groups).forEach(key => {
                  let prev = groups[key][0];
                  let nextOrder = 2;
                  while (true) {
                    const next = foundSpots.find(s => s.order === nextOrder && s.startTime.getTime() === prev.endTime.getTime());
                    if (!next) break;
                    groups[key].push(next);
                    prev = next;
                    nextOrder++;
                  }
                });
                // Only show complete combinations (all steps)
                const completeGroups = Object.values(groups).filter(g => g.length === combiAppointments.length);
                if (completeGroups.length === 0) return <div className="text-gray-500">No complete combinations found.</div>;
                return (
                  <div className="space-y-4">
                    {completeGroups.map((group, idx) => (
                      <div key={group[0].startTime.toISOString()} className="bg-white rounded-md border p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div className="flex-1 flex flex-col md:flex-row md:items-center gap-2">
                          {group.map((step, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-500">{step.order}.</span>
                              <span className="font-medium">{step.type.name} ({step.duration}min)</span>
                              <span className="text-xs text-gray-400">{format(step.startTime, 'HH:mm')} - {format(step.endTime, 'HH:mm')}</span>
                              <span className="text-xs text-gray-600">{practitioners.find(p => p.id === step.practitionerId)?.firstName}</span>
                              {i < group.length - 1 && <span className="mx-2 text-gray-300">→</span>}
                            </div>
                          ))}
                        </div>
                        <Button size="sm" onClick={() => handleSpotSelected(group)}>
                          Select This Time
                        </Button>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 