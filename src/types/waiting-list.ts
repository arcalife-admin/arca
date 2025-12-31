export interface WaitingListEntry {
  id: string;
  patientId: string;
  practitionerId: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  waitingAppointmentId?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

  patient: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
  };

  practitioner: {
    id: string;
    firstName: string;
    lastName: string;
  };

  creator: {
    id: string;
    firstName: string;
    lastName: string;
  };

  waitingAppointment?: WaitingAppointment;
}

export interface WaitingAppointment {
  id: string;
  patientId: string;
  type: string;
  duration: number;
  notes?: string;
  status: string;
  priority: string;
  startTime?: Date;
  endTime?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;

  patient: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
  };

  creator: {
    id: string;
    firstName: string;
    lastName: string;
  };

  waitingListEntry?: WaitingListEntry;
}

export interface WaitingListStats {
  practitionerId: string;
  practitionerName: string;
  practitionerRole: string;
  patientCount: number;
}

export interface CreateWaitingListEntryData {
  patientId: string;
  practitionerId: string;
  notes?: string;
  waitingAppointment?: {
    type: string;
    duration: number;
    notes?: string;
    priority?: string;
    startTime?: Date;
    endTime?: Date;
  };
}

export interface UpdateWaitingListEntryData {
  id: string;
  notes?: string;
  status?: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  waitingAppointment?: {
    type: string;
    duration: number;
    notes?: string;
    priority: string;
    startTime?: Date;
    endTime?: Date;
  };
  waitingAppointmentId?: string;
} 