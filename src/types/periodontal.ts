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
} 