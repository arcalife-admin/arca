'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import PatientForm from '@/components/patients/PatientForm'
import HealthAssessment from '@/components/patients/HealthAssessment'
import { Label } from '@/components/ui/label'
// Periodontal chart removed - not applicable for plastic surgery
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
import { SurgicalCodeSearch } from '@/components/surgical/SurgicalCodeSearch'
import { TreatmentPlan } from '@/components/patients/TreatmentPlan'
// TreatmentModal removed - will use SurgicalProcedureForm instead
import { EnhancedPatientImagesSection } from '@/components/patients/EnhancedPatientImagesSection'
import { PatientInfoCard, PatientEditModal, EmailModal, FilesModal, ImportantNotesCard, PatientGoalsHistoryCard } from '@/components/patient-detail';
import { ShopModal } from '@/components/patients/ShopModal';
import { useCall } from '@/contexts/CallContext';
import { PrintOptionsModal, PrintOptions } from '@/components/print/PrintOptionsModal'
import PatientTaskList from '@/components/tasks/PatientTaskList'
import PatientWaitingList from '@/components/waiting-list/PatientWaitingList'
import { logActivityClient, LOG_ACTIONS, ENTITY_TYPES, LOG_SEVERITY } from '@/lib/activity-logger'
import SurgicalProcedureForm from '@/components/surgical/SurgicalProcedureForm'
import { isEditableKeyboardTarget, isScrollAtBottom } from '@/lib/keyboard'
import { printPatientLabel } from '@/lib/patient-label/print'
import { printPatientCard, printOptionsToSections } from '@/lib/patient-card/print'
import { useViewportSectionHeight } from '@/hooks/useViewportSectionHeight'
// Dental chart and fluoride modals removed - not applicable for plastic surgery

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
  cnp: string
  country: string
  healthInsurance?: {
    provider: string
    policyNumber: string
    coverageDetails?: string
    validUntil: string
  }
  medicalHistory?: any
  surgicalHistory?: any
  asaScore?: number
  statusPraesens?: any
  beforeAfterPhotos?: any
  surgicalNotes?: any
  allowEarlySpotContact?: boolean
  isLongTermCareAct?: boolean
  isDisabled?: boolean
  disabledMotiv?: string
  disabledAt?: string
  disabledBy?: string
  asaHistory: Array<{
    id: string
    score: number
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
}

// Periodontal chart mapping functions removed - not applicable for plastic surgery

export default function PatientDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { startCall } = useCall()
  const { scrollContainerRef, sectionHeight } = useViewportSectionHeight()
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showDeleteDisableModal, setShowDeleteDisableModal] = useState(false)
  const [deleteDisableModalStep, setDeleteDisableModalStep] = useState<'options' | 'disable' | 'delete' | 'history'>('options')
  const [disableMotiv, setDisableMotiv] = useState('')
  const [statusHistory, setStatusHistory] = useState<any[]>([])
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddProcedureModal, setShowAddProcedureModal] = useState(false)
  const [addProcedureCode, setAddProcedureCode] = useState<any>(null)
  const [showAsaModal, setShowAsaModal] = useState(false)
  // Print modal state
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [printOptions, setPrintOptions] = useState<PrintOptions>({
    includePatientInfo: true,
    includeHistoryTreatments: true,
    includeCurrentTreatments: true,
    includePlanTreatments: true,
    includeBeforeAfterImages: true,
  })
  const [asaModalStep, setAsaModalStep] = useState<'history' | 'assessment' | 'score'>('history')
  const [showPpsModal, setShowPpsModal] = useState(false)
  const [ppsModalStep, setPpsModalStep] = useState<'history' | 'assessment'>('history')
  const [showScreeningRecallModal, setShowScreeningRecallModal] = useState(false)
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
    cnp: '',
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

    // Medicamente curente
    currentMedications: '',
    allergies: '',

    // Notițe
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
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Bun venit și pacienți noi'])
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


  // Template type definition
  type EmailTemplate = { subject: string; content: string }
  type EmailTemplateCategorie = Record<string, EmailTemplate>
  type EmailȘabloane = Record<string, EmailTemplateCategorie>

  // Quick email templates organized by category
  const emailȘabloane = {
    'Bun venit și pacienți noi': {
      welcome: {
        subject: 'Bun venit la clinica noastră dentară',
        content: `Vă mulțumim că ați ales clinica noastră pentru îngrijirea dentară. Așteptăm cu plăcere să vă oferim tratament dentar de calitate într-un mediu confortabil și atent.

Nu ezitați să ne contactați dacă aveți întrebări despre programarea viitoare sau doriți modificări.`
      },
      new_patient_forms: {
        subject: 'Completați formularele pentru pacienți noi',
        content: `Pentru a ne pregăti pentru prima vizită, completați formularele pentru pacienți noi atașate.

Aduceți un act de identitate valid și cardul de asigurare. Pentru întrebări, contactați recepția.`
      },
      first_visit_prep: {
        subject: 'Pregătirea primei vizite',
        content: `Așteptăm cu plăcere prima vizită! Iată ce puteți aștepta și cum vă puteți pregăti.

Sosiți cu 15 minute mai devreme pentru eventuale formulare. Aduceți cardul de asigurare și lista medicamentelor curente.`
      }
    },
    'Programări și planificare': {
      appointment_reminder: {
        subject: 'Este timpul să programați următoarea consultație',
        content: `Conform evidențelor, este timpul pentru următoarea consultație. Controalele regulate sunt esențiale pentru sănătatea orală.

Contactați clinica cât mai curând pentru a programa o consultație convenabilă.`
      },
      routine_appointment_reminder: {
        subject: 'Memento: Programați consultația dentară de rutină',
        content: `Stimate/Stimată [Prenume pacient],

Este timpul pentru controlul dentar de rutină! Vizitele la 6 luni mențin sănătatea orală și previn problemele.

Recomandăm programarea cât mai curând pentru cele mai bune intervale. Echipa noastră este pregătită să vă ofere îngrijire de calitate.

Contactați clinica pentru programare:
- Telefon: [Telefon clinică]
- Email: [Email clinică]
- Programare online: [Site web]

Așteptăm cu plăcere vizita!

Cu stimă,
Echipa [Nume clinică]`
      },
      pending_appointment_reminder: {
        subject: 'Memento: Programați consultația în așteptare',
        content: `Stimate/Stimată [Prenume pacient],

Aveți o programare în așteptare care trebuie confirmată. Este importantă pentru continuarea planului de tratament.

Contactați clinica cât mai curând pentru confirmarea orei:
- Telefon: [Telefon clinică]
- Email: [Email clinică]

Pentru întrebări despre planul de tratament sau opțiuni de programare, contactați-ne.

Vă mulțumim pentru atenție.

Cu stimă,
Echipa [Nume clinică]`
      },
      appointment_confirmation: {
        subject: 'Confirmare programare',
        content: `Confirmăm programarea dentară viitoare. Așteptăm cu plăcere vizita.

Pentru reprogramare sau întrebări, contactați clinica cu cel puțin 24 de ore înainte.`
      },
      cleaning_reminder: {
        subject: 'Se apropie programarea pentru curățare profesională',
        content: `Vă reamintim că programarea pentru curățare profesională se apropie. Curățările regulate sunt esențiale pentru dinți și gingii sănătoase.

Sosiți cu 15 minute mai devreme pentru formulare și pentru a începe la timp.`
      },
      missed_appointment: {
        subject: 'Ne-ați lipsit la programare',
        content: `Am observat neprezentarea la programarea de astăzi. Înțelegem că pot apărea situații neprevăzute.

Contactați clinica pentru reprogramare. Îngrijirea dentară regulată este importantă.`
      }
    },
    'Chestionare pacient': {
      pre_operative_health_questionnaire: {
        subject: 'Chestionar de sănătate preoperator — completați',
        content: `Stimate/Stimată [Prenume pacient],

Pentru a vă pregăti în siguranță pentru procedura viitoare, completați chestionarul de sănătate preoperator atașat înainte de programare.

Acest chestionar ne ajută să înțelegem:
- Istoricul chirurgical și anestezic
- Medicamentele și suplimentele curente
- Pregătirea preoperatorie și planificarea recuperării

Completați și returnați acest formular cu cel puțin 24 de ore înainte de programare.

Vă mulțumim că ne ajutați să oferim îngrijire chirurgicală sigură și personalizată.

Cu stimă,
Echipa chirurgicală [Nume clinică]`
      },
      gfi_questionnaire: {
        subject: 'Chestionar GFI de sănătate — completare obligatorie',
        content: `Stimate/Stimată [Prenume pacient],

Completați chestionarul GFI (Informații generale de sănătate) atașat, ca parte a pregătirii pentru îngrijirea chirurgicală.

Acest chestionar cuprinzător acoperă:
- Istoricul medical și starea de sănătate actuală
- Medicamentele și alergiile curente
- Experiențele chirurgicale anterioare
- Modificările de sănătate de la ultima vizită

Informațiile de sănătate sunt esențiale pentru tratament chirurgical sigur. Completați toate secțiunile și aduceți formularul la programare.

Dacă aveți întrebări despre orice secțiune, contactați clinica.

Vă mulțumim pentru colaborare.

Cu stimă,
Echipa [Nume clinică]`
      },
      pre_operative_surgical_risk_assessment: {
        subject: 'Chestionar evaluare risc chirurgical preoperator',
        content: `Stimate/Stimată [Prenume pacient],

Ca parte a evaluării preoperatorii, completați chestionarul de evaluare a riscului chirurgical atașat.

Această evaluare ne ajută să analizăm:
- Factorii de risc cardiovascular și respirator
- Considerațiile privind sângerarea și anestezia
- Factorii de risc pentru vindecare și infecție
- Orice autorizare sau monitorizare suplimentară necesară

Înțelegerea acestor factori ne permite să planificăm procedura în siguranță și să recomandăm pașii preoperatori necesari.

Completați chestionarul și aduceți-l la următoarea programare.

Cu stimă,
Echipa [Nume clinică]`
      },
      pre_operative_nutrition_questionnaire: {
        subject: 'Evaluare nutrițională preoperatorie',
        content: `Stimate/Stimată [Prenume pacient],

Nutriția bună susține chirurgia și recuperarea. Completați chestionarul nutrițional preoperator atașat.

Acest chestionar acoperă:
- Obiceiurile alimentare actuale și restricțiile dietetice
- Postul și utilizarea suplimentelor
- Planificarea alimentației postoperatorii acasă

Răspunsurile dvs. ne vor ajuta să oferim recomandări nutriționale personalizate pentru recuperarea chirurgicală.

Completați și returnați înainte de programare.

Cu stimă,
Echipa clinică [Nume clinică]`
      }
    },
    'Rețete și farmacie': {
      antibiotic_prescription: {
        subject: 'Rețetă antibiotic și instrucțiuni',
        content: `Stimate/Stimată [Prenume pacient],

Găsiți atașată rețeta de antibiotic. Acest medicament a fost prescris ca parte a tratamentului dentar.

Instrucțiuni importante:
- Luați exact conform prescripției, chiar dacă vă simțiți mai bine
- Finalizați întregul tratament cu antibiotic
- Luați cu mâncare pentru a reduce iritația gastrică
- Nu consumați alcool în timpul tratamentului

Dacă apar reacții adverse severe sau alergice, contactați imediat clinica sau solicitați îngrijiri de urgență.

Pentru întrebări la farmacie, contactați:
[Nume farmacie]: [Număr telefon]

Cu stimă,
[Nume medic]
[Nume clinică]`
      },
      pain_medication_prescription: {
        subject: 'Rețetă analgezic și recomandări',
        content: `Stimate/Stimată [Prenume pacient],

Rețeta de analgezic este atașată. Urmați aceste recomandări pentru gestionarea sigură a durerii:

Instrucțiuni de dozare:
- Luați doar conform indicațiilor
- Nu depășiți doza prescrisă
- Luați cu mâncare dacă apare disconfort gastric
- Nu conduceți și nu operați utilaje în timpul tratamentului

Sfaturi pentru gestionarea durerii:
- Aplicați gheață în primele 24 de ore pentru a reduce umflătura
- Treceți la comprese calde după 24 de ore
- Repausați și evitați efortul fizic intens
- Contactați-ne dacă durerea se agravează sau nu se ameliorează

Dacă aveți nelămuriri privind durerea sau efectele medicamentului, contactați clinica.

Cu stimă,
[Nume medic]
[Nume clinică]`
      },
      mouthwash_prescription: {
        subject: 'Rețetă apă de gură terapeutică',
        content: `Stimate/Stimată [Prenume pacient],

Găsiți atașată rețeta de apă de gură terapeutică, prescrisă pentru tratamentul parodontal.

Instrucțiuni de utilizare:
- Clătiți de două ori pe zi după periaj și folosirea aței dentare
- Folosiți 15 ml (o lingură) timp de 30 de secunde
- Nu mâncați și nu beți timp de 30 de minute după utilizare
- Continuați utilizarea pe durata prescrisă

Această apă de gură ajută la:
- Reducerea creșterii bacteriene
- Controlul inflamației gingivale
- Susținerea vindecării după tratament

Continuați igiena orală regulată împreună cu această rețetă.

Cu stimă,
[Nume medic]
[Nume clinică]`
      },
      // fluoride_prescription removed - not applicable for plastic surgery
      oral_steroid_prescription: {
        subject: 'Rețetă steroid oral și informații importante',
        content: `Stimate/Stimată [Prenume pacient],

Rețeta de steroid oral este atașată. Acest medicament a fost prescris pentru reducerea inflamației și susținerea vindecării după procedura dentară.

Recomandări importante:
- Luați cu mâncare pentru a preveni iritația gastrică
- Luați la aceeași oră în fiecare zi
- Nu întrerupeți brusc — finalizați întregul tratament
- Monitorizați glicemia dacă sunteți diabetic
- Raportați imediat orice simptom neobișnuit

Efectele secundare posibile includ creșterea apetitului, schimbări de dispoziție sau dificultăți de somn. De obicei sunt temporare.

Nu luați dacă aveți:
- Infecții active
- Vaccinări recente
- Anumite afecțiuni medicale (discutate anterior)

Contactați clinica pentru orice nelămurire.

Cu stimă,
[Nume medic]
[Nume clinică]`
      }
    },
    'Scrisori de trimitere': {
      specialist_surgical_referral: {
        subject: 'Trimitere chirurgicală specialist pentru [Nume pacient]',
        content: `Stimate coleg,

Vă trimit pacientul [Prenume pacient] [Nume pacient] (data nașterii: [Data nașterii]) pentru evaluare și tratament chirurgical de specialitate.

Informații pacient:
- Plângerea principală actuală: [Descrieți problema principală]
- Constatări clinice: [Constatări chirurgicale relevante]
- Istoric chirurgical anterior: [Dacă există]
- Istoric medical: [Afecțiuni medicale relevante]

Motivul trimiterii:
[Nevoi chirurgicale specifice, diagnostic, preocupări funcționale, obiective de tratament]

Aș aprecia evaluarea și recomandările dvs. Trimiteți planul de tratament și calendarul când este disponibil.

Vă mulțumim pentru colaborarea în îngrijirea acestui pacient.

Cu stimă,
[Nume medic], [Titlu]
[Nume clinică]
[Date contact]`
      },
      specialist_referral_periodontist: {
        subject: 'Trimitere parodontologică pentru [Nume pacient]',
        content: `Stimate coleg,

Vă trimit pacientul [Prenume pacient] [Nume pacient] (data nașterii: [Data nașterii]) pentru evaluare și tratament parodontal.

Constatări clinice:
- Adâncimea pungilor parodontale: [Măsurători]
- Sângerare la sondare: [Localizări]
- Pierdere osoasă radiografică: [Descriere]
- Mobilitate: [Numere dinți și grad]
- Starea actuală a igienei orale: [Evaluare]

Pacientul prezintă:
- [Afecțiuni parodontale specifice]
- [Factori de risc prezenți]
- [Istoric tratament parodontal anterior]

Aș aprecia expertiza dvs. în:
- Evaluare parodontală completă
- Planificarea tratamentului avansat
- Recomandări pentru protocol de întreținere

Vă rog să mă țineți la curent cu evoluția tratamentului. Aștept continuarea colaborării.

Cu stimă,
[Nume medic], [Titlu]
[Nume clinică]
[Date contact]`
      },
      specialist_referral_endodontist: {
        subject: 'Trimitere endodontică pentru [Nume pacient]',
        content: `Stimate coleg,

Vă trimit pacientul [Prenume pacient] [Nume pacient] (data nașterii: [Data nașterii]) pentru evaluare și tratament endodontic.

Informații despre dinte:
- Număr dinte: [#]
- Plângerea principală: [Simptome pacient]
- Constatări clinice: [Rezultate teste pulpare, percuție, palpare]
- Constatări radiografice: [Interpretare radiografie]
- Nivel actual al durerii: [Scară 1-10]

Istoric:
- Istoric traume: [Dacă este cazul]
- Tratamente anterioare: [Obturații, coroane etc.]
- Durata simptomelor: [Cronologie]

Pacientul necesită:
- [Tratament de canal/Re-tratament/Apicoectomie/Evaluare]
- [Nivel de urgență]

Intenționez să restaurez acest dinte cu [coroană/obturație] după tratamentul endodontic reușit.

Vă mulțumim pentru expertiză. Contactați-mă pentru întrebări.

Cu stimă,
[Nume medic], [Titlu]
[Nume clinică]
[Date contact]`
      },
      second_opinion_referral: {
        subject: 'Cerere a doua opinie pentru [Nume pacient]',
        content: `Stimate coleg,

Vă trimit pacientul [Prenume pacient] [Nume pacient] (data nașterii: [Data nașterii]) pentru o a doua opinie medicală.

Contextul cazului:
- Afecțiunea prezentă: [Situația dentară actuală]
- Plan de tratament propus: [Recomandările actuale]
- Preocupările pacientului: [Întrebări sau ezitări specifice]
- Factori de complexitate: [Istoric medical, provocări tehnice]

Opțiunile de tratament luate în considerare:
1. [Opțiunea 1 cu avantaje/dezavantaje]
2. [Opțiunea 2 cu avantaje/dezavantaje]
3. [Opțiunea 3 cu avantaje/dezavantaje]

Pacientul ar beneficia de evaluarea dvs. profesională independentă. Vă rog evaluarea privind:
- Confirmarea diagnosticului
- Alternative de tratament
- Evaluarea prognosticului
- Analiza risc-beneficiu

Am atașat radiografii recente și fotografii clinice pentru examinare.

Vă mulțumim pentru acest serviciu valoros acordat pacientului nostru comun.

Cu stimă,
[Nume medic], [Titlu]
[Nume clinică]
[Date contact]`
      },
      oral_surgeon_referral: {
        subject: 'Trimitere chirurgie orală pentru [Nume pacient]',
        content: `Stimate coleg,

Vă trimit pacientul [Prenume pacient] [Nume pacient] (data nașterii: [Data nașterii]) pentru consultație și tratament de chirurgie orală.

Procedura necesară:
- [Extracție/Plasare implant/Grefă osoasă/Biopsie/Altele]
- Număr(e) dinte: [Dacă este cazul]
- Factori de complexitate: [Impactare, proximitate nervi, considerații medicale]

Istoric medical:
- Afecțiuni semnificative: [Afecțiuni medicale relevante]
- Medicamente curente: [Lista medicamentelor importante]
- Alergii: [Alergii la medicamente/materiale]
- Status anticoagulare: [Dacă este cazul]

Informații clinice:
- [Constatări radiografice]
- [Rezultate examinare clinică]
- [Încercări de tratament anterioare]

Considerații speciale:
- [Nevoi de gestionare a anxietății]
- [Cerințe de sedare]
- [Coordonarea îngrijirii postoperatorii]

Coordonați cu clinica noastră calendarul lucrărilor protetice postoperatorii.

Vă mulțumim pentru expertiza chirurgicală.

Cu stimă,
[Nume medic], [Titlu]
[Nume clinică]
[Date contact]`
      }
    },
    'Plăți și administrativ': {
      insurance_payment_policy: {
        subject: 'Important: Politică nouă de plată pentru pacienții neasigurați',
        content: `Stimate/Stimată [Prenume pacient],

Sperăm că vă găsiți bine. Vă informăm despre o actualizare importantă a politicii de plată.

Politică nouă de plată pentru pacienții neasigurați:

Începând cu [Dată], pacienții fără asigurare dentară vor achita serviciile la momentul tratamentului. Acceptăm:
- Carduri de credit și debit
- Plăți numerar
- Planuri de plată (stabilite în prealabil)

Această politică ne ajută să:
- Simplificăm procesele administrative
- Menținem costurile tratamentului accesibile
- Confirmăm imediat serviciile

Înțelegem că poate fi o schimbare și suntem aici să vă ajutăm. Echipa noastră poate:
- Furniza estimări ale costurilor în avans
- Discuta opțiuni de plan de plată
- Explica toate metodele de plată disponibile

Dacă aveți întrebări despre această politică sau doriți să discutați aranjamente de plată, contactați clinica înainte de următoarea programare.

Vă mulțumim pentru înțelegere și încrederea continuă.

Cu stimă,
Echipa [Nume clinică]`
      },
      attachment_attention: {
        subject: 'Important: Verificați documentele atașate',
        content: `Stimate/Stimată [Prenume pacient],

Verificați documentele atașate, care conțin informații importante despre îngrijirea dentară.

Materialele atașate includ:
- [Specificați tipurile de documente]
- [Informații tratament/Rezultate laborator/Instrucțiuni/Altele]

Vă rugăm:
- Să revizuiți cu atenție toate documentele atașate
- Să ne contactați dacă aveți întrebări
- Să aduceți aceste informații la următoarea programare
- Să urmați instrucțiunile specifice furnizate

Dacă nu puteți accesa atașamentele sau aveți nevoie de documente într-un alt format, anunțați-ne și vă vom ajuta cu plăcere.

Înțelegerea acestor informații este importantă pentru succesul tratamentului dvs.

Vă mulțumim pentru atenția acordată acestor materiale.

Cu stimă,
Echipa [Nume clinică]`
      }
    },
    'Gestionare neprezentări': {
      first_missed_appointment: {
        subject: 'Ne-ați lipsit astăzi — fără taxă pentru prima neprezentare',
        content: `Stimate/Stimată [Prenume pacient],

Am observat că nu ați putut participa la programarea de astăzi. Înțelegem că pot apărea situații neprevăzute.

Ca o curtoazie, nu se aplică nicio taxă pentru această primă neprezentare.

Pentru a vă menține sănătatea orală și a continua planul de tratament, contactați clinica pentru reprogramare:
- Telefon: [Telefon clinică]
- E-mail: [Email clinică]

Notă: Politica de anulare — solicităm anunț cu cel puțin 24 de ore pentru modificări, pentru a evita taxe.

Așteptăm cu plăcere să vă vedem în curând și să continuăm îngrijirea dentară.

Cu stimă,
Echipa [Nume clinică]`
      },
      second_missed_appointment: {
        subject: 'A doua neprezentare — taxă de anulare aplicată',
        content: `Stimate/Stimată [Prenume pacient],

Ne-ați lipsit din nou la programarea de astăzi. Aceasta este a doua neprezentare fără anunț prealabil.

Conform politicii clinicii, o taxă de anulare de [Sumă] a fost aplicată contului dvs. pentru această neprezentare. Taxa acoperă timpul rezervat și costurile administrative.

Pentru a evita taxe viitoare și a continua îngrijirea dentară de calitate:
- Anunțați modificările de program cu cel puțin 24 de ore înainte
- Contactați-ne imediat pentru reprogramare
- Discutați cu echipa noastră orice dificultăți de programare

Vă apreciem ca pacient și dorim să găsim împreună intervale convenabile.

Contactați clinica pentru:
- Reprogramarea consultației
- Discutarea taxei de anulare
- Abordarea oricăror preocupări legate de programare

Cu stimă,
Echipa [Nume clinică]`
      },
      multiple_missed_appointments: {
        subject: 'Multiple neprezentări — revizuire cont necesară',
        content: `Stimate/Stimată [Prenume pacient],

Vă contactăm în legătură cu neprezentările multiple fără anunț prealabil. Înțelegem că programarea poate fi dificilă, însă neprezentările repetate afectează capacitatea noastră de a servi toți pacienții eficient.

Status cont:
- Număr de neprezentări: [Număr]
- Taxe de anulare restante: [Sumă]
- Sold curent al contului: [Sumă]

Pași următori:
O taxă de anulare de [Sumă] a fost aplicată pentru neprezentarea de astăzi. Pentru a continua îngrijirea în clinica noastră, este necesar:

1. Să rezolvați soldul restant al contului
2. Să stabiliți un program de consultații fiabil
3. Să anunțați cu 24 de ore înainte orice modificare viitoare

Contactați clinica în 5 zile lucrătoare pentru:
- Programarea și plata în avans a următoarei consultații
- Discutarea aranjamentelor de plată pentru taxele restante
- Abordarea oricăror obstacole în respectarea programărilor

Prețuim relația cu pacienții noștri și dorim să continuăm să vă oferim îngrijire dentară de calitate.

Cu stimă,
Management [Nume clinică]`
      },
      final_warning_dismissal: {
        subject: 'Notificare finală — revizuire relație pacient',
        content: `Stimate/Stimată [Prenume pacient],

După multiple neprezentări și încercări de adaptare la programul dvs., trebuie să abordăm modelul continuu de neconformitate la programări.

Aceasta constituie notificare finală, deoarece:
- Neprezentări repetate fără anunț
- Taxe de anulare restante
- Imposibilitatea menținerii unui program de îngrijire constant

Este posibil să fie necesară încetarea relației medic-pacient dacă aceste probleme nu sunt rezolvate imediat.

Cerințe finale:
- Contactați clinica în 3 zile lucrătoare
- Rezolvați toate soldurile restante
- Angajați-vă să respectați programările
- Anunțați cu 24 de ore înainte orice modificare viitoare

Nerespectarea acestui termen poate duce la încetarea relației. Vă vom oferi 30 de zile preaviz și copii ale dosarului dentar pentru transfer la alt furnizor.

Preferăm să continuăm îngrijirea dvs. și sperăm să rezolvăm aceste probleme prompt.

Contact urgent necesar: [Telefon clinică]

Cu stimă,
Management [Nume clinică]`
      },
      patient_dismissal: {
        subject: 'Notificare de încetare relație și transfer dosar',
        content: `Stimate/Stimată [Prenume pacient],

După analiză atentă și multiple încercări de rezolvare a problemelor de programare și conformitate, am luat decizia dificilă de a înceta relația medic-pacient.

Această decizie se datorează:
- Neprezentărilor constante la programările stabilite
- Neconformității cu politicile clinicii
- Obligațiilor restante ale contului

Data efectivă: [Dată — 30 zile de la notificare]

Ce urmează:
- Aveți 30 de zile pentru a aranja transferul dosarului dentar
- Dosarul va fi furnizat noului medic dentist la cerere scrisă
- Orice sold restant trebuie rezolvat înainte de transfer
- Îngrijirea de urgență va fi oferită doar în perioada de tranziție de 30 de zile

Pentru obținerea dosarului:
1. Furnizați autorizarea scrisă de la noul dentist
2. Includeți datele de contact ale noii clinici
3. Rezolvați orice sold restant al contului

Vă recomandăm să stabiliți îngrijire la un nou medic dentist cât mai curând, pentru a evita întreruperea menținerii sănătății orale.

Dacă aveți întrebări despre această decizie sau procesul de tranziție, contactați managerul clinicii.

Vă dorim tot binele în îngrijirea dentară viitoare.

Cu stimă,
Management [Nume clinică]`
      }
    },
    'Transfer pacient': {
      patient_care_transfer: {
        subject: 'Transfer îngrijire pacient — dosar complet atașat',
        content: `Stimate coleg,

Transferăm îngrijirea pacientului [Prenume pacient] [Nume pacient] (data nașterii: [Data nașterii]) către clinica dvs.

Rezumat pacient:
- ID pacient: [Cod pacient]
- Ultima vizită: [Dată]
- Status actual: [Tratament activ/Întreținere/Tratament finalizat]
- Asigurare: [Informații asigurare]

Dosarul complet atașat include:
- Istoric medical și dentar complet
- Istoricul tratamentelor și procedurilor efectuate
- Medicamentele și alergiile curente
- Radiografii (format digital)
- Fotografii clinice
- Rapoarte de laborator și corespondență
- Grafice și măsurători parodontale
- Planuri de tratament restante
- Rezumat financiar al contului

Status tratament actual:
- [Tratamente în curs și pașii următori]
- [Programări sau urmăriri în așteptare]
- [Recomandări pentru program de recall]
- [Considerații speciale de îngrijire]

Considerații medicale:
- [Afecțiuni medicale relevante]
- [Interacțiuni medicamentoase sau considerații]
- [Informații despre alergii]
- [Nevoi speciale sau adaptări]

Acest pacient este sub îngrijirea noastră din [Dată] și am menținut evidențe complete ale tuturor tratamentelor și interacțiunilor. Credem că va fi o adăugire excelentă pentru clinica dvs.

Dacă aveți nevoie de clarificări privind istoricul tratamentului, constatările sau recomandările, nu ezitați să ne contactați. Ne angajăm să asigurăm o tranziție lină a îngrijirii.

Vă mulțumim că acceptați acest pacient. Suntem convinși că va primi îngrijire excelentă.

Cu stimă,
[Nume medic], [Titlu]
[Nume clinică]
[Date contact]

Atașamente: Dosar complet pacient (protejat cu parolă — contactați-ne pentru acces)`
      }
    },
    'Tratament și urmărire': {
      treatment_followup: {
        subject: 'Cum vă simțiți după tratamentul recent?',
        content: `Sperăm că vă simțiți bine după tratamentul recent. Confortul și vindecarea corectă sunt prioritare pentru noi.

Dacă aveți durere, umflătură sau alte simptome neobișnuite, contactați imediat clinica.`
      },
      post_surgery_care: {
        subject: 'Instrucțiuni postoperatorii',
        content: `Urmați instrucțiunile postoperatorii pentru o vindecare corectă și confort.

La sângerare abundentă, durere severă sau semne de infecție, contactați imediat linia de urgență.`
      },
      treatment_plan_review: {
        subject: 'Planul dvs. personalizat de tratament',
        content: `Am pregătit un plan de tratament adaptat nevoilor dvs. Verificați planul atașat și contactați-ne pentru întrebări.

Suntem aici pentru sănătatea orală optimă și discutăm orice nelămurire.`
      }
    },
    'Facturare și asigurări': {
      payment_reminder: {
        subject: 'Informații de plată pentru vizita recentă',
        content: `Vă mulțumim pentru vizita recentă. Vă contactăm privind plata serviciilor.

Pentru întrebări despre tratament, acoperire asigurare sau plăți, contactați departamentul de facturare.`
      },
      insurance_update: {
        subject: 'Actualizați informațiile de asigurare',
        content: `Actualizăm informațiile de asigurare pentru acoperire corectă.

Aduceți cardul de asigurare la următoarea vizită sau transmiteți datele actualizate.`
      },
      payment_plan_options: {
        subject: 'Opțiuni flexibile de plată disponibile',
        content: `Înțelegem că tratamentul dentar este o investiție. Oferim planuri de plată și opțiuni de finanțare.

Contactați facturarea pentru opțiunea de plată potrivită.`
      }
    },
    'Îngrijire preventivă': {
      oral_hygiene_tips: {
        subject: 'Sfaturi pentru menținerea sănătății orale',
        content: `Sfaturi pentru menținerea sănătății orale între vizite. Igiena zilnică previne problemele dentare.

Periați de două ori pe zi, folosiți ața dentară și mențineți o alimentație sănătoasă. Suntem disponibili pentru întrebări.`
      },
      seasonal_checkup: {
        subject: 'Este timpul pentru controlul dentar sezonier',
        content: `Schimbarea sezonului este un moment potrivit pentru controlul dentar. Prevenția detectează problemele din timp.

Contactați clinica pentru programare și un zâmbet sănătos tot anul.`
      }
    },
    'Urgență': {
      emergency_instructions: {
        subject: 'Instrucțiuni pentru urgențe dentare',
        content: `În caz de urgență dentară, urmați instrucțiunile imediate și contactați linia de urgență.

Pentru durere severă, traumă sau urgențe în afara programului, contactați numărul de urgență.`
      },
      urgent_followup: {
        subject: 'Urmărire urgentă necesară',
        content: `După vizita recentă, programăm o urmărire urgentă pentru monitorizare și vindecare corectă.

Contactați imediat clinica pentru această urmărire importantă.`
      }
    }
  }

  // Telefonbook contacts
  const phonebookContacts = {
    'Membri familie': {
      'Soț/Soție': 'spouse@example.com',
      'Contact urgență': 'emergency@example.com',
      'Părinte/Tutore': 'parent@example.com'
    },
    'Specialiști medicali': {
      'Parodontolog': 'perio.specialist@dentalcare.com',
      'Endodont': 'endo.specialist@dentalcare.com',
      'Ortodont': 'ortho.specialist@dentalcare.com',
      'Chirurg oral': 'surgeon@dentalcare.com',
      'Implantolog': 'implant.specialist@dentalcare.com'
    },
    'Instituții medicale': {
      'Spital general': 'info@generalhospital.com',
      'Urgențe': 'emergency@hospital.com',
      'Centru radiologie': 'imaging@radiology.com',
      'Servicii laborator': 'results@labservices.com'
    },
    'Laborator dentar': {
      'Lab coroane și punți': 'orders@crownbridge.lab',
      'Lab ortodontic': 'cases@ortholab.com',
      'Lab implanturi': 'implants@dentallab.com',
      'Lab general': 'service@dentallab.com'
    },
    'Asigurări și administrativ': {
      'Furnizor asigurări': 'claims@insurance.com',
      'Asigurare dentară': 'dental@insurance.com',
      'Manager clinică': 'manager@dentalpractice.com',
      'Departament facturare': 'billing@dentalpractice.com'
    }
  }

  // Fetch notes and folders
  const { data: notes, refetch: refetchNotes } = useQuery({
    queryKey: ['patient-notes', params.id],
    queryFn: async () => {
      const response = await fetch(`/api/patients/${params.id}/notes`)
      if (!response.ok) throw new Error('Încărcarea notițelor a eșuat')
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
      if (!response.ok) throw new Error('Încărcarea dosarelor a eșuat')
      return response.json()
    }
  })

  // Fetch dental procedures
  const { data: surgicalProcedures, refetch: refetchProcedures } = useQuery({
    queryKey: ['patient-surgical-procedures', params.id],
    queryFn: async () => {
      const response = await fetch(`/api/patients/${params.id}/surgical-procedures`)
      if (!response.ok) throw new Error('Încărcarea procedurilor dentare a eșuat')
      return response.json()
    }
  })

  // Dental codes removed - not applicable for plastic surgery (using surgical procedure codes instead)

  // Note mutations
  const createNote = useMutation({
    mutationFn: async (data: { content: string; folderId?: string | null; isPinned: boolean }) => {
      const response = await fetch(`/api/patients/${params.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Crearea notiței a eșuat')
      return response.json()
    },
    onSuccess: () => {
      refetchNotes()
      refetchFolders()
      toast.success('Notă adăugată cu succes')
    }
  })

  const updateNote = useMutation({
    mutationFn: async (data: { noteId: string; content?: string; isPinned?: boolean; pinOrder?: number | null }) => {
      const response = await fetch(`/api/patients/${params.id}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Actualizarea notiței a eșuat')
      return response.json()
    },
    onSuccess: () => {
      refetchNotes()
      refetchFolders()
      toast.success('Notă actualizată cu succes')
    }
  })

  const deleteNote = useMutation({
    mutationFn: async (noteId: string) => {
      const response = await fetch(`/api/patients/${params.id}/notes?noteId=${noteId}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Ștergerea notiței a eșuat')
    },
    onSuccess: () => {
      refetchNotes()
      refetchFolders()
      toast.success('Notă ștearsă cu succes')
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
      if (!response.ok) throw new Error('Crearea dosarului a eșuat')
      return response.json()
    },
    onSuccess: () => {
      refetchFolders()
      toast.success('Dosar creat cu succes')
    }
  })

  const deleteFolder = useMutation({
    mutationFn: async (folderId: string) => {
      const response = await fetch(`/api/patients/${params.id}/note-folders?folderId=${folderId}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Ștergerea dosarului a eșuat')
    },
    onSuccess: () => {
      refetchFolders()
      refetchNotes()
      toast.success('Dosar șters cu succes')
      setShowDeleteFolderModal(false)
      setFolderToDelete(null)
    },
    onError: () => {
      toast.error('Ștergerea dosarului a eșuat')
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
          throw new Error('Încărcarea pacientului a eșuat')
        }
        const patientData = await response.json()

        // Log patient access
        await logActivityClient({
          action: LOG_ACTIONS.VIEW_PATIENT,
          entityType: ENTITY_TYPES.PATIENT,
          entityId: params.id,
          description: `Acces la dosarul pacientului: ${patientData.firstName} ${patientData.lastName}`,
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
          throw new Error('Încărcarea organizației a eșuat')
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
        throw new Error('Actualizarea pacientului a eșuat')
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
        throw new Error('Ștergerea pacientului a eșuat')
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
        throw new Error('Actualizarea scorului ASA a eșuat')
      }

      return response.json()
    },
    onSuccess: () => {
      setShowAsaModal(false)
      setAsaModalStep('history')
      refetch()
      toast.success('Scorul ASA a fost actualizat cu succes')
    },
    onError: (error: Error) => {
      toast.error('Actualizarea scorului ASA a eșuat: ' + error.message)
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
        throw new Error('Actualizarea scorului PPS a eșuat')
      }

      return response.json()
    },
    onSuccess: () => {
      setShowPpsModal(false)
      setPpsModalStep('history')
      refetch()
      toast.success('Scorul PPS a fost actualizat cu succes')
    },
    onError: (error: Error) => {
      toast.error('Actualizarea scorului PPS a eșuat: ' + error.message)
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
        throw new Error('Actualizarea termenilor de recall screening a eșuat')
      }

      return response.json()
    },
    onSuccess: () => {
      setShowScreeningRecallModal(false)
      setScreeningRecallModalStep('history')
      refetch()
      toast.success('Termenii de recall screening au fost actualizați cu succes')
    },
    onError: (error: Error) => {
      toast.error('Actualizarea termenilor de recall screening a eșuat: ' + error.message)
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
        throw new Error('Actualizarea termenilor de recall curățare a eșuat')
      }

      return response.json()
    },
    onSuccess: () => {
      setShowCleaningRecallModal(false)
      setCleaningRecallModalStep('history')
      refetch()
      toast.success('Termenii de recall curățare au fost actualizați cu succes')
    },
    onError: (error: Error) => {
      toast.error('Actualizarea termenilor de recall curățare a eșuat: ' + error.message)
    },
  })

  const handleStatusSave = async (updatedChartData: any) => {
    // Dental chart save removed - not applicable for plastic surgery
    toast.success('Starea a fost salvată cu succes');
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

  // Helper functions for PPS, screening recall, and cleaning recall removed - not applicable for plastic surgery
  const getLatestPpsData = () => {
    return { scores: null, date: null }
  }

  const getLatestScreeningRecallData = () => {
    return { screeningMonths: null, date: null, customText: null }
  }

  const getLatestCleaningRecallData = () => {
    return { cleaningMonths: null, procedureCode: null, date: null, customText: null }
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
    1: 'Pacient sănătos normal',
    2: 'Pacient cu boală sistemică ușoară',
    3: 'Pacient cu boală sistemică severă',
    4: 'Pacient cu boală sistemică severă, amenințare constantă pentru viață',
    5: 'Pacient moribund care nu este așteptat să supraviețuiască fără operație',
    6: 'Pacient declarat mort cerebral, organele sunt prelevate pentru donare',
  }

  const PPS_DESCRIPTIONS = {
    0: 'Fără dinți în cadran',
    1: '1-3mm pockets',
    2: '4-5mm pockets',
    3: '6+mm pockets',
  }

  // Function to generate medical summary from form data
  const generateMedicalSummary = (formData: typeof asaFormData) => {
    const medicalSummary = []

    if (formData.chestPain) {
      medicalSummary.push("Durere în piept la efort")
      if (formData.chestPainReducedActivity) medicalSummary.push("- Activități reduse din cauza durerii în piept")
      if (formData.chestPainWorsening) medicalSummary.push("- Simptome agravate recent")
      if (formData.chestPainAtRest) medicalSummary.push("- Simptome și în repaus")
    }

    if (formData.heartAttack) {
      medicalSummary.push("Infarct miocardic anterior")
      if (formData.heartAttackStillSymptoms) medicalSummary.push("- Simptome persistente")
      if (formData.heartAttackLast6Months) medicalSummary.push("- Infarct în ultimele 6 luni")
    }

    if (formData.heartMurmur) {
      medicalSummary.push(`Sufluri cardiace/defect valvular: ${formData.heartMurmurDetails || 'Da'}`)
    }

    if (formData.vascularSurgery6Months) {
      medicalSummary.push("Intervenție vasculară în ultimele 6 luni")
    }

    if (formData.pacemakerICD) {
      medicalSummary.push("Pacemaker/ICD/stent")
    }

    if (formData.heartPalpitations) {
      medicalSummary.push("Palpitații fără efort")
      if (formData.heartPalpitationsNeedRest) medicalSummary.push("- Necesită repaus în timpul episoadelor")
      if (formData.heartPalpitationsPaleDizzy) medicalSummary.push("- Paliditate/amețeală în timpul episoadelor")
    }

    if (formData.heartFailure) {
      medicalSummary.push("Insuficiență cardiacă")
      if (formData.heartFailureExtraPillows) medicalSummary.push("- Necesită perne suplimentare pentru respirație")
      if (formData.heartFailureNightBreathing) medicalSummary.push("- Trezire dispneic noaptea")
      if (formData.heartFailureNightUrination) medicalSummary.push("- Urinări frecvente noaptea")
      if (formData.heartFailureSwollenFeet) medicalSummary.push("- Picioare umflate seara")
    }

    if (formData.acuteRheumatism) {
      medicalSummary.push("Reumatism acut anterior")
    }

    if (formData.bloodPressure) {
      medicalSummary.push(`Tensiune arterială: ${formData.bloodPressureValue || 'Scăzută/Ridicată'}`)
    }

    if (formData.bleedingTendency) {
      medicalSummary.push("Tendință la sângerare")
      if (formData.bleedingLongerThan1Hour) medicalSummary.push("- Sângerare peste 1 oră după proceduri")
      if (formData.bleedingBruises) medicalSummary.push("- Vânătăi fără motiv")
      if (formData.bloodThinners) {
        medicalSummary.push(`Anticoagulante: ${formData.bloodThinnersDetails || 'Da'}`)
      }
    }

    if (formData.lungProblems) {
      medicalSummary.push("Probleme pulmonare/tuse persistentă")
      if (formData.lungProblemsStairs) medicalSummary.push("- Dispnee la urcatul scărilor")
      if (formData.lungProblemsDressing) medicalSummary.push("- Dispnee la îmbrăcat")
      if (formData.lungProblemsHyperventilation) medicalSummary.push("- Episoade de hiperventilație/leșin")
    }

    if (formData.prosthesisLast3Months) {
      medicalSummary.push("Proteză în ultimele 3 luni")
    }

    const conditions = []
    if (formData.epilepsy) conditions.push("Epilepsie")
    if (formData.cancerLeukemia) conditions.push("Cancer/Leucemie")
    if (formData.diabetes) conditions.push("Diabet")
    if (formData.hivAids) conditions.push("HIV/AIDS")
    if (formData.thyroidProblems) conditions.push("Probleme tiroidiene")
    if (formData.asthma) conditions.push("Astm")
    if (formData.kidneyDisease) conditions.push("Boală renală")
    if (formData.liverDisease) conditions.push("Boală hepatică")
    if (formData.hepatitisA) conditions.push("Hepatitis A")
    if (formData.hepatitisB) conditions.push("Hepatitis B")
    if (formData.hepatitisC) conditions.push("Hepatitis C")
    if (formData.hepatitisD) conditions.push("Hepatitis D")

    if (conditions.length > 0) {
      medicalSummary.push(`Afecțiuni medicale: ${conditions.join(', ')}`)
    }

    if (formData.otherConditions) {
      medicalSummary.push(`Alte afecțiuni: ${formData.otherConditions}`)
    }

    if (formData.currentMedications) {
      medicalSummary.push(`Medicamente curente: ${formData.currentMedications}`)
    }

    if (formData.allergies) {
      medicalSummary.push(`Alergii: ${formData.allergies}`)
    }

    if (formData.smoking) {
      medicalSummary.push(`Fumat: ${formData.smokingAmount || 'Da'}`)
    }

    if (formData.drinking) {
      medicalSummary.push(`Consum alcool: ${formData.drinkingAmount || 'Da'}`)
    }

    if (formData.pregnancy) {
      medicalSummary.push(`Însărcinată: ${formData.pregnancyWeeks ? `${formData.pregnancyWeeks} săptămâni` : 'Da'}`)
      if (formData.pregnancyComplications) {
        medicalSummary.push(`Complicații sarcină: ${formData.pregnancyComplications}`)
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
        throw new Error('Încărcarea fișierului a eșuat')
      }

      // Refetch patient data to get updated files
      await refetch()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Încărcarea fișierului a eșuat')
    }
  }

  // Dental data hook removed - using surgical procedures directly
  // dentalChart and periodontalChart removed - not applicable for plastic surgery

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


  const handlePeriodontalSave = async (data: any) => {
    try {
      // Periodontal chart save removed - not applicable for plastic surgery
      // await updateDentalData({
      //   periodontalChart: mapComponentToAPIData(
      //     data.teeth,
      //     params.id,
      //     data.chartType,
      //     data.isExplicitlySaved
      //   )
      // })

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

      toast.success('Graficul parodontal a fost actualizat cu succes')
    } catch (error) {
      toast.error('Actualizarea graficului parodontal a eșuat')
    }
  }

  // Function to analyze periodontal data and suggest scaling treatments for individual teeth
  // Removed - not applicable for plastic surgery
  const analyzePeriodontalDataForScaling = (teeth: Record<number, any>) => {
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
            description: 'Tratament parodontal complex',
            maxDepth,
            hasInflammation,
            reason: `${maxDepth}mm (multi-rădăcină)`,
            urgency: 'high'
          }
        } else if (maxDepth >= 4) {
          treatment = {
            id: `tooth-${toothNumber}-t022`,
            toothNumber,
            code: 't022',
            description: 'Tratament parodontal standard',
            maxDepth,
            hasInflammation,
            reason: `${maxDepth}mm (multi-rădăcină)`,
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
            description: 'Tratament parodontal complex',
            maxDepth,
            hasInflammation,
            reason: `${maxDepth}mm (mono-rădăcină)`,
            urgency: 'high'
          }
        } else if (maxDepth >= 4) {
          treatment = {
            id: `tooth-${toothNumber}-t022`,
            toothNumber,
            code: 't022',
            description: 'Tratament parodontal standard',
            maxDepth,
            hasInflammation,
            reason: `${maxDepth}mm (mono-rădăcină)`,
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
      toast.error('Selectați un cod de tratament')
      return
    }

    // Check if tooth number is required for this code
    const toothSpecificCodes = ['t021', 't022']
    const isToothSpecific = toothSpecificCodes.includes(editForm.code)

    if (isToothSpecific && !editForm.toothNumber) {
      toast.error('Introduceți numărul dintelui pentru acest tratament')
      return
    }

    let toothNum = null
    if (editForm.toothNumber) {
      toothNum = parseInt(editForm.toothNumber)
      if (isNaN(toothNum) || toothNum < 11 || toothNum > 48) {
        toast.error('Introduceți un număr valid de dinte (11-48)')
        return
      }
    }

    const codeMap = {
      't021': 'Tratament parodontal complex',
      't022': 'Tratament parodontal standard',
      'a10': 'Examinare clinică',
      'x10': 'Radiografie bite-wing',
      't012': 'Îndepărtare placă supra-gingivală',
      't032': 'Instrucțiuni de igienă orală',
      't042': 'Curățare parodontală',
      't043': 'Curățare parodontală extinsă',
      't044': 'Întreținere parodontală'
    }

    const updatedTreatment = {
      ...editingTreatment,
      toothNumber: toothNum,
      code: editForm.code,
      description: codeMap[editForm.code] || 'Tratament personalizat'
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
    toast.success('Tratament actualizat cu succes')
  }

  // Add treatment modal functions
  const openAddTreatmentModal = () => {
    setAddForm({ toothNumber: '', code: '' })
    setShowAddTreatmentModal(true)
  }

  const handleAddTreatmentSave = () => {
    if (!addForm.toothNumber || !addForm.code) {
      toast.error('Completați toate câmpurile')
      return
    }

    const toothNum = parseInt(addForm.toothNumber)
    if (isNaN(toothNum) || toothNum < 11 || toothNum > 48) {
      toast.error('Introduceți un număr valid de dinte (11-48)')
      return
    }

    const codeMap = {
      't021': 'Tratament parodontal complex',
      't022': 'Tratament parodontal standard'
    }

    const customTreatment = {
      id: `custom-${toothNum}-${Date.now()}`,
      toothNumber: toothNum,
      code: addForm.code,
      description: codeMap[addForm.code] || 'Tratament personalizat',
      maxDepth: 0,
      hasInflammation: false,
      reason: 'Adăugat manual',
      urgency: 'medium'
    }

    setSuggestedTeethTreatments(prev => [...prev, customTreatment])
    setSelectedTreatments(prev => [...prev, customTreatment])
    setShowAddTreatmentModal(false)
    toast.success('Tratament personalizat adăugat cu succes')
  }

  const handleQuickCodeAdd = (code: string) => {
    const codeMap = {
      'a10': 'Examinare clinică',
      'x10': 'Radiografie bite-wing',
      't012': 'Îndepărtare placă supra-gingivală',
      't032': 'Instrucțiuni de igienă orală',
      't042': 'Curățare parodontală',
      't043': 'Curățare parodontală extinsă',
      't044': 'Întreținere parodontală'
    }

    const quickTreatment = {
      id: `quick-${code}-${Date.now()}`,
      toothNumber: null, // No tooth number for standalone treatments
      code: code,
      description: codeMap[code] || 'Tratament rapid',
      maxDepth: 0,
      hasInflammation: false,
      reason: 'Adăugare rapidă',
      urgency: 'medium'
    }

    setSuggestedTeethTreatments(prev => [...prev, quickTreatment])
    setSelectedTreatments(prev => [...prev, quickTreatment])
    toast.success(`${code.toUpperCase()} adăugat în lista de tratamente`)
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
  }, [surgicalProcedures]);



  // Initialize email content when modal opens
  useEffect(() => {
    if (showEmailModal && !emailFormData.content) {
      setEmailFormData(prev => ({
        ...prev,
        content: `Stimate/Stimată ${patient?.firstName} ${patient?.lastName},\n\n\n\nCu stimă,\n${organization?.name || 'Clinica noastră dentară'}\n${organization?.address || ''}\n${organization?.phone || ''}`
      }));
    }
  }, [showEmailModal, patient, organization]);

  const [pendingProcedureId, setPendingProcedureId] = useState<string | null>(null);

  const handleProcedureCreat = async (procedure?: any) => {
    if (procedure) {
      setUndoStack(prev => [...prev, [procedure]]);
    }
    await refetchProcedures();
    queryClient.invalidateQueries({ queryKey: ['patient-surgical-procedures', params.id] });
    await queryClient.refetchQueries({ queryKey: ['patient-surgical-procedures', params.id] });
  };

  // Helper functions for communication modals

  const handleEmailTemplateSelect = (categoryKey: string, templateKey: string) => {
    const template = emailȘabloane[categoryKey][templateKey];
    setEmailFormData(prev => ({
      ...prev,
      subject: template.subject,
      content: `Stimate/Stimată ${patient?.firstName} ${patient?.lastName},\n\n${template.content}\n\nCu stimă,\n${organization?.name || 'Clinica noastră dentară'}\n${organization?.address || ''}\n${organization?.phone || ''}`
    }));
  };

  const toggleCategorie = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Cute colors for each template category
  const getCategorieColor = (category: string) => {
    const colors: Record<string, string> = {
      'Bun venit și pacienți noi': 'bg-pink-50 border-pink-200 text-pink-800',
      'Programări și planificare': 'bg-blue-50 border-blue-200 text-blue-800',
      'Chestionare pacient': 'bg-purple-50 border-purple-200 text-purple-800',
      'Rețete și farmacie': 'bg-teal-50 border-teal-200 text-teal-800',
      'Scrisori de trimitere': 'bg-indigo-50 border-indigo-200 text-indigo-800',
      'Plăți și administrativ': 'bg-orange-50 border-orange-200 text-orange-800',
      'Gestionare neprezentări': 'bg-rose-50 border-rose-200 text-rose-800',
      'Transfer pacient': 'bg-cyan-50 border-cyan-200 text-cyan-800',
      'Tratament și urmărire': 'bg-green-50 border-green-200 text-green-800',
      'Facturare și asigurări': 'bg-amber-50 border-amber-200 text-amber-800',
      'Îngrijire preventivă': 'bg-emerald-50 border-emerald-200 text-emerald-800',
      'Urgență': 'bg-red-50 border-red-200 text-red-800'
    };
    return colors[category] || 'bg-gray-50 border-gray-200 text-gray-800';
  };

  const getCategorieHeaderColor = (category: string) => {
    const colors: Record<string, string> = {
      'Bun venit și pacienți noi': 'text-pink-700',
      'Programări și planificare': 'text-blue-700',
      'Chestionare pacient': 'text-purple-700',
      'Rețete și farmacie': 'text-teal-700',
      'Scrisori de trimitere': 'text-indigo-700',
      'Plăți și administrativ': 'text-orange-700',
      'Gestionare neprezentări': 'text-rose-700',
      'Transfer pacient': 'text-cyan-700',
      'Tratament și urmărire': 'text-green-700',
      'Facturare și asigurări': 'text-amber-700',
      'Îngrijire preventivă': 'text-emerald-700',
      'Urgență': 'text-red-700'
    };
    return colors[category] || 'text-gray-700';
  };

  const filteredȘabloane = () => {
    if (!templateSearch.trim()) return emailȘabloane;

    const filtered: any = {};
    Object.entries(emailȘabloane).forEach(([category, templates]) => {
      const matchingȘabloane: any = {};
      Object.entries(templates as any).forEach(([key, template]: [string, any]) => {
        if (
          template.subject.toLowerCase().includes(templateSearch.toLowerCase()) ||
          template.content.toLowerCase().includes(templateSearch.toLowerCase()) ||
          category.toLowerCase().includes(templateSearch.toLowerCase())
        ) {
          matchingȘabloane[key] = template;
        }
      });
      if (Object.keys(matchingȘabloane).length > 0) {
        filtered[category] = matchingȘabloane;
      }
    });
    return filtered;
  };

  const handleSendEmail = async () => {
    // Simulate sending email
    toast.success('Email trimis cu succes!');
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
      setEmailInputError('Introduceți o adresă de email validă');
      return false;
    } else if (emailFormData.recipients.includes(email)) {
      setEmailInputError('E-mailul a fost deja adăugat');
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
      subject: `Buget de tratament - ${patient?.firstName} ${patient?.lastName}`,
      content: `Stimate/Stimată ${patient?.firstName} ${patient?.lastName},\n\nGăsiți atașat bugetul de tratament.\n\nCu stimă,\n${organization?.name || 'Clinica dentară'}`,
      selectedFiles: [...prev.selectedFiles] // Add budget file handling if needed
    }));

    // Open email modal
    setShowEmailModal(true);

    // Note: For full implementation, you'd need to handle PDF attachments in the email system
    toast.success('Buget pregătit pentru email — atașați manual deocamdată');
  };

  const handlePrintLabel = () => {
    try {
      if (!patient) return

      printPatientLabel({
        firstName: patient.firstName,
        lastName: patient.lastName,
        patientCode: patient.patientCode,
        dateOfBirth: patient.dateOfBirth,
        address: patient.address.display_name,
        phone: patient.phone,
        email: patient.email,
      })
    } catch (error) {
      console.error('Error printing patient label', error)
      toast.error('Tipărirea etichetei pacientului a eșuat')
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // CTRL+Z handler for undo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        const last = undoStack.pop();
        if (last && last.length) {
          setUndoStack(prev => prev.slice(0, -1));
          Promise.all(
            last.map(p =>
              fetch('/api/surgical-procedures/undo', {
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
                      if (err.code === 'NO_LOG') toast.error('Nimic de anulat.');
                      else if (err.code === 'NO_BACKUP_DELETE' || err.code === 'NO_BACKUP_EDIT') toast.error('Restaurare imposibilă, backup lipsă.');
                      else if (err.code === 'PROCEDURE_NOT_FOUND') toast.error('Procedura nu a fost găsită pentru anulare.');
                      else if (err.code === 'UNAUTHORIZED') toast.error('Nu aveți autorizație pentru anulare.');
                      else toast.error(err.error || 'Anularea a eșuat');
                    } else {
                      toast.error('Anularea a eșuat');
                    }
                    throw new Error(err.error || 'Anularea a eșuat');
                  }
                  return res.json();
                })
            )
          )
            .then(() => {
              toast.success('Anulare reușită');
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
        fetch('/api/surgical-procedures/redo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
          .then(async res => {
            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              if (err && err.code) {
                if (err.code === 'NO_UNDO_LOG') toast.error('Nimic de refăcut.');
                else if (err.code === 'ALREADY_PROCESSED') {
                  // This is expected when multiple requests arrive - just refresh the UI
                  toast.success('Refacere finalizată');
                  refetchProcedures();
                }
                else if (err.code === 'NO_ORIGINAL_DATA') toast.error('Refacere imposibilă, datele originale lipsesc.');
                else if (err.code === 'PROCEDURE_NOT_FOUND') toast.error('Procedura nu a fost găsită pentru refacere.');
                else if (err.code === 'UNAUTHORIZED') toast.error('Nu aveți autorizație pentru refacere.');
                else toast.error(err.error || 'Refacerea a eșuat');
              } else {
                toast.error('Refacerea a eșuat');
              }
              throw new Error(err.error || 'Refacerea a eșuat');
            }
            return res.json();
          })
          .then(() => {
            toast.success('Refacere reușită');
            refetchProcedures();
          })
          .catch((error) => {
            console.error('Error during redo:', error);
          });
      }
      // Space: toggle scroll between clinical info and images
      if (e.code === 'Space') {
        if (isEditableKeyboardTarget(e.target)) return;
        e.preventDefault();
        const scrollEl = scrollContainerRef.current;
        if (!scrollEl) return;
        scrollEl.scrollTo({
          top: isScrollAtBottom(scrollEl) ? 0 : scrollEl.scrollHeight - scrollEl.clientHeight,
          behavior: 'smooth',
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoStack, refetchProcedures, scrollContainerRef]);

  // Fetch all users (practitioners)
  const { data: users = [] } = useQuery({
    queryKey: ['practitioners'],
    queryFn: async () => {
      const response = await fetch('/api/practitioners');
      if (!response.ok) throw new Error('Încărcarea practicienilor a eșuat');
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
        <h2 className="text-2xl font-semibold text-gray-900">Eroare la încărcarea pacientului</h2>
        <p className="mt-2 text-gray-600">
          {queryError instanceof Error ? queryError.message : 'Pacient negăsit'}
        </p>
        <Button
          onClick={() => router.push('/dashboard/patients')}
          className="mt-4"
        >
          Înapoi la pacienți
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full h-full p-0 m-0 bg-gray-100 flex flex-col min-h-0">
      {/* WLZ Badge */}
      {patient?.isLongTermCareAct && (
        <div className="print:hidden shrink-0 p-2">
          <span className="inline-flex items-center px-3 py-1 rounded text-sm font-medium bg-purple-100 text-purple-800 border border-purple-300">
            WLZ
          </span>
        </div>
      )}
      {/* Two-screen layout: clinical info + images below fold */}
      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-y-auto scroll-smooth"
      >
        <div
          style={{ height: sectionHeight || '100%' }}
          className="min-h-0 overflow-hidden"
        >
        <div className="min-h-0 overflow-hidden grid grid-cols-[220px_1fr] grid-rows-[minmax(0,1fr)_38%] gap-1 h-full">
        {/* Left sidebar: patient card + important notes */}
        <div className="col-start-1 row-start-1 row-span-2 flex flex-col gap-2 min-h-0">
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
                cnp: patient.cnp,
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
            isDisabled={patient.isDisabled}
          />
          <PatientGoalsHistoryCard
            patientId={params.id}
            surgicalHistory={patient.surgicalHistory}
            visitReason={patient.medicalHistory?.visitReason}
            onSaved={() => refetch()}
          />
          <ImportantNotesCard
            noteFolders={noteFolders}
            notes={notes}
            onSettingsClick={() => setShowNotesSettingsModal(true)}
            onAddNoteClick={() => {
              setSelectedFolder(null)
              setShowAddNoteModal(true)
            }}
          />
        </div>
        {/* Surgical procedures: entry form + procedure list in one panel */}
        <div className="col-start-2 row-start-1 row-span-2 flex flex-col min-h-0 border-2 border-blue-400 bg-white rounded-xl overflow-hidden">
          <div className="flex flex-col flex-1 min-h-0">
          {/* Sticky Header: Procedure search + action buttons */}
          <div className="sticky top-0 bg-white z-30 border-b shrink-0">
            <div className="flex items-center gap-2 p-2 h-10">
              {organization?.id ? (
                <SurgicalCodeSearch
                  onSelect={(code) => {
                    setAddProcedureCode(code);
                    setShowAddProcedureModal(true);
                  }}
                  className="w-full max-w-md shrink-0"
                />
              ) : (
                <div className="w-full max-w-md shrink-0 h-10 flex items-center justify-center"><span className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></span></div>
              )}
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowShopModal(true)}
                  disabled={patient?.isDisabled}
                  title="Magazin – achiziție produse"
                >
                  <ShoppingCart className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilesModal(true)}
                  title="Fișiere și documente pacient"
                >
                  <Files className="h-4 w-4" />
                </Button>
                {patient?.healthInsurance && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowInsuranceModal(true)}
                    title="Vizualizare detalii asigurare"
                  >
                    <Euro className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrintLabel}
                  title="Tipărire etichetă pacient"
                >
                  <Tag className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPrintModal(true)}
                  title="Tipărire fișă pacient"
                >
                  <Printer className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTasksModal(true)}
                  title="Vizualizare sarcini pacient"
                >
                  <ClipboardList className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowWaitingModal(true)}
                  title="Intrări listă de așteptare"
                >
                  <Clock className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-hidden">
            <TreatmentPlan
              patientId={params.id}
              procedures={surgicalProcedures || []}
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
        </div>
        </div>
        </div>

        {/* Patient Imagini */}
        <div
          style={{ height: sectionHeight || '100%' }}
          className="min-h-0 overflow-hidden"
        >
          <EnhancedPatientImagesSection
            patientId={params.id}
            patientFiles={patient?.files || []}
            patientImages={patientImages}
            onRefresh={() => {
              void refetchImages();
            }}
          />
        </div>
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
        {/* Editează pacient Modal */}
        <Dialog open={showEditModal} onOpenChange={(open) => {
          setShowEditModal(open)
          if (!open) {
            setSelectedAddress(null)
          }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editează informații pacient</DialogTitle>
              <DialogDescription>
                Actualizați informațiile personale ale pacientului
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
                  cnp: editFormData.cnp,
                  country: editFormData.country,
                  allowEarlySpotContact: editFormData.allowEarlySpotContact
                }

                // Check if address was actually changed
                const originalAddress = patient.address.display_name || ''
                const hasAddressChanged = selectedAddress !== null || editFormData.address !== originalAddress

                if (hasAddressChanged && selectedAddress) {
                  // Adresă was changed via autocomplete
                  updateData.address = {
                    display_name: selectedAddress.display_name,
                    lat: selectedAddress.lat,
                    lon: selectedAddress.lon
                  }
                  console.log('Adresă changed via autocomplete:', updateData.address)
                } else if (hasAddressChanged && !selectedAddress && editFormData.address !== originalAddress) {
                  // Adresă was manually typed (rare case)
                  updateData.address = {
                    display_name: editFormData.address,
                    lat: patient.address.lat || '',
                    lon: patient.address.lon || ''
                  }
                  console.log('Adresă manually changed:', updateData.address)
                } else {
                  console.log('Adresă NOT changed - excluding from update')
                }

                console.log('Final updateData being sent to API:', updateData)
                await updatePatient.mutateAsync(updateData)
                setShowEditModal(false)
                setSelectedAddress(null)
                await refetch()
                toast.success('Informațiile pacientului au fost actualizate cu succes')
              } catch (error) {
                console.error('Update error:', error)
                toast.error('Actualizarea informațiilor pacientului a eșuat')
              }
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Prenume</Label>
                  <Input
                    id="firstName"
                    value={editFormData.firstName}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Nume</Label>
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
                  <Label htmlFor="dateOfBirth">Data nașterii</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={editFormData.dateOfBirth}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Sex</Label>
                  <Select value={editFormData.gender} onValueChange={(value) => setEditFormData(prev => ({ ...prev, gender: value as 'MALE' | 'FEMALE' | 'OTHER' }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Masculin</SelectItem>
                      <SelectItem value="FEMALE">Feminin</SelectItem>
                      <SelectItem value="OTHER">Altul</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="address">Adresă</Label>
                <AddressAutocomplete
                  onSelect={(result) => {
                    setEditFormData(prev => ({ ...prev, address: result.display_name }))
                    setSelectedAddress(result)
                  }}
                  placeholder="Introduceți adresa..."
                  className="w-full"
                  value={editFormData.address}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cnp">CNP</Label>
                  <Input
                    id="cnp"
                    value={editFormData.cnp}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, cnp: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="country">Țară</Label>
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
                  Anulează
                </Button>
                <Button type="submit" disabled={updatePatient.isPending}>
                  {updatePatient.isPending ? 'Se salvează...' : 'Salvează modificările'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        {/* Șterge confirm modal (unchanged) */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <Card className="p-6 max-w-sm w-full">
              <h3 className="text-lg font-medium mb-4">Șterge pacient</h3>
              <p className="text-gray-500 mb-4">
                Sigur doriți să ștergeți pe {patient.firstName} {patient.lastName}? Această acțiune
                nu poate fi anulată.
              </p>
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                  Anulează
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deletePatient.mutate()}
                  disabled={deletePatient.isPending}
                >
                  {deletePatient.isPending ? 'Se șterge...' : 'Șterge'}
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
              <DialogTitle>Evaluare status fizic ASA</DialogTitle>
              <DialogDescription>
                {asaModalStep === 'history' && 'Vizualizați istoricul scorurilor ASA și adăugați o evaluare nouă'}
                {asaModalStep === 'assessment' && 'Revizuiți și actualizați evaluarea de sănătate'}
                {asaModalStep === 'score' && 'Selectați scorul ASA și adăugați note'}
              </DialogDescription>
            </DialogHeader>

            {asaModalStep === 'history' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Istoric scor ASA</h3>
                  <Button onClick={() => setAsaModalStep('assessment')} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Evaluare nouă
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
                                <p className="text-sm text-gray-500">De {[(() => {
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
                      <p>Nicio evaluare ASA înregistrată încă</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {asaModalStep === 'assessment' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Chestionar medical</h3>
                  <Button variant="outline" onClick={() => setAsaModalStep('history')}>
                    Înapoi la istoric
                  </Button>
                </div>

                {/* Cardiovascular Section */}
                <div className="space-y-4">
                  <h4 className="font-medium text-blue-700">Sănătate cardiovasculară</h4>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="chestPain"
                        checked={asaFormData.chestPain}
                        onChange={(e) => updateAsaFormData({ chestPain: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="chestPain">Aveți durere/ strângere în piept la efort?</Label>
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
                          <Label htmlFor="chestPainReducedActivity">Ați fost nevoit să vă reduceți activitățile?</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="chestPainWorsening"
                            checked={asaFormData.chestPainWorsening}
                            onChange={(e) => updateAsaFormData({ chestPainWorsening: e.target.checked })}
                            className="rounded"
                          />
                          <Label htmlFor="chestPainWorsening">Simptomele s-au agravat recent?</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="chestPainAtRest"
                            checked={asaFormData.chestPainAtRest}
                            onChange={(e) => updateAsaFormData({ chestPainAtRest: e.target.checked })}
                            className="rounded"
                          />
                          <Label htmlFor="chestPainAtRest">Aveți simptome și în repaus?</Label>
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
                      <Label htmlFor="heartAttack">Ați avut infarct miocardic?</Label>
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
                          <Label htmlFor="heartAttackStillSymptoms">Mai aveți simptome?</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="heartAttackLast6Months"
                            checked={asaFormData.heartAttackLast6Months}
                            onChange={(e) => updateAsaFormData({ heartAttackLast6Months: e.target.checked })}
                            className="rounded"
                          />
                          <Label htmlFor="heartAttackLast6Months">Ați avut infarct în ultimele 6 luni?</Label>
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
                      <Label htmlFor="heartMurmur">Aveți sufluri cardiace, defect valvular sau valvă artificială?</Label>
                    </div>
                    {asaFormData.heartMurmur && (
                      <div className="ml-6">
                        <Label htmlFor="heartMurmurDetails">Dacă da, care:</Label>
                        <Input
                          id="heartMurmurDetails"
                          value={asaFormData.heartMurmurDetails}
                          onChange={(e) => updateAsaFormData({ heartMurmurDetails: e.target.value })}
                          placeholder="Detalii"
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
                      <Label htmlFor="vascularSurgery6Months">Ați suferit intervenție vasculară în ultimele 6 luni?</Label>
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
                      <Label htmlFor="pacemakerICD">Aveți pacemaker/ICD/stent?</Label>
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
                      <Label htmlFor="heartPalpitations">Aveți episoade de palpitații fără efort?</Label>
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
                          <Label htmlFor="heartPalpitationsNeedRest">Trebuie să vă odihniți, să stați jos sau culcat în timpul episoadelor?</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="heartPalpitationsPaleDizzy"
                            checked={asaFormData.heartPalpitationsPaleDizzy}
                            onChange={(e) => updateAsaFormData({ heartPalpitationsPaleDizzy: e.target.checked })}
                            className="rounded"
                          />
                          <Label htmlFor="heartPalpitationsPaleDizzy">Deveniți palid, amețit sau dispneic în timpul episoadelor?</Label>
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
                      <Label htmlFor="heartFailure">Suferiți de insuficiență cardiacă?</Label>
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
                          <Label htmlFor="heartFailureExtraPillows">Aveți nevoie de mai mult de 2 perne din cauza dispneei?</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="heartFailureNightBreathing"
                            checked={asaFormData.heartFailureNightBreathing}
                            onChange={(e) => updateAsaFormData({ heartFailureNightBreathing: e.target.checked })}
                            className="rounded"
                          />
                          <Label htmlFor="heartFailureNightBreathing">Vă treziți dispneic noaptea?</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="heartFailureNightUrination"
                            checked={asaFormData.heartFailureNightUrination}
                            onChange={(e) => updateAsaFormData({ heartFailureNightUrination: e.target.checked })}
                            className="rounded"
                          />
                          <Label htmlFor="heartFailureNightUrination">Urinați de mai mult de 2 ori pe noapte?</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="heartFailureSwollenFeet"
                            checked={asaFormData.heartFailureSwollenFeet}
                            onChange={(e) => updateAsaFormData({ heartFailureSwollenFeet: e.target.checked })}
                            className="rounded"
                          />
                          <Label htmlFor="heartFailureSwollenFeet">Aveți picioare umflate seara?</Label>
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
                      <Label htmlFor="acuteRheumatism">Ați avut reumatism acut?</Label>
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
                      <Label htmlFor="bloodPressure">Aveți tensiune arterială scăzută/ridicată?</Label>
                    </div>
                    {asaFormData.bloodPressure && (
                      <div className="ml-6">
                        <Label htmlFor="bloodPressureValue">Tensiunea arterială:</Label>
                        <Input
                          id="bloodPressureValue"
                          value={asaFormData.bloodPressureValue}
                          onChange={(e) => updateAsaFormData({ bloodPressureValue: e.target.value })}
                          placeholder="ex.: 120/80"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Bleeding Section */}
                <div className="space-y-4">
                  <h4 className="font-medium text-blue-700">Tendință la sângerare</h4>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="bleedingTendency"
                        checked={asaFormData.bleedingTendency}
                        onChange={(e) => updateAsaFormData({ bleedingTendency: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="bleedingTendency">Aveți tendință la sângerare?</Label>
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
                          <Label htmlFor="bleedingLongerThan1Hour">Sângerați mai mult de 1 oră după leziuni sau proceduri?</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="bleedingBruises"
                            checked={asaFormData.bleedingBruises}
                            onChange={(e) => updateAsaFormData({ bleedingBruises: e.target.checked })}
                            className="rounded"
                          />
                          <Label htmlFor="bleedingBruises">Apare vânătaie fără motiv?</Label>
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
                            <Label htmlFor="bloodThinners">Luați anticoagulante?</Label>
                          </div>
                          {asaFormData.bloodThinners && (
                            <div className="ml-6">
                              <Label htmlFor="bloodThinnersDetails">Dacă da, care:</Label>
                              <Input
                                id="bloodThinnersDetails"
                                value={asaFormData.bloodThinnersDetails}
                                onChange={(e) => updateAsaFormData({ bloodThinnersDetails: e.target.value })}
                                placeholder="ex.: Warfarin, Aspirină etc."
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
                  <h4 className="font-medium text-blue-700">Sănătate respiratorie</h4>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="lungProblems"
                        checked={asaFormData.lungProblems}
                        onChange={(e) => updateAsaFormData({ lungProblems: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="lungProblems">Aveți probleme pulmonare/tuse persistentă?</Label>
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
                          <Label htmlFor="lungProblemsStairs">Sunteți dispneic după ~20 trepte?</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="lungProblemsDressing"
                            checked={asaFormData.lungProblemsDressing}
                            onChange={(e) => updateAsaFormData({ lungProblemsDressing: e.target.checked })}
                            className="rounded"
                          />
                          <Label htmlFor="lungProblemsDressing">Sunteți dispneic când vă îmbracați?</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="lungProblemsHyperventilation"
                            checked={asaFormData.lungProblemsHyperventilation}
                            onChange={(e) => updateAsaFormData({ lungProblemsHyperventilation: e.target.checked })}
                            className="rounded"
                          />
                          <Label htmlFor="lungProblemsHyperventilation">Aveți episoade de hiperventilație/leșin?</Label>
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
                      <Label htmlFor="prosthesisLast3Months">Ați primit proteză în ultimele 3 luni?</Label>
                    </div>
                  </div>
                </div>

                {/* Specific Conditions */}
                <div className="space-y-4">
                  <h4 className="font-medium text-blue-700">Afecțiuni specifice</h4>
                  <p className="text-sm text-gray-600">Suferiți de următoarele afecțiuni:</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="epilepsy"
                        checked={asaFormData.epilepsy}
                        onChange={(e) => updateAsaFormData({ epilepsy: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="epilepsy">Epilepsie</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="cancerLeukemia"
                        checked={asaFormData.cancerLeukemia}
                        onChange={(e) => updateAsaFormData({ cancerLeukemia: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="cancerLeukemia">Cancer/Leucemie</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="diabetes"
                        checked={asaFormData.diabetes}
                        onChange={(e) => updateAsaFormData({ diabetes: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="diabetes">Diabet</Label>
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
                      <Label htmlFor="thyroidProblems">Probleme tiroidiene</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="asthma"
                        checked={asaFormData.asthma}
                        onChange={(e) => updateAsaFormData({ asthma: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="asthma">Astm</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="kidneyDisease"
                        checked={asaFormData.kidneyDisease}
                        onChange={(e) => updateAsaFormData({ kidneyDisease: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="kidneyDisease">Boală renală</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="liverDisease"
                        checked={asaFormData.liverDisease}
                        onChange={(e) => updateAsaFormData({ liverDisease: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="liverDisease">Boală hepatică</Label>
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
                    <Label htmlFor="otherConditions">Alte afecțiuni:</Label>
                    <Textarea
                      id="otherConditions"
                      value={asaFormData.otherConditions}
                      onChange={(e) => updateAsaFormData({ otherConditions: e.target.value })}
                      placeholder="Specificați alte afecțiuni medicale"
                      rows={2}
                    />
                  </div>
                </div>

                {/* Lifestyle Questions */}
                <div className="space-y-4">
                  <h4 className="font-medium text-blue-700">Întrebări despre stil de viață</h4>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="smoking"
                        checked={asaFormData.smoking}
                        onChange={(e) => updateAsaFormData({ smoking: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="smoking">Fumați?</Label>
                    </div>
                    {asaFormData.smoking && (
                      <div className="ml-6">
                        <Label htmlFor="smokingAmount">Cantitate:</Label>
                        <Input
                          id="smokingAmount"
                          value={asaFormData.smokingAmount}
                          onChange={(e) => updateAsaFormData({ smokingAmount: e.target.value })}
                          placeholder="ex.: 1 pachet/zi"
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
                      <Label htmlFor="drinking">Consumați alcool?</Label>
                    </div>
                    {asaFormData.drinking && (
                      <div className="ml-6">
                        <Label htmlFor="drinkingAmount">Cantitate:</Label>
                        <Input
                          id="drinkingAmount"
                          value={asaFormData.drinkingAmount}
                          onChange={(e) => updateAsaFormData({ drinkingAmount: e.target.value })}
                          placeholder="ex.: 1 pahar/zi"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Pregnancy Questions */}
                {patient?.gender === 'FEMALE' && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-blue-700">Întrebări despre sarcină</h4>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="pregnancy"
                          checked={asaFormData.pregnancy}
                          onChange={(e) => updateAsaFormData({ pregnancy: e.target.checked })}
                          className="rounded"
                        />
                        <Label htmlFor="pregnancy">Sunteți însărcinată?</Label>
                      </div>
                      {asaFormData.pregnancy && (
                        <div className="ml-6 space-y-2">
                          <div>
                            <Label htmlFor="pregnancyWeeks">Săptămâni:</Label>
                            <Input
                              id="pregnancyWeeks"
                              value={asaFormData.pregnancyWeeks}
                              onChange={(e) => updateAsaFormData({ pregnancyWeeks: e.target.value })}
                              placeholder="ex.: 12"
                            />
                          </div>
                          <div>
                            <Label htmlFor="pregnancyComplications">Complicații:</Label>
                            <Textarea
                              id="pregnancyComplications"
                              value={asaFormData.pregnancyComplications}
                              onChange={(e) => updateAsaFormData({ pregnancyComplications: e.target.value })}
                              placeholder="Specificați eventualele complicații"
                              rows={2}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Medications and Alergii */}
                <div className="space-y-4">
                  <h4 className="font-medium text-blue-700">Medicamente curente & Alergii</h4>

                  <div>
                    <Label htmlFor="currentMedications">Medicamente curente</Label>
                    <Textarea
                      id="currentMedications"
                      value={asaFormData.currentMedications}
                      onChange={(e) => updateAsaFormData({ currentMedications: e.target.value })}
                      placeholder="Lista medicamentelor curente cu dozele"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="allergies">Alergii</Label>
                    <Textarea
                      id="allergies"
                      value={asaFormData.allergies}
                      onChange={(e) => updateAsaFormData({ allergies: e.target.value })}
                      placeholder="Alergii medicamentoase, alimentare, latex etc."
                      rows={2}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setAsaModalStep('history')}>
                    Anulează
                  </Button>
                  <Button onClick={() => setAsaModalStep('score')}>
                    Următorul pas: selectați scorul ASA
                  </Button>
                </DialogFooter>
              </div>
            )}

            {asaModalStep === 'score' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Selectați scorul ASA</h3>
                  <Button variant="outline" onClick={() => setAsaModalStep('assessment')}>
                    Înapoi la evaluare
                  </Button>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor="asaNotes">Notițe practician</Label>
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
                      Regenerare rezumat
                    </Button>
                  </div>
                  <Textarea
                    id="asaNotes"
                    value={asaFormData.notes}
                    onChange={(e) => {
                      setIsNotesManuallyEdited(true)
                      setAsaFormData(prev => ({ ...prev, notes: e.target.value }))
                    }}
                    placeholder="Medicamente importante, observații sau notițe pentru referință viitoare"
                    rows={4}
                  />
                </div>

                <div>
                  <Label>Scor ASA</Label>
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
                    Înapoi
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
                    {updateAsaScore.isPending ? 'Se salvează...' : 'Salvează scorul ASA'}
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
              <DialogTitle>Screening buzunar parodontal (PPS)</DialogTitle>
              <DialogDescription>
                {ppsModalStep === 'history' && 'Vizualizați istoricul scorurilor PPS și adăugați o evaluare nouă'}
                {ppsModalStep === 'assessment' && 'Introduceți scorurile PPS pentru fiecare cadran și planul de tratament'}
              </DialogDescription>
            </DialogHeader>

            {ppsModalStep === 'history' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Istoric scor PPS</h3>
                  <Button onClick={() => {
                    // Pre-fill with latest data if available
                    const latestPps = getLatestPpsData()
                    if (latestPps.scores) {
                      setPpsFormData({
                        quadrant1: latestPps.scores[0],
                        quadrant2: latestPps.scores[1],
                        quadrant3: latestPps.scores[2],
                        quadrant4: latestPps.scores[3],
                        treatment: 'NONE', // PPS history removed - not applicable for plastic surgery
                        notes: ''
                      })
                    }
                    setPpsModalStep('assessment')
                  }} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Evaluare nouă
                  </Button>
                </div>

                <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                  {/* PPS history removed - not applicable for plastic surgery */}
                  {[]?.length > 0 ? (
                    []
                      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((record: any) => (
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
                                <p className="text-sm text-gray-500">De {[(() => {
                                  const user = userMap[record.createdBy];
                                  if (user) return (user.firstName[0] + user.lastName[0]).toUpperCase();
                                  const parts = record.createdBy?.split(' ') || [];
                                  return (parts[0]?.[0] || '').toUpperCase();
                                })()]}</p>
                                <p className="text-sm text-blue-600">
                                  Tratament: {record.treatment === 'NONE' ? 'Fără tratament' :
                                    record.treatment === 'PREVENTIVE' ? 'Preventiv' : 'Parodontal'}
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
                      <p>Nicio evaluare PPS înregistrată încă</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {ppsModalStep === 'assessment' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Evaluare PPS</h3>
                  <Button variant="outline" onClick={() => setPpsModalStep('history')}>
                    Înapoi la istoric
                  </Button>
                </div>

                {/* Quadrant Scores */}
                <div className="space-y-4">
                  <h4 className="font-medium text-blue-700">Scoruri pe cadrane</h4>
                  <p className="text-sm text-gray-600">Introduceți scorul PPS pentru fiecare cadran (0 = fără dinți, 1 = 1-3mm, 2 = 4-5mm, 3 = 6+mm)</p>

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
                    <Label>Tratament recomandat</Label>
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
                        <Label htmlFor="treatment-none">Nu este necesar tratament suplimentar</Label>
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
                        <Label htmlFor="treatment-preventive">Tratament preventiv</Label>
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
                        <Label htmlFor="treatment-periodontal">Tratament parodontal</Label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notițe */}
                <div className="space-y-4">
                  <h4 className="font-medium text-blue-700">Notițe</h4>
                  <div>
                    <Label htmlFor="ppsNotes">Notițe practician</Label>
                    <Textarea
                      id="ppsNotes"
                      value={ppsFormData.notes}
                      onChange={(e) => setPpsFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Observații suplimentare, recomandări de tratament sau notițe"
                      rows={4}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setPpsModalStep('history')}>
                    Anulează
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
                    {updatePpsScore.isPending ? 'Se salvează...' : 'Salvează evaluarea PPS'}
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
              <DialogTitle>Termeni recall screening</DialogTitle>
              <DialogDescription>
                {screeningRecallModalStep === 'history' && 'Vizualizați istoricul termenilor de recall screening și adăugați o evaluare nouă'}
                {screeningRecallModalStep === 'assessment' && 'Setați termenii de recall pentru screening periodic'}
              </DialogDescription>
            </DialogHeader>

            {screeningRecallModalStep === 'history' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Istoric termeni recall screening</h3>
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
                          // Screening recall history removed - not applicable for plastic surgery
                          notes = ''
                        } catch (e) {
                          notes = ''
                        }
                      } else {
                        notes = ''
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
                    Evaluare nouă
                  </Button>
                </div>

                <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                  {/* Screening recall history removed - not applicable for plastic surgery */}
                  {[]?.length > 0 ? (
                    []
                      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((record: any) => {
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
                                    Personalizat: {customText}
                                  </div>
                                ) : (
                                  <div className="flex gap-2">
                                    <div className="px-3 py-1 rounded-full border bg-blue-100 border-blue-400 text-blue-800">
                                      Recall C002: {record.screeningMonths} luni
                                    </div>
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium">{new Date(record.date).toLocaleDateString()}</p>
                                  <p className="text-sm text-gray-500">De {[(() => {
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
                      <p>Niciun termen de recall screening înregistrat</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {screeningRecallModalStep === 'assessment' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Evaluare recall screening</h3>
                  <Button variant="outline" onClick={() => setScreeningRecallModalStep('history')}>
                    Înapoi la istoric
                  </Button>
                </div>

                {/* Termeni recall screening */}
                <div className="space-y-4">
                  <h4 className="font-medium text-blue-700">Termeni recall screening</h4>
                  <p className="text-sm text-gray-600">Setați intervalele de recall pentru screening periodic (c002)</p>

                  <div className="space-y-2">
                    <Label htmlFor="screeningMonths">Control periodic (c002) – luni</Label>
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
                  <h4 className="font-medium text-blue-700">Instrucțiuni personalizate recall screening</h4>
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
                      <Label htmlFor="useCustomText">Folosiți instrucțiuni personalizate în loc de luni</Label>
                    </div>

                    {screeningRecallFormData.useCustomText && (
                      <div>
                        <Label htmlFor="customText">Instrucțiuni personalizate recall screening</Label>
                        <Textarea
                          id="customText"
                          value={screeningRecallFormData.customText}
                          onChange={(e) => setScreeningRecallFormData(prev => ({
                            ...prev,
                            customText: e.target.value
                          }))}
                          placeholder="ex.: Doar când medicul consideră necesar la screening periodic, sau condiții specifice pentru recall"
                          rows={3}
                          tabIndex={2}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Notițe */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowScreeningRecallNotes(!showScreeningRecallNotes)}
                      className="text-xs"
                    >
                      {showScreeningRecallNotes ? 'Ascunde notițele' : 'Adaugă notițe'}
                    </Button>
                  </div>
                  {showScreeningRecallNotes && (
                    <div>
                      <Label htmlFor="recallNotes">Notițe</Label>
                      <Textarea
                        id="recallNotes"
                        value={screeningRecallFormData.notes}
                        onChange={(e) => setScreeningRecallFormData(prev => ({
                          ...prev,
                          notes: e.target.value
                        }))}
                        placeholder="Observații suplimentare, motivare intervale recall screening sau notițe"
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
                    {updateScreeningRecallScore.isPending ? 'Se salvează...' : 'Salvează termenii recall screening'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setScreeningRecallModalStep('history')}
                    tabIndex={showScreeningRecallNotes ? 5 : 4}
                  >
                    Anulează
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
              <DialogTitle>Termeni recall curățare</DialogTitle>
              <DialogDescription>
                {cleaningRecallModalStep === 'history' && 'Vizualizați istoricul termenilor de recall curățare și adăugați o evaluare nouă'}
                {cleaningRecallModalStep === 'assessment' && 'Setați termenii de recall pentru curățare periodică'}
              </DialogDescription>
            </DialogHeader>

            {cleaningRecallModalStep === 'history' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Istoric termeni recall curățare</h3>
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
                          // Cleaning recall history removed - not applicable for plastic surgery
                          notes = ''
                        } catch (e) {
                          notes = ''
                        }
                      } else {
                        notes = ''
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
                    Evaluare nouă
                  </Button>
                </div>

                <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                  {/* Cleaning recall history removed - not applicable for plastic surgery */}
                  {[]?.length > 0 ? (
                    []
                      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((record: any) => {
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
                                    Personalizat: {customText}
                                  </div>
                                ) : (
                                  <div className="flex gap-2">
                                    <div className="px-3 py-1 rounded-full border bg-green-100 border-green-400 text-green-800">
                                      Recall {record.procedureCode}: {record.cleaningMonths} luni
                                    </div>
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium">{new Date(record.date).toLocaleDateString()}</p>
                                  <p className="text-sm text-gray-500">De {[(() => {
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
                      <p>Niciun termen de recall curățare înregistrat</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {cleaningRecallModalStep === 'assessment' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Evaluare recall curățare</h3>
                  <Button variant="outline" onClick={() => setCleaningRecallModalStep('history')}>
                    Înapoi la istoric
                  </Button>
                </div>

                {/* Termeni recall curățare */}
                <div className="space-y-4">
                  <h4 className="font-medium text-blue-700">Termeni recall curățare</h4>
                  <p className="text-sm text-gray-600">Setați intervalele de recall pentru curățare periodică (m03/t042/t043)</p>

                  <div className="space-y-2">
                    <Label htmlFor="cleaningMonths">Curățare periodică (m03/t042/t043) - Luni</Label>
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
                    <Label htmlFor="procedureCode">Cod procedură</Label>
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
                        <SelectItem value="m03">m03 - Curățare preventivă</SelectItem>
                        <SelectItem value="t042">t042 - Curățare parodontală</SelectItem>
                        <SelectItem value="t043">t043 - Curățare parodontală extinsă</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Custom Text Option */}
                <div className="space-y-4">
                  <h4 className="font-medium text-blue-700">Instrucțiuni personalizate recall curățare</h4>
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
                      <Label htmlFor="useCustomText">Folosiți instrucțiuni personalizate în loc de luni</Label>
                    </div>

                    {cleaningRecallFormData.useCustomText && (
                      <div>
                        <Label htmlFor="customText">Instrucțiuni personalizate recall curățare</Label>
                        <Textarea
                          id="customText"
                          value={cleaningRecallFormData.customText}
                          onChange={(e) => setCleaningRecallFormData(prev => ({
                            ...prev,
                            customText: e.target.value
                          }))}
                          placeholder="ex.: Doar când medicul consideră necesar la curățare periodică, sau condiții specifice pentru recall"
                          rows={3}
                          tabIndex={3}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Notițe */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-blue-700">Notițe practician</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCleaningRecallNotes(!showCleaningRecallNotes)}
                      className="text-xs"
                    >
                      {showCleaningRecallNotes ? 'Ascunde notițele' : 'Adaugă notițe'}
                    </Button>
                  </div>
                  {showCleaningRecallNotes && (
                    <div>
                      <Label htmlFor="recallNotes">Notițe</Label>
                      <Textarea
                        id="recallNotes"
                        value={cleaningRecallFormData.notes}
                        onChange={(e) => setCleaningRecallFormData(prev => ({
                          ...prev,
                          notes: e.target.value
                        }))}
                        placeholder="Observații suplimentare, motivare intervale recall curățare sau notițe"
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
                    {updateCleaningRecallScore.isPending ? 'Se salvează...' : 'Salvează termenii recall curățare'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCleaningRecallModalStep('history')}
                    tabIndex={showCleaningRecallNotes ? 6 : 5}
                  >
                    Anulează
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>


        {/* Adaugă notă Modal */}
        <Dialog open={showAddNoteModal} onOpenChange={setShowAddNoteModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Adaugă notă</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Notă</Label>
                <Textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Introduceți nota..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Dosar (opțional)</Label>
                <Select
                  value={selectedFolder || 'none'}
                  onValueChange={(value) => setSelectedFolder(value === 'none' ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Fără dosar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Fără dosar</SelectItem>
                    {noteFolders?.filter(folder => folder.id && folder.id.trim() !== '').map((folder) => (
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
                <Label htmlFor="isPinned">Fixează această notă</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddNoteModal(false)}>
                Anulează
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
                {createNote.isPending ? 'Se adaugă...' : 'Adaugă notă'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Setări notițe Modal */}
        <Dialog open={showNotesSettingsModal} onOpenChange={setShowNotesSettingsModal}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Setări notițe</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Folders Management */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">Dosare</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddFolderModal(true)}
                  >
                    Adaugă dosar
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

              {/* Pinned Notițe Reordering */}
              <div>
                <h3 className="font-medium mb-2">Ordine notițe fixate</h3>
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

        {/* Adaugă dosar Modal */}
        <Dialog open={showAddFolderModal} onOpenChange={setShowAddFolderModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Adaugă dosar</DialogTitle>
            </DialogHeader>
            <div>
              <Label>Nume dosar</Label>
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Introduceți numele dosarului..."
                className="mt-1"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddFolderModal(false)}>
                Anulează
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
                {createFolder.isPending ? 'Se adaugă...' : 'Adaugă dosar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Șterge/Disable Patient Modal */}
        <Dialog open={showDeleteDisableModal} onOpenChange={setShowDeleteDisableModal}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {deleteDisableModalStep === 'options' && 'Gestionare pacient'}
                {deleteDisableModalStep === 'disable' && 'Dezactivare pacient'}
                {deleteDisableModalStep === 'delete' && 'Șterge pacient'}
                {deleteDisableModalStep === 'history' && 'Istoric status'}
              </DialogTitle>
              <DialogDescription>
                {deleteDisableModalStep === 'options' && 'Alegeți o acțiune pentru acest pacient'}
                {deleteDisableModalStep === 'disable' && 'Dezactivați acest pacient și furnizați un motiv'}
                {deleteDisableModalStep === 'delete' && 'Ștergeți definitiv acest pacient din sistem'}
                {deleteDisableModalStep === 'history' && 'Vizualizați istoricul modificărilor de status'}
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
                  Vizualizare istoric status
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
                          toast.success('Pacient reactivat cu succes')
                          setShowDeleteDisableModal(false)
                          // Refetch patient data
                          window.location.reload()
                        } else {
                          toast.error('Reactivarea pacientului a eșuat')
                        }
                      } catch (error) {
                        toast.error('Reactivarea pacientului a eșuat')
                      }
                    }}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Reactivare pacient
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setDeleteDisableModalStep('disable')}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Dezactivare pacient
                  </Button>
                )}
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  onClick={() => setDeleteDisableModalStep('delete')}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Șterge pacient
                </Button>
              </div>
            )}

            {deleteDisableModalStep === 'disable' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="disableMotiv">Motiv dezactivare</Label>
                  <Textarea
                    id="disableMotiv"
                    value={disableMotiv}
                    onChange={(e) => setDisableMotiv(e.target.value)}
                    placeholder="Introduceți motivul dezactivării pacientului..."
                    className="mt-1"
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteDisableModalStep('options')}>
                    Anulează
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
                            reason: disableMotiv
                          }),
                        })
                        if (response.ok) {
                          toast.success('Pacient dezactivat cu succes')
                          setShowDeleteDisableModal(false)
                          setDisableMotiv('')
                          // Refetch patient data
                          window.location.reload()
                        } else {
                          toast.error('Dezactivarea pacientului a eșuat')
                        }
                      } catch (error) {
                        toast.error('Dezactivarea pacientului a eșuat')
                      }
                    }}
                  >
                    Dezactivare pacient
                  </Button>
                </DialogFooter>
              </div>
            )}

            {deleteDisableModalStep === 'delete' && (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 font-medium">Atenție: această acțiune nu poate fi anulată</p>
                  <p className="text-red-600 text-sm mt-1">
                    Aceasta va șterge definitiv pacientul și toate datele asociate, inclusiv:
                  </p>
                  <ul className="text-red-600 text-sm mt-2 list-disc list-inside">
                    <li>Informații pacient</li>
                    <li>Istoric medical și dentar</li>
                    <li>Programări și tratamente</li>
                    <li>Fișiere și imagini</li>
                    <li>Notițe și evaluări</li>
                  </ul>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteDisableModalStep('options')}>
                    Anulează
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/patients/${params.id}`, {
                          method: 'DELETE',
                        })
                        if (response.ok) {
                          toast.success('Pacient șters cu succes')
                          router.push('/dashboard/patients')
                        } else {
                          toast.error('Ștergerea pacientului a eșuat')
                        }
                      } catch (error) {
                        toast.error('Ștergerea pacientului a eșuat')
                      }
                    }}
                  >
                    Șterge pacient
                  </Button>
                </DialogFooter>
              </div>
            )}

            {deleteDisableModalStep === 'history' && (
              <div className="space-y-4">
                <div className="max-h-64 overflow-y-auto">
                  {statusHistory.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Nu s-a găsit istoric de status</p>
                  ) : (
                    <div className="space-y-2">
                      {statusHistory.map((record, index) => (
                        <div key={record.id} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className={`font-medium ${record.action === 'DISABLE' ? 'text-red-600' : 'text-green-600'
                                }`}>
                                {record.action === 'DISABLE' ? 'Dezactivat' : 'Activat'}
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
                    Înapoi
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Șterge dosar Confirmation Modal */}
        <ConfirmationModal
          open={showDeleteFolderModal}
          onOpenChange={setShowDeleteFolderModal}
          title="Șterge dosar"
          description={`Sigur doriți să ștergeți dosarul „${folderToDelete?.name}"? Notițele din acest dosar vor fi mutate fără dosar.`}
          confirmText="Șterge dosar"
          cancelText="Anulează"
          variant="destructive"
          icon="delete"
          onConfirm={handleConfirmDeleteFolder}
          loading={deleteFolderLoading}
        />

        {/* Telefonbook Modal */}
        <Dialog open={showPhonebookModal} onOpenChange={setShowPhonebookModal}>
          <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>📞 E-mail din agenda telefonică</DialogTitle>
              <DialogDescription>
                Selectați adrese de e-mail din contactele dvs.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Telefonbook Categories */}
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
                Închide
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Quick Șabloane Modal */}
        <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
          <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>📝 Șabloane email rapide</DialogTitle>
              <DialogDescription>
                Alegeți din șabloanele de e-mail predefinite
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Template Search */}
              <div className="relative">
                <Input
                  placeholder="Căutați șabloane..."
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
                {Object.entries(filteredȘabloane()).map(([category, templates]) => (
                  <div key={category} className={`rounded-lg border p-3 ${getCategorieColor(category)}`}>
                    <div
                      className="flex items-center justify-between cursor-pointer p-1 rounded"
                      onClick={() => toggleCategorie(category)}
                    >
                      <h4 className={`text-sm font-semibold ${getCategorieHeaderColor(category)}`}>
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

                {Object.keys(filteredȘabloane()).length === 0 && (
                  <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                    <p className="text-sm">Niciun șablon găsit</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTemplateSearch('')}
                      className="mt-2 text-xs hover:bg-gray-200"
                    >
                      Șterge căutarea
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTemplateModal(false)}>
                Închide
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add procedure from search */}
        <Dialog open={showAddProcedureModal} onOpenChange={(open) => {
          setShowAddProcedureModal(open);
          if (!open) setAddProcedureCode(null);
        }}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Adaugă procedură</DialogTitle>
              <DialogDescription>
                Configurați detaliile pentru {addProcedureCode?.description ?? 'procedura selectată'}.
              </DialogDescription>
            </DialogHeader>
            {addProcedureCode && (
              <SurgicalProcedureForm
                key={addProcedureCode.id}
                patientId={params.id}
                initialCode={addProcedureCode}
                status={statusByTab[treatmentTab] as 'COMPLETED' | 'IN_PROGRESS' | 'PENDING'}
                onSuccess={() => {
                  setShowAddProcedureModal(false);
                  setAddProcedureCode(null);
                  refetchProcedures();
                  queryClient.invalidateQueries({ queryKey: ['patient-surgical-procedures', params.id] });
                }}
                onCancel={() => {
                  setShowAddProcedureModal(false);
                  setAddProcedureCode(null);
                }}
              />
            )}
          </DialogContent>
        </Dialog>



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
                cnp: editFormData.cnp,
                country: editFormData.country,
                allowEarlySpotContact: editFormData.allowEarlySpotContact
              }

              // Check if address was actually changed
              const originalAddress = patient.address.display_name || ''
              const hasAddressChanged = selectedAddress !== null || editFormData.address !== originalAddress

              if (hasAddressChanged && selectedAddress) {
                // Adresă was changed via autocomplete
                updateData.address = {
                  display_name: selectedAddress.display_name,
                  lat: selectedAddress.lat,
                  lon: selectedAddress.lon
                }
                console.log('Adresă changed via autocomplete:', updateData.address)
              } else if (hasAddressChanged && !selectedAddress && editFormData.address !== originalAddress) {
                // Adresă was manually typed (rare case)
                updateData.address = {
                  display_name: editFormData.address,
                  lat: patient.address.lat || '',
                  lon: patient.address.lon || ''
                }
                console.log('Adresă manually changed:', updateData.address)
              } else {
                console.log('Adresă NOT changed - excluding from update')
              }

              console.log('Final updateData being sent to API:', updateData)
              await updatePatient.mutateAsync(updateData)
              setShowEditModal(false)
              setSelectedAddress(null)
              await refetch()
              toast.success('Informațiile pacientului au fost actualizate cu succes')
            } catch (error) {
              console.error('Update error:', error)
              toast.error('Actualizarea informațiilor pacientului a eșuat')
            }
          }}
          editFormData={editFormData}
          setEditFormData={setEditFormData}
          selectedAddress={selectedAddress}
          setSelectedAddress={setSelectedAddress}
        />

        {/* Periodontal Chart History Modal - Removed for plastic surgery */}
        {/* <PeriodontalChartHistoryModal
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
              toast.success('Grafic parodontal încărcat din istoric')
            }).catch(() => {
              toast.error('Încărcarea graficului parodontal din istoric a eșuat')
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


        {/* Scaling Treatment Shopping Cart Modal */}
        <Dialog open={showScalingModal} onOpenChange={setShowScalingModal}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>🦷 Coș tratamente detartraj</DialogTitle>
              <DialogDescription>
                Pe baza constatărilor parodontale, selectați tratamentele de adăugat în plan. Puteți edita, elimina sau adăuga tratamente suplimentare.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Treatment Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">
                      {selectedTreatments.length} tratament{selectedTreatments.length !== 1 ? 'e' : ''} selectat{selectedTreatments.length !== 1 ? 'e' : ''}
                    </span>
                    <span className="text-sm text-gray-600 ml-2">
                      ({suggestedTeethTreatments.length} sugerate în total)
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTreatments([])}
                      disabled={selectedTreatments.length === 0}
                    >
                      Șterge tot
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTreatments([...suggestedTeethTreatments])}
                      disabled={selectedTreatments.length === suggestedTeethTreatments.length}
                    >
                      Selectează tot
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
                                {treatment.toothNumber ? `#${treatment.toothNumber}` : 'Fără dinte'}
                              </div>
                              <div className="px-2 py-1 rounded bg-blue-600 text-white text-sm font-medium">
                                {treatment.code.toUpperCase()}
                              </div>
                              <span className="font-medium text-gray-900">
                                {treatment.description}
                              </span>
                              <div className={`px-2 py-0.5 rounded text-xs font-medium ${urgencyBadgeColors[treatment.urgency]}`}>
                                {{ high: 'ridicată', medium: 'medie', low: 'scăzută' }[treatment.urgency as 'high' | 'medium' | 'low']}
                              </div>
                            </div>

                            {treatment.toothNumber && (
                              <p className="text-sm text-gray-700 mb-2">
                                Adâncime maximă: <span className="font-bold text-red-600">{treatment.maxDepth}mm</span>
                                {treatment.hasInflammation && <span className="ml-2 text-red-500">• Sângerare/suppurație</span>}
                              </p>
                            )}

                            {!treatment.toothNumber && (
                              <p className="text-sm text-gray-700 mb-2">
                                Tratament independent — nu necesită număr de dinte
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Acțiuni */}
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditTreatmentModal(treatment)}
                            className="h-6 px-2 text-xs"
                          >
                            Editează
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
                            Elimină
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {suggestedTeethTreatments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>Niciun tratament de detartraj sugerat pe baza măsurătorilor actuale.</p>
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
                  + Adaugă tratament personalizat
                </Button>
              </div>

              {/* Info Box */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>💡 Coș de tratamente:</strong> Selectați tratamentele pe care doriți să le adăugați în planul de tratament.
                  Toate tratamentele selectate vor fi adăugate simultan în fila „Plan”, cu notițe detaliate din constatările parodontale.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setShowScalingModal(false)}
              >
                Anulează
              </Button>
              <Button
                onClick={async () => {
                  if (selectedTreatments.length === 0) {
                    toast.error('Selectați cel puțin un tratament')
                    return
                  }

                  try {
                    // Add selected treatments to treatment plan
                    for (const treatment of selectedTreatments) {
                      // Dental codes removed - use surgical procedure codes instead
                      // For plastic surgery, search surgical procedure codes
                      const response = await fetch(`/api/surgical-procedure-codes?search=${treatment.code}`)
                      if (!response.ok) continue

                      const codes = await response.json()
                      const codeMatch = codes.find((c: any) =>
                        c.code.toLowerCase() === treatment.code.toLowerCase()
                      )

                      if (codeMatch) {
                        // Create notes from findings
                        const notes = treatment.toothNumber
                          ? [
                            `Sugerat automat pe baza constatărilor parodontale pentru dintele #${treatment.toothNumber}:`,
                            `• Adâncime maximă: ${treatment.maxDepth}mm`,
                            `• Tip dinte: ${treatment.reason}`,
                            treatment.hasInflammation ? `• Inflamație prezentă (sângerare/suppurație)` : null
                          ].filter(Boolean).join('\n')
                          : `${treatment.description} - ${treatment.reason}`

                        // Add procedure to treatment plan
                        await fetch(`/api/patients/${params.id}/surgical-procedures`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            codeId: codeMatch.id,
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
                    toast.success(
                      selectedTreatments.length === 1
                        ? '1 tratament de detartraj adăugat în planul de tratament'
                        : `${selectedTreatments.length} tratamente de detartraj adăugate în planul de tratament`
                    )

                    // Switch to plan tab to show the new procedures
                    setTreatmentTab('plan')
                  } catch (error) {
                    console.error('Error adding scaling treatments:', error)
                    toast.error('Adăugarea tratamentelor de detartraj a eșuat')
                  }
                }}
                disabled={selectedTreatments.length === 0}
              >
                Adaugă {selectedTreatments.length} tratament{selectedTreatments.length !== 1 ? 'e' : ''} în plan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Editează tratament Modal */}
        <Dialog open={showEditTreatmentModal} onOpenChange={setShowEditTreatmentModal}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>✏️ Editează tratament</DialogTitle>
              <DialogDescription>
                Modificați numărul dintelui și codul de tratament pentru acest tratament parodontal.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-code">Cod tratament</Label>
                <Select
                  value={editForm.code}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, code: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selectați codul de tratament" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="t021">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span>T021 - Tratament parodontal complex</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="t022">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span>T022 - Tratament parodontal standard</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="a10">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>A10 - Examinare clinică</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="x10">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span>X10 - Radiografie bite-wing</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="t012">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>T012 - Îndepărtare placă supragingivală</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="t032">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                        <span>T032 - Instrucțiuni de igienă orală</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="t042">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span>T042 - Curățare parodontală</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="t043">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                        <span>T043 - Curățare parodontală extinsă</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="t044">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                        <span>T044 - Întreținere parodontală</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Conditional Număr dinte Field */}
              {(editForm.code === 't021' || editForm.code === 't022') && (
                <div>
                  <Label htmlFor="edit-tooth-number">Număr dinte</Label>
                  <Input
                    id="edit-tooth-number"
                    type="number"
                    min="11"
                    max="48"
                    value={editForm.toothNumber}
                    onChange={(e) => setEditForm(prev => ({ ...prev, toothNumber: e.target.value }))}
                    placeholder="Introduceți numărul dintelui (11-48)"
                    className="mt-1"
                  />
                </div>
              )}

              {/* Treatment Rules Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                <p className="font-medium text-blue-900 mb-1">📋 Tipuri de tratament:</p>
                <div className="text-blue-800 space-y-1">
                  <p><strong>T021/T022:</strong> Necesită număr de dinte (tratamente parodontale)</p>
                  <p><strong>A10, X10, T012, T032, T042, T043, T044:</strong> Tratamente independente</p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowEditTreatmentModal(false)}
              >
                Anulează
              </Button>
              <Button
                onClick={handleEditTreatmentSave}
              >
                Salvează modificările
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Custom Treatment Modal */}
        <Dialog open={showAddTreatmentModal} onOpenChange={setShowAddTreatmentModal}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>➕ Adaugă tratament personalizat</DialogTitle>
              <DialogDescription>
                Adăugați un tratament nou în coșul de tratament parodontal.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Tooth-Specific Treatments */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-900">🦷 Tratamente specifice pe dinte</h3>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="add-tooth-number">Număr dinte</Label>
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
                    <Label htmlFor="add-code">Cod tratament</Label>
                    <Select
                      value={addForm.code}
                      onValueChange={(value) => setAddForm(prev => ({ ...prev, code: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selectați codul" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="t021">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span>T021 - Tratament parodontal complex</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="t022">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <span>T022 - Tratament parodontal standard</span>
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
                  <h3 className="font-medium text-gray-900">⚡ Adăugare rapidă tratamente independente</h3>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[
                    { code: 'a10', label: 'A10', color: 'bg-blue-500', desc: 'Examinare clinică' },
                    { code: 'x10', label: 'X10', color: 'bg-purple-500', desc: 'Radiografie bite-wing' },
                    { code: 't012', label: 'T012', color: 'bg-green-500', desc: 'Îndepărtare placă' },
                    { code: 't032', label: 'T032', color: 'bg-teal-500', desc: 'Igienă orală' },
                    { code: 't042', label: 'T042', color: 'bg-yellow-500', desc: 'Curățare parodontală' },
                    { code: 't043', label: 'T043', color: 'bg-orange-600', desc: 'Curățare extinsă' },
                    { code: 't044', label: 'T044', color: 'bg-indigo-500', desc: 'Întreținere' }
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
                  Apăsați orice buton pentru a adăuga instant tratamentul în listă
                </p>
              </div>

              {/* Treatment Rules Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                <p className="font-medium text-blue-900 mb-1">📋 Tipuri de tratament:</p>
                <div className="text-blue-800 space-y-1 text-xs">
                  <p><strong>Specifice pe dinte:</strong> T021/T022 necesită numere de dinți specifice</p>
                  <p><strong>Independente:</strong> A10, X10, T012, T032, T042, T043, T044 sunt proceduri generale</p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowAddTreatmentModal(false)}
              >
                Închide
              </Button>
              <Button
                onClick={handleAddTreatmentSave}
                disabled={!addForm.toothNumber || !addForm.code}
                className="bg-green-600 hover:bg-green-700"
              >
                Adaugă tratament pe dinte
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
            handleProcedureCreat();
          }}
        />

        {/* Insurance Modal */}
        <Dialog open={showInsuranceModal} onOpenChange={setShowInsuranceModal}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5 text-green-600" />
                Informații asigurare
              </DialogTitle>
              <DialogDescription>
                Vizualizați detaliile asigurării de sănătate ale pacientului
              </DialogDescription>
            </DialogHeader>

            {patient?.healthInsurance && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Furnizor</Label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <span className="font-medium text-gray-900">
                        {patient.healthInsurance.provider}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Număr poliță</Label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <span className="font-mono text-gray-900">
                        {patient.healthInsurance.policyNumber}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Valabil până la</Label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <span className="text-gray-900">
                        {new Date(patient.healthInsurance.validUntil).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Stare</Label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${new Date(patient.healthInsurance.validUntil) > new Date()
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                        }`}>
                        {new Date(patient.healthInsurance.validUntil) > new Date() ? 'Activ' : 'Expirat'}
                      </span>
                    </div>
                  </div>
                </div>

                {patient.healthInsurance.coverageDetails && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Detalii acoperire</Label>
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
                Închide
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Print Options Modal */}
        <PrintOptionsModal
          isOpen={showPrintModal}
          onOpenChange={setShowPrintModal}
          options={printOptions}
          setOptions={setPrintOptions}
          onPrint={() => {
            if (!patient) return

            try {
              printPatientCard({
                patient: {
                  firstName: patient.firstName,
                  lastName: patient.lastName,
                  dateOfBirth: patient.dateOfBirth,
                  gender: patient.gender,
                  email: patient.email,
                  phone: patient.phone,
                  address: patient.address,
                  cnp: patient.cnp,
                  patientCode: patient.patientCode,
                },
                procedures: surgicalProcedures || [],
                images: patientImages || [],
                includedSections: printOptionsToSections(printOptions),
              })
              setShowPrintModal(false)
            } catch (error) {
              console.error('Error printing patient card', error)
              toast.error('Tipărirea fișei pacientului a eșuat')
            }
          }}
        />

        {/* Tasks Modal */}
        <Dialog open={showTasksModal} onOpenChange={setShowTasksModal}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Sarcini pacient</DialogTitle>
              <DialogDescription>Sarcini legate de acest pacient.</DialogDescription>
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
                Închide
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Waiting List Modal */}
        <Dialog open={showWaitingModal} onOpenChange={setShowWaitingModal}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Listă de așteptare</DialogTitle>
              <DialogDescription>Programări în așteptare legate de acest pacient.</DialogDescription>
            </DialogHeader>

            <PatientWaitingList
              patientId={params.id}
              onCreateEntry={() => {
                setShowWaitingModal(false);
                router.push(`/dashboard/tasks?view=waiting-list&create=true&patientId=${params.id}`);
              }}
              limit={10}
            />

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowWaitingModal(false)}>
                Închide
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
    </div>
  )
}