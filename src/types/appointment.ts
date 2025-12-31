import { AppointmentStatusMetadata } from './appointment-status';

export type AppointmentStatus = 'SCHEDULED' | 'PENDING' | 'COMPLETED' | 'CANCELLED';

export type AppointmentTypeEnum = 'REGULAR' | 'RESERVATION' | 'FAMILY';

export type AppointmentType = {
  id: string;
  name: string;
  duration: number; // in minutes
  color: string;
  description?: string;
};

export interface Appointment {
  id: string;
  patientId?: string; // Optional for reservations
  practitionerId: string;
  type: AppointmentType;
  startTime: Date;
  endTime: Date;
  status: AppointmentStatus;
  notes?: string;

  // Enhanced appointment types
  appointmentType: AppointmentTypeEnum;
  reservationColor?: string; // Custom color for reservations
  isReservation: boolean;
  isFamilyAppointment: boolean;
  familyAppointmentId?: string; // Groups family appointments together

  // Appointment status metadata
  appointmentStatus?: AppointmentStatusMetadata;

  createdAt: Date;
  updatedAt: Date;
  duration: number; // in minutes
  patient?: {
    id: string;
    name: string;
  };
  doctor: {
    id: string;
    name: string;
  };
}

export interface PendingAppointment {
  id: string;
  patientId: string;
  practitionerId: string;
  type: AppointmentType;
  status: 'PENDING';
  notes?: string;
  requestedBy: string;
  createdAt: Date;
  priority?: 'high' | 'medium' | 'low';
  duration: number; // in minutes
  patient: {
    id: string;
    name: string;
  };
  doctor: {
    id: string;
    name: string;
  };
}

export interface CalendarView {
  type: 'day' | 'week' | 'month';
  currentDate: Date;
}

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  isAvailable: boolean;
}

export interface DoctorSchedule {
  practitionerId: string;
  name: string;
  workingHours: {
    start: string; // HH:mm format
    end: string; // HH:mm format
    days: number[]; // 0-6 for Sunday-Saturday
  };
}

// Patient Code based family types
export interface PatientWithCode {
  id: string;
  patientCode: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  email: string;
  phone: string;
  familyHeadCode?: string;
  familyPosition?: number;
  isDisabled: boolean;
}

export interface FamilyGroup {
  familyHeadCode: string;
  patients: PatientWithCode[];
}

export interface FamilyAppointmentRequest {
  familyHeadCode: string;
  selectedPatientCodes: string[];
  practitionerId: string;
  startTime: Date;
  duration: number;
  type: AppointmentType;
  notes?: string;
}

export interface ReservationRequest {
  practitionerId: string;
  startTime: Date;
  duration: number;
  notes?: string;
  reservationColor: string;
  patientId?: string; // Optional patient connection
} 