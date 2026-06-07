#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.join(__dirname, '../src')

const fileReplacements = {
  'app/[locale]/dashboard/manager/page.tsx': [
    ['Manager Dashboard', 'Panou manager'],
    ['Refresh Data', 'Reîmprospătează datele'],
    ['<TabsTrigger value="overview">Overview</TabsTrigger>', '<TabsTrigger value="overview">Prezentare generală</TabsTrigger>'],
    ['<TabsTrigger value="users">User Management</TabsTrigger>', '<TabsTrigger value="users">Gestionare utilizatori</TabsTrigger>'],
    ['<TabsTrigger value="calendar-planning">Calendar Planning</TabsTrigger>', '<TabsTrigger value="calendar-planning">Planificare calendar</TabsTrigger>'],
    ['<TabsTrigger value="logs">Activity Logs</TabsTrigger>', '<TabsTrigger value="logs">Jurnale de activitate</TabsTrigger>'],
    ['Analytics Dashboard', 'Panou analitice'],
    ['<SelectItem value="quarter">This Quarter</SelectItem>', '<SelectItem value="quarter">Trimestrul acesta</SelectItem>'],
    ['<SelectItem value="year">This Year</SelectItem>', '<SelectItem value="year">Anul acesta</SelectItem>'],
    ['Active Patients', 'Pacienți activi'],
    ['Revenue This {analyticsFilter}', 'Venituri {analyticsFilter === "week" ? "săptămâna aceasta" : analyticsFilter === "month" ? "luna aceasta" : analyticsFilter === "quarter" ? "trimestrul acesta" : "anul acesta"}'],
    ['+{analytics.summary.newPatientsThisPeriod} new this {analyticsFilter}', '+{analytics.summary.newPatientsThisPeriod} noi {analyticsFilter === "week" ? "săptămâna aceasta" : analyticsFilter === "month" ? "luna aceasta" : analyticsFilter === "quarter" ? "trimestrul acesta" : "anul acesta"}'],
    ["from previous {analyticsFilter}", "față de {analyticsFilter === \"week\" ? \"săptămâna anterioară\" : analyticsFilter === \"month\" ? \"luna anterioară\" : analyticsFilter === \"quarter\" ? \"trimestrul anterior\" : \"anul anterior\"}"],
    ["'New'", "'Nou'"],
    ['<p className="text-sm font-medium text-purple-100">Appointments</p>', '<p className="text-sm font-medium text-purple-100">Programări</p>'],
    ['This {analyticsFilter}', '{analyticsFilter === "week" ? "Săptămâna aceasta" : analyticsFilter === "month" ? "Luna aceasta" : analyticsFilter === "quarter" ? "Trimestrul acesta" : "Anul acesta"}'],
    ['Staff Efficiency', 'Eficiență personal'],
    ['+2.1% improvement', '+2,1% îmbunătățire'],
    ['Organization Revenue Trends', 'Tendințe venituri organizație'],
    ['Appointment Status Distribution', 'Distribuție status programări'],
    ['User Activity Breakdown', 'Defalcare activitate utilizatori'],
    ['Top Performers', 'Cei mai performanți'],
    ['Personal Workspace', 'Spațiu de lucru personal'],
    ['Quick Links', 'Linkuri rapide'],
    ['Personal Notes', 'Notițe personale'],
    ['>Save<', '>Salvează<'],
    ['Recent Activity', 'Activitate recentă'],
    [' requested ', ' a solicitat '],
    ['<h2 className="text-2xl font-bold text-gray-900">User Management</h2>', '<h2 className="text-2xl font-bold text-gray-900">Gestionare utilizatori</h2>'],
    ['Add User', 'Adaugă utilizator'],
    ['<TableHead>User</TableHead>', '<TableHead>Utilizator</TableHead>'],
    ['<TableHead>Role</TableHead>', '<TableHead>Rol</TableHead>'],
    ['<TableHead>Contact</TableHead>', '<TableHead>Contact</TableHead>'],
    ['<TableHead>Statistics</TableHead>', '<TableHead>Statistici</TableHead>'],
    ['<TableHead>Last Login</TableHead>', '<TableHead>Ultima autentificare</TableHead>'],
    ['<Badge variant="destructive">Disabled</Badge>', '<Badge variant="destructive">Dezactivat</Badge>'],
    ['<Badge variant="default">Active</Badge>', '<Badge variant="default">Activ</Badge>'],
    ['<Badge variant="secondary">Inactive</Badge>', '<Badge variant="secondary">Inactiv</Badge>'],
    ['<div>Appointments: {user._count.appointments}</div>', '<div>Programări: {user._count.appointments}</div>'],
    ['<div>Tasks: {user._count.createdTasks}</div>', '<div>Sarcini: {user._count.createdTasks}</div>'],
    ['Disable User', 'Dezactivează utilizatorul'],
    ['Enable User', 'Activează utilizatorul'],
    ['Delete User', 'Șterge utilizatorul'],
    ['<TableHead>Employee</TableHead>', '<TableHead>Angajat</TableHead>'],
    ['<TableHead>Dates</TableHead>', '<TableHead>Date</TableHead>'],
    ['<TableHead>Submitted</TableHead>', '<TableHead>Trimis</TableHead>'],
    ['<Label htmlFor="action-filter">Action</Label>', '<Label htmlFor="action-filter">Acțiune</Label>'],
    ['<Label htmlFor="severity-filter">Severity</Label>', '<Label htmlFor="severity-filter">Severitate</Label>'],
    ['<SelectItem value="DEBUG">Debug</SelectItem>', '<SelectItem value="DEBUG">Depanare</SelectItem>'],
    ['<SelectItem value="INFO">Info</SelectItem>', '<SelectItem value="INFO">Informare</SelectItem>'],
    ['<TableHead>Timestamp</TableHead>', '<TableHead>Marcaj temporal</TableHead>'],
    ['<TableHead>Action</TableHead>', '<TableHead>Acțiune</TableHead>'],
    ['<TableHead>Description</TableHead>', '<TableHead>Descriere</TableHead>'],
    ['<TableHead>Severity</TableHead>', '<TableHead>Severitate</TableHead>'],
    ['<TableHead>Details</TableHead>', '<TableHead>Detalii</TableHead>'],
    ['Download Logs', 'Descarcă jurnalele'],
    ['Delete Selected', 'Șterge selectate'],
    ['<span>Room Assignments</span>', '<span>Atribuiri săli</span>'],
    ['<SelectItem value="none">None</SelectItem>', '<SelectItem value="none">Niciunul</SelectItem>'],
    ['<h4 className="font-medium">Room {roomIndex + 1} Shifts</h4>', '<h4 className="font-medium">Ture sala {roomIndex + 1}</h4>'],
    ['<Badge variant="secondary" className="ml-2">Override</Badge>', '<Badge variant="secondary" className="ml-2">Excepție</Badge>'],
    ['<Label>Worker</Label>', '<Label>Angajat</Label>'],
    ['<Label>Start Time</Label>', '<Label>Ora de început</Label>'],
    ['<Label>End Time</Label>', '<Label>Ora de sfârșit</Label>'],
    ['<Label htmlFor="startTime">Start Time</Label>', '<Label htmlFor="startTime">Ora de început</Label>'],
    ['<Label htmlFor="endTime">End Time</Label>', '<Label htmlFor="endTime">Ora de sfârșit</Label>'],
    ['<Label>Shift Schedule</Label>', '<Label>Program tură</Label>'],
    ['Next Month', 'Luna viitoare'],
    ['Apply to All Workers', 'Aplică tuturor angajaților'],
    ['Override existing assignments', 'Suprascrie atribuirile existente'],
    ['Reason (optional)', 'Motiv (opțional)'],
    ['Practitioner (optional)', 'Practician (opțional)'],
    ['Side Practitioner (optional)', 'Practician secundar (opțional)'],
    ['<span className="text-sm font-medium">Active ({analytics.summary.activeUsers})</span>', '<span className="text-sm font-medium">Activi ({analytics.summary.activeUsers})</span>'],
    ['<span className="text-sm font-medium">Inactive ({analytics.summary.totalUsers - analytics.summary.activeUsers})</span>', '<span className="text-sm font-medium">Inactivi ({analytics.summary.totalUsers - analytics.summary.activeUsers})</span>'],
    ['Task Completion Rate', 'Rată finalizare sarcini'],
    ['Completed Tasks', 'Sarcini finalizate'],
    ['Pending Leave Requests', 'Cereri de concediu în așteptare'],
    ['Leave Requests Overview', 'Prezentare cereri de concediu'],
    ['Activity Logs', 'Jurnale de activitate'],
    ['Filter Logs', 'Filtrează jurnalele'],
    ['Start Date', 'Data de început'],
    ['End Date', 'Data de sfârșit'],
    ['Search logs...', 'Căutați în jurnale...'],
    ['No logs found', 'Nu s-au găsit jurnale'],
    ['Select logs to delete', 'Selectați jurnalele de șters'],
    ['Main Practitioner', 'Practician principal'],
    ['Side Practitioner', 'Practician secundar'],
    ['Other Workers', 'Alți angajați'],
    ['Week Schedule Editor', 'Editor program săptămânal'],
    ['Reset Schedule Confirmation', 'Confirmare resetare program'],
  ],
  'app/[locale]/dashboard/appointments/page.tsx': [
    ['>Open patient card<', '>Deschide fișa pacientului<'],
    ['>Send to pending<', '>Trimite în așteptare<'],
    ['>Send confirmation email<', '>Trimite e-mail de confirmare<'],
    ['>Print ticket (selected)<', '>Tipărește bilet (selectat)<'],
    ['>Print ticket (all future)<', '>Tipărește bilet (toate viitoare)<'],
  ],
  'app/[locale]/dashboard/patients/[id]/page.tsx': [
    ['Tasks linked to this patient.', 'Sarcini legate de acest pacient.'],
    ['Waiting appointments related to this patient.', 'Programări în așteptare legate de acest pacient.'],
  ],
}

const apiReplacements = [
  [/error: 'Failed to load medications'/g, "error: 'Încărcarea medicamentelor a eșuat'"],
  [/error: 'Failed to fetch task'/g, "error: 'Încărcarea sarcinii a eșuat'"],
  [/error: 'Failed to update task'/g, "error: 'Actualizarea sarcinii a eșuat'"],
  [/error: 'Failed to delete task'/g, "error: 'Ștergerea sarcinii a eșuat'"],
  [/message: 'Task deleted successfully'/g, "message: 'Sarcina a fost ștearsă cu succes'"],
  [/error: 'Failed to fetch messages'/g, "error: 'Încărcarea mesajelor a eșuat'"],
  [/error: 'Failed to create message'/g, "error: 'Crearea mesajului a eșuat'"],
  [/error: 'Failed to fetch instructions'/g, "error: 'Încărcarea instrucțiunilor a eșuat'"],
  [/error: 'Failed to add instruction'/g, "error: 'Adăugarea instrucțiunii a eșuat'"],
  [/error: 'Failed to update product'/g, "error: 'Actualizarea produsului a eșuat'"],
  [/error: 'Failed to delete product'/g, "error: 'Ștergerea produsului a eșuat'"],
  [/error: 'Cannot delete product with existing purchases. Consider deactivating instead.'/g, "error: 'Nu se poate șterge produsul cu achiziții existente. Considerați dezactivarea.'"],
  [/error: 'Failed to fetch repair requests'/g, "error: 'Încărcarea cererilor de reparație a eșuat'"],
  [/error: 'Failed to create repair request'/g, "error: 'Crearea cererii de reparație a eșuat'"],
  [/error: 'Failed to update repair request'/g, "error: 'Actualizarea cererii de reparație a eșuat'"],
  [/error: 'Patient not found or missing email address'/g, "error: 'Pacientul nu a fost găsit sau lipsește adresa de e-mail'"],
  [/error: 'Failed to send confirmation email'/g, "error: 'Trimiterea e-mailului de confirmare a eșuat'"],
  [/error: 'Invalid session'/g, "error: 'Sesiune invalidă'"],
  [/error: 'Failed to fetch boards'/g, "error: 'Încărcarea panourilor a eșuat'"],
  [/error: 'Failed to create board'/g, "error: 'Crearea panoului a eșuat'"],
  [/error: 'Failed to fetch shop purchases'/g, "error: 'Încărcarea achizițiilor din magazin a eșuat'"],
  [/error: 'Failed to create shop purchases'/g, "error: 'Crearea achizițiilor din magazin a eșuat'"],
  [/error: 'Failed to delete image'/g, "error: 'Ștergerea imaginii a eșuat'"],
  [/error: 'Failed to update image'/g, "error: 'Actualizarea imaginii a eșuat'"],
  [/error: 'Invalid status type'/g, "error: 'Tip de status invalid'"],
  [/error: 'Failed to update appointment status'/g, "error: 'Actualizarea statusului programării a eșuat'"],
  [/error: 'Failed to clear appointment status'/g, "error: 'Ștergerea statusului programării a eșuat'"],
  [/error: 'Failed to fetch categories'/g, "error: 'Încărcarea categoriilor a eșuat'"],
  [/error: 'Failed to create category'/g, "error: 'Crearea categoriei a eșuat'"],
  [/error: 'Failed to fetch pending appointments'/g, "error: 'Încărcarea programărilor în așteptare a eșuat'"],
  [/error: 'Failed to create pending appointment'/g, "error: 'Crearea programării în așteptare a eșuat'"],
  [/error: 'Failed to update pending appointment'/g, "error: 'Actualizarea programării în așteptare a eșuat'"],
  [/error: 'Failed to delete pending appointment'/g, "error: 'Ștergerea programării în așteptare a eșuat'"],
  [/error: 'Failed to send support report'/g, "error: 'Trimiterea raportului de suport a eșuat'"],
  [/error: 'No procedures selected for payment'/g, "error: 'Nu au fost selectate proceduri pentru plată'"],
  [/error: 'No valid unpaid procedures found'/g, "error: 'Nu s-au găsit proceduri neplătite valide'"],
  [/error: 'Failed to process payment'/g, "error: 'Procesarea plății a eșuat'"],
  [/error: 'No actions to redo'/g, "error: 'Nu există acțiuni de refăcut'"],
  [/error: 'No original data found for redo'/g, "error: 'Nu s-au găsit date originale pentru refacere'"],
  [/error: 'Failed to process redo'/g, "error: 'Procesarea refacerii a eșuat'"],
  [/error: 'Failed to fetch order requests'/g, "error: 'Încărcarea cererilor de comandă a eșuat'"],
  [/error: 'Failed to create order request'/g, "error: 'Crearea cererii de comandă a eșuat'"],
  [/error: 'Failed to update order request'/g, "error: 'Actualizarea cererii de comandă a eșuat'"],
  [/error: 'Failed to fetch order analytics'/g, "error: 'Încărcarea analiticelor comenzilor a eșuat'"],
  [/message: 'Schedule rule ID is required'/g, "message: 'ID-ul regulii de program este obligatoriu'"],
  [/message: 'Schedule rule not found or unauthorized'/g, "message: 'Regula de program nu a fost găsită sau acces neautorizat'"],
  [/message: 'Schedule rule deleted successfully'/g, "message: 'Regula de program a fost ștearsă cu succes'"],
  [/error: 'Failed to fetch surgical procedures'/g, "error: 'Încărcarea procedurilor chirurgicale a eșuat'"],
  [/error: 'Failed to create surgical procedure'/g, "error: 'Crearea procedurii chirurgicale a eșuat'"],
  [/error: 'Invalid surgical procedure code'/g, "error: 'Cod de procedură chirurgicală invalid'"],
  [/error: 'Patient ID is required'/g, "error: 'ID-ul pacientului este obligatoriu'"],
  [/error: 'Invalid participants'/g, "error: 'Participanți invalizi'"],
  [/message: 'Invalid from or to date'/g, "message: 'Data de la sau până la este invalidă'"],
  [/message: 'Failed to get personal theme settings'/g, "message: 'Obținerea setărilor temei personale a eșuat'"],
  [/message: 'Failed to update personal theme settings'/g, "message: 'Actualizarea setărilor temei personale a eșuat'"],
  [/error: 'Failed to fetch contact persons'/g, "error: 'Încărcarea persoanelor de contact a eșuat'"],
  [/error: 'Failed to create contact person'/g, "error: 'Crearea persoanei de contact a eșuat'"],
  [/error: 'Failed to update contact person'/g, "error: 'Actualizarea persoanei de contact a eșuat'"],
  [/message: 'Schedule ID is required'/g, "message: 'ID-ul programului este obligatoriu'"],
  [/message: 'Unauthorized - Only organization owners and managers can create schedules'/g, "message: 'Neautorizat — doar proprietarii și managerii pot crea programe'"],
  [/message: 'Unauthorized - Only organization owners and managers can update schedules'/g, "message: 'Neautorizat — doar proprietarii și managerii pot actualiza programe'"],
  [/message: 'Unauthorized - Only organization owners and managers can create schedule overrides'/g, "message: 'Neautorizat — doar proprietarii și managerii pot crea excepții de program'"],
  [/message: 'Unauthorized - Only organization owners and managers can delete schedule overrides'/g, "message: 'Neautorizat — doar proprietarii și managerii pot șterge excepții de program'"],
  [/error: 'Failed to process the webpage'/g, "error: 'Procesarea paginii web a eșuat'"],
  [/error: 'No purchases selected for payment'/g, "error: 'Nu au fost selectate achiziții pentru plată'"],
  [/error: 'No valid unpaid purchases found'/g, "error: 'Nu s-au găsit achiziții neplătite valide'"],
  [/error: 'Invalid updates'/g, "error: 'Actualizări invalide'"],
  [/error: 'Failed to update order items'/g, "error: 'Actualizarea articolelor comenzii a eșuat'"],
  [/error: 'Failed to fetch board'/g, "error: 'Încărcarea panoului a eșuat'"],
  [/error: 'Failed to fetch address data'/g, "error: 'Încărcarea datelor adresei a eșuat'"],
  [/error: 'Missing API credentials'/g, "error: 'Lipsesc credențialele API'"],
  [/error: 'Missing query parameter'/g, "error: 'Lipsește parametrul query'"],
  [/message: 'No active schedule found'/g, "message: 'Nu s-a găsit niciun program activ'"],
]

function walkApi(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walkApi(full, files)
    else if (entry.name.endsWith('.ts')) files.push(full)
  }
  return files
}

let uiChanged = 0
for (const [relPath, replacements] of Object.entries(fileReplacements)) {
  const filePath = path.join(srcDir, relPath)
  if (!fs.existsSync(filePath)) continue
  let content = fs.readFileSync(filePath, 'utf8')
  const original = content
  for (const [from, to] of replacements) {
    content = content.split(from).join(to)
  }
  if (content !== original) {
    fs.writeFileSync(filePath, content)
    uiChanged++
    console.log(`Updated ${relPath}`)
  }
}

const apiDir = path.join(srcDir, 'app/api')
let apiChanged = 0
for (const file of walkApi(apiDir)) {
  let content = fs.readFileSync(file, 'utf8')
  const original = content
  for (const [pattern, replacement] of apiReplacements) {
    content = content.replace(pattern, replacement)
  }
  if (content !== original) {
    fs.writeFileSync(file, content)
    apiChanged++
  }
}
console.log(`Updated ${uiChanged} UI files, ${apiChanged} API files`)
