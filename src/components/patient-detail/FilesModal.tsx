import React, { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Download, FileText, Upload, Trash2, FolderOpen, Plus, X, Files } from 'lucide-react'
import { toast } from 'sonner'
import { openHtmlPreview, printHtmlDocument } from '@/lib/print-html'

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
    id: 'pre-operative-health-questionnaire',
    name: 'Chestionar medical preoperator',
    type: 'questionnaire',
    category: 'Chestionare',
    createdAt: new Date().toISOString(),
    isTemplate: true,
    content: `
CHESTIONAR MEDICAL PREOPERATOR

Nume pacient: [Nume pacient]
Data: [Dată]
Procedură planificată: [Procedure Name]

1. Ați mai avut intervenții chirurgicale?    □ Da    □ Nu
   Dacă da, enumerați: _________________________________

2. Ați avut complicații cu anestezia?    □ Da    □ Nu
   Dacă da, descrieți: _________________________________

3. Luați anticoagulante sau antiplachetare?    □ Da    □ Nu

4. Înțelegeți instrucțiunile de post înainte de intervenție?    □ Da    □ Nu

5. Veți avea pe cineva care să vă conducă acasă după intervenție?    □ Da    □ Nu

6. Aveți sprijin acasă în primele 48 de ore?    □ Da    □ Nu

7. Fumați sau folosiți produse cu nicotină?    □ Da    □ Nu

8. Evaluați anxietatea față de intervenție (1-10): ____

9. Comentarii sau îngrijorări suplimentare:
   _________________________________
   _________________________________

Vă mulțumim pentru completarea acestui chestionar. Aceste informații ne ajută să vă pregătim în siguranță pentru procedură.
    `
  },
  {
    id: 'gfi-questionnaire',
    name: 'Chestionar informații generale de sănătate (GFI)',
    type: 'questionnaire',
    category: 'Chestionare',
    createdAt: new Date().toISOString(),
    isTemplate: true,
    content: `
CHESTIONAR INFORMAȚII GENERALE DE SĂNĂTATE (GFI)

Nume pacient: [Nume pacient]
Data nașterii: [Data nașterii]
Data: [Dată]

ISTORIC MEDICAL

1. Sunteți în prezent sub îngrijire medicală?    □ Da    □ Nu
   Dacă da, pentru ce afecțiune: _________________________________

2. Luați medicamente?    □ Da    □ Nu
   Dacă da, enumerați: _________________________________

3. Aveți alergii la medicamente?    □ Da    □ Nu
   Dacă da, precizați: _________________________________

4. Aveți sau ați avut vreuna dintre următoarele:
   □ Boli de inimă    □ Hipertensiune arterială    □ Diabet
   □ Boli hepatice    □ Boli renale    □ Cancer
   □ HIV/SIDA    □ Hepatită    □ Tuberculoză
   □ Epilepsie    □ AVC    □ Artrită
   □ Osteoporoză    □ Tulburări de coagulare    □ Sarcină

5. Fumați sau folosiți tutun?    □ Da    □ Nu
   Dacă da, cât: _________________________________

6. Consumați alcool?    □ Da    □ Nu
   Dacă da, cât: _________________________________

ISTORIC CHIRURGICAL

7. Când a fost ultima intervenție chirurgicală? _________________________________

8. Motivul ultimei intervenții:
   □ Electivă    □ Urgență    □ Traumă    □ Altul

9. Ați avut experiențe neplăcute cu intervenții chirurgicale sau anestezia?    □ Da    □ Nu

10. Sunteți anxios/ă față de procedura viitoare?    □ Da    □ Nu

11. Aveți durere la locul intervenției chirurgicale actuale?    □ Da    □ Nu

SIMPTOME ACTUALE

12. Prezentați vreunul dintre următoarele:
    □ Dispnee    □ Durere toracică    □ Edeme
    □ Sângerare necontrolată    □ Febră    □ Secreție la nivelul plăgii

Semnătura pacientului: _________________ Data: _________________

Aceste informații sunt confidențiale și vor fi utilizate exclusiv în scopul îngrijirii chirurgicale.
    `
  },
  {
    id: 'pre-operative-surgical-risk-assessment',
    name: 'Evaluarea riscului chirurgical preoperator',
    type: 'questionnaire',
    category: 'Chestionare',
    createdAt: new Date().toISOString(),
    isTemplate: true,
    content: `
EVALUAREA RISCULUI CHIRURGICAL PREOPERATOR

Nume pacient: [Nume pacient]
Data: [Dată]
Procedură planificată: [Procedure Name]

CARDIOVASCULAR ȘI RESPIRATOR

1. Antecedente de boli de inimă, AVC sau hipertensiune necontrolată?    □ Da    □ Nu

2. Astm, BPOC sau apnee în somn?    □ Da    □ Nu

3. Infecție respiratorie recentă (în ultimele 4 săptămâni)?    □ Da    □ Nu

SÂNGERARE ȘI ANESTEZIE

4. Antecedente de sângerare excesivă sau cheaguri de sânge?    □ Da    □ Nu

5. În prezent sub terapie anticoagulantă sau antiplachetară?    □ Da    □ Nu

6. Reacție adversă anterioară la anestezie?    □ Da    □ Nu

VINDECARE ȘI RISC DE INFECȚIE

7. Diabet (controlat/necontrolat)?    □ Nu    □ Da

8. Infecție activă sau imunosupresie?    □ Da    □ Nu

9. Fumat sau consum de nicotină?    □ Niciodată    □ Fost fumător    □ Fumător actual

STATUS FUNCȚIONAL

10. Puteți urca un etaj fără oprire?    □ Da    □ Nu

EVALUARE RISC: _____ (de completat de echipa chirurgicală)

Recomandări:
□ Necesită aviz medical
□ Ajustare protocol anticoagulare
□ Analize/imagistică preoperatorie
□ Consult anestezie

Medic: _________________ Data: _________________
    `
  },
  {
    id: 'pre-operative-nutrition-questionnaire',
    name: 'Evaluare nutrițională preoperatorie',
    type: 'questionnaire',
    category: 'Chestionare',
    createdAt: new Date().toISOString(),
    isTemplate: true,
    content: `
EVALUARE NUTRIȚIONALĂ PREOPERATORIE

Nume pacient: [Nume pacient]
Data: [Dată]
Procedură planificată: [Procedure Name]

OBICEIURI ALIMENTARE

1. Câte mese luați pe zi?
   □ 1-2    □ 3    □ 4-5    □ Mai mult de 5

2. Urmați un regim alimentar special?    □ Da    □ Nu
   Dacă da, precizați: _________________________________

3. Aveți alergii sau intoleranțe alimentare?    □ Da    □ Nu

NUTRIȚIE PREOPERATORIE

4. Ați primit instrucțiuni privind postul înainte de intervenție?    □ Da    □ Nu

5. Luați suplimente proteice sau înlocuitori de masă?    □ Da    □ Nu

6. Ați avut pierdere recentă în greutate (>4,5 kg în 3 luni)?    □ Da    □ Nu

7. Aveți dificultăți de înghițire sau mestecat?    □ Da    □ Nu

HIDRATARE ȘI SUPLIMENTE

8. Câtă apă beți zilnic?
   □ Mai puțin de 4 pahare    □ 4-6 pahare    □ 7-8 pahare    □ Mai mult de 8 pahare

9. Luați suplimente nutriționale sau vitamine?    □ Da    □ Nu
   Dacă da, precizați: _________________________________

10. Luați suplimente pe bază de plante care pot afecta coagularea?    □ Da    □ Nu
    Dacă da, enumerați: _________________________________

PLANIFICARE POSTOPERATORIE

11. Aveți acces ușor la alimente moi/ușor de preparat acasă?    □ Da    □ Nu

12. Restricții alimentare de care trebuie să ținem cont pentru recuperare?
    _________________________________

RECOMANDĂRI:
□ Consiliere nutrițională preoperatorie
□ Suplimentare proteică înainte de intervenție
□ Ajustare program suplimente/medicamente
□ Plan alimentar postoperator furnizat

Nutriționist/Echipă clinică: _________________ Data: _________________
    `
  },
  {
    id: 'antibiotic-prescription',
    name: 'Formular rețetă antibiotic',
    type: 'prescription',
    category: 'Rețete',
    createdAt: new Date().toISOString(),
    isTemplate: true,
    content: `
REȚETĂ ANTIBIOTIC

Nume pacient: [Nume pacient]
Data nașterii: [Data nașterii]
Data: [Dată]

DETALII REȚETĂ:
Medicament: [Antibiotic Name]
Concentrație: [Dose] mg
Cantitate: [Number] comprimate/capsule
Mod de administrare: Câte [frequency] [timing] timp de [duration] zile

INSTRUCȚIUNI IMPORTANTE:

1. Administrați exact conform prescripției — finalizați întregul tratament chiar dacă vă simțiți mai bine
2. Administrați cu alimente pentru a reduce disconfortul gastric
3. Nu consumați alcool în timpul tratamentului
4. Distribuiți dozele uniform pe parcursul zilei
5. Nu împărtășiți acest medicament cu alte persoane

EFECTE SECUNDARE DE MONITORIZAT:
- Greață sau disconfort gastric
- Diaree
- Reacții alergice (erupție cutanată, dificultăți respiratorii, edeme)
- Infecții fungice

CÂND NE CONTACTAȚI:
- Reacții alergice severe (solicitați îngrijiri de urgență imediat)
- Greață sau vărsături persistente
- Diaree severă
- Lipsă de îmbunătățire după 2-3 zile
- Orice simptome neobișnuite

CONTROL:
Reveniți pentru control la: [Dată]

Medic prescriptor: [Nume medic]
Nr. autorizație: [License Number]
Semnătură: _________________
Data: [Dată]

Informații farmacie:
[Pharmacy Name]
[Pharmacy Address]
[Pharmacy Phone]

Semnătura pacientului/tutorelui: _________________ Data: _________
(Confirmare primire instrucțiuni)
    `
  },
  {
    id: 'pain-medication-prescription',
    name: 'Rețetă medicamente pentru durere',
    type: 'prescription',
    category: 'Rețete',
    createdAt: new Date().toISOString(),
    isTemplate: true,
    content: `
REȚETĂ MEDICAMENTE PENTRU DURERE

Nume pacient: [Nume pacient]
Data nașterii: [Data nașterii]
Data: [Dată]

DETALII REȚETĂ:
Medicament: [Pain Medication Name]
Concentrație: [Dose] mg
Cantitate: [Number] comprimate
Mod de administrare: Câte [frequency] la nevoie pentru durere
Maximum: [Max daily dose] comprimate pe zi

INSTRUCȚIUNI GESTIONARE DURERE:

INDICAȚII MEDICAMENT:
1. Administrați doar conform prescripției — nu depășiți doza prescrisă
2. Administrați cu alimente dacă apare disconfort gastric
3. Nu conduceți și nu operați utilaje în timpul tratamentului
4. Nu consumați alcool în timpul tratamentului
5. Păstrați medicamentul într-un loc sigur, inaccesibil copiilor

AMELIORARE DURERE FĂRĂ MEDICAMENTE:
1. Aplicați gheață în primele 24 de ore (20 minute pornit, 20 minute oprit)
2. După 24 de ore, treceți la comprese calde
3. Repaus și evitați efortul fizic intens
4. Dormiți cu capul ridicat
5. Respectați restricțiile de activitate pentru zona operatorie

CÂND NE CONTACTAȚI:
- Durerea se agravează sau nu se ameliorează după 2-3 zile
- Semne de infecție (febră, edeme crescute, secreții purulente)
- Reacții alergice
- Efecte secundare severe
- Sângerare excesivă

EFECTE SECUNDARE DE MONITORIZAT:
- Somnolență sau amețeli
- Greață sau constipație
- Dificultăți respiratorii
- Modificări neobișnuite ale stării de spirit

ÎNGRIJIRE DE URMĂRIRE:
Următoarea programare: [Dată]
Instrucțiuni speciale: [Any specific post-operative care]

Medic prescriptor: [Nume medic]
Nr. autorizație: [License Number]
Semnătură: _________________
Data: [Dată]

Contact urgență: [Emergency Phone]

Semnătura pacientului/tutorelui: _________________ Data: _________
(Confirmare primire instrucțiuni)
    `
  },
  {
    id: 'post-operative-wound-care',
    name: 'Instrucțiuni îngrijire plagă postoperatorie',
    type: 'prescription',
    category: 'Rețete',
    createdAt: new Date().toISOString(),
    isTemplate: true,
    content: `
INSTRUCȚIUNI ÎNGRIJIRE PLAGĂ POSTOPERATORIE

Nume pacient: [Nume pacient]
Data nașterii: [Data nașterii]
Data: [Dată]
Procedură: [Procedure Name]

PROTOCOL ÎNGRIJIRE PLAGĂ:

SCHIMBARE PANSAMENT:
1. Schimbați pansamentul conform indicațiilor: [Frequency]
2. Spălați-vă bine mâinile înainte și după fiecare schimbare
3. Curățați incizia cu [saline/antiseptic solution] conform instrucțiunilor
4. Aplicați un strat subțire de unguent prescris, dacă este indicat
5. Acoperiți cu pansament steril curat și uscat

RESTRICȚII DE ACTIVITATE:
1. Fără efort intens (peste 4,5 kg) timp de [duration]
2. Evitați activitatea fizică intensă timp de [duration]
3. Mențineți zona operatorie ridicată când este posibil
4. Fără baie, piscină sau jacuzzi până la autorizare medicală

SEMNE DE MONITORIZAT:
- Roșeață, căldură sau edeme crescute la locul inciziei
- Secreții purulente sau miros neplăcut
- Febră peste 38,3°C
- Margini ale plăgii desprinse sau sângerare care nu se oprește
- Durere crescândă necalmată de medicamentele prescrise

CÂND NE CONTACTAȚI:
- Orice semn de infecție menționat mai sus
- Reacție alergică la produsele de îngrijire a plăgii
- Întrebări despre schimbarea pansamentului
- Sângerare sau secreții neașteptate

CONTROL:
Următorul control al plăgii: [Dată]
Îndepărtare fire/agrafă (dacă este cazul): [Dată]

Chirurg: [Nume medic]
Nr. autorizație: [License Number]
Semnătură: _________________
Data: [Dată]

Semnătura pacientului/tutorelui: _________________ Data: _________
(Confirmare primire instrucțiuni)
    `
  }
]

export function FilesModal({ isOpen, onClose, patientId, patientName }: FilesModalProps) {
  const [files, setFiles] = useState<FileItem[]>(DEFAULT_FILES)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('Toate')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const categories = ['Toate', ...Array.from(new Set(files.map(f => f.category)))]

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'Toate' || file.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleFileUpload = (uploadedFiles: FileList) => {
    Array.from(uploadedFiles).forEach(file => {
      const newFile: FileItem = {
        id: `uploaded-${Date.now()}-${Math.random()}`,
        name: file.name,
        type: 'uploaded',
        category: 'Fișiere încărcate',
        size: file.size,
        createdAt: new Date().toISOString(),
        isTemplate: false
      }
      setFiles(prev => [...prev, newFile])
    })
    toast.success(`${uploadedFiles.length} fișier(e) încărcat(e) cu succes`)
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
        .replace(/\[Nume pacient\]/g, patientName)
        .replace(/\[Patient Name\]/g, patientName)
        .replace(/\[Dată\]/g, new Date().toLocaleDateString('ro-RO'))
        .replace(/\[Date\]/g, new Date().toLocaleDateString('ro-RO'))
        .replace(/\[Data nașterii\]/g, '[Data nașterii]')
        .replace(/\[DOB\]/g, '[Data nașterii]')
        .replace(/\[Nume medic\]/g, '[Nume medic]')
        .replace(/\[Doctor Name\]/g, '[Nume medic]')
        .replace(/\[Patient Code\]/g, '[Cod pacient]')

      const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>${file.name} - ${patientName}</title>
              <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                @page {
                  size: A4;
                  margin: 0;
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
                      <div><strong>[Numele clinicii]</strong></div>
                      <div>[Adresa clinicii]</div>
                      <div>📞 [Telefon clinică] | 📧 [E-mail clinică]</div>
                    </div>
                    <div class="document-meta">
                      <div><strong>Pacient:</strong> ${patientName}</div>
                      <div><strong>Generat:</strong> ${new Date().toLocaleDateString()}</div>
                      <div><strong>Ora:</strong> ${new Date().toLocaleTimeString()}</div>
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
                  <div>Document generat la ${new Date().toLocaleDateString()}, ora ${new Date().toLocaleTimeString()}</div>
                  <div>Acest document este confidențial și destinat exclusiv scopurilor medicale.</div>
                </div>
              </div>
              <div class="no-print" style="position: fixed; bottom: 20px; right: 20px; z-index: 1000; display: flex; gap: 10px;">
                <button onclick="window.print()" style="background: linear-gradient(135deg, #3b82f6, #1e40af); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); transition: all 0.2s;">📄 Salvează ca PDF</button>
                <button onclick="window.close()" style="background: linear-gradient(135deg, #6b7280, #4b5563); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3); transition: all 0.2s;">❌ Închide</button>
              </div>
            </body>
          </html>
        `
      printHtmlDocument(html, { delay: 500 })

      toast.success(`PDF pregătit pentru descărcare: ${file.name}`)
    } else {
      toast.error('Conținutul fișierului nu este disponibil')
    }
  }

  const previewFile = (file: FileItem) => {
    if (file.content) {
      const personalizedContent = file.content
        .replace(/\[Nume pacient\]/g, patientName)
        .replace(/\[Patient Name\]/g, patientName)
        .replace(/\[Dată\]/g, new Date().toLocaleDateString('ro-RO'))
        .replace(/\[Date\]/g, new Date().toLocaleDateString('ro-RO'))
        .replace(/\[Data nașterii\]/g, '[Data nașterii]')
        .replace(/\[DOB\]/g, '[Data nașterii]')
        .replace(/\[Nume medic\]/g, '[Nume medic]')
        .replace(/\[Doctor Name\]/g, '[Nume medic]')
        .replace(/\[Patient Code\]/g, '[Cod pacient]')

      const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Previzualizare: ${file.name} - ${patientName}</title>
              <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                @page {
                  size: A4;
                  margin: 0;
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
                <strong>✨ Previzualizare PDF modernă</strong> — Așa va arăta documentul la tipărire/descărcare ca PDF
              </div>
              <div class="document-container">
                <div class="header">
                  <h1>${file.name}</h1>
                  <div class="header-info">
                    <div class="practice-info">
                      <div><strong>[Numele clinicii]</strong></div>
                      <div>[Adresa clinicii]</div>
                      <div>📞 [Telefon clinică] | 📧 [E-mail clinică]</div>
                    </div>
                    <div class="document-meta">
                      <div><strong>Pacient:</strong> ${patientName}</div>
                      <div><strong>Generat:</strong> ${new Date().toLocaleDateString()}</div>
                      <div><strong>Ora:</strong> ${new Date().toLocaleTimeString()}</div>
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
                  <div>Document generat la ${new Date().toLocaleDateString()}, ora ${new Date().toLocaleTimeString()}</div>
                  <div>Acest document este confidențial și destinat exclusiv scopurilor medicale.</div>
                </div>
              </div>
              <div class="actions">
                <button onclick="window.print()">🖨️ Tipărește ca PDF</button>
                <button onclick="window.close()" class="close-btn">❌ Închide previzualizarea</button>
              </div>
            </body>
          </html>
        `
      openHtmlPreview(html)
    }
  }

  const deleteFile = (fileId: string) => {
    const file = files.find(f => f.id === fileId)
    if (file?.isTemplate) {
      toast.error('Nu se pot șterge fișierele șablon')
      return
    }
    setFiles(prev => prev.filter(f => f.id !== fileId))
    toast.success('Fișier șters cu succes')
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
            Fișiere pacient — {patientName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-[70vh]">
          {/* Search and Controls */}
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Căutați fișiere..."
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
              Încarcă
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
              <p>Trageți și plasați fișierele aici sau apăsați butonul Încarcă</p>
              <p className="text-sm">Formate acceptate: PDF, DOC, TXT, imagini</p>
              <p className="text-xs text-blue-600 mt-1">💡 Toate șabloanele se descarcă ca PDF-uri profesionale!</p>
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
                            Șablon
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
                      title="Previzualizare fișier"
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadFile(file)}
                      title="Descarcă ca PDF"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {!file.isTemplate && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteFile(file.id)}
                        title="Șterge fișierul"
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
                  <p>Nu s-au găsit fișiere care să corespundă criteriilor</p>
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