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
import { openHtmlPreview, printHtmlDocument } from '@/lib/print-html'

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
    name: 'Chestionar de sănătate preoperator',
    type: 'questionnaire',
    category: 'Chestionare pacienți',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDefault: true,
    author: 'Sistem',
    content: `
CHESTIONAR DE SĂNĂTATE PREOPERATOR

Nume pacient: [Nume pacient]
Data: [Data]
Cod pacient: [Cod pacient]
Procedură planificată: [Nume procedură]
Data intervenției chirurgicale programate: [Data]

ISTORIC CHIRURGICAL

1. Ați mai avut intervenții chirurgicale?    □ Da    □ Nu
   Dacă da, vă rugăm să enumerați procedurile și datele:
   _________________________________
   _________________________________

2. Ați avut vreodată complicații legate de anestezie sau chirurgie?
   □ Nu    □ Greață/vărsături    □ Dificultăți la trezire    □ Reacție alergică
   □ Sângerare prelungită    □ Infecție    □ Altele: _________________________________

3. Vi s-a spus vreodată că aveți acces venos dificil sau căi respiratorii dificile?
   □ Da    □ Nu

MEDICAMENTE ȘI SUPLIMENTE ACTUALE

4. Luați anticoagulante sau medicamente antiplachetare?
   □ Nu    □ Aspirină    □ Warfarină    □ Eliquis/Xarelto    □ Altele: ____________

5. Luați suplimente din plante sau vitamine?
   □ Nu    □ Da (enumerați): _________________________________

PREGĂTIRE PREOPERATORIE

6. Înțelegeți instrucțiunile de post (fără mâncare/băuturi după miezul nopții)?
   □ Da    □ Nu    □ Am nevoie de clarificări

7. Va exista cineva care să vă conducă acasă și să rămână cu dumneavoastră 24 de ore după intervenție?
   □ Da    □ Nu    □ Organizez asistență

8. Aveți istoric de fumat sau vaping?
   □ Niciodată    □ Fost fumător (data renunțării: ________)    □ Actual (cantitate: ________)

PLANIFICARE POSTOPERATORIE

9. Aveți ajutor acasă în primele 48 de ore după intervenție?
   □ Da    □ Nu    □ Organizez ajutor

10. Aveți îngrijorări legate de recuperare sau procedură?
    _________________________________
    _________________________________

11. Evaluați anxietatea legată de intervenție (1-10): ____

Semnătura pacientului: _________________ Data: _________________

Pentru uz intern:
Revizuit de: _________________________________
Aprobare necesară: □ Niciuna    □ Cardiologie    □ Medic de familie    □ Altele: ____________
Instrucțiuni preoperatorii trimise: □ Da    Data: _________________
    `
  },
  {
    id: 'gfi-comprehensive-questionnaire',
    name: 'Chestionar GFI de sănătate complet',
    type: 'questionnaire',
    category: 'Chestionare pacienți',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDefault: true,
    author: 'Sistem',
    content: `
CHESTIONAR DE INFORMAȚII GENERALE DE SĂNĂTATE (GFI)

Informații pacient:
Nume: [Nume pacient]
Data nașterii: [Data nașterii]
Data: [Data]
Contact de urgență: [Contact de urgență]

STARE MEDICALĂ ACTUALĂ

1. Sunteți în prezent sub îngrijire medicală?    □ Da    □ Nu
   Dacă da, numele medicului: _________________________________
   Afecțiunea tratată: _________________________________

2. Luați medicamente, vitamine sau suplimente?    □ Da    □ Nu
   Dacă da, vă rugăm să enumerați cu dozele:
   _________________________________
   _________________________________
   _________________________________

3. Aveți alergii?    □ Da    □ Nu
   □ Medicamente: _________________________________
   □ Alimente: _________________________________
   □ Mediu: _________________________________
   □ Latex: _________________________________

ISTORIC MEDICAL
Vă rugăm să bifați dacă aveți sau ați avut următoarele:

CARDIOVASCULAR
□ Boli de inimă    □ Infarct miocardic    □ Durere în piept (angină)
□ Tensiune arterială ridicată    □ Suflu cardiac    □ Febră reumatică
□ Accident vascular cerebral    □ Cheaguri de sânge    □ Stimulator cardiac

RESPIRATOR
□ Astm    □ Emfizem    □ Tuse cronică
□ Apnee în somn    □ Tuberculoză    □ Pneumonie

ENDOCRIN
□ Diabet (Tip 1 / Tip 2)    □ Probleme tiroidiene
□ Probleme suprarenale    □ Terapie hormonală

SÂNGE/IMUNITATE
□ Anemie    □ Tulburări de coagulare    □ Transfuzie de sânge
□ HIV/SIDA    □ Hepatită A/B/C    □ Boală autoimună

NEUROLOGIC
□ Epilepsie/Convulsii    □ Migrene    □ Traumatism cranian
□ Tratament pentru sănătate mintală    □ Probleme de memorie

OS/ARTICULAȚII
□ Artrită    □ Osteoporoză    □ Înlocuire articulară
□ Probleme de spate    □ Mobilitate redusă

CANCER/RADIOTERAPIE
□ Cancer (tip: ____________)    □ Chimioterapie
□ Radioterapie    □ Transplant de măduvă osoasă

ALTE AFECȚIUNI
□ Boli de rinichi    □ Boli de ficat    □ Ulcer gastric
□ Boli intestinale    □ Sarcină    □ Menopauză

FACTORI DE STIL DE VIAȚĂ

Consum de tutun:
□ Niciodată    □ Fost consumator (data renunțării: ________)
□ Consumator actual (tip: _________ cantitate: _________)

Consum de alcool:
□ Niciunul    □ Ocazional    □ Regulat (cantitate: _________)

Consum de droguri:
□ Niciunul    □ Recreațional    □ Abuz de medicamente pe rețetă

ISTORIC FAMILIAL
Vă rugăm să indicați dacă membrii familiei apropiați au avut:
□ Boli de inimă    □ Diabet    □ Cancer
□ Tensiune arterială ridicată    □ Accident vascular cerebral    □ Boli mintale

ANXIETATE CHIRURGICALĂ
Evaluați anxietatea legată de intervenție (1-10): ____
□ Fără anxietate    □ Anxietate ușoară    □ Anxietate moderată    □ Anxietate severă

Acomodări speciale necesare: _________________________________

CONSIMȚĂMÂNT
Certific că informațiile de mai sus sunt complete și corecte. Înțeleg că orice modificare a stării mele de sănătate trebuie raportată clinicii chirurgicale înainte de procedură.

Semnătura pacientului: _________________ Data: _________________
Martor: _________________ Data: _________________

Doar pentru uz intern:
Revizuit de: _________________ Data: _________________
Evaluare risc: □ Scăzut    □ Mediu    □ Ridicat
Precauții speciale: _________________________________
    `
  },
  {
    id: 'pre-operative-surgical-risk-assessment',
    name: 'Evaluare risc chirurgical preoperator',
    type: 'questionnaire',
    category: 'Chestionare pacienți',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDefault: true,
    author: 'Sistem',
    content: `
EVALUARE RISC CHIRURGICAL PREOPERATOR

Nume pacient: [Nume pacient]
Data: [Data]
Examinator: [Nume practician]
Procedură planificată: [Nume procedură]

RISC CARDIOVASCULAR

1. Istoric de boli de inimă, infarct miocardic sau accident vascular cerebral?    □ Da    □ Nu
2. Tensiune arterială necontrolată?    □ Da    □ Nu
3. Stimulator cardiac sau defibrilator?    □ Da    □ Nu
4. Durere în piept la efort?    □ Da    □ Nu

RISC RESPIRATOR

5. Astm, BPOC sau apnee în somn?    □ Da    □ Nu
6. Utilizați CPAP sau oxigen suplimentar acasă?    □ Da    □ Nu
7. Infecție respiratorie recentă (în ultimele 4 săptămâni)?    □ Da    □ Nu

RISC DE SÂNGERARE ȘI COAGULARE

8. Istoric de sângerare excesivă sau cheaguri de sânge?    □ Da    □ Nu
9. În prezent sub anticoagulante sau terapie antiplachetară?    □ Da    □ Nu
10. Tulburare de coagulare cunoscută?    □ Da    □ Nu

RISC ANESTEZIC

11. Reacție adversă anterioară la anestezie?    □ Da    □ Nu
    Dacă da, descrieți: _________________________________
12. Dificultăți la intubație sau managementul căilor respiratorii?    □ Da    □ Nu    □ Necunoscut
13. Hipertermie malignă la pacient sau în familie?    □ Da    □ Nu

RISC DE INFECȚIE ȘI VINDECARE

14. Diabet (controlat/necontrolat)?    □ Nu    □ Da - controlat    □ Da - necontrolat
15. Imunosupresie sau infecție activă?    □ Da    □ Nu
16. Fumat sau consum de nicotină?    □ Niciodată    □ Fost    □ Actual
17. IMC peste 35 sau modificare semnificativă recentă a greutății?    □ Da    □ Nu

STATUS FUNCȚIONAL

18. Puteți urca un etaj de scări fără oprire?    □ Da    □ Nu
19. Activitățile sunt limitate de o afecțiune medicală?    □ Da    □ Nu

REZUMAT SCOR RISC:
Factori de risc ridicat: ____
Factori de risc moderat: ____
Factori de risc scăzut: ____

NIVEL GENERAL DE RISC:
□ Risc scăzut - procedați conform programării
□ Risc moderat - aprobare/monitorizare suplimentară necesară
□ Risc ridicat - aprobare de la specialist necesară înainte de intervenție

RECOMANDĂRI:
□ Aprobare medicală de la medicul de familie
□ Aprobare cardiologică
□ Aprobare pneumologică
□ Ajustare protocol anticoagulant
□ Analize/imagistică preoperatorie
□ Consult anesteziologic

Semnătura practicianului: _________________ Data: _________________
    `
  },
  {
    id: 'comprehensive-antibiotic-prescription',
    name: 'Rețetă antibiotic completă',
    type: 'prescription',
    category: 'Rețete farmacologice',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDefault: true,
    author: 'Sistem',
    content: `
REȚETĂ ANTIBIOTIC ȘI INSTRUCȚIUNI PENTRU PACIENT

Informații pacient:
Nume: [Nume pacient]
Data nașterii: [Data nașterii]
Adresă: [Adresă pacient]
Telefon: [Telefon pacient]
Data: [Data]

DETALII REȚETĂ:
Medicament: [Nume antibiotic]
Denumire generică: [Denumire generică]
Concentrație: [Doză] mg
Formă: □ Comprimate    □ Capsule    □ Lichid    □ Injecție
Cantitate: [Număr] unități
Număr NDC: [Număr NDC]

INSTRUCȚIUNI DE DOZARE:
Luați [Număr] [comprimat/capsulă] [frecvență] timp de [durată] zile
□ La fiecare 6 ore (de 4 ori pe zi)
□ La fiecare 8 ore (de 3 ori pe zi)
□ La fiecare 12 ore (de 2 ori pe zi)
□ O dată pe zi

Instrucțiuni speciale:
□ Luați cu mâncare
□ Luați pe stomacul gol (cu 1 oră înainte sau 2 ore după masă)
□ Luați cu multă apă
□ Nu luați cu produse lactate
□ Altele: _________________________________

INSTRUCȚIUNI CRITICE PENTRU PACIENT:

CONFORMITATE:
• Luați exact conform prescripției
• Finalizați întregul tratament chiar dacă vă simțiți mai bine
• Nu omiteți dozele
• Dacă omiteți o doză, luați-o imediat ce vă amintiți
• Nu luați dublu dacă ați omis o doză

PRECAUȚII:
• Nu consumați alcool în timpul tratamentului
• Informați toți furnizorii de îngrijire medicală că luați acest antibiotic
• Nu împărțiți acest medicament cu alții
• Depozitați conform indicațiilor (temperatura camerei/frigider)

CONSIDERAȚII DIETETICE:
• [Interacțiuni alimentare specifice]
• Probioticele pot ajuta la menținerea sănătății intestinale
• Hidratați-vă bine

EFECTE SECUNDARE DE MONITORIZAT:

Frecvente (contactați cabinetul dacă sunt severe):
• Greață sau disconfort gastric
• Diaree
• Durere de cap ușoară
• Amețeli

GRAVE (căutați imediat asistență medicală):
• Reacții alergice severe (erupție, urticarie, dificultăți de respirație, umflături)
• Diaree severă (poate indica infecție cu C. difficile)
• Sângerare sau vânătăi neobișnuite
• Îngălbenirea pielii sau a ochilor
• Durere abdominală severă
• Vărsături persistente

INTERACȚIUNI MEDICAMENTOASE:
• Anticoagulante (warfarină)
• Contraceptive orale (pot reduce eficacitatea)
• Antiacide (luați la 2 ore distanță)
• Alte medicamente: _________________________________

ÎNGRIJIRE DE URMĂRIRE:
Programare de control: [Data]
Contactați cabinetul dacă nu există îmbunătățire în: [Număr] zile
Analize de laborator necesare: □ Da    □ Nu
Dacă da, când: _________________________________

INFORMAȚII PRESCRIPTOR:
Nume medic: [Nume medic]
Număr licență: [Număr licență]
Număr DEA: [Număr DEA]
Semnătură: _________________
Data: [Data]

INFORMAȚII FARMACIE:
Farmacie preferată: [Nume farmacie]
Adresă: [Adresă farmacie]
Telefon: [Telefon farmacie]

CONFIRMARE PACIENT:
Am primit și înțeleg instrucțiunile de mai sus privind rețeta de antibiotic. Înțeleg importanța administrării medicamentului exact conform prescripției și finalizării întregului tratament.

Semnătura pacientului: _________________ Data: _________________

REÎNCĂRCĂRI: □ Niciuna    □ [Număr] reîncărcări
Valabilitate originală până la: [Data]

Pentru uz intern:
Indicație: _________________________________
Rezultate cultură: _________________________________
Verificare alergii: □ Finalizată
Verificare asigurare: □ Finalizată
    `
  },
  {
    id: 'specialist-surgical-referral-letter',
    name: 'Scrisoare de trimitere către specialist chirurgical',
    type: 'letter',
    category: 'Scrisori de trimitere',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDefault: true,
    author: 'Sistem',
    content: `
SCRISOARE DE TRIMITERE CĂTRE SPECIALIST CHIRURGICAL

[Antet cabinet medical]

Data: [Data]

Dr. [Nume specialist]
[Nume cabinet specialist]
[Adresă]
[Oraș, Județ, Cod poștal]

Referitor la: [Nume pacient]
Data nașterii: [Data nașterii]
Telefon: [Telefon pacient]

Stimate Dr. [Nume specialist],

Trimit pacientul menționat mai sus către cabinetul dumneavoastră pentru evaluare chirurgicală de specialitate și luarea în considerare a tratamentului.

INFORMAȚII PACIENT:
Vârstă: [Vârstă pacient]
Plângere principală: [Principala îngrijorare a pacientului]
Diagnostic de trimitere: [Diagnostic principal]
Contact de urgență: [Nume și telefon contact]

CONSTatăRI CLINICE:

Examen fizic:
• Aspect general: [Descriere]
• Semne vitale: TA [___] / FC [___] / Temp [___]
• Constatări relevante la examen: [Constatări specifice locului]
• Amplitudine de mișcare / status funcțional: [Descriere]
• Descriere rană sau leziune: [Dimensiune, localizare, caracteristici]

Evaluare sit chirurgical:
• Localizare: [Sit anatomic]
• Dimensiuni: [Măsurători]
• Tratamente anterioare la sit: [Biopsii, radioterapie, chirurgie]
• Calitatea pielii / cicatrici: [Descriere]
• Vascularizație și sensibilitate: [Evaluare]

Imagistică și diagnostice:
• RMN/CT/Ecografie: [Data] - [Constatări cheie]
• Rezultate laborator: [Valori relevante]
• Anatomie patologică: [Rezultate biopsie, dacă este cazul]
• Alte investigații: [Specificați]

ISTORIC MEDICAL:
Afecțiuni medicale semnificative: [Enumerați afecțiunile relevante]
Medicamente actuale: [Enumerați medicamentele]
Alergii: [Enumerați alergiile]
Intervenții chirurgicale anterioare: [Enumerați cu datele și rezultatele]
Istoric anestezic: [Complicații anterioare, dacă există]

TRATAMENT ANTERIOR:
□ Niciunul
□ Management conservator: [Detalii și durată]
□ Intervenție chirurgicală anterioară: [Când, unde, rezultat]
□ Radioterapie/chimioterapie: [Detalii, dacă este cazul]

URGENȚA TRATAMENTULUI:
□ Consultație de rutină
□ Urgent - vă rugăm să vedeți în termen de [interval]
□ Emergent - evaluare în aceeași zi solicitată

ÎNTREBĂRI/ÎNGRIJORĂRI SPECIFICE:
1. [Întrebare clinică specifică]
2. [Recomandări privind abordarea chirurgicală]
3. [Coordonare cu procedurile planificate la clinica noastră]

OBIECTIVE ȘI AȘTEPTĂRI PACIENT:
□ Foarte motivat    □ Moderat motivat    □ Nesigur
Îngrijorări pacient: [Enumerați îngrijorările specifice]
Obiective pacient: [Rezultate dorite]

COORDONAREA ÎNGRIJIRII:
Vă rugăm să ne sfătuiți privind:
• Abordarea chirurgicală recomandată și momentul
• Cerințele de aprobare preoperatorie
• Coordonarea îngrijirii postoperatorii
• Programul de urmărire și planul de îngrijire comună

Aș aprecia evaluarea și recomandările dumneavoastră de tratament. Nu ezitați să mă contactați dacă aveți nevoie de informații, imagistică sau documente suplimentare.

Vă mulțumesc pentru timpul și expertiza acordată evaluării acestui pacient.

Cu stimă,

[Nume medic], [Titlu]
[Nume cabinet]
[Telefon]
[Email]

Anexe: Rapoarte imagistice, Fotografii clinice, Note operatorii (dacă sunt disponibile)

cc: Dosar pacient
    `
  }
]

const TYPE_LABELS: Record<FileTemplate['type'], string> = {
  questionnaire: 'Chestionar',
  prescription: 'Rețetă',
  document: 'Document',
  letter: 'Scrisoare'
}

export default function FileManagementPage() {
  const [templates, setȘabloane] = useState<FileTemplate[]>(DEFAULT_TEMPLATES)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategorie, setSelectedCategorie] = useState<string>('All')
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

  const filteredȘabloane = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategorie = selectedCategorie === 'All' || template.category === selectedCategorie
    const matchesType = selectedType === 'All' || template.type === selectedType
    return matchesSearch && matchesCategorie && matchesType
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
      author: 'Utilizator'
    }
    setȘabloane(prev => [...prev, template])
    setNewTemplate({ name: '', type: 'document', category: '', content: '' })
    setShowCreateModal(false)
    toast.success('Șablon creat cu succes')
  }

  const handleUpdateTemplate = () => {
    if (!editingTemplate) return

    setȘabloane(prev => prev.map(t =>
      t.id === editingTemplate.id
        ? { ...editingTemplate, updatedAt: new Date().toISOString() }
        : t
    ))
    setEditingTemplate(null)
    setShowEditModal(false)
    toast.success('Șablon actualizat cu succes')
  }

  const handleDeleteTemplate = (id: string) => {
    const template = templates.find(t => t.id === id)
    if (template?.isDefault) {
      toast.error('Șabloanele implicite nu pot fi șterse')
      return
    }
    setȘabloane(prev => prev.filter(t => t.id !== id))
    toast.success('Șablon șters cu succes')
  }

  const downloadTemplate = (template: FileTemplate) => {
    const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${template.name}</title>
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
                      <div><strong>[Numele cabinetului dumneavoastră]</strong></div>
                      <div>[Adresa cabinetului]</div>
                      <div>📞 [Telefon cabinet] | 📧 [Email cabinet]</div>
                    </div>
                    <div class="document-meta">
                      <div><strong>Șablon</strong></div>
                      <div><strong>Generat:</strong> ${new Date().toLocaleDateString()}</div>
                      <div><strong>Ora:</strong> ${new Date().toLocaleTimeString()}</div>
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
                  <div>Șablon generat la ${new Date().toLocaleDateString()} ora ${new Date().toLocaleTimeString()}</div>
                  <div>Acest document este un șablon și trebuie personalizat pentru fiecare pacient.</div>
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

    toast.success(`PDF pregătit pentru descărcare: ${template.name}`)
  }

  const previewTemplate = (template: FileTemplate) => {
    const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Previzualizare: ${template.name}</title>
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
                <strong>✨ Previzualizare șablon PDF modern</strong> - Așa va arăta șablonul dumneavoastră la tipărire/descărcare ca PDF
              </div>
              <div class="template-info">
                <strong>Șablon:</strong> ${template.name} | <strong>Tip:</strong> ${TYPE_LABELS[template.type]} | <strong>Categorie:</strong> ${template.category}
              </div>
              <div class="document-container">
                <div class="header">
                  <h1>${template.name}</h1>
                  <div class="header-info">
                    <div class="practice-info">
                      <div><strong>[Numele cabinetului dumneavoastră]</strong></div>
                      <div>[Adresa cabinetului]</div>
                      <div>📞 [Telefon cabinet] | 📧 [Email cabinet]</div>
                    </div>
                    <div class="document-meta">
                      <div><strong>Șablon</strong></div>
                      <div><strong>Generat:</strong> ${new Date().toLocaleDateString()}</div>
                      <div><strong>Ora:</strong> ${new Date().toLocaleTimeString()}</div>
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
                  <div>Șablon generat la ${new Date().toLocaleDateString()} ora ${new Date().toLocaleTimeString()}</div>
                  <div>Acest document este un șablon și trebuie personalizat pentru fiecare pacient.</div>
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestionare fișiere</h1>
        <p className="text-gray-600">Gestionați chestionare, rețete și șabloane de documente</p>
      </div>

      {/* Controls */}
      <Card className="p-6 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Căutați șabloane..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <select
            value={selectedCategorie}
            onChange={(e) => setSelectedCategorie(e.target.value)}
            className="px-3 py-2 border rounded-md min-w-[150px]"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat === 'All' ? 'Toate categoriile' : cat}</option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border rounded-md min-w-[120px]"
          >
            <option value="All">Toate tipurile</option>
            {types.slice(1).map(type => (
              <option key={type} value={type}>
                {TYPE_LABELS[type as FileTemplate['type']]}
              </option>
            ))}
          </select>

          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Creează șablon
          </Button>
        </div>
      </Card>

      {/* Șabloane Grid */}
      <div className="grid gap-4">
        {filteredȘabloane.map(template => (
          <Card key={template.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{getTypeIcon(template.type)}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(template.type)}`}>
                        {TYPE_LABELS[template.type]}
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
                            Implicit
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
                  title="Previzualizare șablon"
                >
                  <FileText className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadTemplate(template)}
                  title="Descărcare ca PDF"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const html = `<!DOCTYPE html>
                        <html>
                          <head>
                            <title>Tipărire: ${template.name}</title>
                            <style>
                              @page { margin: 0; }
                              body { 
                                font-family: Arial, sans-serif; 
                                padding: 20px; 
                                line-height: 1.6;
                                margin: 0;
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
                          </body>
                        </html>`
                    printHtmlDocument(html)
                  }}
                  title="Tipărire șablon"
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
                  title="Editează șablon"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                {!template.isDefault && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id)}
                    title="Șterge șablon"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}

        {filteredȘabloane.length === 0 && (
          <Card className="p-12 text-center">
            <Files className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Niciun șablon găsit</h3>
            <p className="text-gray-600">Încercați să ajustați criteriile de căutare sau creați un șablon nou.</p>
          </Card>
        )}
      </div>

      {/* Creează șablon Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Creare șablon nou</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nume șablon</label>
                <Input
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Introduceți numele șablonului"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Categorie</label>
                <Input
                  value={newTemplate.category}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="Introduceți categoria"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tip</label>
              <select
                value={newTemplate.type}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, type: e.target.value as FileTemplate['type'] }))}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="document">Document</option>
                <option value="questionnaire">Chestionar</option>
                <option value="prescription">Rețetă</option>
                <option value="letter">Scrisoare</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Conținut</label>
              <Textarea
                value={newTemplate.content}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Introduceți conținutul șablonului..."
                className="min-h-[400px] font-mono"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Anulare
            </Button>
            <Button
              onClick={handleCreateTemplate}
              disabled={!newTemplate.name || !newTemplate.category || !newTemplate.content}
            >
              Creează șablon
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Editează șablon Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editează șablon</DialogTitle>
          </DialogHeader>

          {editingTemplate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nume șablon</label>
                  <Input
                    value={editingTemplate.name}
                    onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, name: e.target.value } : null)}
                    disabled={editingTemplate.isDefault}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Categorie</label>
                  <Input
                    value={editingTemplate.category}
                    onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, category: e.target.value } : null)}
                    disabled={editingTemplate.isDefault}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Conținut</label>
                <Textarea
                  value={editingTemplate.content}
                  onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, content: e.target.value } : null)}
                  className="min-h-[400px] font-mono"
                />
              </div>

              {editingTemplate.isDefault && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-700">
                    Notă: Acesta este un șablon implicit. Doar conținutul poate fi modificat.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Anulare
            </Button>
            <Button onClick={handleUpdateTemplate}>
              Actualizează șablonul
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
