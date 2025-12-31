export interface LegacyDentalCode {
  code: string;
  description: string;
  explanation?: string;
  points?: number;
  tariff?: number;
  rate?: number | 'cost price' | 'Maximum';
  section?: string;
  subSection?: string;
  patientType?: string;
  category?: string;
  isTimeDependent?: boolean;
  timeUnit?: number;
  requiresTooth?: boolean;
  requiresJaw?: boolean;
  requiresSurface?: boolean;
  requiresQuadrant?: boolean;
  maxSurfaces?: number;
  maxRoots?: number;
  isPerElement?: boolean;
  isFirstElement?: boolean;
  followUpCode?: string;
  allowedCombinations?: string[];
  forbiddenCombinations?: string[];
  basePrice?: number;
  technicalCosts?: number;
  requirements?: {
    notes?: string[];
    conditions?: string[] | {
      [key: string]: string | string[];
    };
    category?: string;
    isTimeDependent?: boolean;
    perElement?: boolean;
    requiresTooth?: boolean;
    requiresJaw?: boolean;
    requiresSurface?: boolean;
    incompatibleWith?: string[];
    applicableWith?: string[];
    includes?: string[];
    includedServices?: string[];
    [key: string]: any;
  };
  // Allow any additional properties for maximum flexibility
  [key: string]: any;
} 