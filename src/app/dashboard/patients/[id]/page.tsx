'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import PatientForm from '@/components/patients/PatientForm'
import HealthAssessment from '@/components/patients/HealthAssessment'
import { Label } from '@/components/ui/label'
import PeriodontalChartSettings from '@/components/dental/PeriodontalChartSettings'
import PeriodontalChartHistoryModal from '@/components/dental/PeriodontalChartHistoryModal'
import DEFAULT_SETTINGS from '@/components/dental/PeriodontalChartSettings'
import { useDentalData } from '@/hooks/useDentalData'
import { toast } from 'sonner'
import { LocationModal } from '@/components/LocationModal'
import { MapPin, Edit, History, Plus, Settings, Trash2, X, ChevronUp, ChevronDown, Pin, PlusCircle, Mail, Phone, Contact, Printer, ShoppingCart, Tag, Euro, ClipboardList, Clock, Files, FolderOpen, Download } from 'lucide-react'
import AddressAutocomplete from '@/components/AddressAutocomplete'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { DentalCodeSearch } from '@/components/dental/DentalCodeSearch'
import { TreatmentPlan } from '@/components/patients/TreatmentPlan'
import { TreatmentModal } from '@/components/dental/TreatmentModal'
import { PeriodontalChartData, PeriodontalChartType } from '@/types/dental';
import type { ToothMeasurements, PeriodontalMeasurements } from '@/components/dental/PeriodontalChart';
import { EnhancedPatientImagesSection } from '@/components/patients/EnhancedPatientImagesSection'
import { PatientInfoCard, PatientCenterPanel, PatientEditModal, EmailModal, FilesModal } from '@/components/patient-detail';
import { ShopModal } from '@/components/patients/ShopModal';
import { U35QuantityModal } from '@/components/patients/U35QuantityModal';
import { useCall } from '@/contexts/CallContext';
import { PrintOptionsModal, PrintOptions } from '@/components/print/PrintOptionsModal'
import PatientTaskList from '@/components/tasks/PatientTaskList'
import PatientWaitingList from '@/components/waiting-list/PatientWaitingList'
import { logActivityClient, LOG_ACTIONS, ENTITY_TYPES, LOG_SEVERITY } from '@/lib/activity-logger'
import { DentalChart } from '@/components/dental/DentalChart'
import FluorideModal, { FluorideFlavor } from '@/components/dental/FluorideModal';
import FluorideFlavorSettingsModal from '@/components/dental/FluorideFlavorSettingsModal';

interface Patient {
  id: string
  patientCode: string
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: 'MALE' | 'FEMALE' | 'OTHER'
  email: string
  phone: string
  address: {
    display_name: string
    lat: string
    lon: string
    altitude?: number
  }
  bsn: string
  country: string
  healthInsurance?: {
    provider: string
    policyNumber: string
    coverageDetails?: string
    validUntil: string
  }
  medicalHistory?: any
  dentalHistory?: any
  asaScore?: number
  ppsScores?: any
  ppsTreatment?: string
  statusPraesens?: any
  periodontalCharts?: any[]
  recallTerm?: number
  allowEarlySpotContact?: boolean
  isLongTermCareAct?: boolean
  isDisabled?: boolean
  disabledReason?: string
  disabledAt?: string
  disabledBy?: string
  asaHistory: Array<{
    id: string
    score: number
    notes: string
    date: string
    createdBy: string
  }>
  ppsHistory: Array<{
    id: string
    quadrant1: number
    quadrant2: number
    quadrant3: number
    quadrant4: number
    treatment: 'NONE' | 'PREVENTIVE' | 'PERIODONTAL'
    notes: string
    date: string
    createdBy: string
  }>
  screeningRecallHistory: Array<{
    id: string
    screeningMonths: number
    notes: string
    date: string
    createdBy: string
  }>
  cleaningRecallHistory: Array<{
    id: string
    cleaningMonths: number
    procedureCode: string
    notes: string
    date: string
    createdBy: string
  }>
  files?: Array<{
    id: string
    name: string
    url: string
    type: string
    size: number
    createdAt: string
  }>
  carePlan?: {
    careRequest: string
    careGoal: string
    policy: string
    riskProfile: {
      mucousMembranes: {
        status: 'NO_ABNORMALITIES' | 'ABNORMALITIES'
        notes: string
      }
      periodontitis: {
        status: 'LOW_RISK' | 'HIGH_RISK'
        notes: string
      }
      caries: {
        status: 'LOW_RISK' | 'MODERATE_RISK' | 'HIGH_RISK'
        notes: string
      }
      wear: {
        status: 'LOW_RISK' | 'MODERATE_RISK' | 'HIGH_RISK' | 'PHYSIOLOGICAL' | 'PATHOLOGICAL'
        notes: string
      }
      functionProblem: {
        status: 'YES' | 'NO'
        notes: string
      }
    }
    updatedAt: string
  }
}

const mapAPIToComponentData = (apiData: PeriodontalChartData | null): Record<number, ToothMeasurements> => {
  if (!apiData?.teeth) return {};
  return apiData.teeth;
};

const mapComponentToAPIData = (
  componentData: Record<number, ToothMeasurements>,
  patientId: string,
  chartType: PeriodontalChartType = 'INITIAL_ASSESSMENT',
  isExplicitlySaved: boolean = false
): PeriodontalChartData => {
  return {
    teeth: componentData,
    date: new Date().toISOString(),
    patientId,
    chartType,
    isExplicitlySaved
  };
};

export default function PatientDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { startCall } = useCall()
  const [error, setError] = useState('')
  const imagesRef = useRef<HTMLDivElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showDeleteDisableModal, setShowDeleteDisableModal] = useState(false)
  const [deleteDisableModalStep, setDeleteDisableModalStep] = useState<'options' | 'disable' | 'delete' | 'history'>('options')
  const [disableReason, setDisableReason] = useState('')
  const [statusHistory, setStatusHistory] = useState<any[]>([])
  const [centerPanel, setCenterPanel] = useState<'status' | 'perio'>('status')
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showQuickAddModal, setShowQuickAddModal] = useState(false)
  const [quickAddCode, setQuickAddCode] = useState<any>(null)
  const [showAsaModal, setShowAsaModal] = useState(false)
  // Print modal state
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [printOptions, setPrintOptions] = useState<PrintOptions>({
    includePatientInfo: true,
    includeDentalChart: true,
    includePeriodontalChart: true,
    includeHistoryTreatments: true,
    includeCurrentTreatments: true,
    includePlanTreatments: true,
    includeXrayImages: true,
  })
  const [asaModalStep, setAsaModalStep] = useState<'history' | 'assessment' | 'score'>('history')
  const [showPpsModal, setShowPpsModal] = useState(false)
  const [ppsModalStep, setPpsModalStep] = useState<'history' | 'assessment'>('history')
  const [showScreeningRecallModal, setShowScreeningRecallModal] = useState(false)
  const [showPerioSettingsModal, setShowPerioSettingsModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showScalingModal, setShowScalingModal] = useState(false)
  const [suggestedTeethTreatments, setSuggestedTeethTreatments] = useState<any[]>([])
  const [selectedTreatments, setSelectedTreatments] = useState<any[]>([])
  const [savedPerioData, setSavedPerioData] = useState<any>(null)
  const [showEditTreatmentModal, setShowEditTreatmentModal] = useState(false)
  const [editingTreatment, setEditingTreatment] = useState<any>(null)
  const [editForm, setEditForm] = useState({ toothNumber: '', code: '' })
  const [showAddTreatmentModal, setShowAddTreatmentModal] = useState(false)
  const [addForm, setAddForm] = useState({ toothNumber: '', code: '' })
  const [screeningRecallModalStep, setScreeningRecallModalStep] = useState<'history' | 'assessment'>('history')
  const [showCleaningRecallModal, setShowCleaningRecallModal] = useState(false)
  const [cleaningRecallModalStep, setCleaningRecallModalStep] = useState<'history' | 'assessment'>('history')
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'MALE' as 'MALE' | 'FEMALE' | 'OTHER',
    email: '',
    phone: '',
    address: '',
    bsn: '',
    country: '',
    allowEarlySpotContact: true,
    isLongTermCareAct: false
  })
  const [selectedAddress, setSelectedAddress] = useState<{
    display_name: string;
    lat: string;
    lon: string;
  } | null>(null)

  // Undo stack for dental procedures
  const [undoStack, setUndoStack] = useState<any[][]>([])

  // ASA Modal State
  const [asaFormData, setAsaFormData] = useState({
    // General Information
    regularDentist: '',
    dentistPhone: '',
    lastDentalVisit: '',

    // Medical Information
    chestPain: false,
    chestPainReducedActivity: false,
    chestPainWorsening: false,
    chestPainAtRest: false,
    heartAttack: false,
    heartAttackStillSymptoms: false,
    heartAttackLast6Months: false,
    heartMurmur: false,
    heartMurmurDetails: '',
    vascularSurgery6Months: false,
    pacemakerICD: false,
    heartPalpitations: false,
    heartPalpitationsNeedRest: false,
    heartPalpitationsPaleDizzy: false,
    heartFailure: false,
    heartFailureExtraPillows: false,
    heartFailureNightBreathing: false,
    heartFailureNightUrination: false,
    heartFailureSwollenFeet: false,
    acuteRheumatism: false,
    bloodPressure: false,
    bloodPressureValue: '',
    bleedingTendency: false,
    bleedingLongerThan1Hour: false,
    bleedingBruises: false,
    bloodThinners: false,
    bloodThinnersDetails: '',
    lungProblems: false,
    lungProblemsStairs: false,
    lungProblemsDressing: false,
    lungProblemsHyperventilation: false,
    prosthesisLast3Months: false,

    // Specific Conditions
    epilepsy: false,
    cancerLeukemia: false,
    diabetes: false,
    hivAids: false,
    thyroidProblems: false,
    asthma: false,
    kidneyDisease: false,
    liverDisease: false,
    hepatitisA: false,
    hepatitisB: false,
    hepatitisC: false,
    hepatitisD: false,
    otherConditions: '',

    // Lifestyle Questions
    smoking: false,
    smokingAmount: '',
    drinking: false,
    drinkingAmount: '',

    // Pregnancy Questions (for females)
    pregnancy: false,
    pregnancyWeeks: '',
    pregnancyComplications: '',

    // Current Medications
    currentMedications: '',
    allergies: '',

    // Notes
    notes: ''
  })
  const [selectedAsaScore, setSelectedAsaScore] = useState<number>(1)
  const [showAsaScoreDropdown, setShowAsaScoreDropdown] = useState(false)
  const [isNotesManuallyEdited, setIsNotesManuallyEdited] = useState(false)

  // PPS Modal State
  const [ppsFormData, setPpsFormData] = useState({
    quadrant1: 1,
    quadrant2: 1,
    quadrant3: 1,
    quadrant4: 1,
    treatment: 'NONE' as 'NONE' | 'PREVENTIVE' | 'PERIODONTAL',
    notes: ''
  })
  const [isPpsNotesManuallyEdited, setIsPpsNotesManuallyEdited] = useState(false)

  // Screening Recall Modal State
  const [screeningRecallFormData, setScreeningRecallFormData] = useState({
    screeningMonths: 6,
    useCustomText: false,
    customText: '',
    notes: ''
  })
  const [isScreeningRecallNotesManuallyEdited, setIsScreeningRecallNotesManuallyEdited] = useState(false)
  const [showScreeningRecallNotes, setShowScreeningRecallNotes] = useState(false)

  // Cleaning Recall Modal State
  const [cleaningRecallFormData, setCleaningRecallFormData] = useState({
    cleaningMonths: 6,
    procedureCode: 'm03' as 'm03' | 't042' | 't043',
    useCustomText: false,
    customText: '',
    notes: ''
  })
  const [isCleaningRecallNotesManuallyEdited, setIsCleaningRecallNotesManuallyEdited] = useState(false)
  const [showCleaningRecallNotes, setShowCleaningRecallNotes] = useState(false)

  // Care Plan Modal State
  const [showCarePlanModal, setShowCarePlanModal] = useState(false)
  const [carePlanFormData, setCarePlanFormData] = useState({
    careRequest: '',
    careGoal: '',
    policy: '',
    riskProfile: {
      mucousMembranes: {
        status: 'NO_ABNORMALITIES',
        notes: ''
      },
      periodontitis: {
        status: 'LOW_RISK',
        notes: ''
      },
      caries: {
        status: 'LOW_RISK',
        notes: ''
      },
      wear: {
        status: 'LOW_RISK',
        notes: ''
      },
      functionProblem: {
        status: 'NO',
        notes: ''
      }
    }
  })

  // Notes State
  const [showAddNoteModal, setShowAddNoteModal] = useState(false)
  const [showNotesSettingsModal, setShowNotesSettingsModal] = useState(false)
  const [showAddFolderModal, setShowAddFolderModal] = useState(false)
  const [showDeleteFolderModal, setShowDeleteFolderModal] = useState(false)
  const [newNoteContent, setNewNoteContent] = useState('')
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [isNewNotePinned, setIsNewNotePinned] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [folderToDelete, setFolderToDelete] = useState<any>(null)
  const [deleteFolderLoading, setDeleteFolderLoading] = useState(false)

  // Communication Modals State
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailFormData, setEmailFormData] = useState({
    recipients: [] as string[],
    subject: '',
    content: '',
    selectedFiles: [] as string[],
    selectedImages: [] as string[]
  })
  const [templateSearch, setTemplateSearch] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Welcome & New Patients'])
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showPhonebookModal, setShowPhonebookModal] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const [emailInputError, setEmailInputError] = useState('')

  // Shop Modal State
  const [showShopModal, setShowShopModal] = useState(false)
  const [showTasksModal, setShowTasksModal] = useState(false)
  const [showWaitingModal, setShowWaitingModal] = useState(false)

  // Files Modal State
  const [showFilesModal, setShowFilesModal] = useState(false)

  // Insurance Modal State
  const [showInsuranceModal, setShowInsuranceModal] = useState(false)

  // U35 Modal State (for WLZ patients)
  const [showU35Modal, setShowU35Modal] = useState(false)
  const [pendingTreatmentData, setPendingTreatmentData] = useState<any>(null)

  // Template type definition
  type EmailTemplate = { subject: string; content: string }
  type EmailTemplateCategory = Record<string, EmailTemplate>
  type EmailTemplates = Record<string, EmailTemplateCategory>

  // Quick email templates organized by category
  const emailTemplates = {
    'Welcome & New Patients': {
      welcome: {
        subject: 'Welcome to our dental practice',
        content: `We would like to thank you for choosing our practice for your dental care. We look forward to providing you with excellent dental treatment in a comfortable and caring environment.

Please don't hesitate to contact us if you have any questions about your upcoming appointment or if you need to make any changes to your schedule.`
      },
      new_patient_forms: {
        subject: 'Please complete your new patient forms',
        content: `To help us prepare for your first visit and provide you with the best possible care, please complete the attached new patient forms.

Please bring a valid ID and your insurance card to your appointment. If you have any questions, feel free to contact our office.`
      },
      first_visit_prep: {
        subject: 'Preparing for your first visit',
        content: `We're excited to meet you at your upcoming appointment! Here's what to expect during your first visit and how to prepare.

Please arrive 15 minutes early to complete any remaining paperwork. Don't forget to bring your insurance card and a list of current medications.`
      }
    },
    'Appointments & Scheduling': {
      appointment_reminder: {
        subject: 'Time to schedule your next appointment',
        content: `According to our records, it's time to schedule your next dental appointment. Regular check-ups are important for maintaining optimal oral health.

Please contact our office at your earliest convenience to schedule an appointment that works best for you.`
      },
      routine_appointment_reminder: {
        subject: 'Reminder: Schedule your routine dental appointment',
        content: `Dear [Patient First Name],

It's time for your routine dental check-up! Regular dental visits every 6 months help maintain optimal oral health and prevent potential problems.

We recommend scheduling your appointment soon to ensure the best available times. Our team is ready to provide you with excellent care.

Please contact our office to schedule your appointment:
- Phone: [Practice Phone]
- Email: [Practice Email]
- Online booking: [Website]

We look forward to seeing you soon!

Best regards,
[Practice Name] Team`
      },
      pending_appointment_reminder: {
        subject: 'Reminder: Please schedule your pending appointment',
        content: `Dear [Patient First Name],

You have a pending appointment that needs to be scheduled. This appointment is important for continuing your dental care plan.

Please contact our office as soon as possible to confirm your appointment time:
- Phone: [Practice Phone]
- Email: [Practice Email]

If you have any questions about your treatment plan or need to discuss scheduling options, please don't hesitate to reach out.

Thank you for your attention to this matter.

Best regards,
[Practice Name] Team`
      },
      appointment_confirmation: {
        subject: 'Appointment confirmation',
        content: `This is to confirm your upcoming dental appointment. We look forward to seeing you and providing excellent dental care.

If you need to reschedule or have any questions, please contact our office at least 24 hours in advance.`
      },
      cleaning_reminder: {
        subject: 'Your cleaning appointment is coming up',
        content: `This is a friendly reminder that your professional cleaning appointment is scheduled soon. Regular cleanings are essential for maintaining healthy teeth and gums.

Please arrive 15 minutes early to complete any necessary paperwork and ensure we can start your appointment on time.`
      },
      missed_appointment: {
        subject: 'We missed you at your appointment',
        content: `We noticed you missed your scheduled appointment today. We understand that things come up unexpectedly.

Please contact our office to reschedule your appointment. Regular dental care is important for maintaining your oral health.`
      }
    },
    'Patient Questionnaires': {
      dental_hygiene_questionnaire: {
        subject: 'Dental Hygiene Questionnaire - Please Complete',
        content: `Dear [Patient First Name],

To provide you with the best possible dental hygiene care, please complete the attached dental hygiene questionnaire before your appointment.

This short questionnaire helps us understand:
- Your current oral hygiene routine
- Any concerns or sensitivity you may have
- Your hygiene goals and preferences

Please complete and return this form at least 24 hours before your appointment.

Thank you for helping us provide personalized care.

Best regards,
[Practice Name] Hygiene Team`
      },
      gfi_questionnaire: {
        subject: 'GFI Health Questionnaire - Required Completion',
        content: `Dear [Patient First Name],

Please complete the attached GFI (General Health Information) questionnaire as part of your dental care preparation.

This comprehensive questionnaire covers:
- Medical history and current health status
- Current medications and allergies
- Previous dental experiences
- Health changes since your last visit

Your health information is crucial for safe and effective dental treatment. Please complete all sections thoroughly and bring the form to your appointment.

If you have questions about any section, please contact our office.

Thank you for your cooperation.

Best regards,
[Practice Name] Team`
      },
      erosive_tooth_wear_questionnaire: {
        subject: 'Erosive Tooth Wear Assessment Questionnaire',
        content: `Dear [Patient First Name],

As part of your comprehensive dental evaluation, please complete the attached Erosive Tooth Wear questionnaire.

This brief assessment helps us evaluate:
- Dietary habits that may affect tooth enamel
- Symptoms of tooth sensitivity or wear
- Risk factors for dental erosion
- Preventive measures needed

Understanding these factors allows us to provide targeted preventive care and treatment recommendations.

Please complete the questionnaire and bring it to your next appointment.

Best regards,
[Practice Name] Team`
      },
      nutrition_questionnaire: {
        subject: 'Nutritional Assessment for Oral Health',
        content: `Dear [Patient First Name],

Good nutrition plays a vital role in oral health. Please complete the attached nutrition questionnaire to help us understand how your diet may be affecting your dental health.

This short questionnaire covers:
- Daily eating and drinking habits
- Frequency of sugar and acid consumption
- Snacking patterns
- Nutritional supplements

Your responses will help us provide personalized dietary recommendations to support your oral health goals.

Please complete and return before your appointment.

Best regards,
[Practice Name] Nutrition Team`
      }
    },
    'Prescriptions & Pharmacy': {
      antibiotic_prescription: {
        subject: 'Antibiotic Prescription and Instructions',
        content: `Dear [Patient First Name],

Please find your antibiotic prescription attached. This medication has been prescribed as part of your dental treatment.

Important instructions:
- Take exactly as prescribed, even if you feel better
- Complete the entire course of antibiotics
- Take with food to reduce stomach upset
- Do not drink alcohol while taking this medication

If you experience any severe side effects or allergic reactions, contact our office immediately or seek emergency medical care.

For pharmacy questions, please contact:
[Pharmacy Name]: [Phone Number]

Best regards,
[Doctor Name]
[Practice Name]`
      },
      pain_medication_prescription: {
        subject: 'Pain Medication Prescription and Guidelines',
        content: `Dear [Patient First Name],

Your pain medication prescription is attached. Please follow these guidelines for safe and effective pain management:

Dosage Instructions:
- Take only as directed
- Do not exceed the prescribed dose
- Take with food if stomach upset occurs
- Do not operate machinery or drive while taking this medication

Pain Management Tips:
- Apply ice for first 24 hours to reduce swelling
- Switch to warm compresses after 24 hours
- Rest and avoid strenuous activity
- Contact us if pain worsens or doesn't improve

If you have concerns about pain management or medication effects, please contact our office.

Best regards,
[Doctor Name]
[Practice Name]`
      },
      mouthwash_prescription: {
        subject: 'Therapeutic Mouthwash Prescription',
        content: `Dear [Patient First Name],

Please find your therapeutic mouthwash prescription attached. This special mouthwash has been prescribed to support your periodontal treatment.

Usage Instructions:
- Rinse twice daily after brushing and flossing
- Use 15ml (1 tablespoon) for 30 seconds
- Do not eat or drink for 30 minutes after use
- Continue use for the prescribed duration

This mouthwash will help:
- Reduce bacterial growth
- Control gum inflammation
- Support healing after treatment

Please continue your regular oral hygiene routine along with this prescription.

Best regards,
[Doctor Name]
[Practice Name]`
      },
      fluoride_prescription: {
        subject: 'Fluoride Treatment Prescription',
        content: `Dear [Patient First Name],

Your prescription for fluoride treatment is attached. This high-concentration fluoride will help strengthen your teeth and prevent decay.

Application Instructions:
- Use a pea-sized amount on your toothbrush
- Brush gently for 2 minutes before bedtime
- Spit out excess but do not rinse
- No eating or drinking for 30 minutes after application
- Use only at bedtime

This treatment is particularly important due to your increased risk of dental decay. Regular use will help protect your teeth.

Please contact us if you have any questions about the application process.

Best regards,
[Doctor Name]
[Practice Name]`
      },
      oral_steroid_prescription: {
        subject: 'Oral Steroid Prescription and Important Information',
        content: `Dear [Patient First Name],

Your oral steroid prescription is attached. This medication has been prescribed to reduce inflammation and promote healing after your dental procedure.

Important Guidelines:
- Take with food to prevent stomach irritation
- Take at the same time each day
- Do not stop abruptly - complete the full course
- Monitor blood sugar if diabetic
- Report any unusual symptoms immediately

Possible side effects may include increased appetite, mood changes, or difficulty sleeping. These are usually temporary.

Do not take if you have:
- Active infections
- Recent vaccinations
- Certain medical conditions (as discussed)

Please contact our office with any concerns.

Best regards,
[Doctor Name]
[Practice Name]`
      }
    },
    'Referral Letters': {
      specialist_referral_orthodontist: {
        subject: 'Orthodontic Referral for [Patient Name]',
        content: `Dear Colleague,

I am referring [Patient First Name] [Patient Last Name] (DOB: [DOB]) for orthodontic evaluation and treatment.

Patient Information:
- Current chief complaint: [Describe main concern]
- Clinical findings: [Orthodontic issues observed]
- Previous orthodontic history: [If any]
- Medical history: [Relevant medical conditions]

Reason for referral:
[Specific orthodontic needs, malocclusion type, aesthetic concerns, functional issues]

I would appreciate your expert evaluation and treatment recommendations. Please send a treatment plan and timeline when available.

Thank you for your collaboration in this patient's care.

Best regards,
[Doctor Name], [Degree]
[Practice Name]
[Contact Information]`
      },
      specialist_referral_periodontist: {
        subject: 'Periodontal Referral for [Patient Name]',
        content: `Dear Colleague,

I am referring [Patient First Name] [Patient Last Name] (DOB: [DOB]) for periodontal evaluation and treatment.

Clinical Findings:
- Periodontal pocket depths: [Measurements]
- Bleeding on probing: [Locations]
- Radiographic bone loss: [Description]
- Mobility: [Tooth numbers and degree]
- Current oral hygiene status: [Assessment]

Patient presents with:
- [Specific periodontal conditions]
- [Risk factors present]
- [Previous periodontal treatment history]

I would appreciate your expertise in:
- Comprehensive periodontal evaluation
- Treatment planning for advanced therapy
- Maintenance protocol recommendations

Please keep me informed of the treatment progress. I look forward to continuing collaborative care.

Best regards,
[Doctor Name], [Degree]
[Practice Name]
[Contact Information]`
      },
      specialist_referral_endodontist: {
        subject: 'Endodontic Referral for [Patient Name]',
        content: `Dear Colleague,

I am referring [Patient First Name] [Patient Last Name] (DOB: [DOB]) for endodontic evaluation and treatment.

Tooth Information:
- Tooth number: [#]
- Chief complaint: [Patient symptoms]
- Clinical findings: [Pulp testing results, percussion, palpation]
- Radiographic findings: [PA interpretation]
- Current pain level: [Scale 1-10]

History:
- Trauma history: [If applicable]
- Previous treatment: [Fillings, crowns, etc.]
- Symptom duration: [Timeline]

The patient requires:
- [Root canal therapy/Retreatment/Apicoectomy/Evaluation]
- [Urgency level]

I plan to restore this tooth with [crown/filling] following successful endodontic treatment.

Thank you for your expertise. Please contact me with any questions.

Best regards,
[Doctor Name], [Degree]
[Practice Name]
[Contact Information]`
      },
      second_opinion_referral: {
        subject: 'Second Opinion Request for [Patient Name]',
        content: `Dear Colleague,

I am referring [Patient First Name] [Patient Last Name] (DOB: [DOB]) for a second opinion consultation.

Case Background:
- Presenting condition: [Current dental situation]
- Proposed treatment plan: [Current recommendations]
- Patient concerns: [Specific questions or hesitations]
- Complexity factors: [Medical history, technical challenges]

Current Treatment Options Being Considered:
1. [Option 1 with pros/cons]
2. [Option 2 with pros/cons]
3. [Option 3 with pros/cons]

The patient would benefit from your independent professional assessment and treatment recommendations. Please provide your evaluation of:
- Diagnosis confirmation
- Treatment alternatives
- Prognosis assessment
- Risk/benefit analysis

I have attached recent radiographs and clinical photos for your review.

Thank you for providing this valuable service to our mutual patient.

Best regards,
[Doctor Name], [Degree]
[Practice Name]
[Contact Information]`
      },
      oral_surgeon_referral: {
        subject: 'Oral Surgery Referral for [Patient Name]',
        content: `Dear Colleague,

I am referring [Patient First Name] [Patient Last Name] (DOB: [DOB]) for oral surgery consultation and treatment.

Procedure Required:
- [Extraction/Implant placement/Bone grafting/Biopsy/Other]
- Tooth number(s): [If applicable]
- Complexity factors: [Impaction, proximity to nerves, medical considerations]

Medical History:
- Significant conditions: [Relevant medical conditions]
- Current medications: [List important medications]
- Allergies: [Drug/material allergies]
- Anticoagulation status: [If applicable]

Clinical Information:
- [Radiographic findings]
- [Clinical examination results]
- [Previous treatment attempts]

Special Considerations:
- [Anxiety management needs]
- [Sedation requirements]
- [Post-operative care coordination]

Please coordinate with our office regarding timing for any restorative work planned post-surgery.

Thank you for your surgical expertise.

Best regards,
[Doctor Name], [Degree]
[Practice Name]
[Contact Information]`
      }
    },
    'Payment & Administrative': {
      insurance_payment_policy: {
        subject: 'Important: New Payment Policy for Uninsured Patients',
        content: `Dear [Patient First Name],

We hope this message finds you in good health. We want to inform you of an important update to our payment policies to ensure clarity and smooth service.

New Payment Policy for Patients Without Insurance:

Effective [Date], patients without dental insurance will be asked to pay for services at the time of treatment. We accept:
- Credit and debit cards
- Cash payments
- Payment plans (arranged in advance)

This policy helps us:
- Streamline administrative processes
- Keep treatment costs manageable
- Provide immediate service confirmation

We understand this may be an adjustment, and we're here to help. Our team can:
- Provide treatment cost estimates in advance
- Discuss payment plan options
- Help you understand all available payment methods

If you have questions about this policy or would like to discuss payment arrangements, please contact our office before your next appointment.

Thank you for your understanding and continued trust in our care.

Best regards,
[Practice Name] Team`
      },
      attachment_attention: {
        subject: 'Important: Please Review Attached Documents',
        content: `Dear [Patient First Name],

Please take a moment to review the attached documents, which contain important information related to your dental care.

The attached materials include:
- [Specify document types]
- [Treatment information/Lab results/Instructions/Other]

Please:
- Review all attached documents carefully
- Contact our office if you have any questions
- Bring this information to your next appointment
- Follow any specific instructions provided

If you cannot access the attachments or need the documents in a different format, please let us know and we'll be happy to assist.

Your understanding of this information is important for the success of your treatment.

Thank you for your attention to these materials.

Best regards,
[Practice Name] Team`
      }
    },
    'No-Show Management': {
      first_missed_appointment: {
        subject: 'We missed you today - No charge for first missed appointment',
        content: `Dear [Patient First Name],

We noticed you were unable to attend your scheduled appointment today. We understand that unexpected situations arise, and life can be unpredictable.

As a courtesy, there is no charge for this first missed appointment.

To maintain your oral health and continue your treatment plan, please contact our office to reschedule:
- Phone: [Practice Phone]
- Email: [Practice Email]

Please note our cancellation policy: We kindly request at least 24 hours notice for any appointment changes to avoid future charges.

We look forward to seeing you soon and continuing your dental care.

Best regards,
[Practice Name] Team`
      },
      second_missed_appointment: {
        subject: 'Second missed appointment - Cancellation fee applied',
        content: `Dear [Patient First Name],

We missed you again at your scheduled appointment today. This is your second missed appointment without proper notice.

Due to our practice policy, a cancellation fee of [Amount] has been applied to your account for this missed appointment. This fee helps cover the reserved time and administrative costs.

To avoid future charges and continue receiving excellent dental care:
- Please provide at least 24 hours notice for any schedule changes
- Contact us immediately to reschedule your appointment
- Discuss any scheduling challenges with our team

We value you as a patient and want to work together to find appointment times that work for your schedule.

Please contact our office to:
- Reschedule your appointment
- Discuss the cancellation fee
- Address any scheduling concerns

Best regards,
[Practice Name] Team`
      },
      multiple_missed_appointments: {
        subject: 'Multiple missed appointments - Account review required',
        content: `Dear [Patient First Name],

This is regarding your multiple missed appointments without proper notice. We understand that scheduling can be challenging, but consistent missed appointments affect our ability to serve all patients effectively.

Account Status:
- Number of missed appointments: [Count]
- Outstanding cancellation fees: [Amount]
- Current account balance: [Amount]

Moving Forward:
A cancellation fee of [Amount] has been applied for today's missed appointment. To continue receiving care in our practice, we need to:

1. Resolve outstanding account balance
2. Establish a reliable appointment schedule
3. Ensure 24-hour notice for any future changes

Please contact our office within 5 business days to:
- Schedule and pay for your next appointment in advance
- Discuss payment arrangements for outstanding fees
- Address any barriers to keeping appointments

We value our patient relationships and want to continue providing you with excellent dental care.

Best regards,
[Practice Name] Management`
      },
      final_warning_dismissal: {
        subject: 'Final notice - Patient relationship review',
        content: `Dear [Patient First Name],

After multiple missed appointments and attempts to work with your schedule, we must address the ongoing pattern of appointment non-compliance.

This serves as final notice that due to:
- Repeated missed appointments without notice
- Outstanding cancellation fees
- Inability to maintain consistent care schedule

We may need to consider discontinuing our patient-provider relationship if these issues are not resolved immediately.

Final Requirements:
- Contact our office within 3 business days
- Resolve all outstanding account balances
- Commit to reliable appointment attendance
- Provide 24-hour notice for any future changes

Failure to respond within this timeframe may result in dismissal from the practice. We will provide you with 30 days notice and copies of your dental records to transfer to another provider.

We prefer to continue your care and hope to resolve these issues promptly.

Urgent contact required: [Practice Phone]

Best regards,
[Practice Name] Management`
      },
      patient_dismissal: {
        subject: 'Notice of patient dismissal and records transfer',
        content: `Dear [Patient First Name],

After careful consideration and multiple attempts to resolve ongoing appointment and policy compliance issues, we have made the difficult decision to discontinue our patient-provider relationship.

This decision is due to:
- Consistent failure to attend scheduled appointments
- Non-compliance with practice policies
- Outstanding account obligations

Effective Date: [Date - 30 days from notice]

What happens next:
- You have 30 days to arrange for transfer of your dental records
- Records will be provided to your new dental provider upon written request
- Any outstanding balances must be resolved before record transfer
- Emergency care will be provided during the 30-day transition period only

To obtain your records:
1. Provide written authorization from your new dentist
2. Include the new practice's contact information
3. Resolve any outstanding account balance

We recommend you establish care with a new dental provider immediately to avoid interruption in your dental health maintenance.

If you have questions about this decision or the transition process, please contact our office manager.

We wish you well in your future dental care.

Best regards,
[Practice Name] Management`
      }
    },
    'Patient Transfer': {
      patient_care_transfer: {
        subject: 'Patient care transfer - Complete records attached',
        content: `Dear Colleague,

We are transferring the care of [Patient First Name] [Patient Last Name] (DOB: [DOB]) to your practice.

Patient Summary:
- Patient ID: [Patient Code]
- Last visit: [Date]
- Current status: [Active treatment/Maintenance/Completed treatment]
- Insurance: [Insurance information]

Complete records attached include:
- Full medical and dental history
- Treatment history and procedures completed
- Current medications and allergies
- Radiographs (digital format)
- Clinical photographs
- Laboratory reports and correspondence
- Periodontal charts and measurements
- Outstanding treatment plans
- Financial account summary

Current Treatment Status:
- [Ongoing treatments and next steps]
- [Pending appointments or follow-ups]
- [Recall schedule recommendations]
- [Special care considerations]

Medical Considerations:
- [Relevant medical conditions]
- [Medication interactions or considerations]
- [Allergy information]
- [Special needs or accommodations]

This patient has been under our care since [Date] and we've maintained comprehensive records of all treatments and interactions. We believe they will be an excellent addition to your practice.

If you need any clarification about treatment history, findings, or recommendations, please don't hesitate to contact us. We're committed to ensuring a smooth transition of care.

Thank you for accepting this patient into your practice. We're confident they will receive excellent care under your supervision.

Best regards,
[Doctor Name], [Degree]
[Practice Name]
[Contact Information]

Attachments: Complete patient dossier (Password protected - please call for access)`
      }
    },
    'Treatment & Follow-up': {
      treatment_followup: {
        subject: 'How are you feeling after your recent treatment?',
        content: `We hope you're feeling well after your recent dental treatment. It's important to us that you're comfortable and healing properly.

If you're experiencing any unusual pain, swelling, or have any concerns, please don't hesitate to contact our office immediately.`
      },
      post_surgery_care: {
        subject: 'Post-surgery care instructions',
        content: `Please follow these important post-surgery care instructions to ensure proper healing and minimize discomfort.

If you experience excessive bleeding, severe pain, or signs of infection, please contact our emergency line immediately.`
      },
      treatment_plan_review: {
        subject: 'Your personalized treatment plan',
        content: `We've prepared a comprehensive treatment plan tailored to your specific dental needs. Please review the attached plan and contact us with any questions.

We're here to help you achieve optimal oral health and are happy to discuss any concerns you may have.`
      }
    },
    'Billing & Insurance': {
      payment_reminder: {
        subject: 'Payment information for your recent visit',
        content: `Thank you for your recent visit to our office. We wanted to follow up regarding payment for the services provided.

If you have any questions about your treatment plan, insurance coverage, or payment options, please contact our billing department.`
      },
      insurance_update: {
        subject: 'Please update your insurance information',
        content: `We need to update your insurance information in our records to ensure proper coverage for your dental care.

Please bring your current insurance card to your next appointment or contact our office to provide the updated information.`
      },
      payment_plan_options: {
        subject: 'Flexible payment options available',
        content: `We understand that dental treatment is an investment in your health. We offer various payment plans and financing options to make your care more affordable.

Please contact our billing department to discuss which payment option works best for your situation.`
      }
    },
    'Preventive Care': {
      oral_hygiene_tips: {
        subject: 'Tips for maintaining excellent oral health',
        content: `Here are some important tips to help you maintain excellent oral health between visits. Consistent daily care is key to preventing dental problems.

Remember to brush twice daily, floss regularly, and maintain a healthy diet. We're always here to answer any questions about your oral care routine.`
      },
      seasonal_checkup: {
        subject: 'Time for your seasonal dental checkup',
        content: `As the season changes, it's a perfect time to schedule your routine dental checkup. Regular preventive care helps catch potential issues early.

Contact our office to schedule your appointment and keep your smile healthy and bright throughout the year.`
      }
    },
    'Emergency & Urgent': {
      emergency_instructions: {
        subject: 'Emergency dental care instructions',
        content: `If you're experiencing a dental emergency, please follow these immediate care instructions and contact our emergency line.

For severe pain, trauma, or urgent situations outside office hours, please don't hesitate to reach out to our emergency contact number.`
      },
      urgent_followup: {
        subject: 'Urgent follow-up required',
        content: `Based on your recent visit, we need to schedule an urgent follow-up appointment to monitor your condition and ensure proper healing.

Please contact our office immediately to schedule this important follow-up visit.`
      }
    }
  }

  // Phonebook contacts
  const phonebookContacts = {
    'Family Members': {
      'Spouse': 'spouse@example.com',
      'Emergency Contact': 'emergency@example.com',
      'Parent/Guardian': 'parent@example.com'
    },
    'Medical Specialists': {
      'Periodontist': 'perio.specialist@dentalcare.com',
      'Endodontist': 'endo.specialist@dentalcare.com',
      'Orthodontist': 'ortho.specialist@dentalcare.com',
      'Oral Surgeon': 'surgeon@dentalcare.com',
      'Implantologist': 'implant.specialist@dentalcare.com'
    },
    'Healthcare Facilities': {
      'General Hospital': 'info@generalhospital.com',
      'Emergency Room': 'emergency@hospital.com',
      'Radiology Center': 'imaging@radiology.com',
      'Lab Services': 'results@labservices.com'
    },
    'Dental Laboratory': {
      'Crown & Bridge Lab': 'orders@crownbridge.lab',
      'Orthodontic Lab': 'cases@ortholab.com',
      'Implant Lab': 'implants@dentallab.com',
      'General Lab': 'service@dentallab.com'
    },
    'Insurance & Admin': {
      'Insurance Provider': 'claims@insurance.com',
      'Dental Insurance': 'dental@insurance.com',
      'Practice Manager': 'manager@dentalpractice.com',
      'Billing Department': 'billing@dentalpractice.com'
    }
  }

  // Fetch notes and folders
  const { data: notes, refetch: refetchNotes } = useQuery({
    queryKey: ['patient-notes', params.id],
    queryFn: async () => {
      const response = await fetch(`/api/patients/${params.id}/notes`)
      if (!response.ok) throw new Error('Failed to fetch notes')
      return response.json()
    }
  })

  // Fetch patient images
  const { data: patientImages = [], refetch: refetchImages } = useQuery({
    queryKey: ['patient-images', params.id],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/patients/${params.id}/images`);
        if (!response.ok) {
          console.error('Failed to fetch patient images');
          return [];
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching patient images:', error);
        return [];
      }
    },
  })

  const { data: noteFolders, refetch: refetchFolders } = useQuery({
    queryKey: ['patient-note-folders', params.id],
    queryFn: async () => {
      const response = await fetch(`/api/patients/${params.id}/note-folders`)
      if (!response.ok) throw new Error('Failed to fetch folders')
      return response.json()
    }
  })

  // Fetch dental procedures
  const { data: dentalProcedures, refetch: refetchProcedures } = useQuery({
    queryKey: ['patient-dental-procedures', params.id],
    queryFn: async () => {
      const response = await fetch(`/api/patients/${params.id}/dental-procedures`)
      if (!response.ok) throw new Error('Failed to fetch dental procedures')
      return response.json()
    }
  })

  // Fetch dental codes
  const { data: dentalCodes } = useQuery({
    queryKey: ['dental-codes'],
    queryFn: async () => {
      const response = await fetch('/api/dental-codes')
      if (!response.ok) throw new Error('Failed to fetch dental codes')
      return response.json()
    }
  })

  // Note mutations
  const createNote = useMutation({
    mutationFn: async (data: { content: string; folderId?: string | null; isPinned: boolean }) => {
      const response = await fetch(`/api/patients/${params.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to create note')
      return response.json()
    },
    onSuccess: () => {
      refetchNotes()
      refetchFolders()
      toast.success('Note added successfully')
    }
  })

  const updateNote = useMutation({
    mutationFn: async (data: { noteId: string; content?: string; isPinned?: boolean; pinOrder?: number | null }) => {
      const response = await fetch(`/api/patients/${params.id}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to update note')
      return response.json()
    },
    onSuccess: () => {
      refetchNotes()
      refetchFolders()
      toast.success('Note updated successfully')
    }
  })

  const deleteNote = useMutation({
    mutationFn: async (noteId: string) => {
      const response = await fetch(`/api/patients/${params.id}/notes?noteId=${noteId}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete note')
    },
    onSuccess: () => {
      refetchNotes()
      refetchFolders()
      toast.success('Note deleted successfully')
    }
  })

  // Folder mutations
  const createFolder = useMutation({
    mutationFn: async (data: { name: string }) => {
      const response = await fetch(`/api/patients/${params.id}/note-folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to create folder')
      return response.json()
    },
    onSuccess: () => {
      refetchFolders()
      toast.success('Folder created successfully')
    }
  })

  const deleteFolder = useMutation({
    mutationFn: async (folderId: string) => {
      const response = await fetch(`/api/patients/${params.id}/note-folders?folderId=${folderId}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete folder')
    },
    onSuccess: () => {
      refetchFolders()
      refetchNotes()
      toast.success('Folder deleted successfully')
      setShowDeleteFolderModal(false)
      setFolderToDelete(null)
    },
    onError: () => {
      toast.error('Failed to delete folder')
    },
    onSettled: () => {
      setDeleteFolderLoading(false)
    }
  })

  const handleDeleteFolder = (folder: any) => {
    setFolderToDelete(folder)
    setShowDeleteFolderModal(true)
  }

  const handleConfirmDeleteFolder = () => {
    if (folderToDelete) {
      setDeleteFolderLoading(true)
      deleteFolder.mutate(folderToDelete.id)
    }
  }

  const { data: patient, isLoading, error: queryError, refetch } = useQuery<Patient>({
    queryKey: ['patient', params.id],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/patients/${params.id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch patient')
        }
        const patientData = await response.json()

        // Log patient access
        await logActivityClient({
          action: LOG_ACTIONS.VIEW_PATIENT,
          entityType: ENTITY_TYPES.PATIENT,
          entityId: params.id,
          description: `Accessed patient record: ${patientData.firstName} ${patientData.lastName}`,
          details: {
            patientCode: patientData.patientCode,
            gender: patientData.gender,
            age: patientData.dateOfBirth ? new Date().getFullYear() - new Date(patientData.dateOfBirth).getFullYear() : null
          },
          page: '/dashboard/patients/[id]',
          patientId: params.id,
          severity: LOG_SEVERITY.INFO
        });

        return patientData
      } catch (error) {
        console.error('Error fetching patient:', error)
        throw error
      }
    },
  })

  const { data: organization } = useQuery({
    queryKey: ['organization'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/user/organization')
        if (!response.ok) {
          throw new Error('Failed to fetch organization')
        }
        return response.json()
      } catch (error) {
        console.error('Error fetching organization:', error)
        throw error
      }
    },
  })

  const updatePatient = useMutation({
    mutationFn: async (data: Partial<Patient>) => {
      const response = await fetch(`/api/patients/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to update patient')
      }

      return response.json()
    },
    onSuccess: () => {
      setIsEditing(false)
    },
    onError: (error: Error) => {
      setError(error.message)
    },
  })

  const deletePatient = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/patients/${params.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete patient')
      }
    },
    onSuccess: () => {
      router.push('/dashboard/patients')
    },
    onError: (error: Error) => {
      setError(error.message)
    },
  })

  const updateAsaScore = useMutation({
    mutationFn: async (data: { score: number; notes: string }) => {
      const response = await fetch(`/api/patients/${params.id}/asa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to update ASA score')
      }

      return response.json()
    },
    onSuccess: () => {
      setShowAsaModal(false)
      setAsaModalStep('history')
      refetch()
      toast.success('ASA score updated successfully')
    },
    onError: (error: Error) => {
      toast.error('Failed to update ASA score: ' + error.message)
    },
  })

  const updatePpsScore = useMutation({
    mutationFn: async (data: { quadrant1: number; quadrant2: number; quadrant3: number; quadrant4: number; treatment: 'NONE' | 'PREVENTIVE' | 'PERIODONTAL'; notes: string }) => {
      const response = await fetch(`/api/patients/${params.id}/pps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to update PPS score')
      }

      return response.json()
    },
    onSuccess: () => {
      setShowPpsModal(false)
      setPpsModalStep('history')
      refetch()
      toast.success('PPS score updated successfully')
    },
    onError: (error: Error) => {
      toast.error('Failed to update PPS score: ' + error.message)
    },
  })

  const updateScreeningRecallScore = useMutation({
    mutationFn: async (data: { screeningMonths: number; useCustomText: boolean; customText: string; notes: string }) => {
      const response = await fetch(`/api/patients/${params.id}/screening-recall`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          screeningMonths: data.screeningMonths,
          useCustomText: data.useCustomText,
          customText: data.customText,
          notes: data.notes
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update screening recall score')
      }

      return response.json()
    },
    onSuccess: () => {
      setShowScreeningRecallModal(false)
      setScreeningRecallModalStep('history')
      refetch()
      toast.success('Screening recall terms updated successfully')
    },
    onError: (error: Error) => {
      toast.error('Failed to update screening recall terms: ' + error.message)
    },
  })

  const updateCleaningRecallScore = useMutation({
    mutationFn: async (data: { cleaningMonths: number; procedureCode: string; useCustomText: boolean; customText: string; notes: string }) => {
      const response = await fetch(`/api/patients/${params.id}/cleaning-recall`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cleaningMonths: data.cleaningMonths,
          procedureCode: data.procedureCode,
          useCustomText: data.useCustomText,
          customText: data.customText,
          notes: data.notes
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update cleaning recall score')
      }

      return response.json()
    },
    onSuccess: () => {
      setShowCleaningRecallModal(false)
      setCleaningRecallModalStep('history')
      refetch()
      toast.success('Cleaning recall terms updated successfully')
    },
    onError: (error: Error) => {
      toast.error('Failed to update cleaning recall terms: ' + error.message)
    },
  })

  const updateCarePlan = useMutation({
    mutationFn: async (data: typeof carePlanFormData) => {
      const response = await fetch(`/api/patients/${params.id}/care-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to update care plan')
      }

      return response.json()
    },
    onSuccess: () => {
      setShowCarePlanModal(false)
      refetch()
      toast.success('Care plan updated successfully')
    },
    onError: (error: Error) => {
      toast.error('Failed to update care plan: ' + error.message)
    },
  })

  const handleStatusSave = async (updatedChartData: any) => {
    try {
      await updateDentalData({ dentalChart: updatedChartData });
      toast.success('Dental chart saved successfully');
    } catch (err) {
      console.error('Failed to save dental chart:', err);
      toast.error('Failed to save dental chart');
    }
  };

  // Helper function to get latest ASA score and date
  const getLatestAsaData = () => {
    if (!patient?.asaHistory || patient.asaHistory.length === 0) {
      return { score: null, date: null }
    }
    const latest = patient.asaHistory.sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0]
    return {
      score: latest.score,
      date: new Date(latest.date).toLocaleDateString()
    }
  }

  // Helper function to get latest PPS data
  const getLatestPpsData = () => {
    if (!patient?.ppsHistory || patient.ppsHistory.length === 0) {
      return { scores: null, date: null }
    }
    const latest = patient.ppsHistory.sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0]
    return {
      scores: [latest.quadrant1, latest.quadrant2, latest.quadrant3, latest.quadrant4],
      date: new Date(latest.date).toLocaleDateString()
    }
  }

  // Helper function to get latest screening recall data
  const getLatestScreeningRecallData = () => {
    if (!patient?.screeningRecallHistory || patient.screeningRecallHistory.length === 0) {
      return { screeningMonths: null, date: null, customText: null }
    }
    const latest = patient.screeningRecallHistory.sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0]

    // Check if notes contain custom text data
    let customText = null
    if (latest.notes) {
      try {
        const notesData = JSON.parse(latest.notes)
        if (notesData.useCustomText && notesData.customText) {
          customText = notesData.customText
        }
      } catch (e) {
        // If parsing fails, it's regular notes
      }
    }

    return {
      screeningMonths: latest.screeningMonths,
      date: new Date(latest.date).toLocaleDateString(),
      customText
    }
  }

  // Helper function to get latest cleaning recall data
  const getLatestCleaningRecallData = () => {
    if (!patient?.cleaningRecallHistory || patient.cleaningRecallHistory.length === 0) {
      return { cleaningMonths: null, procedureCode: null, date: null, customText: null }
    }
    const latest = patient.cleaningRecallHistory.sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0]

    // Check if notes contain custom text data
    let customText = null
    if (latest.notes) {
      try {
        const notesData = JSON.parse(latest.notes)
        if (notesData.useCustomText && notesData.customText) {
          customText = notesData.customText
        }
      } catch (e) {
        // If parsing fails, it's regular notes
      }
    }

    return {
      cleaningMonths: latest.cleaningMonths,
      procedureCode: latest.procedureCode,
      date: new Date(latest.date).toLocaleDateString(),
      customText
    }
  }

  // Helper function to format PPS scores for display
  const formatPpsScores = (scores: number[]) => {
    return scores.map(score => score === 0 ? '-' : score.toString()).join('-')
  }

  // ASA Score colors
  const getAsaScoreColor = (score: number) => {
    switch (score) {
      case 1: return 'bg-white border-gray-300 text-gray-700'
      case 2: return 'bg-yellow-100 border-yellow-400 text-yellow-800'
      case 3: return 'bg-orange-100 border-orange-400 text-orange-800'
      case 4: return 'bg-red-100 border-red-400 text-red-800'
      case 5: return 'bg-red-200 border-red-500 text-red-900'
      case 6: return 'bg-gray-100 border-gray-400 text-gray-800'
      default: return 'bg-white border-gray-300 text-gray-700'
    }
  }

  // PPS Score colors
  const getPpsScoreColor = (score: number) => {
    switch (score) {
      case 0: return 'bg-gray-100 border-gray-400 text-gray-800'
      case 1: return 'bg-green-100 border-green-400 text-green-800'
      case 2: return 'bg-yellow-100 border-yellow-400 text-yellow-800'
      case 3: return 'bg-red-100 border-red-400 text-red-800'
      default: return 'bg-white border-gray-300 text-gray-700'
    }
  }

  const ASA_DESCRIPTIONS = {
    1: 'A normal healthy patient',
    2: 'A patient with mild systemic disease',
    3: 'A patient with severe systemic disease',
    4: 'A patient with severe systemic disease that is a constant threat to life',
    5: 'A moribund patient who is not expected to survive without the operation',
    6: 'A declared brain-dead patient whose organs are being removed for donor purposes',
  }

  const PPS_DESCRIPTIONS = {
    0: 'No teeth in quadrant',
    1: '1-3mm pockets',
    2: '4-5mm pockets',
    3: '6+mm pockets',
  }

  // Function to generate medical summary from form data
  const generateMedicalSummary = (formData: typeof asaFormData) => {
    const medicalSummary = []

    // Cardiovascular Health
    if (formData.chestPain) {
      medicalSummary.push("Chest pain during exertion")
      if (formData.chestPainReducedActivity) medicalSummary.push("- Reduced activities due to chest pain")
      if (formData.chestPainWorsening) medicalSummary.push("- Symptoms worsening recently")
      if (formData.chestPainAtRest) medicalSummary.push("- Symptoms also at rest")
    }

    if (formData.heartAttack) {
      medicalSummary.push("Previous heart attack")
      if (formData.heartAttackStillSymptoms) medicalSummary.push("- Still experiencing symptoms")
      if (formData.heartAttackLast6Months) medicalSummary.push("- Heart attack in last 6 months")
    }

    if (formData.heartMurmur) {
      medicalSummary.push(`Heart murmur/valve defect: ${formData.heartMurmurDetails || 'Yes'}`)
    }

    if (formData.vascularSurgery6Months) {
      medicalSummary.push("Vascular surgery in last 6 months")
    }

    if (formData.pacemakerICD) {
      medicalSummary.push("Pacemaker/ICD/stent")
    }

    if (formData.heartPalpitations) {
      medicalSummary.push("Heart palpitations without exertion")
      if (formData.heartPalpitationsNeedRest) medicalSummary.push("- Need to rest during episodes")
      if (formData.heartPalpitationsPaleDizzy) medicalSummary.push("- Become pale/dizzy during episodes")
    }

    if (formData.heartFailure) {
      medicalSummary.push("Heart failure")
      if (formData.heartFailureExtraPillows) medicalSummary.push("- Need extra pillows for breathing")
      if (formData.heartFailureNightBreathing) medicalSummary.push("- Wake up short of breath at night")
      if (formData.heartFailureNightUrination) medicalSummary.push("- Frequent night urination")
      if (formData.heartFailureSwollenFeet) medicalSummary.push("- Swollen feet in evening")
    }

    if (formData.acuteRheumatism) {
      medicalSummary.push("Previous acute rheumatism")
    }

    if (formData.bloodPressure) {
      medicalSummary.push(`Blood pressure: ${formData.bloodPressureValue || 'High/Low'}`)
    }

    // Bleeding Tendency
    if (formData.bleedingTendency) {
      medicalSummary.push("Bleeding tendency")
      if (formData.bleedingLongerThan1Hour) medicalSummary.push("- Bleed longer than 1 hour after procedures")
      if (formData.bleedingBruises) medicalSummary.push("- Unexplained bruising")
      if (formData.bloodThinners) {
        medicalSummary.push(`Blood thinners: ${formData.bloodThinnersDetails || 'Yes'}`)
      }
    }

    // Respiratory Health
    if (formData.lungProblems) {
      medicalSummary.push("Lung problems/persistent cough")
      if (formData.lungProblemsStairs) medicalSummary.push("- Short of breath climbing stairs")
      if (formData.lungProblemsDressing) medicalSummary.push("- Short of breath when dressing")
      if (formData.lungProblemsHyperventilation) medicalSummary.push("- Hyperventilation/fainting episodes")
    }

    if (formData.prosthesisLast3Months) {
      medicalSummary.push("Prosthesis in last 3 months")
    }

    // Specific Conditions
    const conditions = []
    if (formData.epilepsy) conditions.push("Epilepsy")
    if (formData.cancerLeukemia) conditions.push("Cancer/Leukemia")
    if (formData.diabetes) conditions.push("Diabetes")
    if (formData.hivAids) conditions.push("HIV/AIDS")
    if (formData.thyroidProblems) conditions.push("Thyroid problems")
    if (formData.asthma) conditions.push("Asthma")
    if (formData.kidneyDisease) conditions.push("Kidney disease")
    if (formData.liverDisease) conditions.push("Liver disease")
    if (formData.hepatitisA) conditions.push("Hepatitis A")
    if (formData.hepatitisB) conditions.push("Hepatitis B")
    if (formData.hepatitisC) conditions.push("Hepatitis C")
    if (formData.hepatitisD) conditions.push("Hepatitis D")

    if (conditions.length > 0) {
      medicalSummary.push(`Medical conditions: ${conditions.join(', ')}`)
    }

    if (formData.otherConditions) {
      medicalSummary.push(`Other conditions: ${formData.otherConditions}`)
    }

    // Medications and Allergies
    if (formData.currentMedications) {
      medicalSummary.push(`Current medications: ${formData.currentMedications}`)
    }

    if (formData.allergies) {
      medicalSummary.push(`Allergies: ${formData.allergies}`)
    }

    // Lifestyle Questions
    if (formData.smoking) {
      medicalSummary.push(`Smoking: ${formData.smokingAmount || 'Yes'}`)
    }

    if (formData.drinking) {
      medicalSummary.push(`Alcohol consumption: ${formData.drinkingAmount || 'Yes'}`)
    }

    // Pregnancy Questions
    if (formData.pregnancy) {
      medicalSummary.push(`Pregnant: ${formData.pregnancyWeeks ? `${formData.pregnancyWeeks} weeks` : 'Yes'}`)
      if (formData.pregnancyComplications) {
        medicalSummary.push(`Pregnancy complications: ${formData.pregnancyComplications}`)
      }
    }

    return medicalSummary.join('\n')
  }

  // Function to update form data and automatically update notes
  const updateAsaFormData = (updates: Partial<typeof asaFormData>) => {
    const newFormData = { ...asaFormData, ...updates }

    // Only auto-update notes if user hasn't manually edited them
    if (!isNotesManuallyEdited) {
      const medicalSummary = generateMedicalSummary(newFormData)
      setAsaFormData({ ...newFormData, notes: medicalSummary })
    } else {
      setAsaFormData(newFormData)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`/api/patients/${params.id}/files`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload file')
      }

      // Refetch patient data to get updated files
      await refetch()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to upload file')
    }
  }

  const {
    dentalChart,
    periodontalChart,
    procedures,
    isLoading: isDentalLoading,
    error: dentalError,
    updateDentalData,
  } = useDentalData({
    patientId: params.id,
    onError: (error) => {
      toast.error('Failed to load dental data: ' + error.message);
    },
  });

  // Dental chart tool toggle logic
  const handleToolClick = (toolId: string) => {
    setActiveTool(activeTool === toolId ? null : toolId)
  }

  const loadStatusHistory = async () => {
    try {
      const response = await fetch(`/api/patients/${params.id}/status`)
      if (response.ok) {
        const history = await response.json()
        setStatusHistory(history)
      }
    } catch (error) {
      console.error('Failed to load status history:', error)
    }
  }

  const handleOpenDeleteDisableModal = () => {
    setShowDeleteDisableModal(true)
    setDeleteDisableModalStep('options')
    loadStatusHistory()
  }

  const [periodontalSettings, setPeriodontalSettings] = useState({
    keybinds: {
      bleeding: 'b',
      suppuration: 'n',
      extended: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    },
    order: [
      { field: 'recession', quadrant: 'Q1', side: 'buccal', direction: 'd->m' },
      { field: 'pocketDepth', quadrant: 'Q1', side: 'buccal', direction: 'd->m' },
      { field: 'recession', quadrant: 'Q2', side: 'lingual', direction: 'd->m' },
      { field: 'pocketDepth', quadrant: 'Q2', side: 'lingual', direction: 'd->m' },
      { field: 'recession', quadrant: 'Q3', side: 'lingual', direction: 'd->m' },
      { field: 'pocketDepth', quadrant: 'Q3', side: 'lingual', direction: 'd->m' },
      { field: 'recession', quadrant: 'Q4', side: 'buccal', direction: 'd->m' },
      { field: 'pocketDepth', quadrant: 'Q4', side: 'buccal', direction: 'd->m' },
    ]
  })

  const handlePeriodontalSave = async (data: any) => {
    try {
      await updateDentalData({
        periodontalChart: mapComponentToAPIData(
          data.teeth,
          params.id,
          data.chartType,
          data.isExplicitlySaved
        )
      })

      // Only analyze and show scaling treatments for explicit saves, not auto-saves
      if (data.isExplicitlySaved) {
        // Analyze periodontal data to suggest scaling treatments for individual teeth
        const teethTreatments = analyzePeriodontalDataForScaling(data.teeth)
        if (teethTreatments.length > 0) {
          setSuggestedTeethTreatments(teethTreatments)
          setSelectedTreatments([...teethTreatments]) // Start with all selected
          setSavedPerioData(data)
          setShowScalingModal(true)
        }
      }

      toast.success('Periodontal chart updated successfully')
    } catch (error) {
      toast.error('Failed to update periodontal chart')
    }
  }

  // Function to analyze periodontal data and suggest scaling treatments for individual teeth
  const analyzePeriodontalDataForScaling = (teeth: Record<number, ToothMeasurements>) => {
    const treatments: any[] = []

    // Analyze each tooth individually
    Object.entries(teeth).forEach(([toothNum, measurements]) => {
      const toothNumber = parseInt(toothNum)

      // Skip disabled/extracted teeth and implants
      if (measurements.isDisabled || measurements.isImplant) {
        return
      }

      // Get all pocket depths for this tooth
      const allDepths: number[] = []
      const allBleeding: boolean[] = []
      const allSuppuration: boolean[] = []

      // Collect measurements from all sites
      const sides: ('buccal' | 'lingual')[] = ['buccal', 'lingual']
      const sites: ('distal' | 'middle' | 'mesial')[] = ['distal', 'middle', 'mesial']

      sides.forEach(side => {
        sites.forEach(site => {
          const measurement = measurements[side]?.[site]
          if (measurement) {
            if (measurement.pocketDepth && measurement.pocketDepth > 0) {
              allDepths.push(measurement.pocketDepth)
            }
            allBleeding.push(measurement.bleeding || false)
            allSuppuration.push(measurement.suppuration || false)
          }
        })
      })

      // Skip teeth with no measurements
      if (allDepths.length === 0) return

      const maxDepth = Math.max(...allDepths)
      const hasInflammation = allBleeding.some(b => b) || allSuppuration.some(s => s)

      // Determine if tooth is multi-rooted (6s, 7s, 8s)
      const toothType = toothNumber % 10
      const isMultiRooted = toothType >= 6 && toothType <= 8

      // Determine treatment based on single vs multi-rooted rules
      let treatment = null

      if (isMultiRooted) {
        // Multi-rooted teeth: T022 for 4-5mm, T021 for 6+mm
        if (maxDepth >= 6) {
          treatment = {
            id: `tooth-${toothNumber}-t021`,
            toothNumber,
            code: 't021',
            description: 'Complex periodontal treatment',
            maxDepth,
            hasInflammation,
            reason: `${maxDepth}mm (multi-rooted)`,
            urgency: 'high'
          }
        } else if (maxDepth >= 4) {
          treatment = {
            id: `tooth-${toothNumber}-t022`,
            toothNumber,
            code: 't022',
            description: 'Standard periodontal treatment',
            maxDepth,
            hasInflammation,
            reason: `${maxDepth}mm (multi-rooted)`,
            urgency: 'medium'
          }
        }
      } else {
        // Single-rooted teeth: T022 for 4-7mm, T021 for 8+mm
        if (maxDepth >= 8) {
          treatment = {
            id: `tooth-${toothNumber}-t021`,
            toothNumber,
            code: 't021',
            description: 'Complex periodontal treatment',
            maxDepth,
            hasInflammation,
            reason: `${maxDepth}mm (single-rooted)`,
            urgency: 'high'
          }
        } else if (maxDepth >= 4) {
          treatment = {
            id: `tooth-${toothNumber}-t022`,
            toothNumber,
            code: 't022',
            description: 'Standard periodontal treatment',
            maxDepth,
            hasInflammation,
            reason: `${maxDepth}mm (single-rooted)`,
            urgency: 'medium'
          }
        }
      }

      if (treatment) {
        treatments.push(treatment)
      }
    })

    // Sort by urgency (high first) then by tooth number
    treatments.sort((a, b) => {
      const urgencyOrder = { high: 3, medium: 2, low: 1 }
      if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
        return urgencyOrder[b.urgency] - urgencyOrder[a.urgency]
      }
      return a.toothNumber - b.toothNumber
    })

    return treatments
  }

  // Edit treatment modal functions
  const openEditTreatmentModal = (treatment: any) => {
    setEditingTreatment(treatment)
    setEditForm({
      toothNumber: treatment.toothNumber ? treatment.toothNumber.toString() : '',
      code: treatment.code
    })
    setShowEditTreatmentModal(true)
  }

  const handleEditTreatmentSave = () => {
    if (!editForm.code) {
      toast.error('Please select a treatment code')
      return
    }

    // Check if tooth number is required for this code
    const toothSpecificCodes = ['t021', 't022']
    const isToothSpecific = toothSpecificCodes.includes(editForm.code)

    if (isToothSpecific && !editForm.toothNumber) {
      toast.error('Please enter a tooth number for this treatment')
      return
    }

    let toothNum = null
    if (editForm.toothNumber) {
      toothNum = parseInt(editForm.toothNumber)
      if (isNaN(toothNum) || toothNum < 11 || toothNum > 48) {
        toast.error('Please enter a valid tooth number (11-48)')
        return
      }
    }

    const codeMap = {
      't021': 'Complex periodontal treatment',
      't022': 'Standard periodontal treatment',
      'a10': 'Clinical examination',
      'x10': 'Bitewing radiograph',
      't012': 'Supra-gingival plaque removal',
      't032': 'Oral hygiene instruction',
      't042': 'Periodontal cleaning',
      't043': 'Extensive periodontal cleaning',
      't044': 'Periodontal maintenance'
    }

    const updatedTreatment = {
      ...editingTreatment,
      toothNumber: toothNum,
      code: editForm.code,
      description: codeMap[editForm.code] || 'Custom treatment'
    }

    // Update in suggestions list
    setSuggestedTeethTreatments(prev =>
      prev.map(t => t.id === editingTreatment.id ? updatedTreatment : t)
    )

    // Update in selected list if it's selected
    const isSelected = selectedTreatments.some(t => t.id === editingTreatment.id)
    if (isSelected) {
      setSelectedTreatments(prev =>
        prev.map(t => t.id === editingTreatment.id ? updatedTreatment : t)
      )
    }

    setShowEditTreatmentModal(false)
    toast.success('Treatment updated successfully')
  }

  // Add treatment modal functions
  const openAddTreatmentModal = () => {
    setAddForm({ toothNumber: '', code: '' })
    setShowAddTreatmentModal(true)
  }

  const handleAddTreatmentSave = () => {
    if (!addForm.toothNumber || !addForm.code) {
      toast.error('Please fill in all fields')
      return
    }

    const toothNum = parseInt(addForm.toothNumber)
    if (isNaN(toothNum) || toothNum < 11 || toothNum > 48) {
      toast.error('Please enter a valid tooth number (11-48)')
      return
    }

    const codeMap = {
      't021': 'Complex periodontal treatment',
      't022': 'Standard periodontal treatment'
    }

    const customTreatment = {
      id: `custom-${toothNum}-${Date.now()}`,
      toothNumber: toothNum,
      code: addForm.code,
      description: codeMap[addForm.code] || 'Custom treatment',
      maxDepth: 0,
      hasInflammation: false,
      reason: 'Manually added',
      urgency: 'medium'
    }

    setSuggestedTeethTreatments(prev => [...prev, customTreatment])
    setSelectedTreatments(prev => [...prev, customTreatment])
    setShowAddTreatmentModal(false)
    toast.success('Custom treatment added successfully')
  }

  const handleQuickCodeAdd = (code: string) => {
    const codeMap = {
      'a10': 'Clinical examination',
      'x10': 'Bitewing radiograph',
      't012': 'Supra-gingival plaque removal',
      't032': 'Oral hygiene instruction',
      't042': 'Periodontal cleaning',
      't043': 'Extensive periodontal cleaning',
      't044': 'Periodontal maintenance'
    }

    const quickTreatment = {
      id: `quick-${code}-${Date.now()}`,
      toothNumber: null, // No tooth number for standalone treatments
      code: code,
      description: codeMap[code] || 'Quick treatment',
      maxDepth: 0,
      hasInflammation: false,
      reason: 'Quick add',
      urgency: 'medium'
    }

    setSuggestedTeethTreatments(prev => [...prev, quickTreatment])
    setSelectedTreatments(prev => [...prev, quickTreatment])
    toast.success(`${code.toUpperCase()} added to treatment list`)
  }

  const treatmentContainerRef = useRef<HTMLDivElement>(null);
  // Active tab for Treatment Plan
  const [treatmentTab, setTreatmentTab] = useState<'history' | 'current' | 'plan'>('current');
  const statusByTab: Record<'history' | 'current' | 'plan', string> = {
    history: 'COMPLETED',
    current: 'IN_PROGRESS',
    plan: 'PENDING',
  };

  // Scroll to bottom whenever procedures list updates
  useEffect(() => {
    if (treatmentContainerRef.current) {
      treatmentContainerRef.current.scrollTop = treatmentContainerRef.current.scrollHeight;
    }
  }, [dentalProcedures]);



  // Initialize email content when modal opens
  useEffect(() => {
    if (showEmailModal && !emailFormData.content) {
      setEmailFormData(prev => ({
        ...prev,
        content: `Dear ${patient?.firstName} ${patient?.lastName},\n\n\n\nBest regards,\n${organization?.name || 'Our dental practice'}\n${organization?.address || ''}\n${organization?.phone || ''}`
      }));
    }
  }, [showEmailModal, patient, organization]);

  const [pendingProcedureId, setPendingProcedureId] = useState<string | null>(null);

  // Handle quick-add treatment save
  const handleQuickAddSave = async (treatmentData: any) => {
    try {
      const response = await fetch(`/api/patients/${params.id}/dental-procedures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: params.id,
          codeId: treatmentData.codeId,
          toothNumber: treatmentData.toothNumber,
          jaw: treatmentData.jaw,
          surface: treatmentData.surface,
          quadrant: treatmentData.quadrant,
          timeMultiplier: treatmentData.timeMultiplier,
          surfaces: treatmentData.surfaces,
          roots: treatmentData.roots,
          elements: treatmentData.elements,
          sessions: treatmentData.sessions,
          jawHalf: treatmentData.jawHalf,
          sextant: treatmentData.sextant,
          technicalCosts: treatmentData.technicalCosts,
          materialCosts: treatmentData.materialCosts,
          cost: treatmentData.cost,
          notes: treatmentData.notes,
          status: statusByTab[treatmentTab],
          date: new Date().toISOString().split('T')[0]
        }),
      });

      if (!response.ok) throw new Error('Failed to save treatment');

      const result = await response.json();
      if (result && result.procedure && result.procedure.id) {
        setUndoStack(prev => [...prev, [result.procedure]]);
      }

      refetchProcedures();
      toast.success(`Added ${quickAddCode?.code} - ${quickAddCode?.description}`);

      // For WLZ patients, automatically trigger U35 modal after treatment is added
      if (patient?.isLongTermCareAct) {
        setPendingTreatmentData(treatmentData);
        setShowU35Modal(true);
      }
    } catch (error) {
      console.error('Error saving quick-add treatment:', error);
      throw error;
    }
  };

  // Called by DentalChart when a new procedure is created so UI refreshes instantly
  const handleProcedureCreated = async (procedure?: any) => {
    console.log('🔄 handleProcedureCreated called with procedure:', procedure);

    // If a procedure was passed, add it to the undo stack
    if (procedure) {
      setUndoStack(prev => [...prev, [procedure]]);
    }

    console.log('🔄 Calling refetchProcedures...');
    await refetchProcedures();
    console.log('🔄 Calling queryClient.invalidateQueries...');
    queryClient.invalidateQueries({ queryKey: ['dental', params.id] });
    console.log('🔄 Calling queryClient.refetchQueries...');
    await queryClient.refetchQueries({ queryKey: ['dental', params.id] });
    console.log('🔄 handleProcedureCreated completed');
  };

  // Handle U35 quantity modal confirmation
  const handleU35Confirm = async (quantity: number) => {
    try {
      // Find the U35 code from available dental codes
      const u35Code = dentalCodes?.find(code => code.code === 'U35');
      if (!u35Code) {
        toast.error('U35 code not found in system');
        return;
      }

      const response = await fetch(`/api/patients/${params.id}/dental-procedures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: params.id,
          codeId: u35Code.id,
          quantity: quantity,
          cost: quantity * 19.93, // €19.93 per 5-minute unit
          notes: `Time units for ${pendingTreatmentData?.code || 'treatment'} - ${quantity} units (${quantity * 5} minutes)`,
          status: statusByTab[treatmentTab],
          date: new Date().toISOString().split('T')[0]
        }),
      });

      if (!response.ok) throw new Error('Failed to save U35 treatment');

      refetchProcedures();
      toast.success(`Added U35 - ${quantity} time units (${quantity * 5} minutes)`);

      // Reset modal state
      setShowU35Modal(false);
      setPendingTreatmentData(null);
    } catch (error) {
      console.error('Error saving U35 treatment:', error);
      toast.error('Failed to save U35 treatment');
      throw error;
    }
  };

  // Helper functions for communication modals

  const handleEmailTemplateSelect = (categoryKey: string, templateKey: string) => {
    const template = emailTemplates[categoryKey][templateKey];
    setEmailFormData(prev => ({
      ...prev,
      subject: template.subject,
      content: `Dear ${patient?.firstName} ${patient?.lastName},\n\n${template.content}\n\nBest regards,\n${organization?.name || 'Our dental practice'}\n${organization?.address || ''}\n${organization?.phone || ''}`
    }));
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Cute colors for each template category
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Welcome & New Patients': 'bg-pink-50 border-pink-200 text-pink-800',
      'Appointments & Scheduling': 'bg-blue-50 border-blue-200 text-blue-800',
      'Patient Questionnaires': 'bg-purple-50 border-purple-200 text-purple-800',
      'Prescriptions & Pharmacy': 'bg-teal-50 border-teal-200 text-teal-800',
      'Referral Letters': 'bg-indigo-50 border-indigo-200 text-indigo-800',
      'Payment & Administrative': 'bg-orange-50 border-orange-200 text-orange-800',
      'No-Show Management': 'bg-rose-50 border-rose-200 text-rose-800',
      'Patient Transfer': 'bg-cyan-50 border-cyan-200 text-cyan-800',
      'Treatment & Follow-up': 'bg-green-50 border-green-200 text-green-800',
      'Billing & Insurance': 'bg-amber-50 border-amber-200 text-amber-800',
      'Preventive Care': 'bg-emerald-50 border-emerald-200 text-emerald-800',
      'Emergency & Urgent': 'bg-red-50 border-red-200 text-red-800'
    };
    return colors[category] || 'bg-gray-50 border-gray-200 text-gray-800';
  };

  const getCategoryHeaderColor = (category: string) => {
    const colors: Record<string, string> = {
      'Welcome & New Patients': 'text-pink-700',
      'Appointments & Scheduling': 'text-blue-700',
      'Patient Questionnaires': 'text-purple-700',
      'Prescriptions & Pharmacy': 'text-teal-700',
      'Referral Letters': 'text-indigo-700',
      'Payment & Administrative': 'text-orange-700',
      'No-Show Management': 'text-rose-700',
      'Patient Transfer': 'text-cyan-700',
      'Treatment & Follow-up': 'text-green-700',
      'Billing & Insurance': 'text-amber-700',
      'Preventive Care': 'text-emerald-700',
      'Emergency & Urgent': 'text-red-700'
    };
    return colors[category] || 'text-gray-700';
  };

  const filteredTemplates = () => {
    if (!templateSearch.trim()) return emailTemplates;

    const filtered: any = {};
    Object.entries(emailTemplates).forEach(([category, templates]) => {
      const matchingTemplates: any = {};
      Object.entries(templates as any).forEach(([key, template]: [string, any]) => {
        if (
          template.subject.toLowerCase().includes(templateSearch.toLowerCase()) ||
          template.content.toLowerCase().includes(templateSearch.toLowerCase()) ||
          category.toLowerCase().includes(templateSearch.toLowerCase())
        ) {
          matchingTemplates[key] = template;
        }
      });
      if (Object.keys(matchingTemplates).length > 0) {
        filtered[category] = matchingTemplates;
      }
    });
    return filtered;
  };

  const handleSendEmail = async () => {
    // Simulate sending email
    toast.success('Email sent successfully!');
    setShowEmailModal(false);
    setEmailFormData({
      subject: '',
      content: '',
      recipients: [],
      selectedFiles: [],
      selectedImages: []
    });
  };

  const toggleFileSelection = (fileId: string, type: 'file' | 'image') => {
    if (type === 'file') {
      setEmailFormData(prev => ({
        ...prev,
        selectedFiles: prev.selectedFiles.includes(fileId)
          ? prev.selectedFiles.filter(id => id !== fileId)
          : [...prev.selectedFiles, fileId]
      }));
    } else {
      setEmailFormData(prev => ({
        ...prev,
        selectedImages: prev.selectedImages.includes(fileId)
          ? prev.selectedImages.filter(id => id !== fileId)
          : [...prev.selectedImages, fileId]
      }));
    }
  };

  const addEmailRecipient = (email: string) => {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailFormData.recipients.includes(email) && emailRegex.test(email)) {
      setEmailFormData(prev => ({
        ...prev,
        recipients: [...prev.recipients, email]
      }));
      setEmailInputError('');
      return true;
    } else if (email && !emailRegex.test(email)) {
      setEmailInputError('Please enter a valid email address');
      return false;
    } else if (emailFormData.recipients.includes(email)) {
      setEmailInputError('Email already added');
      return false;
    }
    return false;
  };

  const removeEmailRecipient = (email: string) => {
    setEmailFormData(prev => ({
      ...prev,
      recipients: prev.recipients.filter(recipient => recipient !== email)
    }));
  };

  const addPatientEmail = () => {
    if (patient?.email && !emailFormData.recipients.includes(patient.email)) {
      addEmailRecipient(patient.email);
    }
  };

  const handleEmailInputKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && emailInput.trim()) {
      e.preventDefault();
      if (addEmailRecipient(emailInput.trim())) {
        setEmailInput('');
        setEmailInputError('');
      }
    } else if (e.key === 'Backspace' && !emailInput && emailFormData.recipients.length > 0) {
      // Remove last recipient if input is empty and backspace is pressed
      const lastEmail = emailFormData.recipients[emailFormData.recipients.length - 1];
      removeEmailRecipient(lastEmail);
    }
  };

  const handleEmailInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailInput(e.target.value);
    // Clear error when user starts typing
    if (emailInputError) {
      setEmailInputError('');
    }
  };

  // Handle budget email integration
  const handleEmailBudget = (pdfBlob: Blob, filename: string) => {
    // Convert blob to file for email attachment
    const file = new File([pdfBlob], filename, { type: 'application/pdf' });

    // Add budget to email attachments (implement similar to file attachments)
    setEmailFormData(prev => ({
      ...prev,
      subject: `Treatment Budget - ${patient?.firstName} ${patient?.lastName}`,
      content: `Dear ${patient?.firstName} ${patient?.lastName},\n\nPlease find attached your treatment budget.\n\nBest regards,\n${organization?.name || 'Dental Practice'}`,
      selectedFiles: [...prev.selectedFiles] // Add budget file handling if needed
    }));

    // Open email modal
    setShowEmailModal(true);

    // Note: For full implementation, you'd need to handle PDF attachments in the email system
    toast.success('Budget prepared for email - please attach manually for now');
  };

  // Print patient label for sticker printer
  const handlePrintLabel = () => {
    try {
      if (!patient) return;

      const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      };

      const cleanAddress = (address: string) => {
        // Remove all duplicate parts (case-insensitive)
        const parts = address.split(', ');
        const seen = new Set();
        const cleaned = parts.filter(part => {
          const lowerPart = part.toLowerCase();
          if (seen.has(lowerPart)) {
            return false;
          }
          seen.add(lowerPart);
          return true;
        });

        // Find and separate postcode (format: #### XX or ####XX)
        const postcodePattern = /^\d{4}\s?[A-Z]{2}$/;
        const addressParts = [];
        let postcode = '';

        for (const part of cleaned) {
          if (postcodePattern.test(part.trim())) {
            postcode = part.trim();
          } else {
            addressParts.push(part);
          }
        }

        // Return address with postcode on separate line if found
        if (postcode) {
          return addressParts.join(', ') + ' ' + postcode;
        }

        return cleaned.join(', ');
      };

      const html = `<!DOCTYPE html>
        <html>
        <head>
          <title>Patient Label</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 6px;
              font-size: 15px;
              line-height: 1.4;
              width: 2.25in;
              height: 1in;
              box-sizing: border-box;
              overflow: hidden;
            }
            .label-container {
              display: flex;
              flex-direction: column;
              height: 100%;
              justify-content: flex-start;
              gap: 2px;
            }
            .patient-name {
              font-weight: bold;
              font-size: 16px;
              text-align: left;
            }
            .info-row {
              font-size: 16px;
              text-align: left;
              line-height: 1.3;
            }
            .dob {
              font-weight: bold;
            }
            .contact-info {
              font-size: 16px;
            }
            @media print {
              body { margin: 0; padding: 6px; }
              @page { 
                size: 2.25in 1in; 
                margin: 0; 
              }
            }
          </style>
        </head>
        <body>
          <div class="label-container">
            <div class="patient-name">${patient.firstName} ${patient.lastName} (${patient.patientCode})</div>
            <div class="info-row dob">${formatDate(patient.dateOfBirth)}</div>
            <div class="info-row" style="white-space: normal;">${cleanAddress(patient.address.display_name)}</div>
            ${patient.phone ? `<div class="info-row contact-info">${patient.phone}</div>` : ''}
            ${patient.email ? `<div class="info-row contact-info">${patient.email}</div>` : ''}
          </div>
        </body>
        </html>`;

      const printWindow = window.open('', '_blank', 'width=400,height=200');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();

        // Delay print slightly to ensure content is rendered
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }

      toast.success('Patient label opened for printing');
    } catch (error) {
      console.error('Error printing patient label', error);
      toast.error('Failed to print patient label');
    }
  };

  // Spacebar scroll to images functionality
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if space is pressed and we're not in an input field
      if (e.code === 'Space' && e.target &&
        (e.target as HTMLElement).tagName !== 'INPUT' &&
        (e.target as HTMLElement).tagName !== 'TEXTAREA' &&
        !(e.target as HTMLElement).isContentEditable) {
        e.preventDefault();
        imagesRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }

      // CTRL+Z handler for undo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        const last = undoStack.pop();
        if (last && last.length) {
          setUndoStack(prev => prev.slice(0, -1));
          Promise.all(
            last.map(p =>
              fetch('/api/dental-procedures/undo', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-entity-id': p.id
                }
              })
                .then(async res => {
                  if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    if (err && err.code) {
                      if (err.code === 'NO_LOG') toast.error('Nothing to undo.');
                      else if (err.code === 'NO_BACKUP_DELETE' || err.code === 'NO_BACKUP_EDIT') toast.error('Cannot restore, backup missing.');
                      else if (err.code === 'PROCEDURE_NOT_FOUND') toast.error('Procedure not found for undo.');
                      else if (err.code === 'UNAUTHORIZED') toast.error('You are not authorized to undo.');
                      else toast.error(err.error || 'Failed to undo');
                    } else {
                      toast.error('Failed to undo');
                    }
                    throw new Error(err.error || 'Failed to undo');
                  }
                  return res.json();
                })
            )
          )
            .then(() => {
              toast.success('Undo successful');
              refetchProcedures();
            })
            .catch((error) => {
              console.error('Error during undo:', error);
            });
        }
      }

      // CTRL+Y handler for redo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        fetch('/api/dental-procedures/redo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
          .then(async res => {
            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              if (err && err.code) {
                if (err.code === 'NO_UNDO_LOG') toast.error('Nothing to redo.');
                else if (err.code === 'ALREADY_PROCESSED') {
                  // This is expected when multiple requests arrive - just refresh the UI
                  toast.success('Redo completed');
                  refetchProcedures();
                }
                else if (err.code === 'NO_ORIGINAL_DATA') toast.error('Cannot redo, original data missing.');
                else if (err.code === 'PROCEDURE_NOT_FOUND') toast.error('Procedure not found for redo.');
                else if (err.code === 'UNAUTHORIZED') toast.error('You are not authorized to redo.');
                else toast.error(err.error || 'Failed to redo');
              } else {
                toast.error('Failed to redo');
              }
              throw new Error(err.error || 'Failed to redo');
            }
            return res.json();
          })
          .then(() => {
            toast.success('Redo successful');
            refetchProcedures();
          })
          .catch((error) => {
            console.error('Error during redo:', error);
          });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoStack, refetchProcedures]);

  // Fetch all users (practitioners)
  const { data: users = [] } = useQuery({
    queryKey: ['practitioners'],
    queryFn: async () => {
      const response = await fetch('/api/practitioners');
      if (!response.ok) throw new Error('Failed to fetch practitioners');
      return response.json();
    }
  });
  // Build user map for fast lookup
  const userMap = React.useMemo(() => {
    const map: Record<string, { firstName: string; lastName: string }> = {};
    users.forEach((u: any) => {
      map[u.id] = { firstName: u.firstName, lastName: u.lastName };
    });
    return map;
  }, [users]);

  const [showFluorideModal, setShowFluorideModal] = useState(false);
  const [showFlavorSettings, setShowFlavorSettings] = useState(false);
  const [fluorideFlavors, setFluorideFlavors] = useState<FluorideFlavor[]>([]);
  const [fluorideLoading, setFluorideLoading] = useState(false);

  const fetchFluorideFlavors = async () => {
    setFluorideLoading(true);
    try {
      const res = await fetch(`/api/fluoride-flavors?organizationId=${organization?.id}`);
      const data = await res.json();
      setFluorideFlavors(data);
    } finally {
      setFluorideLoading(false);
    }
  };

  const handleFluorideQuickButton = () => {
    fetchFluorideFlavors();
    setShowFluorideModal(true);
  };

  const handleFluorideSave = async ({ jaws, flavor }: { jaws: string[]; flavor: FluorideFlavor }) => {
    setFluorideLoading(true);
    try {
      const notes = `${flavor.name} for ${jaws.length === 2 ? 'upper & lower' : jaws[0]} jaw`;
      const res = await fetch('/api/dental-codes?search=M40');
      const codes = await res.json();
      const m40 = codes.find((c: any) => c.code === 'M40');
      if (m40) {
        const response = await fetch(`/api/patients/${params.id}/dental-procedures`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId: params.id,
            codeId: m40.id,
            toothNumber: null,
            notes,
            status: 'IN_PROGRESS',
            date: new Date().toISOString().split('T')[0],
            quantity: jaws.length,
          })
        });

        if (response.ok) {
          const result = await response.json();
          if (result && result.procedure && result.procedure.id) {
            setUndoStack(prev => [...prev, [result.procedure]]);
          }
        }
      }
      toast.success('Fluoride added');
      setShowFluorideModal(false);
      refetchProcedures && refetchProcedures();
    } catch {
      toast.error('Failed to add fluoride');
    } finally {
      setFluorideLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (queryError || !patient) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900">Error Loading Patient</h2>
        <p className="mt-2 text-gray-600">
          {queryError instanceof Error ? queryError.message : 'Patient not found'}
        </p>
        <Button
          onClick={() => router.push('/dashboard/patients')}
          className="mt-4"
        >
          Back to Patients
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full h-full p-0 m-0 bg-gray-100">
      {/* WLZ Badge and Action buttons */}
      <div className="print:hidden flex justify-between items-center gap-2 p-2">
        {/* WLZ Badge - Left side */}
        <div className="flex items-center">
          {patient?.isLongTermCareAct && (
            <span className="inline-flex items-center px-3 py-1 rounded text-sm font-medium bg-purple-100 text-purple-800 border border-purple-300">
              WLZ
            </span>
          )}
        </div>

        {/* Action buttons - Right side */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowShopModal(true)}
            disabled={patient?.isDisabled}
            title="Shop - Purchase products"
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilesModal(true)}
            title="Patient files and documents"
          >
            <Files className="h-4 w-4" />
          </Button>
          {/* Insurance button - only show if patient has insurance */}
          {patient?.healthInsurance && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInsuranceModal(true)}
              title="View insurance details"
            >
              <Euro className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrintLabel}
            title="Print patient label"
          >
            <Tag className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowPrintModal(true)}>
            <Printer className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTasksModal(true)}
            title="View patient tasks"
          >
            <ClipboardList className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowWaitingModal(true)}
            title="Waiting list entries"
          >
            <Clock className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {/* Main grid */}
      <div className="w-full h-full grid grid-cols-[220px_1fr] grid-rows-[1fr_38vh_auto_auto] gap-1">
        {/* Left sidebar: Patient Info & Treatment Plan */}
        <PatientInfoCard
          patient={patient}
          onEditClick={() => {
            setEditFormData({
              firstName: patient.firstName,
              lastName: patient.lastName,
              dateOfBirth: patient.dateOfBirth.split('T')[0],
              gender: patient.gender as 'MALE' | 'FEMALE' | 'OTHER',
              email: patient.email || '',
              phone: patient.phone || '',
              address: patient.address.display_name || '',
              bsn: patient.bsn,
              country: patient.country,
              allowEarlySpotContact: patient.allowEarlySpotContact ?? true,
              isLongTermCareAct: patient.isLongTermCareAct ?? false
            })
            setSelectedAddress(null)  // Always start with null
            setShowEditModal(true)
          }}
          onSettingsClick={handleOpenDeleteDisableModal}
          onLocationClick={() => setShowLocationModal(true)}
          onAsaClick={() => setShowAsaModal(true)}
          onPpsClick={() => setShowPpsModal(true)}
          onScreeningRecallClick={() => setShowScreeningRecallModal(true)}
          onCleaningRecallClick={() => setShowCleaningRecallModal(true)}
          onCarePlanClick={() => setShowCarePlanModal(true)}
          onEmailClick={() => {
            setShowEmailModal(true);
            if (patient?.email) {
              setEmailFormData(prev => ({
                ...prev,
                recipients: prev.recipients.includes(patient.email)
                  ? prev.recipients
                  : [...prev.recipients, patient.email]
              }));
            }
          }}
          getLatestAsaData={getLatestAsaData}
          getLatestPpsData={getLatestPpsData}
          getLatestScreeningRecallData={getLatestScreeningRecallData}
          getLatestCleaningRecallData={getLatestCleaningRecallData}
          formatPpsScores={formatPpsScores}
          isDisabled={patient.isDisabled}
        />
        {/* Center panel: Status Praesens / Periodontal Chart toggle */}
        <PatientCenterPanel
          centerPanel={centerPanel}
          setCenterPanel={setCenterPanel}
          activeTool={activeTool}
          handleToolClick={handleToolClick}
          setShowPerioSettingsModal={setShowPerioSettingsModal}
          setShowHistoryModal={setShowHistoryModal}
          patient={patient}
          perioSettings={periodontalSettings}
          mapAPIToComponentData={mapAPIToComponentData}
          mapComponentToAPIData={mapComponentToAPIData}
          handlePeriodontalSave={handlePeriodontalSave}
          onProcedureCreated={handleProcedureCreated}
          onProcedureDeleted={async () => {
            await refetchProcedures(); // Refresh procedures
            queryClient.invalidateQueries({ queryKey: ['dental', params.id] }); // Refresh dental chart
            // Force a complete refresh of dental chart data by refetching
            queryClient.refetchQueries({ queryKey: ['dental', params.id] });
          }}
          handleStatusSave={handleStatusSave}
          activeProcedures={dentalProcedures?.filter(p => p.status === statusByTab[treatmentTab]) || []}
          patientId={params.id}
          procedures={dentalProcedures || []}
          toothTypes={dentalChart?.toothTypes || {}}
          currentStatus={statusByTab[treatmentTab] as 'COMPLETED' | 'IN_PROGRESS' | 'PENDING'}
          dentalChart={dentalChart}
          onForceRefresh={async () => {
            // Force refresh all patient data from database
            await refetch()
            queryClient.invalidateQueries({ queryKey: ['dental', params.id] })
            queryClient.refetchQueries({ queryKey: ['dental', params.id] })
            console.log('🔄 Forced refresh of all patient data from database')
          }}
        />

        {/* <DentalChart
          procedures={dentalProcedures || []}
          toothTypes={dentalChart?.toothTypes || {}}
          readOnly={false}
          activeTool={activeTool}
          onToolChange={handleToolClick}
          patientId={params.id}
          onProcedureDeleted={async () => {
            await refetchProcedures();
            queryClient.invalidateQueries({ queryKey: ['dental', params.id] });
          }}
          onProcedureCreated={handleProcedureCreated}
          currentStatus={statusByTab[treatmentTab] as 'COMPLETED' | 'IN_PROGRESS' | 'PENDING'}
          activeProcedures={dentalProcedures?.filter(p => p.status === statusByTab[treatmentTab]) || []}
        /> */}

        {/* Bottom left: Important notes */}
        <div className="flex flex-col border-2 border-blue-400 bg-white p-2 rounded-xl h-[38vh]">
          <div className="flex justify-between items-center mb-2">
            <div className="font-bold text-blue-700">Important notes</div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotesSettingsModal(true)}
                className="h-6 w-6 p-0"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedFolder(null)
                  setShowAddNoteModal(true)
                }}
                className="h-6"
              >
                Add Note
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2 overflow-y-auto max-h-[300px] custom-scrollbar">
            {/* Group notes by folder */}
            {noteFolders?.map((folder) => (
              <div key={folder.id} className="space-y-2">
                <div className="font-medium text-sm text-blue-700">{folder.name}:</div>
                {folder.notes
                  .sort((a, b) => {
                    if (a.isPinned && !b.isPinned) return -1
                    if (!a.isPinned && b.isPinned) return 1
                    if (a.isPinned && b.isPinned) {
                      if (a.pinOrder && b.pinOrder) return a.pinOrder - b.pinOrder
                      if (a.pinOrder) return -1
                      if (b.pinOrder) return 1
                    }
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                  })
                  .map((note) => (
                    <div
                      key={note.id}
                      className={`p-2 rounded text-sm ${note.isPinned
                        ? 'bg-blue-50 border border-blue-200'
                        : 'bg-gray-50 border border-gray-200'
                        }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {note.isPinned && (
                              <Pin className="h-3 w-3 text-blue-500" />
                            )}
                            <span className="font-medium">[{(() => {
                              const firstName = note.user?.firstName || note.createdBy.split(' ')[0];
                              const lastName = note.user?.lastName || note.createdBy.split(' ')[1] || '';
                              return (firstName[0] + lastName[0]).toUpperCase();
                            })()}]</span>
                          </div>
                          <div className="whitespace-pre-wrap mt-1">{note.content}</div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(note.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ))}

            {/* Notes without folders */}
            {notes
              ?.filter((note) => !note.folderId)
              .sort((a, b) => {
                if (a.isPinned && !b.isPinned) return -1
                if (!a.isPinned && b.isPinned) return 1
                if (a.isPinned && b.isPinned) {
                  if (a.pinOrder && b.pinOrder) return a.pinOrder - b.pinOrder
                  if (a.pinOrder) return -1
                  if (b.pinOrder) return 1
                }
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              })
              .map((note) => (
                <div
                  key={note.id}
                  className={`p-2 rounded text-sm ${note.isPinned
                    ? 'bg-blue-50 border border-blue-200'
                    : 'bg-gray-50 border border-gray-200'
                    }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {note.isPinned && (
                          <Pin className="h-3 w-3 text-blue-500" />
                        )}
                        <span className="font-medium">[{(() => {
                          const firstName = note.user?.firstName || note.createdBy.split(' ')[0];
                          const lastName = note.user?.lastName || note.createdBy.split(' ')[1] || '';
                          return (firstName[0] + lastName[0]).toUpperCase();
                        })()}]</span>
                      </div>
                      <div className="whitespace-pre-wrap mt-1">{note.content}</div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
        {/* Bottom center: Treatment [history & current] + tab for plan scrollfield */}
        <div className="border-2 border-blue-400 bg-white flex flex-col rounded-xl h-[38vh]">
          {/* Sticky Header: Search + Quick Codes */}
          <div className="sticky top-0 bg-white z-30 border-b rounded-xl">
            <div className="flex items-center gap-4 p-2 h-10">
              {organization?.id ? (
                <DentalCodeSearch
                  onSelect={async (code) => {
                    try {
                      const response = await fetch(`/api/patients/${params.id}/dental-procedures`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          codeId: code.id,
                          date: new Date().toISOString().split('T')[0],
                          notes: '',
                          status: statusByTab[treatmentTab]
                        })
                      });

                      if (!response.ok) throw new Error('Failed to add procedure');

                      const result = await response.json();
                      if (result && result.procedure && result.procedure.id) {
                        setUndoStack(prev => [...prev, [result.procedure]]);
                      }
                      setPendingProcedureId(result.procedure?.id);

                      toast.success(`Added ${code.code} - ${code.description} to treatment plan`);
                      refetchProcedures();
                    } catch (error) {
                      toast.error('Failed to add procedure to treatment plan');
                    }
                  }}
                  className="w-[300px]"
                  patientId={params.id}
                  currentStatus={statusByTab[treatmentTab]}
                  onProcedureCreated={async (procedure?: any) => {
                    // If a procedure was passed, add it to the undo stack
                    if (procedure) {
                      setUndoStack(prev => [...prev, [procedure]]);
                    }

                    refetchProcedures()
                    refetch() // Refresh patient data
                    // Force refresh dental chart data
                    queryClient.invalidateQueries({ queryKey: ['dental', params.id] })
                  }}
                  organizationId={organization.id}
                />
              ) : (
                <div className="w-[300px] h-10 flex items-center justify-center"><span className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></span></div>
              )}
              {/* Quick-add buttons */}
              {['c002', 'x10', 'm03', 't042', 't043', 'm40'].map((quickCode) => (
                <Button
                  key={quickCode}
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={async () => {
                    if (quickCode === 'm40') {
                      handleFluorideQuickButton();
                      return;
                    }
                    try {
                      // Find the dental code by searching the API
                      const res = await fetch(`/api/dental-codes?search=${quickCode}`);
                      if (!res.ok) throw new Error('Code search failed');
                      const codes = await res.json();
                      const codeMatch = codes.find((c: any) => c.code.toLowerCase() === quickCode.toLowerCase());
                      if (!codeMatch) {
                        toast.error(`Code ${quickCode.toUpperCase()} not found`);
                        return;
                      }
                      setQuickAddCode(codeMatch);
                      setShowQuickAddModal(true);
                    } catch (err) {
                      toast.error(`Failed to find ${quickCode.toUpperCase()}`);
                    }
                  }}
                >
                  {quickCode.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-hidden">
            <TreatmentPlan
              patientId={params.id}
              procedures={dentalProcedures || []}
              onProcedureAdded={refetchProcedures}
              onProcedureUpdated={refetchProcedures}
              onProcedureDeleted={async () => {
                await refetchProcedures(); // Refresh procedures
                queryClient.invalidateQueries({ queryKey: ['dental', params.id] }); // Refresh dental chart
              }}
              activeTab={treatmentTab}
              onTabChange={setTreatmentTab}
              pendingProcedureId={pendingProcedureId}
              onPendingHandled={() => setPendingProcedureId(null)}
              patientAge={patient?.dateOfBirth ?
                Math.floor((new Date().getTime() - new Date(patient.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
                : 18
              }
              patient={patient ? {
                id: patient.id,
                patientCode: patient.patientCode,
                firstName: patient.firstName,
                lastName: patient.lastName,
                dateOfBirth: patient.dateOfBirth,
                email: patient.email || '',
                phone: patient.phone || '',
                address: patient.address
              } : undefined}
              organization={organization ? {
                name: organization.name,
                address: organization.address,
                phone: organization.phone,
                email: organization.email,
                website: organization.website
              } : undefined}
              onEmailBudget={handleEmailBudget}
              onOpenAsaModal={() => setShowAsaModal(true)}
              onOpenPpsModal={() => setShowPpsModal(true)}
              onOpenScreeningRecallModal={() => setShowScreeningRecallModal(true)}
              onRefresh={refetch}
            />
          </div>
        </div>

        {/* Scroll hint */}
        <div className="col-span-2 flex justify-center items-center py-2">
          <span className="text-lg font-medium italic bg-gradient-to-r from-blue-400 via-blue-300 to-blue-400 bg-clip-text text-transparent drop-shadow-lg px-2">
            ↓ Press SPACE to scroll down to images ↓
          </span>
        </div>

        {/* Third row: Enhanced Images Section */}
        <div ref={imagesRef} className="col-span-2">
          <EnhancedPatientImagesSection
            patientId={params.id}
            patientFiles={patient?.files || []}
            patientImages={patientImages}
            onRefresh={() => {
              refetch();
            }}
          />
        </div>

        {/* Location Modal */}
        {patient && organization && (
          <LocationModal
            isOpen={showLocationModal}
            onClose={() => setShowLocationModal(false)}
            address={patient.address}
            clinicLocation={{
              lat: organization.latitude.toString(),
              lon: organization.longitude.toString(),
              name: organization.name
            }}
          />
        )}
        {/* Edit Patient Modal */}
        <Dialog open={showEditModal} onOpenChange={(open) => {
          setShowEditModal(open)
          if (!open) {
            setSelectedAddress(null)
          }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Patient Information</DialogTitle>
              <DialogDescription>
                Update the patient's personal information
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={async (e) => {
              e.preventDefault()
              try {
                const updateData: any = {
                  firstName: editFormData.firstName,
                  lastName: editFormData.lastName,
                  dateOfBirth: editFormData.dateOfBirth,
                  gender: editFormData.gender,
                  email: editFormData.email,
                  phone: editFormData.phone,
                  bsn: editFormData.bsn,
                  country: editFormData.country,
                  allowEarlySpotContact: editFormData.allowEarlySpotContact
                }

                // Check if address was actually changed
                const originalAddress = patient.address.display_name || ''
                const hasAddressChanged = selectedAddress !== null || editFormData.address !== originalAddress

                if (hasAddressChanged && selectedAddress) {
                  // Address was changed via autocomplete
                  updateData.address = {
                    display_name: selectedAddress.display_name,
                    lat: selectedAddress.lat,
                    lon: selectedAddress.lon
                  }
                  console.log('Address changed via autocomplete:', updateData.address)
                } else if (hasAddressChanged && !selectedAddress && editFormData.address !== originalAddress) {
                  // Address was manually typed (rare case)
                  updateData.address = {
                    display_name: editFormData.address,
                    lat: patient.address.lat || '',
                    lon: patient.address.lon || ''
                  }
                  console.log('Address manually changed:', updateData.address)
                } else {
                  console.log('Address NOT changed - excluding from update')
                }

                console.log('Final updateData being sent to API:', updateData)
                await updatePatient.mutateAsync(updateData)
                setShowEditModal(false)
                setSelectedAddress(null)
                await refetch()
                toast.success('Patient information updated successfully')
              } catch (error) {
                console.error('Update error:', error)
                toast.error('Failed to update patient information')
              }
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={editFormData.firstName}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={editFormData.lastName}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={editFormData.dateOfBirth}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={editFormData.gender} onValueChange={(value) => setEditFormData(prev => ({ ...prev, gender: value as 'MALE' | 'FEMALE' | 'OTHER' }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <AddressAutocomplete
                  onSelect={(result) => {
                    setEditFormData(prev => ({ ...prev, address: result.display_name }))
                    setSelectedAddress(result)
                  }}
                  placeholder="Enter address..."
                  className="w-full"
                  value={editFormData.address}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bsn">BSN</Label>
                  <Input
                    id="bsn"
                    value={editFormData.bsn}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, bsn: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={editFormData.country}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, country: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setShowEditModal(false)
                  setSelectedAddress(null)
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updatePatient.isPending}>
                  {updatePatient.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        {/* Delete confirm modal (unchanged) */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <Card className="p-6 max-w-sm w-full">
              <h3 className="text-lg font-medium mb-4">Delete Patient</h3>
              <p className="text-gray-500 mb-4">
                Are you sure you want to delete {patient.firstName} {patient.lastName}? This action
                cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deletePatient.mutate()}
                  disabled={deletePatient.isPending}
                >
                  {deletePatient.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </Card>
          </div>
        )}
        {/* ASA Modal */}
        <Dialog open={showAsaModal} onOpenChange={(open) => {
          setShowAsaModal(open)
          if (!open) {
            setAsaModalStep('history')
            setSelectedAsaScore(1)
            setShowAsaScoreDropdown(false)
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>ASA Physical Status Assessment</DialogTitle>
              <DialogDescription>
                {asaModalStep === 'history' && 'View ASA score history and add new assessment'}
                {asaModalStep === 'assessment' && 'Review and update health assessment'}
                {asaModalStep === 'score' && 'Select ASA score and add notes'}
              </DialogDescription>
            </DialogHeader>

            {asaModalStep === 'history' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">ASA Score History</h3>
                  <Button onClick={() => setAsaModalStep('assessment')} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    New Assessment
                  </Button>
                </div>

                <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                  {patient?.asaHistory && patient.asaHistory.length > 0 ? (
                    patient.asaHistory
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((record) => (
                        <Card key={record.id} className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className={`px-3 py-1 rounded-full border ${getAsaScoreColor(record.score)}`}>
                                ASA {record.score}
                              </div>
                              <div>
                                <p className="font-medium">{new Date(record.date).toLocaleDateString()}</p>
                                <p className="text-sm text-gray-500">By {[(() => {
                                  const user = userMap[record.createdBy];
                                  if (user) return (user.firstName[0] + user.lastName[0]).toUpperCase();
                                  const parts = record.createdBy?.split(' ') || [];
                                  return (parts[0]?.[0] || '').toUpperCase();
                                })()]}</p>
                              </div>
                            </div>
                          </div>
                          {record.notes && (
                            <div className="mt-2 p-2 bg-gray-50 rounded">
                              <p className="text-sm text-gray-700">{record.notes}</p>
                            </div>
                          )}
                        </Card>
                      ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <History className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No ASA assessments recorded yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {asaModalStep === 'assessment' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Medical Questionnaire</h3>
                  <Button variant="outline" onClick={() => setAsaModalStep('history')}>
                    Back to History
                  </Button>
                </div>

                {/* Cardiovascular Section */}
                <div className="space-y-4">
                  <h4 className="font-medium text-blue-700">Cardiovascular Health</h4>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="chestPain"
                        checked={asaFormData.chestPain}
                        onChange={(e) => updateAsaFormData({ chestPain: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="chestPain">Do you have chest pain/tightness during exertion?</Label>
                    </div>
                    {asaFormData.chestPain && (
                      <div className="ml-6 space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="chestPainReducedActivity"
                            checked={asaFormData.chestPainReducedActivity}
                            onChange={(e) => updateAsaFormData({ chestPainReducedActivity: e.target.checked })}
                            className="rounded"
                          />
                          <Label htmlFor="chestPainReducedActivity">Have you had to reduce your activities?</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="chestPainWorsening"
                            checked={asaFormData.chestPainWorsening}
                            onChange={(e) => updateAsaFormData({ chestPainWorsening: e.target.checked })}
                            className="rounded"
                          />
                          <Label htmlFor="chestPainWorsening">Are your symptoms worsening recently?</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="chestPainAtRest"
                            checked={asaFormData.chestPainAtRest}
                            onChange={(e) => updateAsaFormData({ chestPainAtRest: e.target.checked })}
                            className="rounded"
                          />
                          <Label htmlFor="chestPainAtRest">Do you also have symptoms at rest?</Label>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="heartAttack"
                        checked={asaFormData.heartAttack}
                        onChange={(e) => updateAsaFormData({ heartAttack: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="heartAttack">Have you had a heart attack?</Label>
                    </div>
                    {asaFormData.heartAttack && (
                      <div className="ml-6 space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="heartAttackStillSymptoms"
                            checked={asaFormData.heartAttackStillSymptoms}
                            onChange={(e) => updateAsaFormData({ heartAttackStillSymptoms: e.target.checked })}
                            className="rounded"
                          />
                          <Label htmlFor="heartAttackStillSymptoms">Do you still experience symptoms?</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="heartAttackLast6Months"
                            checked={asaFormData.heartAttackLast6Months}
                            onChange={(e) => updateAsaFormData({ heartAttackLast6Months: e.target.checked })}
                            className="rounded"
                          />
                          <Label htmlFor="heartAttackLast6Months">Have you had a heart attack in the last 6 months?</Label>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="heartMurmur"
                        checked={asaFormData.heartMurmur}
                        onChange={(e) => updateAsaFormData({ heartMurmur: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="heartMurmur">Do you have a heart murmur, heart valve defect, or artificial heart valve?</Label>
                    </div>
                    {asaFormData.heartMurmur && (
                      <div className="ml-6">
                        <Label htmlFor="heartMurmurDetails">If yes, which one:</Label>
                        <Input
                          id="heartMurmurDetails"
                          value={asaFormData.heartMurmurDetails}
                          onChange={(e) => updateAsaFormData({ heartMurmurDetails: e.target.value })}
                          placeholder="Details"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="vascularSurgery6Months"
                        checked={asaFormData.vascularSurgery6Months}
                        onChange={(e) => updateAsaFormData({ vascularSurgery6Months: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="vascularSurgery6Months">Have you undergone vascular surgery less than 6 months ago?</Label>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="pacemakerICD"
                        checked={asaFormData.pacemakerICD}
                        onChange={(e) => updateAsaFormData({ pacemakerICD: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="pacemakerICD">Do you have a pacemaker/ICD/stent?</Label>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="heartPalpitations"
                        checked={asaFormData.heartPalpitations}
                        onChange={(e) => updateAsaFormData({ heartPalpitations: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="heartPalpitations">Do you have episodes of heart palpitations without exertion?</Label>
                    </div>
                    {asaFormData.heartPalpitations && (
                      <div className="ml-6 space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="heartPalpitationsNeedRest"
                            checked={asaFormData.heartPalpitationsNeedRest}
                            onChange={(e) => updateAsaFormData({ heartPalpitationsNeedRest: e.target.checked })}
                            className="rounded"
                          />
                          <Label htmlFor="heartPalpitationsNeedRest">Do you need to rest, sit, or lie down during episodes?</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="heartPalpitationsPaleDizzy"
                            checked={asaFormData.heartPalpitationsPaleDizzy}
                            onChange={(e) => updateAsaFormData({ heartPalpitationsPaleDizzy: e.target.checked })}
                            className="rounded"
                          />
                          <Label htmlFor="heartPalpitationsPaleDizzy">Do you become pale, dizzy, or short of breath during episodes?</Label>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="heartFailure"
                        checked={asaFormData.heartFailure}
                        onChange={(e) => updateAsaFormData({ heartFailure: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="heartFailure">Do you suffer from heart failure?</Label>
                    </div>
                    {asaFormData.heartFailure && (
                      <div className="ml-6 space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="heartFailureExtraPillows"
                            checked={asaFormData.heartFailureExtraPillows}
                            onChange={(e) => updateAsaFormData({ heartFailureExtraPillows: e.target.checked })}
                            className="rounded"
                          />
                          <Label htmlFor="heartFailureExtraPillows">Do you need more than 2 pillows due to shortness of breath?</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="heartFailureNightBreathing"
                            checked={asaFormData.heartFailureNightBreathing}
                            onChange={(e) => updateAsaFormData({ heartFailureNightBreathing: e.target.checked })}
                            className="rounded"
                          />
                          <Label htmlFor="heartFailureNightBreathing">Do you wake up short of breath at night?</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="heartFailureNightUrination"
                            checked={asaFormData.heartFailureNightUrination}
                            onChange={(e) => updateAsaFormData({ heartFailureNightUrination: e.target.checked })}
                            className="rounded"
                          />
                          <Label htmlFor="heartFailureNightUrination">Do you need to urinate more than 2 times at night?</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="heartFailureSwollenFeet"
                            checked={asaFormData.heartFailureSwollenFeet}
                            onChange={(e) => updateAsaFormData({ heartFailureSwollenFeet: e.target.checked })}
                            className="rounded"
                          />
                          <Label htmlFor="heartFailureSwollenFeet">Do you have swollen feet in the evening?</Label>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="acuteRheumatism"
                        checked={asaFormData.acuteRheumatism}
                        onChange={(e) => updateAsaFormData({ acuteRheumatism: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="acuteRheumatism">Have you had acute rheumatism?</Label>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="bloodPressure"
                        checked={asaFormData.bloodPressure}
                        onChange={(e) => updateAsaFormData({ bloodPressure: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="bloodPressure">Do you have low/high blood pressure?</Label>
                    </div>
                    {asaFormData.bloodPressure && (
                      <div className="ml-6">
                        <Label htmlFor="bloodPressureValue">Your blood pressure is:</Label>
                        <Input
                          id="bloodPressureValue"
                          value={asaFormData.bloodPressureValue}
                          onChange={(e) => updateAsaFormData({ bloodPressureValue: e.target.value })}
                          placeholder="e.g., 120/80"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Bleeding Section */}
                <div className="space-y-4">
                  <h4 className="font-medium text-blue-700">Bleeding Tendency</h4>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="bleedingTendency"
                        checked={asaFormData.bleedingTendency}
                        onChange={(e) => updateAsaFormData({ bleedingTendency: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="bleedingTendency">Do you have a tendency to bleed?</Label>
                    </div>
                    {asaFormData.bleedingTendency && (
                      <div className="ml-6 space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="bleedingLongerThan1Hour"
                            checked={asaFormData.bleedingLongerThan1Hour}
                            onChange={(e) => updateAsaFormData({ bleedingLongerThan1Hour: e.target.checked })}
                            className="rounded"
                          />
                          <Label htmlFor="bleedingLongerThan1Hour">Do you bleed longer than 1 hour after injury or procedures?</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="bleedingBruises"
                            checked={asaFormData.bleedingBruises}
                            onChange={(e) => updateAsaFormData({ bleedingBruises: e.target.checked })}
                            className="rounded"
                          />
                          <Label htmlFor="bleedingBruises">Do you get bruises without any cause?</Label>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="bloodThinners"
                              checked={asaFormData.bloodThinners}
                              onChange={(e) => updateAsaFormData({ bloodThinners: e.target.checked })}
                              className="rounded"
                            />
                            <Label htmlFor="bloodThinners">Do you take blood thinners?</Label>
                          </div>
                          {asaFormData.bloodThinners && (
                            <div className="ml-6">
                              <Label htmlFor="bloodThinnersDetails">If yes, which ones:</Label>
                              <Input
                                id="bloodThinnersDetails"
                                value={asaFormData.bloodThinnersDetails}
                                onChange={(e) => updateAsaFormData({ bloodThinnersDetails: e.target.value })}
                                placeholder="e.g., Warfarin, Aspirin, etc."
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Respiratory Health */}
                <div className="space-y-4">
                  <h4 className="font-medium text-blue-700">Respiratory Health</h4>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="lungProblems"
                        checked={asaFormData.lungProblems}
                        onChange={(e) => updateAsaFormData({ lungProblems: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="lungProblems">Do you have problems with your lungs/persistent cough?</Label>
                    </div>
                    {asaFormData.lungProblems && (
                      <div className="ml-6 space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="lungProblemsStairs"
                            checked={asaFormData.lungProblemsStairs}
                            onChange={(e) => updateAsaFormData({ lungProblemsStairs: e.target.checked })}
                            className="rounded"
                          />
                          <Label htmlFor="lungProblemsStairs">Are you short of breath after about 20 steps when climbing stairs?</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="lungProblemsDressing"
                            checked={asaFormData.lungProblemsDressing}
                            onChange={(e) => updateAsaFormData({ lungProblemsDressing: e.target.checked })}
                            className="rounded"
                          />
                          <Label htmlFor="lungProblemsDressing">Are you short of breath when getting dressed?</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="lungProblemsHyperventilation"
                            checked={asaFormData.lungProblemsHyperventilation}
                            onChange={(e) => updateAsaFormData({ lungProblemsHyperventilation: e.target.checked })}
                            className="rounded"
                          />
                          <Label htmlFor="lungProblemsHyperventilation">Do you have hyperventilation/fainting episodes?</Label>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="prosthesisLast3Months"
                        checked={asaFormData.prosthesisLast3Months}
                        onChange={(e) => updateAsaFormData({ prosthesisLast3Months: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="prosthesisLast3Months">Did you receive a prosthesis during the last 3 months?</Label>
                    </div>
                  </div>
                </div>

                {/* Specific Conditions */}
                <div className="space-y-4">
                  <h4 className="font-medium text-blue-700">Specific Conditions</h4>
                  <p className="text-sm text-gray-600">Do you suffer from any of the following conditions:</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="epilepsy"
                        checked={asaFormData.epilepsy}
                        onChange={(e) => updateAsaFormData({ epilepsy: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="epilepsy">Epilepsy</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="cancerLeukemia"
                        checked={asaFormData.cancerLeukemia}
                        onChange={(e) => updateAsaFormData({ cancerLeukemia: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="cancerLeukemia">Cancer/Leukemia</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="diabetes"
                        checked={asaFormData.diabetes}
                        onChange={(e) => updateAsaFormData({ diabetes: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="diabetes">Diabetes</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="hivAids"
                        checked={asaFormData.hivAids}
                        onChange={(e) => updateAsaFormData({ hivAids: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="hivAids">HIV/AIDS</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="thyroidProblems"
                        checked={asaFormData.thyroidProblems}
                        onChange={(e) => updateAsaFormData({ thyroidProblems: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="thyroidProblems">Thyroid Problems</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="asthma"
                        checked={asaFormData.asthma}
                        onChange={(e) => updateAsaFormData({ asthma: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="asthma">Asthma</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="kidneyDisease"
                        checked={asaFormData.kidneyDisease}
                        onChange={(e) => updateAsaFormData({ kidneyDisease: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="kidneyDisease">Kidney Disease</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="liverDisease"
                        checked={asaFormData.liverDisease}
                        onChange={(e) => updateAsaFormData({ liverDisease: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="liverDisease">Liver Disease</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="hepatitisA"
                        checked={asaFormData.hepatitisA}
                        onChange={(e) => updateAsaFormData({ hepatitisA: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="hepatitisA">Hepatitis A</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="hepatitisB"
                        checked={asaFormData.hepatitisB}
                        onChange={(e) => updateAsaFormData({ hepatitisB: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="hepatitisB">Hepatitis B</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="hepatitisC"
                        checked={asaFormData.hepatitisC}
                        onChange={(e) => updateAsaFormData({ hepatitisC: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="hepatitisC">Hepatitis C</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="hepatitisD"
                        checked={asaFormData.hepatitisD}
                        onChange={(e) => updateAsaFormData({ hepatitisD: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="hepatitisD">Hepatitis D</Label>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="otherConditions">Other conditions:</Label>
                    <Textarea
                      id="otherConditions"
                      value={asaFormData.otherConditions}
                      onChange={(e) => updateAsaFormData({ otherConditions: e.target.value })}
                      placeholder="Please specify any other medical conditions"
                      rows={2}
                    />
                  </div>
                </div>

                {/* Lifestyle Questions */}
                <div className="space-y-4">
                  <h4 className="font-medium text-blue-700">Lifestyle Questions</h4>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="smoking"
                        checked={asaFormData.smoking}
                        onChange={(e) => updateAsaFormData({ smoking: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="smoking">Do you smoke?</Label>
                    </div>
                    {asaFormData.smoking && (
                      <div className="ml-6">
                        <Label htmlFor="smokingAmount">Amount:</Label>
                        <Input
                          id="smokingAmount"
                          value={asaFormData.smokingAmount}
                          onChange={(e) => updateAsaFormData({ smokingAmount: e.target.value })}
                          placeholder="e.g., 1 pack/day"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="drinking"
                        checked={asaFormData.drinking}
                        onChange={(e) => updateAsaFormData({ drinking: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="drinking">Do you drink alcohol?</Label>
                    </div>
                    {asaFormData.drinking && (
                      <div className="ml-6">
                        <Label htmlFor="drinkingAmount">Amount:</Label>
                        <Input
                          id="drinkingAmount"
                          value={asaFormData.drinkingAmount}
                          onChange={(e) => updateAsaFormData({ drinkingAmount: e.target.value })}
                          placeholder="e.g., 1 drink/day"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Pregnancy Questions */}
                {patient?.gender === 'FEMALE' && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-blue-700">Pregnancy Questions</h4>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="pregnancy"
                          checked={asaFormData.pregnancy}
                          onChange={(e) => updateAsaFormData({ pregnancy: e.target.checked })}
                          className="rounded"
                        />
                        <Label htmlFor="pregnancy">Are you pregnant?</Label>
                      </div>
                      {asaFormData.pregnancy && (
                        <div className="ml-6 space-y-2">
                          <div>
                            <Label htmlFor="pregnancyWeeks">Weeks:</Label>
                            <Input
                              id="pregnancyWeeks"
                              value={asaFormData.pregnancyWeeks}
                              onChange={(e) => updateAsaFormData({ pregnancyWeeks: e.target.value })}
                              placeholder="e.g., 12"
                            />
                          </div>
                          <div>
                            <Label htmlFor="pregnancyComplications">Any complications:</Label>
                            <Textarea
                              id="pregnancyComplications"
                              value={asaFormData.pregnancyComplications}
                              onChange={(e) => updateAsaFormData({ pregnancyComplications: e.target.value })}
                              placeholder="Please specify any complications"
                              rows={2}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Medications and Allergies */}
                <div className="space-y-4">
                  <h4 className="font-medium text-blue-700">Current Medications & Allergies</h4>

                  <div>
                    <Label htmlFor="currentMedications">Current Medications</Label>
                    <Textarea
                      id="currentMedications"
                      value={asaFormData.currentMedications}
                      onChange={(e) => updateAsaFormData({ currentMedications: e.target.value })}
                      placeholder="List all current medications with dosages"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="allergies">Allergies</Label>
                    <Textarea
                      id="allergies"
                      value={asaFormData.allergies}
                      onChange={(e) => updateAsaFormData({ allergies: e.target.value })}
                      placeholder="Drug allergies, food allergies, latex, etc."
                      rows={2}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setAsaModalStep('history')}>
                    Cancel
                  </Button>
                  <Button onClick={() => setAsaModalStep('score')}>
                    Next: Select ASA Score
                  </Button>
                </DialogFooter>
              </div>
            )}

            {asaModalStep === 'score' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Select ASA Score</h3>
                  <Button variant="outline" onClick={() => setAsaModalStep('assessment')}>
                    Back to Assessment
                  </Button>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor="asaNotes">Practitioner Notes</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const medicalSummary = generateMedicalSummary(asaFormData)
                        setAsaFormData(prev => ({ ...prev, notes: medicalSummary }))
                        setIsNotesManuallyEdited(false)
                      }}
                    >
                      Regenerate Summary
                    </Button>
                  </div>
                  <Textarea
                    id="asaNotes"
                    value={asaFormData.notes}
                    onChange={(e) => {
                      setIsNotesManuallyEdited(true)
                      setAsaFormData(prev => ({ ...prev, notes: e.target.value }))
                    }}
                    placeholder="Important medications, observations, or notes for future reference"
                    rows={4}
                  />
                </div>

                <div>
                  <Label>ASA Score</Label>
                  <Popover open={showAsaScoreDropdown} onOpenChange={setShowAsaScoreDropdown}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start ${getAsaScoreColor(selectedAsaScore)}`}
                      >
                        ASA {selectedAsaScore} - {ASA_DESCRIPTIONS[selectedAsaScore]}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <div className="space-y-1">
                        {Object.entries(ASA_DESCRIPTIONS).map(([score, description]) => (
                          <Button
                            key={score}
                            variant="ghost"
                            className={`w-full justify-start text-left ${getAsaScoreColor(parseInt(score))}`}
                            onClick={() => {
                              setSelectedAsaScore(parseInt(score))
                              setShowAsaScoreDropdown(false)
                            }}
                          >
                            ASA {score} - {description}
                          </Button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setAsaModalStep('assessment')}>
                    Back
                  </Button>
                  <Button
                    onClick={() => {
                      updateAsaScore.mutate({
                        score: selectedAsaScore,
                        notes: asaFormData.notes
                      })
                    }}
                    disabled={updateAsaScore.isPending}
                  >
                    {updateAsaScore.isPending ? 'Saving...' : 'Save ASA Score'}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
        {/* PPS Modal */}
        <Dialog open={showPpsModal} onOpenChange={(open) => {
          setShowPpsModal(open)
          if (!open) {
            setPpsModalStep('history')
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Periodontal Pocket Screening (PPS)</DialogTitle>
              <DialogDescription>
                {ppsModalStep === 'history' && 'View PPS score history and add new assessment'}
                {ppsModalStep === 'assessment' && 'Enter PPS scores for each quadrant and treatment plan'}
              </DialogDescription>
            </DialogHeader>

            {ppsModalStep === 'history' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">PPS Score History</h3>
                  <Button onClick={() => {
                    // Pre-fill with latest data if available
                    const latestPps = getLatestPpsData()
                    if (latestPps.scores) {
                      setPpsFormData({
                        quadrant1: latestPps.scores[0],
                        quadrant2: latestPps.scores[1],
                        quadrant3: latestPps.scores[2],
                        quadrant4: latestPps.scores[3],
                        treatment: patient?.ppsHistory?.[0]?.treatment || 'NONE',
                        notes: patient?.ppsHistory?.[0]?.notes || ''
                      })
                    }
                    setPpsModalStep('assessment')
                  }} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    New Assessment
                  </Button>
                </div>

                <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                  {patient?.ppsHistory && patient.ppsHistory.length > 0 ? (
                    patient.ppsHistory
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((record) => (
                        <Card key={record.id} className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className="flex gap-1">
                                {[record.quadrant1, record.quadrant2, record.quadrant3, record.quadrant4].map((score, index) => (
                                  <div key={index} className={`px-2 py-1 rounded border text-sm ${getPpsScoreColor(score)}`}>
                                    {score === 0 ? '-' : score}
                                  </div>
                                ))}
                              </div>
                              <div>
                                <p className="font-medium">{new Date(record.date).toLocaleDateString()}</p>
                                <p className="text-sm text-gray-500">By {[(() => {
                                  const user = userMap[record.createdBy];
                                  if (user) return (user.firstName[0] + user.lastName[0]).toUpperCase();
                                  const parts = record.createdBy?.split(' ') || [];
                                  return (parts[0]?.[0] || '').toUpperCase();
                                })()]}</p>
                                <p className="text-sm text-blue-600">
                                  Treatment: {record.treatment === 'NONE' ? 'No Treatment' :
                                    record.treatment === 'PREVENTIVE' ? 'Preventive' : 'Periodontal'}
                                </p>
                              </div>
                            </div>
                          </div>
                          {record.notes && (
                            <div className="mt-2 p-2 bg-gray-50 rounded">
                              <p className="text-sm text-gray-700">{record.notes}</p>
                            </div>
                          )}
                        </Card>
                      ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <History className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No PPS assessments recorded yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {ppsModalStep === 'assessment' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">PPS Assessment</h3>
                  <Button variant="outline" onClick={() => setPpsModalStep('history')}>
                    Back to History
                  </Button>
                </div>

                {/* Quadrant Scores */}
                <div className="space-y-4">
                  <h4 className="font-medium text-blue-700">Quadrant Scores</h4>
                  <p className="text-sm text-gray-600">Enter the PPS score for each quadrant (0 = no teeth, 1 = 1-3mm, 2 = 4-5mm, 3 = 6+mm)</p>

                  {/* Anatomical Quadrant Layout */}
                  <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
                    {/* Top Row */}
                    <div className="space-y-2">
                      <Select
                        value={ppsFormData.quadrant1.toString()}
                        onValueChange={(value) => setPpsFormData(prev => ({ ...prev, quadrant1: parseInt(value) }))}
                      >
                        <SelectTrigger
                          autoFocus
                          onKeyDown={(e) => {
                            if (['0', '1', '2', '3'].includes(e.key) && !e.ctrlKey && !e.altKey && !e.metaKey) {
                              e.preventDefault()
                              setPpsFormData(prev => ({ ...prev, quadrant1: parseInt(e.key) }))
                            }
                          }}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent onKeyDown={(e) => {
                          if (e.key === 'Tab') {
                            // Allow normal Tab navigation
                            return
                          }
                          if (['0', '1', '2', '3'].includes(e.key) && !e.ctrlKey && !e.altKey && !e.metaKey) {
                            e.preventDefault()
                            setPpsFormData(prev => ({ ...prev, quadrant1: parseInt(e.key) }))
                          }
                        }}>
                          <SelectItem value="0">0</SelectItem>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Select
                        value={ppsFormData.quadrant2.toString()}
                        onValueChange={(value) => setPpsFormData(prev => ({ ...prev, quadrant2: parseInt(value) }))}
                      >
                        <SelectTrigger
                          onKeyDown={(e) => {
                            if (['0', '1', '2', '3'].includes(e.key) && !e.ctrlKey && !e.altKey && !e.metaKey) {
                              e.preventDefault()
                              setPpsFormData(prev => ({ ...prev, quadrant2: parseInt(e.key) }))
                            }
                          }}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent onKeyDown={(e) => {
                          if (e.key === 'Tab') {
                            // Allow normal Tab navigation
                            return
                          }
                          if (['0', '1', '2', '3'].includes(e.key) && !e.ctrlKey && !e.altKey && !e.metaKey) {
                            e.preventDefault()
                            setPpsFormData(prev => ({ ...prev, quadrant2: parseInt(e.key) }))
                          }
                        }}>
                          <SelectItem value="0">0</SelectItem>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Bottom Row */}
                    <div className="space-y-2">
                      <Select
                        value={ppsFormData.quadrant4.toString()}
                        onValueChange={(value) => setPpsFormData(prev => ({ ...prev, quadrant4: parseInt(value) }))}
                      >
                        <SelectTrigger
                          onKeyDown={(e) => {
                            if (['0', '1', '2', '3'].includes(e.key) && !e.ctrlKey && !e.altKey && !e.metaKey) {
                              e.preventDefault()
                              setPpsFormData(prev => ({ ...prev, quadrant4: parseInt(e.key) }))
                            }
                          }}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent onKeyDown={(e) => {
                          if (e.key === 'Tab') {
                            // Allow normal Tab navigation
                            return
                          }
                          if (['0', '1', '2', '3'].includes(e.key) && !e.ctrlKey && !e.altKey && !e.metaKey) {
                            e.preventDefault()
                            setPpsFormData(prev => ({ ...prev, quadrant4: parseInt(e.key) }))
                          }
                        }}>
                          <SelectItem value="0">0</SelectItem>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Select
                        value={ppsFormData.quadrant3.toString()}
                        onValueChange={(value) => setPpsFormData(prev => ({ ...prev, quadrant3: parseInt(value) }))}
                      >
                        <SelectTrigger
                          onKeyDown={(e) => {
                            if (['0', '1', '2', '3'].includes(e.key) && !e.ctrlKey && !e.altKey && !e.metaKey) {
                              e.preventDefault()
                              setPpsFormData(prev => ({ ...prev, quadrant3: parseInt(e.key) }))
                            }
                          }}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent onKeyDown={(e) => {
                          if (e.key === 'Tab') {
                            // Allow normal Tab navigation
                            return
                          }
                          if (['0', '1', '2', '3'].includes(e.key) && !e.ctrlKey && !e.altKey && !e.metaKey) {
                            e.preventDefault()
                            setPpsFormData(prev => ({ ...prev, quadrant3: parseInt(e.key) }))
                          }
                        }}>
                          <SelectItem value="0">0</SelectItem>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Treatment Plan */}
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label>Recommended Treatment</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="treatment-none"
                          name="treatment"
                          value="NONE"
                          checked={ppsFormData.treatment === 'NONE'}
                          onChange={(e) => setPpsFormData(prev => ({ ...prev, treatment: e.target.value as 'NONE' | 'PREVENTIVE' | 'PERIODONTAL' }))}
                          className="rounded"
                        />
                        <Label htmlFor="treatment-none">No further treatment necessary</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="treatment-preventive"
                          name="treatment"
                          value="PREVENTIVE"
                          checked={ppsFormData.treatment === 'PREVENTIVE'}
                          onChange={(e) => setPpsFormData(prev => ({ ...prev, treatment: e.target.value as 'NONE' | 'PREVENTIVE' | 'PERIODONTAL' }))}
                          className="rounded"
                        />
                        <Label htmlFor="treatment-preventive">Preventive treatment</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="treatment-periodontal"
                          name="treatment"
                          value="PERIODONTAL"
                          checked={ppsFormData.treatment === 'PERIODONTAL'}
                          onChange={(e) => setPpsFormData(prev => ({ ...prev, treatment: e.target.value as 'NONE' | 'PREVENTIVE' | 'PERIODONTAL' }))}
                          className="rounded"
                        />
                        <Label htmlFor="treatment-periodontal">Periodontal treatment</Label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-4">
                  <h4 className="font-medium text-blue-700">Notes</h4>
                  <div>
                    <Label htmlFor="ppsNotes">Practitioner Notes</Label>
                    <Textarea
                      id="ppsNotes"
                      value={ppsFormData.notes}
                      onChange={(e) => setPpsFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional observations, treatment recommendations, or notes for future reference"
                      rows={4}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setPpsModalStep('history')}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      updatePpsScore.mutate({
                        quadrant1: ppsFormData.quadrant1,
                        quadrant2: ppsFormData.quadrant2,
                        quadrant3: ppsFormData.quadrant3,
                        quadrant4: ppsFormData.quadrant4,
                        treatment: ppsFormData.treatment,
                        notes: ppsFormData.notes
                      })
                    }}
                    disabled={updatePpsScore.isPending}
                  >
                    {updatePpsScore.isPending ? 'Saving...' : 'Save PPS Assessment'}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
        {/* Screening Recall Modal */}
        <Dialog open={showScreeningRecallModal} onOpenChange={(open) => {
          setShowScreeningRecallModal(open)
          if (!open) {
            setScreeningRecallModalStep('history')
            setShowScreeningRecallNotes(false)
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Screening Recall Terms</DialogTitle>
              <DialogDescription>
                {screeningRecallModalStep === 'history' && 'View screening recall terms history and add new assessment'}
                {screeningRecallModalStep === 'assessment' && 'Set screening recall terms for periodic screening'}
              </DialogDescription>
            </DialogHeader>

            {screeningRecallModalStep === 'history' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Screening Recall Terms History</h3>
                  <Button onClick={() => {
                    // Pre-fill with latest data if available
                    const latestScreeningRecall = getLatestScreeningRecallData()
                    if (latestScreeningRecall.screeningMonths) {
                      let useCustomText = false
                      let customText = ''
                      let notes = ''

                      // Check if the latest record has custom text
                      if (latestScreeningRecall.customText) {
                        useCustomText = true
                        customText = latestScreeningRecall.customText
                        // Try to get original notes from JSON
                        try {
                          const notesData = JSON.parse(patient?.screeningRecallHistory?.[0]?.notes || '{}')
                          notes = notesData.originalNotes || ''
                        } catch (e) {
                          notes = ''
                        }
                      } else {
                        notes = patient?.screeningRecallHistory?.[0]?.notes || ''
                      }

                      setScreeningRecallFormData({
                        screeningMonths: latestScreeningRecall.screeningMonths,
                        useCustomText,
                        customText,
                        notes
                      })
                    } else {
                      // Set default values for new assessment
                      setScreeningRecallFormData({
                        screeningMonths: 6,
                        useCustomText: false,
                        customText: '',
                        notes: ''
                      })
                    }
                    setScreeningRecallModalStep('assessment')
                  }} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    New Assessment
                  </Button>
                </div>

                <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                  {patient?.screeningRecallHistory && patient.screeningRecallHistory.length > 0 ? (
                    patient.screeningRecallHistory
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((record) => {
                        // Check if this record has custom text
                        let customText = null
                        let originalNotes = record.notes
                        if (record.notes) {
                          try {
                            const notesData = JSON.parse(record.notes)
                            if (notesData.useCustomText && notesData.customText) {
                              customText = notesData.customText
                              originalNotes = notesData.originalNotes || ''
                            }
                          } catch (e) {
                            // If parsing fails, it's regular notes
                          }
                        }

                        return (
                          <Card key={record.id} className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-3">
                                {customText ? (
                                  <div className="px-3 py-1 rounded-full border bg-purple-100 border-purple-400 text-purple-800">
                                    Custom: {customText}
                                  </div>
                                ) : (
                                  <div className="flex gap-2">
                                    <div className="px-3 py-1 rounded-full border bg-blue-100 border-blue-400 text-blue-800">
                                      C002 Recall: {record.screeningMonths} mnd
                                    </div>
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium">{new Date(record.date).toLocaleDateString()}</p>
                                  <p className="text-sm text-gray-500">By {[(() => {
                                    const user = userMap[record.createdBy];
                                    if (user) return (user.firstName[0] + user.lastName[0]).toUpperCase();
                                    const parts = record.createdBy?.split(' ') || [];
                                    return (parts[0]?.[0] || '').toUpperCase();
                                  })()]}</p>
                                </div>
                              </div>
                            </div>
                            {originalNotes && (
                              <div className="mt-2 p-2 bg-gray-50 rounded">
                                <p className="text-sm text-gray-700">{originalNotes}</p>
                              </div>
                            )}
                          </Card>
                        )
                      })
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <History className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No screening recall terms recorded yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {screeningRecallModalStep === 'assessment' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Screening Recall Assessment</h3>
                  <Button variant="outline" onClick={() => setScreeningRecallModalStep('history')}>
                    Back to History
                  </Button>
                </div>

                {/* Screening Recall Terms */}
                <div className="space-y-4">
                  <h4 className="font-medium text-blue-700">Screening Recall Terms</h4>
                  <p className="text-sm text-gray-600">Set the screening recall intervals for periodic screening (c002)</p>

                  <div className="space-y-2">
                    <Label htmlFor="screeningMonths">Periodic Screening (c002) - Months</Label>
                    <Input
                      id="screeningMonths"
                      type="number"
                      min={1}
                      max={24}
                      value={screeningRecallFormData.screeningMonths === 0 ? '' : String(screeningRecallFormData.screeningMonths)}
                      onChange={(e) => setScreeningRecallFormData(prev => ({
                        ...prev,
                        screeningMonths: e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                      }))}
                      placeholder="6"
                      autoFocus
                      tabIndex={1}
                    />
                  </div>
                </div>

                {/* Custom Text Option */}
                <div className="space-y-4">
                  <h4 className="font-medium text-blue-700">Custom Screening Recall Instructions</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="useCustomText"
                        checked={screeningRecallFormData.useCustomText}
                        onChange={(e) => setScreeningRecallFormData(prev => ({
                          ...prev,
                          useCustomText: e.target.checked
                        }))}
                        className="rounded"
                      />
                      <Label htmlFor="useCustomText">Use custom screening recall instructions instead of months</Label>
                    </div>

                    {screeningRecallFormData.useCustomText && (
                      <div>
                        <Label htmlFor="customText">Custom Screening Recall Instructions</Label>
                        <Textarea
                          id="customText"
                          value={screeningRecallFormData.customText}
                          onChange={(e) => setScreeningRecallFormData(prev => ({
                            ...prev,
                            customText: e.target.value
                          }))}
                          placeholder="e.g., Only when dentist sees necessary during periodic screening, or specific conditions for recall"
                          rows={3}
                          tabIndex={2}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowScreeningRecallNotes(!showScreeningRecallNotes)}
                      className="text-xs"
                    >
                      {showScreeningRecallNotes ? 'Hide Notes' : 'Add Notes'}
                    </Button>
                  </div>
                  {showScreeningRecallNotes && (
                    <div>
                      <Label htmlFor="recallNotes">Notes</Label>
                      <Textarea
                        id="recallNotes"
                        value={screeningRecallFormData.notes}
                        onChange={(e) => setScreeningRecallFormData(prev => ({
                          ...prev,
                          notes: e.target.value
                        }))}
                        placeholder="Additional observations, reasoning for screening recall intervals, or notes for future reference"
                        rows={4}
                        tabIndex={showScreeningRecallNotes ? 3 : undefined}
                      />
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button
                    onClick={() => {
                      updateScreeningRecallScore.mutate({
                        screeningMonths: screeningRecallFormData.screeningMonths || 6,
                        useCustomText: screeningRecallFormData.useCustomText,
                        customText: screeningRecallFormData.customText,
                        notes: screeningRecallFormData.notes
                      })
                    }}
                    disabled={updateScreeningRecallScore.isPending}
                    tabIndex={showScreeningRecallNotes ? 4 : 3}
                  >
                    {updateScreeningRecallScore.isPending ? 'Saving...' : 'Save Screening Recall Terms'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setScreeningRecallModalStep('history')}
                    tabIndex={showScreeningRecallNotes ? 5 : 4}
                  >
                    Cancel
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
        {/* Cleaning Recall Modal */}
        <Dialog open={showCleaningRecallModal} onOpenChange={(open) => {
          setShowCleaningRecallModal(open)
          if (!open) {
            setCleaningRecallModalStep('history')
            setShowCleaningRecallNotes(false)
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cleaning Recall Terms</DialogTitle>
              <DialogDescription>
                {cleaningRecallModalStep === 'history' && 'View cleaning recall terms history and add new assessment'}
                {cleaningRecallModalStep === 'assessment' && 'Set cleaning recall terms for periodic cleaning'}
              </DialogDescription>
            </DialogHeader>

            {cleaningRecallModalStep === 'history' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Cleaning Recall Terms History</h3>
                  <Button onClick={() => {
                    // Pre-fill with latest data if available
                    const latestCleaningRecall = getLatestCleaningRecallData()
                    if (latestCleaningRecall.cleaningMonths) {
                      let useCustomText = false
                      let customText = ''
                      let notes = ''

                      // Check if the latest record has custom text
                      if (latestCleaningRecall.customText) {
                        useCustomText = true
                        customText = latestCleaningRecall.customText
                        // Try to get original notes from JSON
                        try {
                          const notesData = JSON.parse(patient?.cleaningRecallHistory?.[0]?.notes || '{}')
                          notes = notesData.originalNotes || ''
                        } catch (e) {
                          notes = ''
                        }
                      } else {
                        notes = patient?.cleaningRecallHistory?.[0]?.notes || ''
                      }

                      setCleaningRecallFormData({
                        cleaningMonths: latestCleaningRecall.cleaningMonths,
                        procedureCode: (latestCleaningRecall.procedureCode || 'm03') as 'm03' | 't042' | 't043',
                        useCustomText,
                        customText,
                        notes
                      })
                    } else {
                      // Set default values for new assessment
                      setCleaningRecallFormData({
                        cleaningMonths: 6,
                        procedureCode: 'm03',
                        useCustomText: false,
                        customText: '',
                        notes: ''
                      })
                    }
                    setCleaningRecallModalStep('assessment')
                  }} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    New Assessment
                  </Button>
                </div>

                <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                  {patient?.cleaningRecallHistory && patient.cleaningRecallHistory.length > 0 ? (
                    patient.cleaningRecallHistory
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((record) => {
                        // Check if this record has custom text
                        let customText = null
                        let originalNotes = record.notes
                        if (record.notes) {
                          try {
                            const notesData = JSON.parse(record.notes)
                            if (notesData.useCustomText && notesData.customText) {
                              customText = notesData.customText
                              originalNotes = notesData.originalNotes || ''
                            }
                          } catch (e) {
                            // If parsing fails, it's regular notes
                          }
                        }

                        return (
                          <Card key={record.id} className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-3">
                                {customText ? (
                                  <div className="px-3 py-1 rounded-full border bg-purple-100 border-purple-400 text-purple-800">
                                    Custom: {customText}
                                  </div>
                                ) : (
                                  <div className="flex gap-2">
                                    <div className="px-3 py-1 rounded-full border bg-green-100 border-green-400 text-green-800">
                                      {record.procedureCode} Recall: {record.cleaningMonths} mnd
                                    </div>
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium">{new Date(record.date).toLocaleDateString()}</p>
                                  <p className="text-sm text-gray-500">By {[(() => {
                                    const user = userMap[record.createdBy];
                                    if (user) return (user.firstName[0] + user.lastName[0]).toUpperCase();
                                    const parts = record.createdBy?.split(' ') || [];
                                    return (parts[0]?.[0] || '').toUpperCase();
                                  })()]}</p>
                                </div>
                              </div>
                            </div>
                            {originalNotes && (
                              <div className="mt-2 p-2 bg-gray-50 rounded">
                                <p className="text-sm text-gray-700">{originalNotes}</p>
                              </div>
                            )}
                          </Card>
                        )
                      })
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <History className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No cleaning recall terms recorded yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {cleaningRecallModalStep === 'assessment' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Cleaning Recall Assessment</h3>
                  <Button variant="outline" onClick={() => setCleaningRecallModalStep('history')}>
                    Back to History
                  </Button>
                </div>

                {/* Cleaning Recall Terms */}
                <div className="space-y-4">
                  <h4 className="font-medium text-blue-700">Cleaning Recall Terms</h4>
                  <p className="text-sm text-gray-600">Set the cleaning recall intervals for periodic cleaning (m03/t042/t043)</p>

                  <div className="space-y-2">
                    <Label htmlFor="cleaningMonths">Periodic Cleaning (m03/t042/t043) - Months</Label>
                    <Input
                      id="cleaningMonths"
                      type="number"
                      min={1}
                      max={24}
                      value={cleaningRecallFormData.cleaningMonths === 0 ? '' : cleaningRecallFormData.cleaningMonths}
                      onChange={(e) => setCleaningRecallFormData(prev => ({
                        ...prev,
                        cleaningMonths: e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                      }))}
                      placeholder="6"
                      autoFocus
                      tabIndex={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="procedureCode">Procedure Code</Label>
                    <Select
                      value={cleaningRecallFormData.procedureCode}
                      onValueChange={(value) => setCleaningRecallFormData(prev => ({
                        ...prev,
                        procedureCode: value as 'm03' | 't042' | 't043'
                      }))}
                    >
                      <SelectTrigger tabIndex={2}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="m03">m03 - Preventive cleaning</SelectItem>
                        <SelectItem value="t042">t042 - Periodontal cleaning</SelectItem>
                        <SelectItem value="t043">t043 - Extensive periodontal cleaning</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Custom Text Option */}
                <div className="space-y-4">
                  <h4 className="font-medium text-blue-700">Custom Cleaning Recall Instructions</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="useCustomText"
                        checked={cleaningRecallFormData.useCustomText}
                        onChange={(e) => setCleaningRecallFormData(prev => ({
                          ...prev,
                          useCustomText: e.target.checked
                        }))}
                        className="rounded"
                      />
                      <Label htmlFor="useCustomText">Use custom cleaning recall instructions instead of months</Label>
                    </div>

                    {cleaningRecallFormData.useCustomText && (
                      <div>
                        <Label htmlFor="customText">Custom Cleaning Recall Instructions</Label>
                        <Textarea
                          id="customText"
                          value={cleaningRecallFormData.customText}
                          onChange={(e) => setCleaningRecallFormData(prev => ({
                            ...prev,
                            customText: e.target.value
                          }))}
                          placeholder="e.g., Only when dentist sees necessary during periodic cleaning, or specific conditions for recall"
                          rows={3}
                          tabIndex={3}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-blue-700">Practitioner Notes</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCleaningRecallNotes(!showCleaningRecallNotes)}
                      className="text-xs"
                    >
                      {showCleaningRecallNotes ? 'Hide Notes' : 'Add Notes'}
                    </Button>
                  </div>
                  {showCleaningRecallNotes && (
                    <div>
                      <Label htmlFor="recallNotes">Notes</Label>
                      <Textarea
                        id="recallNotes"
                        value={cleaningRecallFormData.notes}
                        onChange={(e) => setCleaningRecallFormData(prev => ({
                          ...prev,
                          notes: e.target.value
                        }))}
                        placeholder="Additional observations, reasoning for cleaning recall intervals, or notes for future reference"
                        rows={4}
                        tabIndex={showCleaningRecallNotes ? 4 : undefined}
                      />
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button
                    onClick={() => {
                      updateCleaningRecallScore.mutate({
                        cleaningMonths: cleaningRecallFormData.cleaningMonths || 6,
                        procedureCode: cleaningRecallFormData.procedureCode,
                        useCustomText: cleaningRecallFormData.useCustomText,
                        customText: cleaningRecallFormData.customText,
                        notes: cleaningRecallFormData.notes
                      })
                    }}
                    disabled={updateCleaningRecallScore.isPending}
                    tabIndex={showCleaningRecallNotes ? 5 : 4}
                  >
                    {updateCleaningRecallScore.isPending ? 'Saving...' : 'Save Cleaning Recall Terms'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCleaningRecallModalStep('history')}
                    tabIndex={showCleaningRecallNotes ? 6 : 5}
                  >
                    Cancel
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Care Plan Modal */}
        <Dialog open={showCarePlanModal} onOpenChange={setShowCarePlanModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Care Plan</DialogTitle>
              <DialogDescription>
                Update patient care plan and risk profile
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Care Request, Goal, and Policy */}
              <div className="space-y-4">
                <div>
                  <Label>Care Request</Label>
                  <Textarea
                    value={carePlanFormData.careRequest}
                    onChange={(e) => setCarePlanFormData(prev => ({
                      ...prev,
                      careRequest: e.target.value
                    }))}
                    placeholder="What does the patient want?"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Care Goal</Label>
                  <Textarea
                    value={carePlanFormData.careGoal}
                    onChange={(e) => setCarePlanFormData(prev => ({
                      ...prev,
                      careGoal: e.target.value
                    }))}
                    placeholder="What do patient and practitioner want to achieve?"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Policy</Label>
                  <Textarea
                    value={carePlanFormData.policy}
                    onChange={(e) => setCarePlanFormData(prev => ({
                      ...prev,
                      policy: e.target.value
                    }))}
                    placeholder="How will they achieve their goal?"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Risk Profile */}
              <div>
                <h3 className="text-lg font-medium mb-4">Risk Profile</h3>

                <div className="space-y-6">
                  {/* Mucous Membranes */}
                  <div className="space-y-2">
                    <Label>Mucous Membranes</Label>
                    <Select
                      value={carePlanFormData.riskProfile.mucousMembranes.status}
                      onValueChange={(value) => setCarePlanFormData(prev => ({
                        ...prev,
                        riskProfile: {
                          ...prev.riskProfile,
                          mucousMembranes: {
                            ...prev.riskProfile.mucousMembranes,
                            status: value
                          }
                        }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NO_ABNORMALITIES">No abnormalities</SelectItem>
                        <SelectItem value="ABNORMALITIES">Abnormalities</SelectItem>
                      </SelectContent>
                    </Select>
                    <Textarea
                      value={carePlanFormData.riskProfile.mucousMembranes.notes}
                      onChange={(e) => setCarePlanFormData(prev => ({
                        ...prev,
                        riskProfile: {
                          ...prev.riskProfile,
                          mucousMembranes: {
                            ...prev.riskProfile.mucousMembranes,
                            notes: e.target.value
                          }
                        }
                      }))}
                      placeholder="Additional notes..."
                      className="mt-1"
                    />
                  </div>

                  {/* Periodontitis */}
                  <div className="space-y-2">
                    <Label>Periodontitis</Label>
                    <Select
                      value={carePlanFormData.riskProfile.periodontitis.status}
                      onValueChange={(value) => setCarePlanFormData(prev => ({
                        ...prev,
                        riskProfile: {
                          ...prev.riskProfile,
                          periodontitis: {
                            ...prev.riskProfile.periodontitis,
                            status: value
                          }
                        }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW_RISK">Low risk</SelectItem>
                        <SelectItem value="HIGH_RISK">High risk</SelectItem>
                      </SelectContent>
                    </Select>
                    <Textarea
                      value={carePlanFormData.riskProfile.periodontitis.notes}
                      onChange={(e) => setCarePlanFormData(prev => ({
                        ...prev,
                        riskProfile: {
                          ...prev.riskProfile,
                          periodontitis: {
                            ...prev.riskProfile.periodontitis,
                            notes: e.target.value
                          }
                        }
                      }))}
                      placeholder="Additional notes..."
                      className="mt-1"
                    />
                  </div>

                  {/* Caries */}
                  <div className="space-y-2">
                    <Label>Caries</Label>
                    <Select
                      value={carePlanFormData.riskProfile.caries.status}
                      onValueChange={(value) => setCarePlanFormData(prev => ({
                        ...prev,
                        riskProfile: {
                          ...prev.riskProfile,
                          caries: {
                            ...prev.riskProfile.caries,
                            status: value
                          }
                        }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW_RISK">Low risk</SelectItem>
                        <SelectItem value="MODERATE_RISK">Moderate risk</SelectItem>
                        <SelectItem value="HIGH_RISK">High risk</SelectItem>
                      </SelectContent>
                    </Select>
                    <Textarea
                      value={carePlanFormData.riskProfile.caries.notes}
                      onChange={(e) => setCarePlanFormData(prev => ({
                        ...prev,
                        riskProfile: {
                          ...prev.riskProfile,
                          caries: {
                            ...prev.riskProfile.caries,
                            notes: e.target.value
                          }
                        }
                      }))}
                      placeholder="Additional notes..."
                      className="mt-1"
                    />
                  </div>

                  {/* Wear */}
                  <div className="space-y-2">
                    <Label>Wear</Label>
                    <Select
                      value={carePlanFormData.riskProfile.wear.status}
                      onValueChange={(value) => setCarePlanFormData(prev => ({
                        ...prev,
                        riskProfile: {
                          ...prev.riskProfile,
                          wear: {
                            ...prev.riskProfile.wear,
                            status: value
                          }
                        }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW_RISK">Low risk</SelectItem>
                        <SelectItem value="MODERATE_RISK">Moderate risk</SelectItem>
                        <SelectItem value="HIGH_RISK">High risk</SelectItem>
                        <SelectItem value="PHYSIOLOGICAL">Physiological</SelectItem>
                        <SelectItem value="PATHOLOGICAL">Pathological</SelectItem>
                      </SelectContent>
                    </Select>
                    <Textarea
                      value={carePlanFormData.riskProfile.wear.notes}
                      onChange={(e) => setCarePlanFormData(prev => ({
                        ...prev,
                        riskProfile: {
                          ...prev.riskProfile,
                          wear: {
                            ...prev.riskProfile.wear,
                            notes: e.target.value
                          }
                        }
                      }))}
                      placeholder="Additional notes..."
                      className="mt-1"
                    />
                  </div>

                  {/* Function Problem */}
                  <div className="space-y-2">
                    <Label>Function Problem</Label>
                    <Select
                      value={carePlanFormData.riskProfile.functionProblem.status}
                      onValueChange={(value) => setCarePlanFormData(prev => ({
                        ...prev,
                        riskProfile: {
                          ...prev.riskProfile,
                          functionProblem: {
                            ...prev.riskProfile.functionProblem,
                            status: value
                          }
                        }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="YES">Yes</SelectItem>
                        <SelectItem value="NO">No</SelectItem>
                      </SelectContent>
                    </Select>
                    <Textarea
                      value={carePlanFormData.riskProfile.functionProblem.notes}
                      onChange={(e) => setCarePlanFormData(prev => ({
                        ...prev,
                        riskProfile: {
                          ...prev.riskProfile,
                          functionProblem: {
                            ...prev.riskProfile.functionProblem,
                            notes: e.target.value
                          }
                        }
                      }))}
                      placeholder="Additional notes..."
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* ASA and PPS Preview */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Current Assessments</h3>

                <div className="grid grid-cols-2 gap-6">
                  {/* ASA Preview */}
                  <div className="space-y-2">
                    <h4 className="font-medium">ASA Score</h4>
                    <div className="flex items-center gap-2">
                      <div className={`px-3 py-1 rounded-full border text-sm ${getAsaScoreColor(getLatestAsaData().score || 1)}`}>
                        ASA {getLatestAsaData().score || '-'}
                      </div>
                      <span className="text-sm text-gray-500">{getLatestAsaData().date || 'No date'}</span>
                    </div>
                    {patient?.asaHistory?.[0]?.notes && (
                      <div className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">
                        {patient.asaHistory[0].notes.split('. ').join('.\n')}
                      </div>
                    )}
                  </div>

                  {/* PPS Preview */}
                  <div className="space-y-2">
                    <h4 className="font-medium">PPS Scores</h4>
                    <div className="grid grid-cols-2 gap-2 max-w-[200px]">
                      {getLatestPpsData().scores?.map((score, index) => (
                        <div
                          key={index}
                          className={`px-2 py-1 rounded border text-sm text-center ${getPpsScoreColor(score)}`}
                          style={{
                            gridColumn: index % 2 === 0 ? 1 : 2,
                            gridRow: index < 2 ? 1 : 2
                          }}
                        >
                          {score === 0 ? '-' : score}
                        </div>
                      )) || (
                          <div className="col-span-2 text-center text-gray-500">No PPS scores</div>
                        )}
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowCarePlanModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    updateCarePlan.mutate(carePlanFormData)
                  }}
                  disabled={updateCarePlan.isPending}
                >
                  {updateCarePlan.isPending ? 'Saving...' : 'Save Care Plan'}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Note Modal */}
        <Dialog open={showAddNoteModal} onOpenChange={setShowAddNoteModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Note</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Note</Label>
                <Textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Enter your note..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Folder (Optional)</Label>
                <Select
                  value={selectedFolder || 'none'}
                  onValueChange={(value) => setSelectedFolder(value === 'none' ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No folder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No folder</SelectItem>
                    {noteFolders?.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isPinned"
                  checked={isNewNotePinned}
                  onCheckedChange={(checked) => setIsNewNotePinned(checked as boolean)}
                />
                <Label htmlFor="isPinned">Pin this note</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddNoteModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!newNoteContent.trim()) return

                  await createNote.mutateAsync({
                    content: newNoteContent,
                    folderId: selectedFolder,
                    isPinned: isNewNotePinned
                  })

                  setNewNoteContent('')
                  setSelectedFolder(null)
                  setIsNewNotePinned(false)
                  setShowAddNoteModal(false)
                }}
                disabled={createNote.isPending}
              >
                {createNote.isPending ? 'Adding...' : 'Add Note'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Notes Settings Modal */}
        <Dialog open={showNotesSettingsModal} onOpenChange={setShowNotesSettingsModal}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Notes Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Folders Management */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">Folders</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddFolderModal(true)}
                  >
                    Add Folder
                  </Button>
                </div>
                <div className="space-y-2">
                  {noteFolders?.map((folder) => (
                    <div
                      key={folder.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <span>{folder.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteFolder(folder)}
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pinned Notes Reordering */}
              <div>
                <h3 className="font-medium mb-2">Pinned Notes Order</h3>
                <div className="space-y-2">
                  {notes
                    ?.filter((note) => note.isPinned)
                    .sort((a, b) => (a.pinOrder || 0) - (b.pinOrder || 0))
                    .map((note, index) => (
                      <div
                        key={note.id}
                        className="flex items-center justify-between p-2 bg-blue-50 rounded"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={index === 0}
                              onClick={() => {
                                const prevNote = notes.find(
                                  (n) => n.isPinned && n.pinOrder === (note.pinOrder || 0) - 1
                                )
                                if (prevNote) {
                                  updateNote.mutate({
                                    noteId: note.id,
                                    pinOrder: prevNote.pinOrder
                                  })
                                  updateNote.mutate({
                                    noteId: prevNote.id,
                                    pinOrder: note.pinOrder
                                  })
                                }
                              }}
                              className="h-4 w-4 p-0"
                            >
                              <ChevronUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={index === notes.filter((n) => n.isPinned).length - 1}
                              onClick={() => {
                                const nextNote = notes.find(
                                  (n) => n.isPinned && n.pinOrder === (note.pinOrder || 0) + 1
                                )
                                if (nextNote) {
                                  updateNote.mutate({
                                    noteId: note.id,
                                    pinOrder: nextNote.pinOrder
                                  })
                                  updateNote.mutate({
                                    noteId: nextNote.id,
                                    pinOrder: note.pinOrder
                                  })
                                }
                              }}
                              className="h-4 w-4 p-0"
                            >
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </div>
                          <span className="truncate max-w-[300px]">{note.content}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            updateNote.mutate({
                              noteId: note.id,
                              isPinned: false,
                              pinOrder: null
                            })
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Folder Modal */}
        <Dialog open={showAddFolderModal} onOpenChange={setShowAddFolderModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Folder</DialogTitle>
            </DialogHeader>
            <div>
              <Label>Folder Name</Label>
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name..."
                className="mt-1"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddFolderModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!newFolderName.trim()) return

                  await createFolder.mutateAsync({
                    name: newFolderName
                  })

                  setNewFolderName('')
                  setShowAddFolderModal(false)
                }}
                disabled={createFolder.isPending}
              >
                {createFolder.isPending ? 'Adding...' : 'Add Folder'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete/Disable Patient Modal */}
        <Dialog open={showDeleteDisableModal} onOpenChange={setShowDeleteDisableModal}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {deleteDisableModalStep === 'options' && 'Patient Management'}
                {deleteDisableModalStep === 'disable' && 'Disable Patient'}
                {deleteDisableModalStep === 'delete' && 'Delete Patient'}
                {deleteDisableModalStep === 'history' && 'Status History'}
              </DialogTitle>
              <DialogDescription>
                {deleteDisableModalStep === 'options' && 'Choose an action for this patient'}
                {deleteDisableModalStep === 'disable' && 'Disable this patient and provide a reason'}
                {deleteDisableModalStep === 'delete' && 'Permanently delete this patient from the system'}
                {deleteDisableModalStep === 'history' && 'View the history of status changes'}
              </DialogDescription>
            </DialogHeader>

            {deleteDisableModalStep === 'options' && (
              <div className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setDeleteDisableModalStep('history')}
                >
                  <History className="w-4 h-4 mr-2" />
                  View Status History
                </Button>
                {patient?.isDisabled ? (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/patients/${params.id}/status`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: 'ENABLE' }),
                        })
                        if (response.ok) {
                          toast.success('Patient enabled successfully')
                          setShowDeleteDisableModal(false)
                          // Refetch patient data
                          window.location.reload()
                        } else {
                          toast.error('Failed to enable patient')
                        }
                      } catch (error) {
                        toast.error('Failed to enable patient')
                      }
                    }}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Enable Patient
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setDeleteDisableModalStep('disable')}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Disable Patient
                  </Button>
                )}
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  onClick={() => setDeleteDisableModalStep('delete')}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Patient
                </Button>
              </div>
            )}

            {deleteDisableModalStep === 'disable' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="disableReason">Reason for disabling</Label>
                  <Textarea
                    id="disableReason"
                    value={disableReason}
                    onChange={(e) => setDisableReason(e.target.value)}
                    placeholder="Enter reason for disabling this patient..."
                    className="mt-1"
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteDisableModalStep('options')}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/patients/${params.id}/status`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            action: 'DISABLE',
                            reason: disableReason
                          }),
                        })
                        if (response.ok) {
                          toast.success('Patient disabled successfully')
                          setShowDeleteDisableModal(false)
                          setDisableReason('')
                          // Refetch patient data
                          window.location.reload()
                        } else {
                          toast.error('Failed to disable patient')
                        }
                      } catch (error) {
                        toast.error('Failed to disable patient')
                      }
                    }}
                  >
                    Disable Patient
                  </Button>
                </DialogFooter>
              </div>
            )}

            {deleteDisableModalStep === 'delete' && (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 font-medium">Warning: This action cannot be undone</p>
                  <p className="text-red-600 text-sm mt-1">
                    This will permanently delete the patient and all associated data including:
                  </p>
                  <ul className="text-red-600 text-sm mt-2 list-disc list-inside">
                    <li>Patient information</li>
                    <li>Medical and dental history</li>
                    <li>Appointments and treatments</li>
                    <li>Files and images</li>
                    <li>Notes and assessments</li>
                  </ul>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteDisableModalStep('options')}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/patients/${params.id}`, {
                          method: 'DELETE',
                        })
                        if (response.ok) {
                          toast.success('Patient deleted successfully')
                          router.push('/dashboard/patients')
                        } else {
                          toast.error('Failed to delete patient')
                        }
                      } catch (error) {
                        toast.error('Failed to delete patient')
                      }
                    }}
                  >
                    Delete Patient
                  </Button>
                </DialogFooter>
              </div>
            )}

            {deleteDisableModalStep === 'history' && (
              <div className="space-y-4">
                <div className="max-h-64 overflow-y-auto">
                  {statusHistory.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No status history found</p>
                  ) : (
                    <div className="space-y-2">
                      {statusHistory.map((record, index) => (
                        <div key={record.id} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className={`font-medium ${record.action === 'DISABLE' ? 'text-red-600' : 'text-green-600'
                                }`}>
                                {record.action === 'DISABLE' ? 'Disabled' : 'Enabled'}
                              </span>
                              {record.reason && (
                                <p className="text-sm text-gray-600 mt-1">{record.reason}</p>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(record.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteDisableModalStep('options')}>
                    Back
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Folder Confirmation Modal */}
        <ConfirmationModal
          open={showDeleteFolderModal}
          onOpenChange={setShowDeleteFolderModal}
          title="Delete Folder"
          description={`Are you sure you want to delete the folder "${folderToDelete?.name}"? Notes in this folder will be moved to no folder.`}
          confirmText="Delete Folder"
          cancelText="Cancel"
          variant="destructive"
          icon="delete"
          onConfirm={handleConfirmDeleteFolder}
          loading={deleteFolderLoading}
        />

        {/* Phonebook Modal */}
        <Dialog open={showPhonebookModal} onOpenChange={setShowPhonebookModal}>
          <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>📞 Email Phonebook</DialogTitle>
              <DialogDescription>
                Select email addresses from your contacts
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Phonebook Categories */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {Object.entries(phonebookContacts).map(([category, contacts]) => (
                  <div key={category} className="rounded-lg border p-3 bg-gray-50">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      {category}
                    </h4>
                    <div className="space-y-1">
                      {Object.entries(contacts).map(([name, email]) => (
                        <Button
                          key={name}
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            addEmailRecipient(email);
                            setShowPhonebookModal(false);
                          }}
                          className="w-full justify-start text-left h-auto p-2 hover:bg-white"
                          disabled={emailFormData.recipients.includes(email)}
                        >
                          <div className="text-left w-full">
                            <div className="font-medium text-xs">
                              {name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {email}
                            </div>
                          </div>
                          {emailFormData.recipients.includes(email) && (
                            <div className="ml-auto text-green-600">
                              <span className="text-xs">✓ Added</span>
                            </div>
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPhonebookModal(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Quick Templates Modal */}
        <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
          <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>📝 Quick Email Templates</DialogTitle>
              <DialogDescription>
                Choose from pre-written email templates
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Template Search */}
              <div className="relative">
                <Input
                  placeholder="Search templates..."
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  className="text-sm"
                />
                {templateSearch && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTemplateSearch('')}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Template Categories */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {Object.entries(filteredTemplates()).map(([category, templates]) => (
                  <div key={category} className={`rounded-lg border p-3 ${getCategoryColor(category)}`}>
                    <div
                      className="flex items-center justify-between cursor-pointer p-1 rounded"
                      onClick={() => toggleCategory(category)}
                    >
                      <h4 className={`text-sm font-semibold ${getCategoryHeaderColor(category)}`}>
                        {category}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="text-xs opacity-70">
                          {Object.keys(templates).length}
                        </span>
                        {expandedCategories.includes(category) ? (
                          <ChevronUp className="h-3 w-3 opacity-70" />
                        ) : (
                          <ChevronDown className="h-3 w-3 opacity-70" />
                        )}
                      </div>
                    </div>

                    {expandedCategories.includes(category) && (
                      <div className="space-y-1 mt-2">
                        {Object.entries(templates).map(([key, template]) => {
                          const templateData = template as { subject: string; content: string };
                          return (
                            <Button
                              key={key}
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                handleEmailTemplateSelect(category, key);
                                setTemplateSearch('');
                                setShowTemplateModal(false);
                              }}
                              className="w-full justify-start text-left h-auto p-2 hover:bg-white/50 bg-white/30"
                            >
                              <div className="text-left w-full">
                                <div className="font-medium text-xs">
                                  {templateData.subject}
                                </div>
                                <div className="text-xs opacity-60 mt-0.5 line-clamp-2">
                                  {templateData.content.split('\n')[0].substring(0, 60)}...
                                </div>
                              </div>
                            </Button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}

                {Object.keys(filteredTemplates()).length === 0 && (
                  <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                    <p className="text-sm">No templates found</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTemplateSearch('')}
                      className="mt-2 text-xs hover:bg-gray-200"
                    >
                      Clear search
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTemplateModal(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Quick-Add Treatment Modal */}
        <TreatmentModal
          isOpen={showQuickAddModal}
          onClose={() => {
            setShowQuickAddModal(false);
            setQuickAddCode(null);
          }}
          onSave={handleQuickAddSave}
          quickCode={quickAddCode}
          patientAge={patient?.dateOfBirth ?
            Math.floor((new Date().getTime() - new Date(patient.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
            : 18
          }
          availableCodes={dentalCodes || []}
          isWLZPatient={patient?.isLongTermCareAct ?? false}
          patient={patient}
          onRefresh={refetch}
        />



        {/* Email Modal */}
        <EmailModal
          isOpen={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          onSend={handleSendEmail}
          emailFormData={emailFormData}
          setEmailFormData={setEmailFormData}
          emailInput={emailInput}
          handleEmailInputChange={handleEmailInputChange}
          handleEmailInputKeyDown={handleEmailInputKeyDown}
          removeEmailRecipient={removeEmailRecipient}
          addPatientEmail={addPatientEmail}
          setShowPhonebookModal={setShowPhonebookModal}
          setShowTemplateModal={setShowTemplateModal}
          toggleFileSelection={toggleFileSelection}
          patient={patient}
          patientImages={patientImages || []}
          emailInputError={emailInputError}
        />
        {/* Email Modal */}
        <EmailModal
          isOpen={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          onSend={handleSendEmail}
          emailFormData={emailFormData}
          setEmailFormData={setEmailFormData}
          emailInput={emailInput}
          handleEmailInputChange={handleEmailInputChange}
          handleEmailInputKeyDown={handleEmailInputKeyDown}
          removeEmailRecipient={removeEmailRecipient}
          addPatientEmail={addPatientEmail}
          setShowPhonebookModal={setShowPhonebookModal}
          setShowTemplateModal={setShowTemplateModal}
          toggleFileSelection={toggleFileSelection}
          patient={patient}
          patientImages={patientImages || []}
          emailInputError={emailInputError}
        />

        {/* Patient Edit Modal */}
        <PatientEditModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setSelectedAddress(null)
          }}
          onSubmit={async (e) => {
            e.preventDefault()
            try {
              const updateData: any = {
                firstName: editFormData.firstName,
                lastName: editFormData.lastName,
                dateOfBirth: editFormData.dateOfBirth,
                gender: editFormData.gender,
                email: editFormData.email,
                phone: editFormData.phone,
                bsn: editFormData.bsn,
                country: editFormData.country,
                allowEarlySpotContact: editFormData.allowEarlySpotContact
              }

              // Check if address was actually changed
              const originalAddress = patient.address.display_name || ''
              const hasAddressChanged = selectedAddress !== null || editFormData.address !== originalAddress

              if (hasAddressChanged && selectedAddress) {
                // Address was changed via autocomplete
                updateData.address = {
                  display_name: selectedAddress.display_name,
                  lat: selectedAddress.lat,
                  lon: selectedAddress.lon
                }
                console.log('Address changed via autocomplete:', updateData.address)
              } else if (hasAddressChanged && !selectedAddress && editFormData.address !== originalAddress) {
                // Address was manually typed (rare case)
                updateData.address = {
                  display_name: editFormData.address,
                  lat: patient.address.lat || '',
                  lon: patient.address.lon || ''
                }
                console.log('Address manually changed:', updateData.address)
              } else {
                console.log('Address NOT changed - excluding from update')
              }

              console.log('Final updateData being sent to API:', updateData)
              await updatePatient.mutateAsync(updateData)
              setShowEditModal(false)
              setSelectedAddress(null)
              await refetch()
              toast.success('Patient information updated successfully')
            } catch (error) {
              console.error('Update error:', error)
              toast.error('Failed to update patient information')
            }
          }}
          editFormData={editFormData}
          setEditFormData={setEditFormData}
          selectedAddress={selectedAddress}
          setSelectedAddress={setSelectedAddress}
        />

        {/* Periodontal Chart History Modal */}
        <PeriodontalChartHistoryModal
          isOpen={showHistoryModal}
          onOpenChange={setShowHistoryModal}
          periodontalCharts={patient?.periodontalCharts || null}
          onLoadChart={(chartData) => {
            // Update the periodontal chart data
            updateDentalData({
              periodontalChart: {
                teeth: chartData.teeth,
                date: chartData.date,
                patientId: params.id,
                chartType: chartData.chartType,
                isExplicitlySaved: chartData.isExplicitlySaved
              }
            }).then(() => {
              toast.success('Periodontal chart loaded from history')
            }).catch(() => {
              toast.error('Failed to load periodontal chart from history')
            })
          }}
          onViewChart={(chartData) => {
            // TODO: Open chart in view-only mode
            console.log('View chart:', chartData)
          }}
          onEditChart={(chartData) => {
            // TODO: Open chart in edit mode with save options
            console.log('Edit chart:', chartData)
          }}
          onCompareCharts={(charts) => {
            // TODO: Open comparison mode
            console.log('Compare charts:', charts)
          }}
        />

        {/* Periodontal Settings Modal */}
        <Dialog open={showPerioSettingsModal} onOpenChange={setShowPerioSettingsModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Periodontal Chart Settings</DialogTitle>
            </DialogHeader>
            <PeriodontalChartSettings
              settings={periodontalSettings}
              onSettingsChange={setPeriodontalSettings}
            />
          </DialogContent>
        </Dialog>

        {/* Scaling Treatment Shopping Cart Modal */}
        <Dialog open={showScalingModal} onOpenChange={setShowScalingModal}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>🦷 Scaling Treatment Cart</DialogTitle>
              <DialogDescription>
                Based on periodontal findings, select treatments to add to the plan. You can edit, remove, or add additional treatments.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Treatment Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">
                      {selectedTreatments.length} treatment{selectedTreatments.length !== 1 ? 's' : ''} selected
                    </span>
                    <span className="text-sm text-gray-600 ml-2">
                      ({suggestedTeethTreatments.length} total suggested)
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTreatments([])}
                      disabled={selectedTreatments.length === 0}
                    >
                      Clear All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTreatments([...suggestedTeethTreatments])}
                      disabled={selectedTreatments.length === suggestedTeethTreatments.length}
                    >
                      Select All
                    </Button>
                  </div>
                </div>
              </div>

              {/* Individual Teeth Treatments */}
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {suggestedTeethTreatments.map((treatment) => {
                  const isSelected = selectedTreatments.some(t => t.id === treatment.id)
                  const urgencyColors = {
                    high: 'border-red-300 bg-red-50',
                    medium: 'border-orange-300 bg-orange-50',
                    low: 'border-green-300 bg-green-50'
                  }
                  const urgencyBadgeColors = {
                    high: 'bg-red-500 text-white',
                    medium: 'bg-orange-500 text-white',
                    low: 'bg-green-500 text-white'
                  }

                  return (
                    <div
                      key={treatment.id}
                      className={`border rounded-lg p-4 transition-all ${isSelected
                        ? `${urgencyColors[treatment.urgency]} border-2`
                        : 'border-gray-200 bg-gray-50 opacity-60'
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {/* Checkbox */}
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTreatments(prev => [...prev, treatment])
                              } else {
                                setSelectedTreatments(prev => prev.filter(t => t.id !== treatment.id))
                              }
                            }}
                            className="mt-1 rounded"
                          />

                          {/* Treatment Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="font-mono font-bold text-lg">
                                {treatment.toothNumber ? `#${treatment.toothNumber}` : 'General'}
                              </div>
                              <div className="px-2 py-1 rounded bg-blue-600 text-white text-sm font-medium">
                                {treatment.code.toUpperCase()}
                              </div>
                              <span className="font-medium text-gray-900">
                                {treatment.description}
                              </span>
                              <div className={`px-2 py-0.5 rounded text-xs font-medium ${urgencyBadgeColors[treatment.urgency]}`}>
                                {treatment.urgency}
                              </div>
                            </div>

                            {treatment.toothNumber && (
                              <p className="text-sm text-gray-700 mb-2">
                                Deepest pocket: <span className="font-bold text-red-600">{treatment.maxDepth}mm</span>
                                {treatment.hasInflammation && <span className="ml-2 text-red-500">• Bleeding/Suppuration</span>}
                              </p>
                            )}

                            {!treatment.toothNumber && (
                              <p className="text-sm text-gray-700 mb-2">
                                Standalone treatment - no tooth number required
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditTreatmentModal(treatment)}
                            className="h-6 px-2 text-xs"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSuggestedTeethTreatments(prev => prev.filter(t => t.id !== treatment.id))
                              setSelectedTreatments(prev => prev.filter(t => t.id !== treatment.id))
                            }}
                            className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {suggestedTeethTreatments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No scaling treatments suggested based on current measurements.</p>
                  </div>
                )}
              </div>

              {/* Add Custom Treatment */}
              <div className="border-t pt-4">
                <Button
                  variant="outline"
                  onClick={openAddTreatmentModal}
                  className="w-full"
                >
                  + Add Custom Treatment
                </Button>
              </div>

              {/* Info Box */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>💡 Shopping Cart:</strong> Select the treatments you want to add to the treatment plan.
                  All selected treatments will be added at once to the "Plan" tab with detailed notes from the periodontal findings.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setShowScalingModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (selectedTreatments.length === 0) {
                    toast.error('Please select at least one treatment')
                    return
                  }

                  try {
                    // Add selected treatments to treatment plan
                    for (const treatment of selectedTreatments) {
                      // Find the dental code in the database
                      const response = await fetch(`/api/dental-codes?search=${treatment.code}`)
                      if (!response.ok) continue

                      const codes = await response.json()
                      const codeMatch = codes.find((c: any) =>
                        c.code.toLowerCase() === treatment.code.toLowerCase()
                      )

                      if (codeMatch) {
                        // Create notes from findings
                        const notes = treatment.toothNumber
                          ? [
                            `Auto-suggested based on periodontal findings for tooth #${treatment.toothNumber}:`,
                            `• Deepest pocket: ${treatment.maxDepth}mm`,
                            `• Tooth type: ${treatment.reason}`,
                            treatment.hasInflammation ? `• Inflammation present (bleeding/suppuration)` : null
                          ].filter(Boolean).join('\n')
                          : `${treatment.description} - ${treatment.reason}`

                        // Add procedure to treatment plan
                        await fetch(`/api/patients/${params.id}/dental-procedures`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            codeId: codeMatch.id,
                            toothNumber: treatment.toothNumber,
                            date: new Date().toISOString().split('T')[0],
                            notes,
                            status: 'PENDING'
                          })
                        })
                      }
                    }

                    // Refresh procedures and show success
                    await refetchProcedures()
                    setShowScalingModal(false)
                    toast.success(`Added ${selectedTreatments.length} scaling treatment${selectedTreatments.length > 1 ? 's' : ''} to treatment plan`)

                    // Switch to plan tab to show the new procedures
                    setTreatmentTab('plan')
                  } catch (error) {
                    console.error('Error adding scaling treatments:', error)
                    toast.error('Failed to add scaling treatments')
                  }
                }}
                disabled={selectedTreatments.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Add {selectedTreatments.length} Treatment{selectedTreatments.length !== 1 ? 's' : ''} to Plan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Treatment Modal */}
        <Dialog open={showEditTreatmentModal} onOpenChange={setShowEditTreatmentModal}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>✏️ Edit Treatment</DialogTitle>
              <DialogDescription>
                Modify the tooth number and treatment code for this periodontal treatment.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-code">Treatment Code</Label>
                <Select
                  value={editForm.code}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, code: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select treatment code" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="t021">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span>T021 - Complex periodontal treatment</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="t022">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span>T022 - Standard periodontal treatment</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="a10">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>A10 - Clinical examination</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="x10">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span>X10 - Bitewing radiograph</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="t012">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>T012 - Supra-gingival plaque removal</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="t032">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                        <span>T032 - Oral hygiene instruction</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="t042">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span>T042 - Periodontal cleaning</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="t043">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                        <span>T043 - Extensive periodontal cleaning</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="t044">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                        <span>T044 - Periodontal maintenance</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Conditional Tooth Number Field */}
              {(editForm.code === 't021' || editForm.code === 't022') && (
                <div>
                  <Label htmlFor="edit-tooth-number">Tooth Number</Label>
                  <Input
                    id="edit-tooth-number"
                    type="number"
                    min="11"
                    max="48"
                    value={editForm.toothNumber}
                    onChange={(e) => setEditForm(prev => ({ ...prev, toothNumber: e.target.value }))}
                    placeholder="Enter tooth number (11-48)"
                    className="mt-1"
                  />
                </div>
              )}

              {/* Treatment Rules Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                <p className="font-medium text-blue-900 mb-1">📋 Treatment Types:</p>
                <div className="text-blue-800 space-y-1">
                  <p><strong>T021/T022:</strong> Require tooth number (periodontal treatments)</p>
                  <p><strong>A10, X10, T012, T032, T042, T043, T044:</strong> Standalone treatments</p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowEditTreatmentModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditTreatmentSave}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Custom Treatment Modal */}
        <Dialog open={showAddTreatmentModal} onOpenChange={setShowAddTreatmentModal}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>➕ Add Custom Treatment</DialogTitle>
              <DialogDescription>
                Add a new treatment to the periodontal treatment cart.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Tooth-Specific Treatments */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-900">🦷 Tooth-Specific Treatments</h3>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="add-tooth-number">Tooth Number</Label>
                    <Input
                      id="add-tooth-number"
                      type="number"
                      min="11"
                      max="48"
                      value={addForm.toothNumber}
                      onChange={(e) => setAddForm(prev => ({ ...prev, toothNumber: e.target.value }))}
                      placeholder="11-48"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="add-code">Treatment Code</Label>
                    <Select
                      value={addForm.code}
                      onValueChange={(value) => setAddForm(prev => ({ ...prev, code: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select code" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="t021">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span>T021 - Complex periodontal treatment</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="t022">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <span>T022 - Standard periodontal treatment</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Quick Add Standalone Treatments */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-900">⚡ Quick Add Standalone Treatments</h3>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[
                    { code: 'a10', label: 'A10', color: 'bg-blue-500', desc: 'Clinical examination' },
                    { code: 'x10', label: 'X10', color: 'bg-purple-500', desc: 'Bitewing radiograph' },
                    { code: 't012', label: 'T012', color: 'bg-green-500', desc: 'Plaque removal' },
                    { code: 't032', label: 'T032', color: 'bg-teal-500', desc: 'Oral hygiene' },
                    { code: 't042', label: 'T042', color: 'bg-yellow-500', desc: 'Periodontal cleaning' },
                    { code: 't043', label: 'T043', color: 'bg-orange-600', desc: 'Extensive cleaning' },
                    { code: 't044', label: 'T044', color: 'bg-indigo-500', desc: 'Maintenance' }
                  ].map((item) => (
                    <Button
                      key={item.code}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickCodeAdd(item.code)}
                      className={`h-12 flex flex-col items-center justify-center text-xs hover:${item.color} hover:text-white transition-colors`}
                      title={item.desc}
                    >
                      <span className="font-medium">{item.label}</span>
                    </Button>
                  ))}
                </div>

                <p className="text-xs text-gray-500 text-center">
                  Click any button to instantly add that treatment to your list
                </p>
              </div>

              {/* Treatment Rules Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                <p className="font-medium text-blue-900 mb-1">📋 Treatment Types:</p>
                <div className="text-blue-800 space-y-1 text-xs">
                  <p><strong>Tooth-specific:</strong> T021/T022 require specific tooth numbers</p>
                  <p><strong>Standalone:</strong> A10, X10, T012, T032, T042, T043, T044 are general procedures</p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowAddTreatmentModal(false)}
              >
                Close
              </Button>
              <Button
                onClick={handleAddTreatmentSave}
                disabled={!addForm.toothNumber || !addForm.code}
                className="bg-green-600 hover:bg-green-700"
              >
                Add Tooth-Specific Treatment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Shop Modal */}
        <ShopModal
          isOpen={showShopModal}
          onClose={() => setShowShopModal(false)}
          patientId={params.id}
          onPurchaseComplete={() => {
            // Refresh procedures/purchases data when shop purchase is completed
            handleProcedureCreated();
          }}
        />

        {/* Insurance Modal */}
        <Dialog open={showInsuranceModal} onOpenChange={setShowInsuranceModal}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5 text-green-600" />
                Insurance Information
              </DialogTitle>
              <DialogDescription>
                View patient's health insurance details
              </DialogDescription>
            </DialogHeader>

            {patient?.healthInsurance && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Provider</Label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <span className="font-medium text-gray-900">
                        {patient.healthInsurance.provider}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Policy Number</Label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <span className="font-mono text-gray-900">
                        {patient.healthInsurance.policyNumber}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Valid Until</Label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <span className="text-gray-900">
                        {new Date(patient.healthInsurance.validUntil).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Status</Label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${new Date(patient.healthInsurance.validUntil) > new Date()
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                        }`}>
                        {new Date(patient.healthInsurance.validUntil) > new Date() ? 'Active' : 'Expired'}
                      </span>
                    </div>
                  </div>
                </div>

                {patient.healthInsurance.coverageDetails && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Coverage Details</Label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <span className="text-gray-900">
                        {patient.healthInsurance.coverageDetails}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowInsuranceModal(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* U35 Quantity Modal for WLZ patients */}
        <U35QuantityModal
          isOpen={showU35Modal}
          onClose={() => {
            setShowU35Modal(false);
            setPendingTreatmentData(null);
          }}
          onConfirm={handleU35Confirm}
        />

        {/* Print Options Modal */}
        <PrintOptionsModal
          isOpen={showPrintModal}
          onOpenChange={setShowPrintModal}
          options={printOptions}
          setOptions={setPrintOptions}
          hasPeriodontalChart={!!periodontalChart}
          onPrint={() => {
            const sectionMap: Record<string, string> = {
              includePatientInfo: 'patientInfo',
              includeDentalChart: 'dentalChart',
              includePeriodontalChart: 'periodontalChart',
              includeHistoryTreatments: 'historyTreatments',
              includeCurrentTreatments: 'currentTreatments',
              includePlanTreatments: 'planTreatments',
              includeXrayImages: 'xrayImages',
            };

            const included = Object.entries(printOptions)
              .filter(([, v]) => v)
              .map(([k]) => sectionMap[k])
              .join(',');

            router.push(`/dashboard/patients/${params.id}/print?sections=${included}`);
            setShowPrintModal(false);
          }}
        />

        {/* Tasks Modal */}
        <Dialog open={showTasksModal} onOpenChange={setShowTasksModal}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Patient Tasks</DialogTitle>
              <DialogDescription>Tasks linked to this patient.</DialogDescription>
            </DialogHeader>

            <PatientTaskList
              patientId={params.id}
              patientName={`${patient.firstName} ${patient.lastName}`}
              onCreateTask={() => {
                setShowTasksModal(false);
                router.push(`/dashboard/tasks?patientId=${params.id}`);
              }}
              limit={10}
            />

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTasksModal(false)}>
                Close
              </Button>
              <Button onClick={() => {
                setShowTasksModal(false);
                router.push(`/dashboard/tasks?patientId=${params.id}`);
              }}>
                Open Tasks Page
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Waiting List Modal */}
        <Dialog open={showWaitingModal} onOpenChange={setShowWaitingModal}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Waiting List</DialogTitle>
              <DialogDescription>Waiting appointments related to this patient.</DialogDescription>
            </DialogHeader>

            <PatientWaitingList
              patientId={params.id}
              onCreateEntry={() => {
                setShowWaitingModal(false);
                router.push('/dashboard/appointments'); // redirect to appointment scheduling page
              }}
              limit={10}
            />

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowWaitingModal(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Files Modal */}
        <FilesModal
          isOpen={showFilesModal}
          onClose={() => setShowFilesModal(false)}
          patientId={params.id}
          patientName={`${patient?.firstName} ${patient?.lastName}`}
        />
        <FluorideModal
          isOpen={showFluorideModal}
          onClose={() => setShowFluorideModal(false)}
          onSave={handleFluorideSave}
          flavors={fluorideFlavors}
          onOpenSettings={() => setShowFlavorSettings(true)}
        />
        <FluorideFlavorSettingsModal
          isOpen={showFlavorSettings}
          onClose={() => {
            setShowFlavorSettings(false);
            // Refresh flavors after closing settings
            if (showFluorideModal) fetchFluorideFlavors();
          }}
          organizationId={organization?.id || ''}
        />
      </div>
    </div>
  )
}