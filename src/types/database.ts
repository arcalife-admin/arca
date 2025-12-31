// Database types that can be safely imported on both client and server
// These are manually defined to avoid importing @prisma/client on the client side

export type UserRole = 'ADMIN' | 'MANAGER' | 'PRACTITIONER' | 'ASSISTANT' | 'RECEPTIONIST' | 'ORGANIZATION_OWNER'

export type AppointmentStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export type LeaveRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALTERNATIVE_PROPOSED' | 'ALTERNATIVE_ACCEPTED' | 'ALTERNATIVE_REJECTED'

export type DentalProcedureStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export type OrderStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export type PaymentStatus = 'PENDING' | 'PAID' | 'PARTIAL' | 'REFUNDED'

export type RepairRequestStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

// Patient interface for client-side use
export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  dateOfBirth?: Date | null;
  gender?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  medicalHistory?: string | null;
  allergies?: string | null;
  medications?: string | null;
  insuranceProvider?: string | null;
  insuranceNumber?: string | null;
  notes?: string | null;
  status?: string | null;
  createdAt: Date;
  updatedAt: Date;
  organizationId: string;
  familyId?: string | null;
  dentalChart?: any;
  periodontalChart?: any;
  patientCode?: string | null;
}

// Calibration interface for client-side use
export interface Calibration {
  id: string;
  imageId: string;
  pixelWidth: number;
  pixelHeight: number;
  realWidth: number;
  realHeight: number;
  unit: string;
  createdAt: Date;
  updatedAt: Date;
}

// Annotation interface for client-side use
export interface Annotation {
  id: string;
  imageId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
  text?: string | null;
  color?: string | null;
  createdAt: Date;
  updatedAt: Date;
} 