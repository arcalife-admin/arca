'use client'

import React, { useState, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  Search,
  Download,
  FileText,
  Upload,
  Trash2,
  FolderOpen,
  Plus,
  Edit,
  Files,
  Filter,
  Settings,
  Printer
} from 'lucide-react'
import { toast } from 'sonner'

interface FileTemplate {
  id: string
  name: string
  type: 'questionnaire' | 'prescription' | 'document' | 'letter'
  category: string
  content: string
  createdAt: string
  updatedAt: string
  isDefault: boolean
  author: string
}

// Default file templates with comprehensive content
const DEFAULT_TEMPLATES: FileTemplate[] = [
  {
    id: 'pre-operative-health-questionnaire',
    name: 'Pre-Operative Health Questionnaire',
    type: 'questionnaire',
    category: 'Patient Questionnaires',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDefault: true,
    author: 'System',
    content: `
PRE-OPERATIVE HEALTH QUESTIONNAIRE

Patient Name: [Patient Name]
Date: [Date]
Patient Code: [Patient Code]
Planned Procedure: [Procedure Name]
Scheduled Surgery Date: [Date]

SURGICAL HISTORY

1. Have you had surgery before?    □ Yes    □ No
   If yes, please list procedures and dates:
   _________________________________
   _________________________________

2. Have you ever had complications with anesthesia or surgery?
   □ No    □ Nausea/vomiting    □ Difficulty waking    □ Allergic reaction
   □ Prolonged bleeding    □ Infection    □ Other: _________________________________

3. Have you ever been told you have difficult IV access or airway?
   □ Yes    □ No

CURRENT MEDICATIONS & SUPPLEMENTS

4. Are you taking blood thinners or antiplatelet medications?
   □ No    □ Aspirin    □ Warfarin    □ Eliquis/Xarelto    □ Other: ____________

5. Are you taking any herbal supplements or vitamins?
   □ No    □ Yes (list): _________________________________

PRE-OPERATIVE PREPARATION

6. Do you understand fasting instructions (no food/drink after midnight)?
   □ Yes    □ No    □ Need clarification

7. Will someone drive you home and stay with you for 24 hours after surgery?
   □ Yes    □ No    □ Arranging assistance

8. Do you have a history of smoking or vaping?
   □ Never    □ Former (quit date: ________)    □ Current (amount: ________)

POST-OPERATIVE PLANNING

9. Do you have help at home for the first 48 hours after surgery?
   □ Yes    □ No    □ Arranging help

10. Do you have any concerns about recovery or the procedure?
    _________________________________
    _________________________________

11. Rate your anxiety about surgery (1-10): ____

Patient Signature: _________________ Date: _________________

For Office Use:
Reviewed by: _________________________________
Clearance Required: □ None    □ Cardiology    □ PCP    □ Other: ____________
Pre-Op Instructions Sent: □ Yes    Date: _________________
    `
  },
  {
    id: 'gfi-comprehensive-questionnaire',
    name: 'GFI Comprehensive Health Questionnaire',
    type: 'questionnaire',
    category: 'Patient Questionnaires',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDefault: true,
    author: 'System',
    content: `
GENERAL HEALTH INFORMATION (GFI) QUESTIONNAIRE

Patient Information:
Name: [Patient Name]
Date of Birth: [DOB]
Date: [Date]
Emergency Contact: [Emergency Contact]

CURRENT MEDICAL STATUS

1. Are you currently under medical care?    □ Yes    □ No
   If yes, physician name: _________________________________
   Condition being treated: _________________________________

2. Are you taking any medications, vitamins, or supplements?    □ Yes    □ No
   If yes, please list with dosages:
   _________________________________
   _________________________________
   _________________________________

3. Do you have any allergies?    □ Yes    □ No
   □ Medications: _________________________________
   □ Foods: _________________________________
   □ Environmental: _________________________________
   □ Latex: _________________________________

MEDICAL HISTORY
Please check if you have or have had any of the following:

CARDIOVASCULAR
□ Heart disease    □ Heart attack    □ Chest pain (angina)
□ High blood pressure    □ Heart murmur    □ Rheumatic fever
□ Stroke    □ Blood clots    □ Pacemaker

RESPIRATORY
□ Asthma    □ Emphysema    □ Chronic cough
□ Sleep apnea    □ Tuberculosis    □ Pneumonia

ENDOCRINE
□ Diabetes (Type 1 / Type 2)    □ Thyroid problems
□ Adrenal problems    □ Hormone therapy

BLOOD/IMMUNE
□ Anemia    □ Bleeding disorders    □ Blood transfusion
□ HIV/AIDS    □ Hepatitis A/B/C    □ Autoimmune disease

NEUROLOGICAL
□ Epilepsy/Seizures    □ Migraines    □ Head injury
□ Mental health treatment    □ Memory problems

BONE/JOINT
□ Arthritis    □ Osteoporosis    □ Joint replacement
□ Back problems    □ Limited mobility

CANCER/RADIATION
□ Cancer (type: ____________)    □ Chemotherapy
□ Radiation therapy    □ Bone marrow transplant

OTHER CONDITIONS
□ Kidney disease    □ Liver disease    □ Stomach ulcers
□ Bowel disease    □ Pregnancy    □ Menopause

LIFESTYLE FACTORS

Tobacco Use:
□ Never used    □ Former user (quit date: ________)
□ Current user (type: _________ amount: _________)

Alcohol Use:
□ None    □ Occasional    □ Regular (amount: _________)

Drug Use:
□ None    □ Recreational    □ Prescription abuse

FAMILY HISTORY
Please indicate if any immediate family members have had:
□ Heart disease    □ Diabetes    □ Cancer
□ High blood pressure    □ Stroke    □ Mental illness

SURGICAL ANXIETY
Rate your anxiety about surgery (1-10): ____
□ No anxiety    □ Mild anxiety    □ Moderate anxiety    □ Severe anxiety

Special accommodations needed: _________________________________

CONSENT
I certify that the above information is complete and accurate. I understand that any changes in my health should be reported to the surgical clinic before my procedure.

Patient Signature: _________________ Date: _________________
Witness: _________________ Date: _________________

For Office Use Only:
Reviewed by: _________________ Date: _________________
Risk Assessment: □ Low    □ Medium    □ High
Special Precautions: _________________________________
    `
  },
  {
    id: 'pre-operative-surgical-risk-assessment',
    name: 'Pre-Operative Surgical Risk Assessment',
    type: 'questionnaire',
    category: 'Patient Questionnaires',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDefault: true,
    author: 'System',
    content: `
PRE-OPERATIVE SURGICAL RISK ASSESSMENT

Patient Name: [Patient Name]
Date: [Date]
Examiner: [Practitioner Name]
Planned Procedure: [Procedure Name]

CARDIOVASCULAR RISK

1. History of heart disease, heart attack, or stroke?    □ Yes    □ No
2. Uncontrolled high blood pressure?    □ Yes    □ No
3. Pacemaker or defibrillator?    □ Yes    □ No
4. Chest pain with exertion?    □ Yes    □ No

RESPIRATORY RISK

5. Asthma, COPD, or sleep apnea?    □ Yes    □ No
6. Use CPAP or supplemental oxygen at home?    □ Yes    □ No
7. Recent respiratory infection (within 4 weeks)?    □ Yes    □ No

BLEEDING & CLOTTING RISK

8. History of excessive bleeding or blood clots?    □ Yes    □ No
9. Currently on anticoagulants or antiplatelet therapy?    □ Yes    □ No
10. Known bleeding disorder?    □ Yes    □ No

ANESTHESIA RISK

11. Previous adverse reaction to anesthesia?    □ Yes    □ No
    If yes, describe: _________________________________
12. Difficulty with intubation or airway management?    □ Yes    □ No    □ Unknown
13. Malignant hyperthermia in patient or family?    □ Yes    □ No

INFECTION & HEALING RISK

14. Diabetes (controlled/uncontrolled)?    □ No    □ Yes - controlled    □ Yes - uncontrolled
15. Immunosuppression or active infection?    □ Yes    □ No
16. Smoking or nicotine use?    □ Never    □ Former    □ Current
17. BMI over 35 or recent significant weight change?    □ Yes    □ No

FUNCTIONAL STATUS

18. Can you climb one flight of stairs without stopping?    □ Yes    □ No
19. Activities limited by medical condition?    □ Yes    □ No

RISK SCORE SUMMARY:
High Risk Factors: ____
Moderate Risk Factors: ____
Low Risk Factors: ____

OVERALL RISK LEVEL:
□ Low Risk - proceed as scheduled
□ Moderate Risk - additional clearance/monitoring required
□ High Risk - specialist clearance required before surgery

RECOMMENDATIONS:
□ Medical clearance from PCP
□ Cardiology clearance
□ Pulmonology clearance
□ Adjust anticoagulation protocol
□ Pre-operative labs/imaging
□ Anesthesia consultation

Practitioner Signature: _________________ Date: _________________
    `
  },
  {
    id: 'comprehensive-antibiotic-prescription',
    name: 'Comprehensive Antibiotic Prescription',
    type: 'prescription',
    category: 'Pharmacy Prescriptions',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDefault: true,
    author: 'System',
    content: `
ANTIBIOTIC PRESCRIPTION AND PATIENT INSTRUCTIONS

Patient Information:
Name: [Patient Name]
Date of Birth: [DOB]
Address: [Patient Address]
Phone: [Patient Phone]
Date: [Date]

PRESCRIPTION DETAILS:
Medication: [Antibiotic Name]
Generic Name: [Generic Name]
Strength: [Dose] mg
Form: □ Tablets    □ Capsules    □ Liquid    □ Injection
Quantity: [Number] units
NDC Number: [NDC Number]

DOSING INSTRUCTIONS:
Take [Number] [tablet/capsule] [frequency] for [duration] days
□ Every 6 hours (4 times daily)
□ Every 8 hours (3 times daily)  
□ Every 12 hours (2 times daily)
□ Once daily

Special Instructions:
□ Take with food
□ Take on empty stomach (1 hour before or 2 hours after meals)
□ Take with plenty of water
□ Do not take with dairy products
□ Other: _________________________________

CRITICAL PATIENT INSTRUCTIONS:

COMPLIANCE:
• Take exactly as prescribed
• Complete the entire course even if you feel better
• Do not skip doses
• If you miss a dose, take it as soon as you remember
• Do not double dose if you miss one

PRECAUTIONS:
• Do not drink alcohol while taking this medication
• Inform all healthcare providers you are taking this antibiotic
• Do not share this medication with others
• Store as directed (room temperature/refrigerated)

DIETARY CONSIDERATIONS:
• [Specific food interactions]
• Probiotics may help maintain gut health
• Stay well hydrated

SIDE EFFECTS TO MONITOR:

Common (contact office if severe):
• Nausea or stomach upset
• Diarrhea
• Mild headache
• Dizziness

SERIOUS (seek immediate medical attention):
• Severe allergic reactions (rash, hives, difficulty breathing, swelling)
• Severe diarrhea (may indicate C. difficile infection)
• Unusual bleeding or bruising
• Yellowing of skin or eyes
• Severe abdominal pain
• Persistent vomiting

DRUG INTERACTIONS:
• Blood thinners (warfarin)
• Birth control pills (may reduce effectiveness)
• Antacids (take 2 hours apart)
• Other medications: _________________________________

FOLLOW-UP CARE:
Return appointment scheduled: [Date]
Call office if no improvement in: [Number] days
Laboratory tests needed: □ Yes    □ No
If yes, when: _________________________________

PRESCRIBER INFORMATION:
Doctor Name: [Doctor Name]
License Number: [License Number]
DEA Number: [DEA Number]
Signature: _________________
Date: [Date]

PHARMACY INFORMATION:
Preferred Pharmacy: [Pharmacy Name]
Address: [Pharmacy Address]
Phone: [Pharmacy Phone]

PATIENT ACKNOWLEDGMENT:
I have received and understand the above instructions regarding my antibiotic prescription. I understand the importance of taking the medication exactly as prescribed and completing the full course.

Patient Signature: _________________ Date: _________________

REFILLS: □ None    □ [Number] refills
Original Valid Until: [Date]

For Office Use:
Indication: _________________________________
Culture Results: _________________________________
Allergy Check: □ Completed
Insurance Verification: □ Completed
    `
  },
  {
    id: 'specialist-surgical-referral-letter',
    name: 'Specialist Surgical Referral Letter',
    type: 'letter',
    category: 'Referral Letters',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDefault: true,
    author: 'System',
    content: `
SPECIALIST SURGICAL REFERRAL LETTER

[Practice Letterhead]

Date: [Date]

Dr. [Specialist Name]
[Specialist Practice Name]
[Address]
[City, State, ZIP]

RE: [Patient Name]
DOB: [DOB]
Phone: [Patient Phone]

Dear Dr. [Specialist Name],

I am referring the above-named patient to your practice for specialist surgical evaluation and treatment consideration.

PATIENT INFORMATION:
Age: [Patient Age]
Chief Complaint: [Patient's main concern]
Referring Diagnosis: [Primary diagnosis]
Emergency Contact: [Contact Name and Phone]

CLINICAL FINDINGS:

Physical Examination:
• General appearance: [Description]
• Vital signs: BP [___] / HR [___] / Temp [___]
• Relevant exam findings: [Site-specific findings]
• Range of motion / functional status: [Description]
• Wound or lesion description: [Size, location, characteristics]

Surgical Site Assessment:
• Location: [Anatomical site]
• Size/Dimensions: [Measurements]
• Prior treatments at site: [Biopsies, radiation, surgery]
• Skin quality / scarring: [Description]
• Vascularity and sensation: [Assessment]

Imaging & Diagnostics:
• MRI/CT/Ultrasound: [Date] - [Key findings]
• Lab results: [Relevant values]
• Pathology: [Biopsy results if applicable]
• Other studies: [Specify]

MEDICAL HISTORY:
Significant medical conditions: [List relevant conditions]
Current medications: [List medications]
Allergies: [List allergies]
Previous surgeries: [List with dates and outcomes]
Anesthesia history: [Prior complications if any]

PREVIOUS TREATMENT:
□ None
□ Conservative management: [Details and duration]
□ Prior surgical intervention: [When, where, outcome]
□ Radiation/chemotherapy: [Details if applicable]

TREATMENT URGENCY:
□ Routine consultation
□ Urgent - please see within [timeframe]
□ Emergent - same-day evaluation requested

SPECIFIC CONCERNS/QUESTIONS:
1. [Specific clinical question]
2. [Surgical approach recommendations]
3. [Coordination with planned procedures at our clinic]

PATIENT GOALS & EXPECTATIONS:
□ Highly motivated    □ Moderately motivated    □ Uncertain
Patient concerns: [List specific concerns]
Patient goals: [Desired outcomes]

COORDINATION OF CARE:
Please advise regarding:
• Recommended surgical approach and timing
• Pre-operative clearance requirements
• Post-operative care coordination
• Follow-up schedule and shared care plan

I would appreciate your evaluation and treatment recommendations. Please feel free to contact me if you need any additional information, imaging, or records.

Thank you for your time and expertise in evaluating this patient.

Sincerely,

[Doctor Name], [Degree]
[Practice Name]
[Phone]
[Email]

Enclosures: Imaging reports, Clinical photographs, Operative notes (if available)

cc: Patient file
    `
  }
]

export default function FileManagementPage() {
  const [templates, setTemplates] = useState<FileTemplate[]>(DEFAULT_TEMPLATES)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [selectedType, setSelectedType] = useState<string>('All')
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<FileTemplate | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    type: 'document' as FileTemplate['type'],
    category: '',
    content: ''
  })

  const categories = ['All', ...Array.from(new Set(templates.map(t => t.category)))]
  const types = ['All', 'questionnaire', 'prescription', 'document', 'letter']

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory
    const matchesType = selectedType === 'All' || template.type === selectedType
    return matchesSearch && matchesCategory && matchesType
  })

  const handleCreateTemplate = () => {
    const template: FileTemplate = {
      id: `custom-${Date.now()}`,
      name: newTemplate.name,
      type: newTemplate.type,
      category: newTemplate.category,
      content: newTemplate.content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDefault: false,
      author: 'User'
    }
    setTemplates(prev => [...prev, template])
    setNewTemplate({ name: '', type: 'document', category: '', content: '' })
    setShowCreateModal(false)
    toast.success('Template created successfully')
  }

  const handleUpdateTemplate = () => {
    if (!editingTemplate) return

    setTemplates(prev => prev.map(t =>
      t.id === editingTemplate.id
        ? { ...editingTemplate, updatedAt: new Date().toISOString() }
        : t
    ))
    setEditingTemplate(null)
    setShowEditModal(false)
    toast.success('Template updated successfully')
  }

  const handleDeleteTemplate = (id: string) => {
    const template = templates.find(t => t.id === id)
    if (template?.isDefault) {
      toast.error('Cannot delete default templates')
      return
    }
    setTemplates(prev => prev.filter(t => t.id !== id))
    toast.success('Template deleted successfully')
  }

  const downloadTemplate = (template: FileTemplate) => {
    // Create a new window for PDF generation
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${template.name}</title>
                          <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                @page {
                  size: A4;
                  margin: 0.75in;
                }
                body { 
                  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  font-size: 11px;
                  line-height: 1.6;
                  color: #1f2937;
                  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                  margin: 0;
                  padding: 0;
                }
                .document-container {
                  background: white;
                  min-height: 100vh;
                  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                  margin: 0;
                }
                .header {
                  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
                  color: white;
                  padding: 30px;
                  margin: 0;
                  position: relative;
                  overflow: hidden;
                }
                .header::before {
                  content: '';
                  position: absolute;
                  top: 0;
                  right: 0;
                  width: 100px;
                  height: 100px;
                  background: rgba(255,255,255,0.1);
                  border-radius: 50%;
                  transform: translate(30px, -30px);
                }
                .header h1 {
                  font-size: 24px;
                  font-weight: 700;
                  margin: 0 0 15px 0;
                  letter-spacing: -0.5px;
                  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .header-info {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  margin-top: 20px;
                  font-size: 10px;
                  opacity: 0.9;
                }
                .practice-info {
                  flex: 1;
                }
                .document-meta {
                  text-align: right;
                  background: rgba(255,255,255,0.15);
                  padding: 10px 15px;
                  border-radius: 8px;
                  backdrop-filter: blur(10px);
                }
                .content {
                  padding: 40px;
                  white-space: pre-wrap;
                  font-family: 'Inter', sans-serif;
                  background: white;
                }
                .checkbox {
                  display: inline-block;
                  width: 14px;
                  height: 14px;
                  border: 2px solid #3b82f6;
                  border-radius: 3px;
                  margin-right: 8px;
                  vertical-align: middle;
                  position: relative;
                  background: #f8fafc;
                }
                .signature-line {
                  border-bottom: 2px solid #d1d5db;
                  display: inline-block;
                  min-width: 200px;
                  margin: 0 10px;
                  padding-bottom: 2px;
                  position: relative;
                }
                .signature-line::before {
                  content: '✍️';
                  position: absolute;
                  left: -20px;
                  bottom: 5px;
                  font-size: 12px;
                }
                .question-group {
                  margin: 20px 0;
                  padding: 15px;
                  background: #f8fafc;
                  border-radius: 8px;
                  border-left: 4px solid #3b82f6;
                }
                .footer-info {
                  margin-top: 40px;
                  padding: 20px;
                  background: #f8fafc;
                  border-radius: 8px;
                  font-size: 10px;
                  color: #6b7280;
                  text-align: center;
                }
                @media print {
                  body { 
                    margin: 0; 
                    padding: 0;
                    background: white !important;
                  }
                  .document-container {
                    box-shadow: none;
                  }
                  .no-print { display: none !important; }
                }
              </style>
          </head>
                      <body>
              <div class="document-container">
                <div class="header">
                  <h1>${template.name}</h1>
                  <div class="header-info">
                    <div class="practice-info">
                      <div><strong>[Your Practice Name]</strong></div>
                      <div>[Practice Address]</div>
                      <div>📞 [Practice Phone] | 📧 [Practice Email]</div>
                    </div>
                    <div class="document-meta">
                      <div><strong>Template</strong></div>
                      <div><strong>Generated:</strong> ${new Date().toLocaleDateString()}</div>
                      <div><strong>Time:</strong> ${new Date().toLocaleTimeString()}</div>
                    </div>
                  </div>
                </div>
                <div class="content">${template.content
          .replace(/□/g, '<span class="checkbox"></span>')
          .replace(/_{3,}/g, '<span class="signature-line"></span>')
          .replace(/\n\n([A-Z][^\\n]*:?)\n/g, '</div><div class="section-header">$1</div><div class="question-group">')
          .replace(/\n\n/g, '</div><div class="question-group">')
          .replace(/\n/g, '<br>')
        }</div>
                <div class="footer-info">
                  <div><strong>📋 ${template.name}</strong></div>
                  <div>Template generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
                  <div>This document is a template and should be customized for each patient.</div>
                </div>
              </div>
              <div class="no-print" style="position: fixed; bottom: 20px; right: 20px; z-index: 1000; display: flex; gap: 10px;">
                <button onclick="window.print()" style="background: linear-gradient(135deg, #3b82f6, #1e40af); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); transition: all 0.2s;">📄 Save as PDF</button>
                <button onclick="window.close()" style="background: linear-gradient(135deg, #6b7280, #4b5563); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3); transition: all 0.2s;">❌ Close</button>
              </div>
            </body>
        </html>
      `)
      printWindow.document.close()

      // Auto-trigger print dialog after a short delay
      setTimeout(() => {
        printWindow.print()
      }, 1000)
    }

    toast.success(`PDF ready for download: ${template.name}`)
  }

  const previewTemplate = (template: FileTemplate) => {
    const newWindow = window.open('', '_blank')
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Preview: ${template.name}</title>
                          <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                @page {
                  size: A4;
                  margin: 0.75in;
                }
                body { 
                  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  font-size: 11px;
                  line-height: 1.6;
                  color: #1f2937;
                  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                  margin: 0;
                  padding: 20px;
                  max-width: 900px;
                  margin: 0 auto;
                }
                .preview-header {
                  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                  color: white;
                  padding: 15px 20px;
                  border-radius: 12px;
                  margin-bottom: 25px;
                  text-align: center;
                  font-family: 'Inter', sans-serif;
                  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
                }
                .template-info {
                  background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
                  padding: 12px 20px;
                  border-radius: 8px;
                  margin-bottom: 25px;
                  font-family: 'Inter', sans-serif;
                  font-size: 11px;
                  text-align: center;
                  font-weight: 500;
                  color: #4338ca;
                }
                .document-container {
                  background: white;
                  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                  border-radius: 12px;
                  overflow: hidden;
                }
                .header {
                  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
                  color: white;
                  padding: 30px;
                  margin: 0;
                  position: relative;
                  overflow: hidden;
                }
                .header::before {
                  content: '';
                  position: absolute;
                  top: 0;
                  right: 0;
                  width: 100px;
                  height: 100px;
                  background: rgba(255,255,255,0.1);
                  border-radius: 50%;
                  transform: translate(30px, -30px);
                }
                .header h1 {
                  font-size: 24px;
                  font-weight: 700;
                  margin: 0 0 15px 0;
                  letter-spacing: -0.5px;
                  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .header-info {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  margin-top: 20px;
                  font-size: 10px;
                  opacity: 0.9;
                }
                .practice-info {
                  flex: 1;
                }
                .document-meta {
                  text-align: right;
                  background: rgba(255,255,255,0.15);
                  padding: 10px 15px;
                  border-radius: 8px;
                  backdrop-filter: blur(10px);
                }
                .content {
                  padding: 40px;
                  white-space: pre-wrap;
                  font-family: 'Inter', sans-serif;
                  background: white;
                }
                .checkbox {
                  display: inline-block;
                  width: 14px;
                  height: 14px;
                  border: 2px solid #3b82f6;
                  border-radius: 3px;
                  margin-right: 8px;
                  vertical-align: middle;
                  position: relative;
                  background: #f8fafc;
                }
                .signature-line {
                  border-bottom: 2px solid #d1d5db;
                  display: inline-block;
                  min-width: 200px;
                  margin: 0 10px;
                  padding-bottom: 2px;
                  position: relative;
                }
                .signature-line::before {
                  content: '✍️';
                  position: absolute;
                  left: -20px;
                  bottom: 5px;
                  font-size: 12px;
                }
                .question-group {
                  margin: 20px 0;
                  padding: 15px;
                  background: #f8fafc;
                  border-radius: 8px;
                  border-left: 4px solid #3b82f6;
                }
                .footer-info {
                  margin-top: 40px;
                  padding: 20px;
                  background: #f8fafc;
                  border-radius: 8px;
                  font-size: 10px;
                  color: #6b7280;
                  text-align: center;
                }
                .actions {
                  margin-top: 30px;
                  text-align: center;
                  font-family: 'Inter', sans-serif;
                  padding: 20px;
                }
                button {
                  background: linear-gradient(135deg, #3b82f6, #1e40af);
                  color: white;
                  border: none;
                  padding: 12px 24px;
                  border-radius: 8px;
                  cursor: pointer;
                  margin: 0 8px;
                  font-weight: 600;
                  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                  transition: all 0.2s;
                  font-family: 'Inter', sans-serif;
                }
                button:hover {
                  transform: translateY(-2px);
                  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
                }
                .close-btn {
                  background: linear-gradient(135deg, #6b7280, #4b5563);
                  box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
                }
                .close-btn:hover {
                  box-shadow: 0 6px 16px rgba(107, 114, 128, 0.4);
                }
                @media print {
                  .preview-header, .template-info, .actions { display: none; }
                  body { margin: 0; padding: 0; background: white !important; }
                  .document-container { box-shadow: none; border-radius: 0; }
                }
              </style>
          </head>
                      <body>
              <div class="preview-header">
                <strong>✨ Modern PDF Template Preview</strong> - This is how your template will look when printed/downloaded as PDF
              </div>
              <div class="template-info">
                <strong>Template:</strong> ${template.name} | <strong>Type:</strong> ${template.type} | <strong>Category:</strong> ${template.category}
              </div>
              <div class="document-container">
                <div class="header">
                  <h1>${template.name}</h1>
                  <div class="header-info">
                    <div class="practice-info">
                      <div><strong>[Your Practice Name]</strong></div>
                      <div>[Practice Address]</div>
                      <div>📞 [Practice Phone] | 📧 [Practice Email]</div>
                    </div>
                    <div class="document-meta">
                      <div><strong>Template</strong></div>
                      <div><strong>Generated:</strong> ${new Date().toLocaleDateString()}</div>
                      <div><strong>Time:</strong> ${new Date().toLocaleTimeString()}</div>
                    </div>
                  </div>
                </div>
                <div class="content">${template.content
          .replace(/□/g, '<span class="checkbox"></span>')
          .replace(/_{3,}/g, '<span class="signature-line"></span>')
          .replace(/\n\n([A-Z][^\\n]*:?)\n/g, '</div><div class="section-header">$1</div><div class="question-group">')
          .replace(/\n\n/g, '</div><div class="question-group">')
          .replace(/\n/g, '<br>')
        }</div>
                <div class="footer-info">
                  <div><strong>📋 ${template.name}</strong></div>
                  <div>Template generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
                  <div>This document is a template and should be customized for each patient.</div>
                </div>
              </div>
              <div class="actions">
                <button onclick="window.print()">🖨️ Print as PDF</button>
                <button onclick="window.close()" class="close-btn">❌ Close Preview</button>
              </div>
            </body>
        </html>
      `)
      newWindow.document.close()
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'questionnaire': return '📋'
      case 'prescription': return '💊'
      case 'letter': return '✉️'
      case 'document': return '📄'
      default: return '📄'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'questionnaire': return 'bg-purple-100 text-purple-800'
      case 'prescription': return 'bg-teal-100 text-teal-800'
      case 'letter': return 'bg-indigo-100 text-indigo-800'
      case 'document': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">File Management System</h1>
        <p className="text-gray-600">Manage questionnaires, prescriptions, and document templates</p>
      </div>

      {/* Controls */}
      <Card className="p-6 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border rounded-md min-w-[150px]"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border rounded-md min-w-[120px]"
          >
            <option value="All">All Types</option>
            {types.slice(1).map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>

          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Template
          </Button>
        </div>
      </Card>

      {/* Templates Grid */}
      <div className="grid gap-4">
        {filteredTemplates.map(template => (
          <Card key={template.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{getTypeIcon(template.type)}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(template.type)}`}>
                        {template.type}
                      </span>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-600">{template.category}</span>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-500">
                        {new Date(template.updatedAt).toLocaleDateString()}
                      </span>
                      {template.isDefault && (
                        <>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                            Default
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 text-sm line-clamp-2">
                  {template.content.split('\n').find(line => line.trim() && !line.includes('['))?.substring(0, 150)}...
                </p>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => previewTemplate(template)}
                  title="Preview template"
                >
                  <FileText className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadTemplate(template)}
                  title="Download as PDF"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newWindow = window.open('', '_blank')
                    if (newWindow) {
                      newWindow.document.write(`
                        <html>
                          <head>
                            <title>Print: ${template.name}</title>
                            <style>
                              body { 
                                font-family: Arial, sans-serif; 
                                padding: 20px; 
                                line-height: 1.6;
                              }
                              pre { 
                                white-space: pre-wrap; 
                                font-family: Arial, sans-serif;
                              }
                              @media print {
                                body { margin: 0; padding: 15px; }
                              }
                            </style>
                          </head>
                          <body>
                            <pre>${template.content}</pre>
                            <script>window.print();</script>
                          </body>
                        </html>
                      `)
                      newWindow.document.close()
                    }
                  }}
                  title="Print template"
                >
                  <Printer className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingTemplate(template)
                    setShowEditModal(true)
                  }}
                  title="Edit template"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                {!template.isDefault && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id)}
                    title="Delete template"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}

        {filteredTemplates.length === 0 && (
          <Card className="p-12 text-center">
            <Files className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or create a new template.</p>
          </Card>
        )}
      </div>

      {/* Create Template Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Template Name</label>
                <Input
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter template name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <Input
                  value={newTemplate.category}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="Enter category"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select
                value={newTemplate.type}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, type: e.target.value as FileTemplate['type'] }))}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="document">Document</option>
                <option value="questionnaire">Questionnaire</option>
                <option value="prescription">Prescription</option>
                <option value="letter">Letter</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Content</label>
              <Textarea
                value={newTemplate.content}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter template content..."
                className="min-h-[400px] font-mono"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateTemplate}
              disabled={!newTemplate.name || !newTemplate.category || !newTemplate.content}
            >
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
          </DialogHeader>

          {editingTemplate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Template Name</label>
                  <Input
                    value={editingTemplate.name}
                    onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, name: e.target.value } : null)}
                    disabled={editingTemplate.isDefault}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <Input
                    value={editingTemplate.category}
                    onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, category: e.target.value } : null)}
                    disabled={editingTemplate.isDefault}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Content</label>
                <Textarea
                  value={editingTemplate.content}
                  onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, content: e.target.value } : null)}
                  className="min-h-[400px] font-mono"
                />
              </div>

              {editingTemplate.isDefault && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-700">
                    Note: This is a default template. Only content can be modified.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTemplate}>
              Update Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 