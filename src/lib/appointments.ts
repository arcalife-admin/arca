/**
 * Convert a pending appointment to a regular appointment
 * 
 * @param pendingAppointment - The pending appointment data
 * @param practitionerId - The ID of the practitioner to assign
 * @returns The created appointment or null if failed
 */
export const convertPendingToAppointment = async (
  pendingAppointment: any,
  practitionerId: string
): Promise<any | null> => {
  try {
    // Create a new regular appointment
    const appointmentResponse = await fetch('/api/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startTime: pendingAppointment.startTime,
        endTime: pendingAppointment.endTime,
        duration: pendingAppointment.duration,
        type: pendingAppointment.type,
        status: 'SCHEDULED',
        notes: pendingAppointment.notes,
        patientId: pendingAppointment.patientId,
        practitionerId,
      }),
    });

    if (!appointmentResponse.ok) {
      throw new Error('Failed to create appointment');
    }

    const appointment = await appointmentResponse.json();

    // Delete the pending appointment
    const deleteResponse = await fetch(`/api/pending-appointments?id=${pendingAppointment.id}`, {
      method: 'DELETE',
    });

    if (!deleteResponse.ok) {
      throw new Error('Failed to delete pending appointment');
    }

    return appointment;
  } catch (error) {
    console.error('Error converting pending appointment:', error);
    return null;
  }
};

/**
 * Fetch appointments for the dashboard
 * Returns appointments for the current day
 */
export const fetchTodaysAppointments = async (): Promise<any[]> => {
  try {
    // Get today's date at start and end
    const today = new Date();
    const startDate = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endDate = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    const response = await fetch(`/api/appointments?startDate=${startDate}&endDate=${endDate}`);
    if (!response.ok) {
      throw new Error('Failed to fetch today\'s appointments');
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching today\'s appointments:', error);
    return [];
  }
};

/**
 * Calculate time slots for appointments
 * 
 * @param startTime - The start time
 * @param duration - Duration in minutes
 * @returns An array of time slots
 */
export const calculateTimeSlots = (
  startTime: Date,
  duration: number
): { start: Date; end: Date }[] => {
  const slots = [];
  const slotDuration = 5; // 5-minute slots
  const numSlots = Math.ceil(duration / slotDuration);

  for (let i = 0; i < numSlots; i++) {
    const start = new Date(startTime);
    start.setMinutes(start.getMinutes() + (i * slotDuration));

    const end = new Date(start);
    end.setMinutes(end.getMinutes() + slotDuration);

    slots.push({ start, end });
  }

  return slots;
}; 