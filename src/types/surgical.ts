export type BodyArea = 'face' | 'breast' | 'body' | 'other';
export type ProcedureType = 'rhinoplasty' | 'blepharoplasty' | 'otoplasty' | 'face_lift' | 'breast_implant' | 'breast_lift' | 'gynecomastia' | 'liposuction' | 'abdominoplasty' | 'labiaplasty' | 'injection' | 'other';

export interface SurgicalProcedure {
  id: string;
  patientId: string;
  codeId: string;
  date: string;
  notes?: string;
  status: string;
  quantity: number;
  cost?: number;
  practitionerId?: string;
  bodyArea?: string;
  procedureType?: string;
  anesthesiaType?: string;
  isPaid: boolean;
  paymentAmount?: number;
  paymentMethod?: string;
  paidAt?: string;
  invoiceEmail: boolean;
  invoicePrinted: boolean;
  createdAt: string;
  updatedAt: string;
  code?: {
    id: string;
    code: string;
    description: string;
    price?: number;
    currency?: string;
    section?: string;
    subSection?: string;
    patientType?: string;
    requirements?: any;
    duration?: number;
  };
}

export interface SurgicalProcedureCode {
  code: string;
  description: string;
  price: number | null;
  currency?: string;
  category: string;
  section?: string;
  subSection?: string;
  patientType?: string;
  duration?: number; // Duration in minutes
  requirements: {
    category?: string;
    bodyArea?: BodyArea | BodyArea[];
    procedureType?: ProcedureType | ProcedureType[];
    timeUnit?: number;
    minElements?: number;
    maxElements?: number;
    includes?: string[];
    excludes?: string[];
    applicableWith?: string[];
    incompatibleWith?: string[];
    mustCombineWithOthers?: boolean;
    patientTypes?: string[];
    patientAge?: {
      min?: number;
      max?: number;
    };
    location?: string;
    perMonth?: boolean;
    consultationType?: string;
    type?: string;
    generalRules?: string[];
    calendarMonth?: number;
    materialCosts?: {
      min?: number;
      max?: number;
    };
    notes?: string[];
    isTimeDependent?: boolean;
    followUpCode?: string;
  };
}

export interface BeforeAfterPhotoData {
  photos: Record<string, {
    before?: string[];
    after?: string[];
    date?: string;
    notes?: string;
  }>;
  bodyAreas?: Record<string, {
    photos: string[];
    date: string;
    notes?: string;
  }>;
}

export enum TreatmentStatus {
  Planned = 'planned',
  InProgress = 'in_progress',
  Completed = 'completed',
  Cancelled = 'cancelled'
}

export enum TreatmentPriority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Emergency = 'emergency'
}

export enum BodyAreaEnum {
  FACE = 'face',
  BREAST = 'breast',
  BODY = 'body',
  OTHER = 'other'
}

export enum ProcedureTypeEnum {
  RHINOPLASTY = 'rhinoplasty',
  BLEPHAROPLASTY = 'blepharoplasty',
  OTOPLASTY = 'otoplasty',
  FACE_LIFT = 'face_lift',
  BREAST_IMPLANT = 'breast_implant',
  BREAST_LIFT = 'breast_lift',
  GYNECOMASTIA = 'gynecomastia',
  LIPOSUCTION = 'liposuction',
  ABDOMINOPLASTY = 'abdominoplasty',
  LABIAPLASTY = 'labiaplasty',
  INJECTION = 'injection',
  OTHER = 'other'
}

