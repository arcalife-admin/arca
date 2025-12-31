export type ToothSurfaceType = 'occlusal' | 'buccal' | 'lingual' | 'mesial' | 'distal';
export type ProcedureType = 'filling' | 'crown' | 'extraction' | 'implant';

export interface DentalProcedure {
  id: string;
  patientId: string;
  codeId: string;
  date: string;
  notes?: string;
  status: string;
  toothNumber?: number;
  quantity: number;
  cost?: number;
  practitionerId?: string;
  subSurfaces: string[];
  fillingMaterial?: string;
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
    points?: number;
    rate?: number | string;
    tariff?: number | string;
    section?: string;
    subSection?: string;
    patientType?: string;
    requirements?: any;
  };
}

export interface ToothData {
  surfaces: Partial<Record<ToothSurfaceType, ProcedureType>>;
  procedures: DentalProcedure[];
  notes?: string;
}

export interface PeriodontalMeasurement {
  pocketDepth: number | null;
  recession: number | null;
  bleeding: boolean;
  suppuration: boolean;
  plaque: boolean;
  furcation: number | null;
}

export interface ToothSite {
  distal: PeriodontalMeasurement;
  middle: PeriodontalMeasurement;
  mesial: PeriodontalMeasurement;
}

export interface ToothMeasurements {
  buccal: ToothSite;
  lingual: ToothSite;
  mobility: number | null;
  notes: string;
  isImplant: boolean;
  isDisabled: boolean;
}

export interface PeriodontalChartData {
  teeth: Record<number, ToothMeasurements>;
  date: string;
  patientId: string;
  chartType?: PeriodontalChartType;
  isExplicitlySaved?: boolean;
}

export type PeriodontalChartType = 'INITIAL_ASSESSMENT' | 'REASSESSMENT' | 'MAINTENANCE' | 'TREATMENT_PLANNING' | 'POST_TREATMENT' | 'OTHER';

export interface DentalChartData {
  teeth: Record<number, {
    isDisabled?: boolean;
    isImplant?: boolean;
    wholeTooth?: string | {
      type: string;
      material?: string;
      creationStatus?: string;
      bridgeId?: string;
      role?: string;
      originalState?: string;
    };
    surfaces?: Record<string, string>;
    zones?: Record<string, string>;
    procedures?: Array<{
      type: string;
      surface: string;
      date: string;
    }>;
  }>;
  toothTypes?: Record<number, string>;
}

export interface DentalCode {
  code: string;
  description: string;
  points: number | null;
  rate: number | string | null;
  tariff?: number | string | null;
  section?: string;
  subSection?: string;
  patientType?: string;
  requirements: {
    category?: 'regular_patient' | 'schisis_patient' | 'cleft_patient' | 'SPECIAL_CARE' | 'INFORMATION_SERVICES' | 'ORTHODONTICS' | 'ENDODONTICS';
    perJaw?: boolean;
    jaw?: 'upper' | 'lower' | 'both';
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
    braceCategory?: string;
    perMonth?: boolean;
    consultationType?: string;
    applianceType?: string;
    hasElectronicChip?: boolean;
    type?: string;
    generalRules?: string[];
    calendarMonth?: number;
    materialCosts?: {
      min?: number;
      max?: number;
    };
    maxRates?: {
      [key: string]: number;
    };
    notes?: string[];
    isTimeDependent?: boolean;
    perElement?: boolean;
    requiresTooth?: boolean;
    requiresJaw?: boolean;
    requiresSurface?: boolean;
    requiresTeethNumbers?: boolean;
    followUpCode?: string;
  };
}

export enum ToothSurfaceEnum {
  OCCLUSAL = 'occlusal',
  BUCCAL = 'buccal',
  LINGUAL = 'lingual',
  MESIAL = 'mesial',
  DISTAL = 'distal'
}

export enum JawSide {
  Upper = 'upper',
  Lower = 'lower'
}

export enum ToothPosition {
  // Upper Right Quadrant (1)
  UR8 = 18, UR7 = 17, UR6 = 16, UR5 = 15, UR4 = 14, UR3 = 13, UR2 = 12, UR1 = 11,
  // Upper Left Quadrant (2)
  UL1 = 21, UL2 = 22, UL3 = 23, UL4 = 24, UL5 = 25, UL6 = 26, UL7 = 27, UL8 = 28,
  // Lower Left Quadrant (3)
  LL8 = 38, LL7 = 37, LL6 = 36, LL5 = 35, LL4 = 34, LL3 = 33, LL2 = 32, LL1 = 31,
  // Lower Right Quadrant (4)
  LR1 = 41, LR2 = 42, LR3 = 43, LR4 = 44, LR5 = 45, LR6 = 46, LR7 = 47, LR8 = 48
}

export enum ToothType {
  Incisor = 'incisor',
  Canine = 'canine',
  Premolar = 'premolar',
  Molar = 'molar'
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