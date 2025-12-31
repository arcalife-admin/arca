import { AppointmentType } from '@/types/appointment';

// Helper function to generate a color based on treatment category
const getColorForTreatment = (treatment: string): string => {
  if (treatment.includes('Check-up') || treatment.includes('Cleaning') || treatment.includes('Follow-up')) {
    return '#4CAF50'; // Green for preventive care
  }
  if (treatment.includes('X-rays') || treatment.includes('scanning') || treatment.includes('charting')) {
    return '#2196F3'; // Blue for diagnostics
  }
  if (treatment.includes('Filling') || treatment.includes('Caries') || treatment.includes('Crown') || treatment.includes('Bridge')) {
    return '#FF9800'; // Orange for restorative
  }
  if (treatment.includes('Root canal') || treatment.includes('Pulpotomy') || treatment.includes('Apexification')) {
    return '#9C27B0'; // Purple for endodontics
  }
  if (treatment.includes('Periodontal') || treatment.includes('Gingivectomy') || treatment.includes('graft')) {
    return '#E91E63'; // Pink for periodontics
  }
  if (treatment.includes('Bleaching') || treatment.includes('Veneers') || treatment.includes('Smile')) {
    return '#00BCD4'; // Cyan for cosmetic
  }
  if (treatment.includes('Extraction') || treatment.includes('Surgery') || treatment.includes('Emergency')) {
    return '#F44336'; // Red for surgical/emergency
  }
  return '#607D8B'; // Blue-grey for others
};

export const treatmentTypes: AppointmentType[] = [
  { treatment: "Check-up", baseTimeMinutes: 15 },
  { treatment: "X-rays", baseTimeMinutes: 10 },
  { treatment: "Intra-oral scanning", baseTimeMinutes: 15 },
  { treatment: "Periodontal charting", baseTimeMinutes: 20 },
  { treatment: "Treatment plan discussion", baseTimeMinutes: 15 },
  { treatment: "Second opinion", baseTimeMinutes: 20 },
  { treatment: "Consultation", baseTimeMinutes: 20 },
  { treatment: "Intake", baseTimeMinutes: 20 },
  { treatment: "Dental cleaning", baseTimeMinutes: 30 },
  { treatment: "Fluoride application", baseTimeMinutes: 10 },
  { treatment: "Sealing", baseTimeMinutes: 15 },
  { treatment: "Instruction", baseTimeMinutes: 15 },
  { treatment: "Behavioral counseling", baseTimeMinutes: 20 },
  { treatment: "Filling", baseTimeMinutes: 30 },
  { treatment: "Caries removal", baseTimeMinutes: 20 },
  { treatment: "Crown preparation", baseTimeMinutes: 60 },
  { treatment: "Crown placement", baseTimeMinutes: 45 },
  { treatment: "Bridge preparation", baseTimeMinutes: 90 },
  { treatment: "Bridge placement", baseTimeMinutes: 60 },
  { treatment: "Root canal treatment start", baseTimeMinutes: 60 },
  { treatment: "Root canal treatment finish", baseTimeMinutes: 60 },
  { treatment: "Pulpotomy", baseTimeMinutes: 30 },
  { treatment: "Apexification", baseTimeMinutes: 45 },
  { treatment: "Apicoectomy", baseTimeMinutes: 60 },
  { treatment: "Periodontal surgery", baseTimeMinutes: 90 },
  { treatment: "Gingivectomy", baseTimeMinutes: 45 },
  { treatment: "Crown lenghtening", baseTimeMinutes: 60 },
  { treatment: "Soft tissue graft", baseTimeMinutes: 75 },
  { treatment: "Bite registration", baseTimeMinutes: 15 },
  { treatment: "Prosthodontics placement", baseTimeMinutes: 60 },
  { treatment: "Proshtodontics repair", baseTimeMinutes: 30 },
  { treatment: "Bleaching", baseTimeMinutes: 45 },
  { treatment: "Veneers", baseTimeMinutes: 60 },
  { treatment: "Smile design", baseTimeMinutes: 30 },
  { treatment: "Tooth reshaping", baseTimeMinutes: 20 },
  { treatment: "Enamel microabrasion", baseTimeMinutes: 20 },
  { treatment: "Tooth extraction", baseTimeMinutes: 30 },
  { treatment: "Frenectomy", baseTimeMinutes: 30 },
  { treatment: "Soft tissue biopsy", baseTimeMinutes: 30 },
  { treatment: "Abscess drainage", baseTimeMinutes: 30 },
  { treatment: "Cyst removal", baseTimeMinutes: 60 },
  { treatment: "Bone grafting", baseTimeMinutes: 60 },
  { treatment: "Sinus lift", baseTimeMinutes: 90 },
  { treatment: "Stainless steel crown", baseTimeMinutes: 30 },
  { treatment: "Space maintainer", baseTimeMinutes: 30 },
  { treatment: "Emergency treatment", baseTimeMinutes: 30 },
  { treatment: "Occlusal adjustment", baseTimeMinutes: 20 },
  { treatment: "Follow-up", baseTimeMinutes: 15 }
].map(treatment => ({
  id: treatment.treatment.toLowerCase().replace(/\s+/g, '-'),
  name: treatment.treatment,
  duration: treatment.baseTimeMinutes,
  color: getColorForTreatment(treatment.treatment),
  description: `${treatment.treatment} - Base duration: ${treatment.baseTimeMinutes} minutes`
})); 