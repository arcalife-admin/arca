export type YesNoValue = '' | 'yes' | 'no' | 'na'

export type Form1YesNoKey =
  | 'hypertension'
  | 'chestPain'
  | 'heartAttack'
  | 'heartMurmur'
  | 'pacemaker'
  | 'bleedingDisorder'
  | 'diabetes'
  | 'asthma'
  | 'epilepsy'
  | 'cancer'
  | 'thyroidDisease'
  | 'liverDisease'
  | 'kidneyDisease'
  | 'autoimmuneDisease'
  | 'infectiousDisease'
  | 'sleepApnea'
  | 'pregnancy'
  | 'priorSurgery'
  | 'surgeryComplications'
  | 'anesthesiaProblems'
  | 'postAnesthesiaNausea'
  | 'bloodTransfusion'
  | 'dailyMedication'
  | 'anticoagulants'
  | 'antiplatelet'
  | 'insulinOrDiabetesMeds'
  | 'corticosteroids'
  | 'medicationAllergies'
  | 'latexAllergy'
  | 'otherAllergies'
  | 'smoking'
  | 'alcohol'
  | 'recreationalDrugs'
  | 'otherMedicalProblems'

export type Form1TextKey =
  | 'emergencyContact'
  | 'emergencyPhone'
  | 'referringDoctor'
  | 'visitReason'
  | 'surgeryDetails'
  | 'currentTreatment'
  | 'allergiesText'
  | 'otherConditionsDetails'

export type Form1YesNoQuestion = {
  key: Form1YesNoKey
  label: string
  pdfYes: string
  pdfNo: string
  pdfNa?: string
}

export type Form1TextField = {
  key: Form1TextKey
  label: string
  pdfField: string
  multiline?: boolean
  showWhen?: { questionKey: Form1YesNoKey; answer: YesNoValue }
}

export type Form1Section = {
  id: string
  title?: string
  description?: string
  questions: Form1YesNoQuestion[]
  textFields?: Form1TextField[]
}

export const FORM1_DEMOGRAPHIC_PDF_FIELDS = [
  'Text Box 1',
  'Text Box 2',
  'Text Box 3',
  'Text Box 4',
  'Text Box 5',
  'Text Box 6',
  'Text Box 7',
  'Text Box 8',
  'Text Box 9',
  'Text Box 10',
] as const

export const FORM1_QUESTIONNAIRE_SECTIONS: Form1Section[] = [
  {
    id: 'demographics-extra',
    textFields: [
      { key: 'emergencyContact', label: 'Persoană de contact în caz de urgență', pdfField: 'Text Box 7' },
      { key: 'emergencyPhone', label: 'Telefon contact urgență', pdfField: 'Text Box 8' },
      { key: 'referringDoctor', label: 'Medic curant / medic trimițător', pdfField: 'Text Box 9' },
      { key: 'visitReason', label: 'Motivul prezentării / intervenția dorită', pdfField: 'Text Box 10', multiline: true },
    ],
    questions: [],
  },
  {
    id: 'medical-history',
    title: '1. Antecedente medicale',
    description: 'Bifați Da sau Nu unde este cazul.',
    questions: [
      { key: 'hypertension', label: 'Aveți tensiune arterială mare sau mică?', pdfYes: '1', pdfNo: '2' },
      { key: 'chestPain', label: 'Aveți dureri în piept / apăsare la efort?', pdfYes: '3', pdfNo: '4' },
      { key: 'heartAttack', label: 'Ați avut infarct miocardic?', pdfYes: '5', pdfNo: '6' },
      {
        key: 'heartMurmur',
        label: 'Aveți suflu cardiac, valvulopatie sau proteză valvulară?',
        pdfYes: '7',
        pdfNo: '8',
      },
      {
        key: 'pacemaker',
        label: 'Aveți pacemaker, ICD, stent sau alt dispozitiv cardiac?',
        pdfYes: '9',
        pdfNo: '10',
      },
      {
        key: 'bleedingDisorder',
        label: 'Aveți tulburări de coagulare sau tendință la sângerare?',
        pdfYes: '11',
        pdfNo: '12',
      },
      { key: 'diabetes', label: 'Aveți diabet?', pdfYes: '13', pdfNo: '14' },
      {
        key: 'asthma',
        label: 'Aveți astm, bronșită cronică sau altă boală pulmonară?',
        pdfYes: '15',
        pdfNo: '16',
      },
      { key: 'epilepsy', label: 'Aveți epilepsie?', pdfYes: '17', pdfNo: '18' },
      { key: 'cancer', label: 'Aveți cancer / leucemie?', pdfYes: '19', pdfNo: '20' },
      { key: 'thyroidDisease', label: 'Aveți boală tiroidiană?', pdfYes: '21', pdfNo: '22' },
      { key: 'liverDisease', label: 'Aveți boală hepatică?', pdfYes: '23', pdfNo: '24' },
      { key: 'kidneyDisease', label: 'Aveți boală renală?', pdfYes: '25', pdfNo: '26' },
      { key: 'autoimmuneDisease', label: 'Aveți boli autoimune?', pdfYes: '27', pdfNo: '28' },
      { key: 'infectiousDisease', label: 'Aveți boli infecțioase cunoscute?', pdfYes: '29', pdfNo: '30' },
      { key: 'sleepApnea', label: 'Aveți apnee de somn / sforăit important?', pdfYes: '31', pdfNo: '32' },
      {
        key: 'pregnancy',
        label: 'Sunteți însărcinată sau există posibilitatea unei sarcini?',
        pdfYes: '31',
        pdfNo: '32',
        pdfNa: '33',
      },
    ],
  },
  {
    id: 'surgical-history',
    title: '2. Antecedente chirurgicale',
    questions: [
      { key: 'priorSurgery', label: 'Ați avut intervenții chirurgicale anterioare?', pdfYes: '36', pdfNo: '37' },
      { key: 'surgeryComplications', label: 'Ați avut complicații după operații?', pdfYes: '38', pdfNo: '39' },
      { key: 'anesthesiaProblems', label: 'Ați avut probleme la anestezie?', pdfYes: '40', pdfNo: '41' },
      {
        key: 'postAnesthesiaNausea',
        label: 'Ați avut greață / vărsături severe după anestezie?',
        pdfYes: '42',
        pdfNo: '43',
      },
      { key: 'bloodTransfusion', label: 'Ați primit transfuzii de sânge?', pdfYes: '44', pdfNo: '45' },
    ],
    textFields: [
      {
        key: 'surgeryDetails',
        label: 'Dacă da, detalii scurte (intervenții / transfuzii / complicații)',
        pdfField: '62',
        multiline: true,
      },
    ],
  },
  {
    id: 'medications-allergies',
    title: '3. Medicație și alergii',
    questions: [
      { key: 'dailyMedication', label: 'Luați tratament zilnic?', pdfYes: '46', pdfNo: '47' },
      {
        key: 'anticoagulants',
        label: 'Luați anticoagulante / „subțiază sângele”?',
        pdfYes: '48',
        pdfNo: '49',
      },
      {
        key: 'antiplatelet',
        label: 'Luați aspirină, Aspenter, clopidogrel sau similar?',
        pdfYes: '50',
        pdfNo: '51',
      },
      {
        key: 'insulinOrDiabetesMeds',
        label: 'Luați insulină sau tratament pentru diabet?',
        pdfYes: '52',
        pdfNo: '53',
      },
      { key: 'corticosteroids', label: 'Luați corticosteroizi?', pdfYes: '54', pdfNo: '55' },
      { key: 'medicationAllergies', label: 'Aveți alergii la medicamente?', pdfYes: '56', pdfNo: '57' },
      { key: 'latexAllergy', label: 'Aveți alergie la latex?', pdfYes: '58', pdfNo: '59' },
      { key: 'otherAllergies', label: 'Aveți alte alergii importante?', pdfYes: '60', pdfNo: '61' },
    ],
    textFields: [
      { key: 'currentTreatment', label: 'Tratament curent', pdfField: '63', multiline: true },
      { key: 'allergiesText', label: 'Alergii', pdfField: '64', multiline: true },
    ],
  },
  {
    id: 'lifestyle',
    title: '4. Stil de viață',
    questions: [
      { key: 'smoking', label: 'Fumați?', pdfYes: '65', pdfNo: '66' },
      { key: 'alcohol', label: 'Consumați alcool regulat?', pdfYes: '67', pdfNo: '68' },
      {
        key: 'recreationalDrugs',
        label: 'Folosiți droguri recreaționale / alte substanțe?',
        pdfYes: '69',
        pdfNo: '70',
      },
    ],
  },
  {
    id: 'other',
    title: '5. Observații importante',
    questions: [
      {
        key: 'otherMedicalProblems',
        label:
          'Aveți alte boli sau probleme medicale importante care nu au fost menționate mai sus?',
        pdfYes: '71',
        pdfNo: '72',
      },
    ],
    textFields: [
      {
        key: 'otherConditionsDetails',
        label: 'Dacă da, precizați',
        pdfField: '73',
        multiline: true,
        showWhen: { questionKey: 'otherMedicalProblems', answer: 'yes' },
      },
    ],
  },
]

export const ALL_FORM1_YES_NO_QUESTIONS = FORM1_QUESTIONNAIRE_SECTIONS.flatMap((s) => s.questions)

export const ALL_FORM1_TEXT_FIELDS = FORM1_QUESTIONNAIRE_SECTIONS.flatMap((s) => s.textFields || [])
