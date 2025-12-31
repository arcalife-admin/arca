import React, { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Download, FileText, Upload, Trash2, FolderOpen, Plus, X, Files } from 'lucide-react'
import { toast } from 'sonner'

interface FileItem {
  id: string
  name: string
  type: 'questionnaire' | 'prescription' | 'document' | 'uploaded'
  category: string
  size?: number
  url?: string
  content?: string
  createdAt: string
  isTemplate?: boolean
}

interface FilesModalProps {
  isOpen: boolean
  onClose: () => void
  patientId: string
  patientName: string
}

// Default file templates
const DEFAULT_FILES: FileItem[] = [
  {
    id: 'dental-hygiene-questionnaire',
    name: 'Dental Hygiene Questionnaire',
    type: 'questionnaire',
    category: 'Questionnaires',
    createdAt: new Date().toISOString(),
    isTemplate: true,
    content: `
DENTAL HYGIENE QUESTIONNAIRE

Patient Name: [Patient Name]
Date: [Date]

1. How often do you brush your teeth?
   □ Once a day    □ Twice a day    □ Three times a day    □ More than three times

2. What type of toothbrush do you use?
   □ Manual soft    □ Manual medium    □ Manual hard    □ Electric

3. Do you floss regularly?
   □ Daily    □ Few times a week    □ Weekly    □ Rarely    □ Never

4. Do you use mouthwash?
   □ Daily    □ Few times a week    □ Weekly    □ Rarely    □ Never

5. Do you experience bleeding gums?
   □ Never    □ Rarely    □ Sometimes    □ Often    □ Always

6. Do you have tooth sensitivity?
   □ None    □ Mild    □ Moderate    □ Severe

7. Do you grind your teeth?
   □ Never    □ Rarely    □ Sometimes    □ Often    □ Always

8. When was your last dental cleaning?
   □ Within 6 months    □ 6-12 months ago    □ 1-2 years ago    □ Over 2 years ago

9. Rate your oral health concern level (1-10): ____

10. Additional comments or concerns:
    _________________________________
    _________________________________
    _________________________________

Thank you for completing this questionnaire. This information helps us provide personalized dental hygiene care.
    `
  },
  {
    id: 'gfi-questionnaire',
    name: 'GFI Health Questionnaire',
    type: 'questionnaire',
    category: 'Questionnaires',
    createdAt: new Date().toISOString(),
    isTemplate: true,
    content: `
GENERAL HEALTH INFORMATION (GFI) QUESTIONNAIRE

Patient Name: [Patient Name]
Date of Birth: [DOB]
Date: [Date]

MEDICAL HISTORY

1. Are you currently under medical care?    □ Yes    □ No
   If yes, for what condition: _________________________________

2. Are you taking any medications?    □ Yes    □ No
   If yes, please list: _________________________________

3. Do you have any allergies to medications?    □ Yes    □ No
   If yes, please specify: _________________________________

4. Do you have or have you had any of the following:
   □ Heart disease    □ High blood pressure    □ Diabetes
   □ Liver disease    □ Kidney disease    □ Cancer
   □ HIV/AIDS    □ Hepatitis    □ Tuberculosis
   □ Epilepsy    □ Stroke    □ Arthritis
   □ Osteoporosis    □ Bleeding disorders    □ Pregnancy

5. Do you smoke or use tobacco?    □ Yes    □ No
   If yes, how much: _________________________________

6. Do you drink alcohol?    □ Yes    □ No
   If yes, how much: _________________________________

DENTAL HISTORY

7. When was your last dental visit? _________________________________

8. Reason for last visit:
   □ Regular checkup    □ Pain    □ Treatment    □ Emergency

9. Have you had any bad experiences with dental treatment?    □ Yes    □ No

10. Are you anxious about dental treatment?    □ Yes    □ No

11. Do you have any dental pain now?    □ Yes    □ No

CURRENT SYMPTOMS

12. Do you experience any of the following:
    □ Jaw pain or clicking    □ Headaches    □ Neck pain
    □ Tooth sensitivity    □ Bleeding gums    □ Bad breath
    □ Dry mouth    □ Difficulty chewing

Patient Signature: _________________ Date: _________________

This information is confidential and will be used solely for dental care purposes.
    `
  },
  {
    id: 'erosive-tooth-wear-questionnaire',
    name: 'Erosive Tooth Wear Assessment',
    type: 'questionnaire',
    category: 'Questionnaires',
    createdAt: new Date().toISOString(),
    isTemplate: true,
    content: `
EROSIVE TOOTH WEAR ASSESSMENT QUESTIONNAIRE

Patient Name: [Patient Name]
Date: [Date]

DIETARY HABITS

1. How often do you consume acidic drinks? (soft drinks, sports drinks, fruit juices)
   □ Never    □ 1-2 times per week    □ 3-4 times per week    □ Daily    □ Multiple times daily

2. How often do you consume citrus fruits?
   □ Never    □ 1-2 times per week    □ 3-4 times per week    □ Daily    □ Multiple times daily

3. Do you hold acidic drinks in your mouth before swallowing?    □ Yes    □ No

4. Do you sip drinks slowly over a long period?    □ Yes    □ No

5. When do you typically brush your teeth after consuming acidic foods/drinks?
   □ Immediately    □ Within 30 minutes    □ 1 hour later    □ Don't change routine

SYMPTOMS

6. Do you experience tooth sensitivity to:
   □ Cold    □ Hot    □ Sweet    □ Sour    □ None

7. Have you noticed changes in tooth appearance?
   □ Yellowing    □ Transparency    □ Shortened teeth    □ Rough edges    □ None

8. Do you experience any tooth pain?    □ Yes    □ No

MEDICAL CONDITIONS

9. Do you suffer from acid reflux or GERD?    □ Yes    □ No

10. Do you have frequent vomiting episodes?    □ Yes    □ No

11. Do you take any medications that cause dry mouth?    □ Yes    □ No

LIFESTYLE FACTORS

12. Do you swim regularly in chlorinated pools?    □ Yes    □ No

13. Are you exposed to acid fumes at work?    □ Yes    □ No

RISK ASSESSMENT SCORE: _____ (to be completed by dental professional)

Recommendations:
□ Dietary counseling
□ Fluoride treatment
□ Regular monitoring
□ Protective measures

Dental Professional: _________________ Date: _________________
    `
  },
  {
    id: 'nutrition-questionnaire',
    name: 'Nutritional Assessment for Oral Health',
    type: 'questionnaire',
    category: 'Questionnaires',
    createdAt: new Date().toISOString(),
    isTemplate: true,
    content: `
NUTRITIONAL ASSESSMENT FOR ORAL HEALTH

Patient Name: [Patient Name]
Date: [Date]

EATING PATTERNS

1. How many meals do you eat per day?
   □ 1-2    □ 3    □ 4-5    □ More than 5

2. How many snacks do you have per day?
   □ None    □ 1-2    □ 3-4    □ More than 4

3. What time do you usually eat your last meal/snack?
   □ Before 6 PM    □ 6-8 PM    □ 8-10 PM    □ After 10 PM

SUGAR CONSUMPTION

4. How often do you consume sugary foods? (candy, desserts, pastries)
   □ Never    □ 1-2 times per week    □ 3-4 times per week    □ Daily    □ Multiple times daily

5. How often do you consume sugary drinks? (soda, sports drinks, sweetened coffee/tea)
   □ Never    □ 1-2 times per week    □ 3-4 times per week    □ Daily    □ Multiple times daily

6. Do you add sugar to beverages?    □ Yes    □ No

ACID EXPOSURE

7. How often do you consume acidic foods/drinks? (citrus, tomatoes, wine)
   □ Never    □ 1-2 times per week    □ 3-4 times per week    □ Daily    □ Multiple times daily

HEALTHY CHOICES

8. How many servings of dairy do you consume daily?
   □ None    □ 1    □ 2-3    □ More than 3

9. How many servings of fruits and vegetables do you eat daily?
   □ 0-2    □ 3-5    □ 6-8    □ More than 8

10. Do you take any nutritional supplements?    □ Yes    □ No
    If yes, please specify: _________________________________

HYDRATION

11. How much water do you drink daily?
    □ Less than 4 glasses    □ 4-6 glasses    □ 7-8 glasses    □ More than 8 glasses

12. What is your primary beverage choice?
    □ Water    □ Juice    □ Soda    □ Coffee/Tea    □ Sports drinks

SPECIAL CONSIDERATIONS

13. Do you follow any special diet?    □ Yes    □ No
    If yes, specify: _________________________________

14. Do you have any eating disorders or unusual eating habits?    □ Yes    □ No

RECOMMENDATIONS:
□ Reduce sugar frequency
□ Increase water intake
□ Improve meal timing
□ Add protective foods
□ Nutritional counseling referral

Nutritionist/Dental Professional: _________________ Date: _________________
    `
  },
  {
    id: 'antibiotic-prescription',
    name: 'Antibiotic Prescription Form',
    type: 'prescription',
    category: 'Prescriptions',
    createdAt: new Date().toISOString(),
    isTemplate: true,
    content: `
ANTIBIOTIC PRESCRIPTION

Patient Name: [Patient Name]
Date of Birth: [DOB]
Date: [Date]

PRESCRIPTION DETAILS:
Medication: [Antibiotic Name]
Strength: [Dose] mg
Quantity: [Number] tablets/capsules
Directions: Take [frequency] [timing] for [duration] days

IMPORTANT INSTRUCTIONS:

1. Take exactly as prescribed - Complete the entire course even if you feel better
2. Take with food to reduce stomach upset
3. Do not drink alcohol while taking this medication
4. Space doses evenly throughout the day
5. Do not share this medication with others

SIDE EFFECTS TO WATCH FOR:
- Nausea or stomach upset
- Diarrhea
- Allergic reactions (rash, difficulty breathing, swelling)
- Yeast infections

WHEN TO CONTACT US:
- Severe allergic reactions (seek emergency care immediately)
- Persistent nausea or vomiting
- Severe diarrhea
- No improvement after 2-3 days
- Any unusual symptoms

FOLLOW-UP:
Return for follow-up appointment on: [Date]

Prescribing Doctor: [Doctor Name]
License #: [License Number]
Signature: _________________
Date: [Date]

Pharmacy Information:
[Pharmacy Name]
[Pharmacy Address]
[Pharmacy Phone]

Patient/Guardian Signature: _________________ Date: _________
(Acknowledging receipt of instructions)
    `
  },
  {
    id: 'pain-medication-prescription',
    name: 'Pain Medication Prescription',
    type: 'prescription',
    category: 'Prescriptions',
    createdAt: new Date().toISOString(),
    isTemplate: true,
    content: `
PAIN MEDICATION PRESCRIPTION

Patient Name: [Patient Name]
Date of Birth: [DOB]
Date: [Date]

PRESCRIPTION DETAILS:
Medication: [Pain Medication Name]
Strength: [Dose] mg
Quantity: [Number] tablets
Directions: Take [frequency] as needed for pain
Maximum: [Max daily dose] tablets per day

PAIN MANAGEMENT INSTRUCTIONS:

MEDICATION GUIDELINES:
1. Take only as directed - Do not exceed prescribed dose
2. Take with food if stomach upset occurs
3. Do not operate machinery or drive while taking this medication
4. Do not drink alcohol while taking this medication
5. Store in a safe place away from children

NON-MEDICATION PAIN RELIEF:
1. Apply ice for first 24 hours (20 minutes on, 20 minutes off)
2. After 24 hours, switch to warm compresses
3. Rest and avoid strenuous activity
4. Sleep with head elevated
5. Eat soft foods and avoid chewing on treated side

WHEN TO CONTACT US:
- Pain worsens or doesn't improve after 2-3 days
- Signs of infection (fever, increased swelling, pus)
- Allergic reactions
- Severe side effects
- Excessive bleeding

SIDE EFFECTS TO MONITOR:
- Drowsiness or dizziness
- Nausea or constipation
- Difficulty breathing
- Unusual mood changes

FOLLOW-UP CARE:
Next appointment: [Date]
Special instructions: [Any specific post-operative care]

Prescribing Doctor: [Doctor Name]
License #: [License Number]
Signature: _________________
Date: [Date]

Emergency Contact: [Emergency Phone]

Patient/Guardian Signature: _________________ Date: _________
(Acknowledging receipt of instructions)
    `
  },
  {
    id: 'fluoride-prescription',
    name: 'Fluoride Treatment Prescription',
    type: 'prescription',
    category: 'Prescriptions',
    createdAt: new Date().toISOString(),
    isTemplate: true,
    content: `
FLUORIDE TREATMENT PRESCRIPTION

Patient Name: [Patient Name]
Date of Birth: [DOB]
Date: [Date]

PRESCRIPTION DETAILS:
Medication: [Fluoride Product Name]
Strength: [Concentration] ppm fluoride
Quantity: [Amount]
Form: □ Gel  □ Foam  □ Toothpaste  □ Rinse

APPLICATION INSTRUCTIONS:

FOR HIGH-CONCENTRATION FLUORIDE TOOTHPASTE:
1. Use a pea-sized amount on your toothbrush
2. Brush gently for 2 minutes before bedtime
3. Spit out excess but do not rinse with water
4. No eating or drinking for 30 minutes after application
5. Use only at bedtime

FOR FLUORIDE RINSE:
1. Use [amount] ml daily after brushing
2. Rinse for 1 minute then spit out
3. Do not swallow
4. No eating or drinking for 30 minutes after use

IMPORTANT SAFETY INFORMATION:
- Do not swallow fluoride products
- Keep out of reach of children
- Use only as directed
- Stop use if irritation occurs

WHY THIS TREATMENT IS PRESCRIBED:
□ High risk of dental decay
□ Root surface caries
□ Xerostomia (dry mouth)
□ Orthodontic treatment
□ Radiation therapy
□ Other: [Specify]

EXPECTED BENEFITS:
- Strengthens tooth enamel
- Reduces risk of cavities
- Helps remineralize early decay
- Reduces tooth sensitivity

FOLLOW-UP:
Return for evaluation in: [Time period]
Next fluoride application: [Date]

ADDITIONAL RECOMMENDATIONS:
□ Continue regular fluoride toothpaste
□ Avoid frequent snacking
□ Limit sugary/acidic beverages
□ Regular dental checkups

Prescribing Doctor: [Doctor Name]
License #: [License Number]
Signature: _________________
Date: [Date]

Patient/Guardian Signature: _________________ Date: _________
(Acknowledging receipt of instructions)
    `
  }
]

export function FilesModal({ isOpen, onClose, patientId, patientName }: FilesModalProps) {
  const [files, setFiles] = useState<FileItem[]>(DEFAULT_FILES)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const categories = ['All', ...Array.from(new Set(files.map(f => f.category)))]

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || file.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleFileUpload = (uploadedFiles: FileList) => {
    Array.from(uploadedFiles).forEach(file => {
      const newFile: FileItem = {
        id: `uploaded-${Date.now()}-${Math.random()}`,
        name: file.name,
        type: 'uploaded',
        category: 'Uploaded Files',
        size: file.size,
        createdAt: new Date().toISOString(),
        isTemplate: false
      }
      setFiles(prev => [...prev, newFile])
    })
    toast.success(`${uploadedFiles.length} file(s) uploaded successfully`)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      handleFileUpload(droppedFiles)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const downloadFile = (file: FileItem) => {
    if (file.content) {
      // Create downloadable PDF content
      const personalizedContent = file.content
        .replace(/\[Patient Name\]/g, patientName)
        .replace(/\[Date\]/g, new Date().toLocaleDateString())
        .replace(/\[DOB\]/g, '[Date of Birth]')
        .replace(/\[Patient Code\]/g, '[Patient Code]')

      // Create a new window for PDF generation
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${file.name} - ${patientName}</title>
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
                .checkbox::after {
                  content: '';
                  position: absolute;
                  top: 1px;
                  left: 4px;
                  width: 4px;
                  height: 8px;
                  border: solid #3b82f6;
                  border-width: 0 2px 2px 0;
                  transform: rotate(45deg);
                  opacity: 0;
                }
                .section-header {
                  font-weight: 600;
                  color: #1e40af;
                  font-size: 13px;
                  margin: 30px 0 15px 0;
                  padding-bottom: 8px;
                  border-bottom: 2px solid #e5e7eb;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
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
                  <h1>${file.name}</h1>
                  <div class="header-info">
                    <div class="practice-info">
                      <div><strong>[Your Practice Name]</strong></div>
                      <div>[Practice Address]</div>
                      <div>📞 [Practice Phone] | 📧 [Practice Email]</div>
                    </div>
                    <div class="document-meta">
                      <div><strong>Patient:</strong> ${patientName}</div>
                      <div><strong>Generated:</strong> ${new Date().toLocaleDateString()}</div>
                      <div><strong>Time:</strong> ${new Date().toLocaleTimeString()}</div>
                    </div>
                  </div>
                </div>
                <div class="content">${personalizedContent
            .replace(/□/g, '<span class="checkbox"></span>')
            .replace(/_{3,}/g, '<span class="signature-line"></span>')
            .replace(/\n\n([A-Z][^\\n]*:?)\n/g, '</div><div class="section-header">$1</div><div class="question-group">')
            .replace(/\n\n/g, '</div><div class="question-group">')
            .replace(/\n/g, '<br>')
          }</div>
                <div class="footer-info">
                  <div><strong>🏥 ${file.name}</strong></div>
                  <div>Document generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
                  <div>This document is confidential and intended solely for medical purposes.</div>
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

      toast.success(`PDF ready for download: ${file.name}`)
    } else {
      toast.error('File content not available')
    }
  }

  const previewFile = (file: FileItem) => {
    if (file.content) {
      const personalizedContent = file.content
        .replace(/\[Patient Name\]/g, patientName)
        .replace(/\[Date\]/g, new Date().toLocaleDateString())
        .replace(/\[DOB\]/g, '[Date of Birth]')
        .replace(/\[Patient Code\]/g, '[Patient Code]')

      const newWindow = window.open('', '_blank')
      if (newWindow) {
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Preview: ${file.name} - ${patientName}</title>
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
                  .preview-header, .actions { display: none; }
                  body { margin: 0; padding: 0; background: white !important; }
                  .document-container { box-shadow: none; border-radius: 0; }
                }
              </style>
            </head>
                        <body>
              <div class="preview-header">
                <strong>✨ Modern PDF Preview</strong> - This is how your document will look when printed/downloaded as PDF
              </div>
              <div class="document-container">
                <div class="header">
                  <h1>${file.name}</h1>
                  <div class="header-info">
                    <div class="practice-info">
                      <div><strong>[Your Practice Name]</strong></div>
                      <div>[Practice Address]</div>
                      <div>📞 [Practice Phone] | 📧 [Practice Email]</div>
                    </div>
                    <div class="document-meta">
                      <div><strong>Patient:</strong> ${patientName}</div>
                      <div><strong>Generated:</strong> ${new Date().toLocaleDateString()}</div>
                      <div><strong>Time:</strong> ${new Date().toLocaleTimeString()}</div>
                    </div>
                  </div>
                </div>
                <div class="content">${personalizedContent
            .replace(/□/g, '<span class="checkbox"></span>')
            .replace(/_{3,}/g, '<span class="signature-line"></span>')
            .replace(/\n\n([A-Z][^\\n]*:?)\n/g, '</div><div class="section-header">$1</div><div class="question-group">')
            .replace(/\n\n/g, '</div><div class="question-group">')
            .replace(/\n/g, '<br>')
          }</div>
                <div class="footer-info">
                  <div><strong>🏥 ${file.name}</strong></div>
                  <div>Document generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
                  <div>This document is confidential and intended solely for medical purposes.</div>
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
  }

  const deleteFile = (fileId: string) => {
    const file = files.find(f => f.id === fileId)
    if (file?.isTemplate) {
      toast.error('Cannot delete template files')
      return
    }
    setFiles(prev => prev.filter(f => f.id !== fileId))
    toast.success('File deleted successfully')
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'questionnaire':
        return '📋'
      case 'prescription':
        return '💊'
      case 'document':
        return '📄'
      case 'uploaded':
        return '📁'
      default:
        return '📄'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Files className="h-5 w-5" />
            Patient Files - {patientName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-[70vh]">
          {/* Search and Controls */}
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload
            </Button>
          </div>

          {/* Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-4 mb-4 transition-colors ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="text-center text-gray-500">
              <FolderOpen className="h-8 w-8 mx-auto mb-2" />
              <p>Drag and drop files here or click Upload button</p>
              <p className="text-sm">Supported formats: PDF, DOC, TXT, Images</p>
              <p className="text-xs text-blue-600 mt-1">💡 All templates download as professional PDFs!</p>
            </div>
          </div>

          {/* Files List */}
          <div className="flex-1 overflow-y-auto border rounded-lg">
            <div className="grid gap-2 p-4">
              {filteredFiles.map(file => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-2xl">{getFileIcon(file.type)}</span>
                    <div className="flex-1">
                      <div className="font-medium">{file.name}</div>
                      <div className="text-sm text-gray-500">
                        {file.category} • {new Date(file.createdAt).toLocaleDateString()}
                        {file.size && ` • ${(file.size / 1024).toFixed(1)} KB`}
                        {file.isTemplate && (
                          <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                            Template
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => previewFile(file)}
                      title="Preview file"
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadFile(file)}
                      title="Download as PDF"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {!file.isTemplate && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteFile(file.id)}
                        title="Delete file"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {filteredFiles.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Files className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No files found matching your criteria</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => {
            if (e.target.files) {
              handleFileUpload(e.target.files)
            }
          }}
          className="hidden"
        />
      </DialogContent>
    </Dialog>
  )
} 