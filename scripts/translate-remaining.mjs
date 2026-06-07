#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.join(__dirname, '../src')

const replacements = [
  ["'en-US'", "'ro-RO'"],
  ['"en-US"', '"ro-RO"'],
  ["error: 'Failed to delete image'", "error: 'Ștergerea imaginii a eșuat'"],
  ["error: 'Failed to update image'", "error: 'Actualizarea imaginii a eșuat'"],
  ["error: 'Failed to fetch messages'", "error: 'Încărcarea mesajelor a eșuat'"],
  ["error: 'Failed to create message'", "error: 'Crearea mesajului a eșuat'"],
  ["error: 'Failed to update product'", "error: 'Actualizarea produsului a eșuat'"],
  ["error: 'Cannot delete product with existing purchases. Consider deactivating instead.'", "error: 'Nu se poate șterge produsul cu achiziții existente. Luați în considerare dezactivarea.'"],
  ["error: 'Failed to delete product'", "error: 'Ștergerea produsului a eșuat'"],
  ["message: 'Product deleted successfully'", "message: 'Produsul a fost șters cu succes'"],
  ["error: 'Failed to fetch contact persons'", "error: 'Încărcarea persoanelor de contact a eșuat'"],
  ["error: 'Failed to create contact person'", "error: 'Crearea persoanei de contact a eșuat'"],
  ["error: 'Failed to update contact person'", "error: 'Actualizarea persoanei de contact a eșuat'"],
  ["error: 'Failed to fetch tasks'", "error: 'Încărcarea sarcinilor a eșuat'"],
  ["error: 'Failed to create task'", "error: 'Crearea sarcinii a eșuat'"],
  ["error: 'Invalid format'", "error: 'Format invalid'"],
  ["error: 'Failed to fetch surgical procedures'", "error: 'Încărcarea procedurilor chirurgicale a eșuat'"],
  ["error: 'Failed to create surgical procedure'", "error: 'Crearea procedurii chirurgicale a eșuat'"],
  ["error: 'Failed to fetch pending appointments'", "error: 'Încărcarea programărilor în așteptare a eșuat'"],
  ["error: 'Failed to create pending appointment'", "error: 'Crearea programării în așteptare a eșuat'"],
  ["error: 'Failed to update pending appointment'", "error: 'Actualizarea programării în așteptare a eșuat'"],
  ["error: 'Failed to delete pending appointment'", "error: 'Ștergerea programării în așteptare a eșuat'"],
  ["error: 'Failed to fetch family'", "error: 'Încărcarea familiei a eșuat'"],
  ["message: 'Patient added to family successfully'", "message: 'Pacientul a fost adăugat în familie cu succes'"],
  ["error: 'Failed to add patient to family'", "error: 'Adăugarea pacientului în familie a eșuat'"],
  ["message: 'Patient removed from family successfully'", "message: 'Pacientul a fost eliminat din familie cu succes'"],
  ["message: 'Family deleted successfully'", "message: 'Familia a fost ștearsă cu succes'"],
  ["error: 'Failed to delete family/patient'", "error: 'Ștergerea familiei/pacientului a eșuat'"],
  ["error: 'Failed to fetch appointments'", "error: 'Încărcarea programărilor a eșuat'"],
  ["error: 'Failed to create appointment'", "error: 'Crearea programării a eșuat'"],
  ["error: 'Failed to update appointment'", "error: 'Actualizarea programării a eșuat'"],
  ["error: 'Failed to delete appointment'", "error: 'Ștergerea programării a eșuat'"],
  ["message: 'Internal server error'", "message: 'Eroare internă de server'"],
  ["message: 'User not found'", "message: 'Utilizatorul nu a fost găsit'"],
  ["message: 'Email already exists'", "message: 'Adresa de e-mail există deja'"],
  ["message: 'Validation error'", "message: 'Eroare de validare'"],
  ["message: 'No logo file provided'", "message: 'Nu a fost furnizat niciun fișier logo'"],
  ["message: 'File must be an image'", "message: 'Fișierul trebuie să fie o imagine'"],
  ["message: 'File size must be less than 5MB'", "message: 'Dimensiunea fișierului trebuie să fie sub 5 MB'"],
  ["message: 'Logo uploaded successfully'", "message: 'Logo-ul a fost încărcat cu succes'"],
  ["message: 'Schedule ID is required'", "message: 'ID-ul programului este obligatoriu'"],
  ["message: 'Schedule not found'", "message: 'Programul nu a fost găsit'"],
  ["message: 'Override deleted successfully'", "message: 'Excepția a fost ștearsă cu succes'"],
  ["message: 'Override ID or Schedule ID is required'", "message: 'ID-ul excepției sau al programului este obligatoriu'"],
  ["message: 'Override not found'", "message: 'Excepția nu a fost găsită'"],
  ["throw new Error('Failed to fetch notes')", "throw new Error('Încărcarea notițelor a eșuat')"],
  ["throw new Error('Failed to fetch folders')", "throw new Error('Încărcarea dosarelor a eșuat')"],
  ["throw new Error('Failed to fetch dental procedures')", "throw new Error('Încărcarea procedurilor dentare a eșuat')"],
  ["throw new Error('Failed to create note')", "throw new Error('Crearea notiței a eșuat')"],
  ["throw new Error('Failed to update note')", "throw new Error('Actualizarea notiței a eșuat')"],
  ["throw new Error('Failed to delete note')", "throw new Error('Ștergerea notiței a eșuat')"],
  ["throw new Error('Failed to create folder')", "throw new Error('Crearea dosarului a eșuat')"],
  ["throw new Error('Failed to delete folder')", "throw new Error('Ștergerea dosarului a eșuat')"],
  ["throw new Error('Failed to fetch patient')", "throw new Error('Încărcarea pacientului a eșuat')"],
  ["throw new Error('Failed to fetch organization')", "throw new Error('Încărcarea organizației a eșuat')"],
  ["throw new Error('Failed to update patient')", "throw new Error('Actualizarea pacientului a eșuat')"],
  ["throw new Error('Failed to delete patient')", "throw new Error('Ștergerea pacientului a eșuat')"],
  ["throw new Error('Failed to update ASA score')", "throw new Error('Actualizarea scorului ASA a eșuat')"],
  ["throw new Error('Failed to update PPS score')", "throw new Error('Actualizarea scorului PPS a eșuat')"],
  ["'Select ASA score and add notes'", "'Selectați scorul ASA și adăugați note'"],
  ["'Next: Select ASA Score'", "'Următorul: Selectați scorul ASA'"],
  ['>Select ASA Score<', '>Selectați scorul ASA<'],
  ["'Select email addresses from your contacts'", "'Selectați adresele de e-mail din contactele dvs.'"],
  ['>Select All<', '>Selectați tot<'],
  ["'💡 Shopping Cart:'", "'💡 Coș de cumpărături:'"],
  ["'Select the treatments you want to add to the treatment plan.'", "'Selectați tratamentele pe care doriți să le adăugați în planul de tratament.'"],
  ['>Print calendars<', '>Tipărire calendare<'],
  ["'Select the practitioners and printer, then preview.'", "'Selectați practicienii și imprimanta, apoi previzualizați.'"],
  ['>Log Details<', '>Detalii jurnal<'],
  ['>Review Leave Request<', '>Revizuire cerere concediu<'],
  ['>Add Shift for Room ', '>Adaugă tură pentru sala '],
  ["message: 'Unauthorized - Only organization owners can update theme settings'", "message: 'Neautorizat — doar proprietarii organizației pot actualiza setările temei'"],
  ["message: 'Unauthorized - Only organization owners can update organization information'", "message: 'Neautorizat — doar proprietarii organizației pot actualiza informațiile organizației'"],
  ["message: 'User is not associated with an organization'", "message: 'Utilizatorul nu este asociat cu o organizație'"],
  ["message: 'Invalid update type. Must be \"user\" or \"organization\"'", "message: 'Tip de actualizare invalid. Trebuie să fie „user” sau „organization”'"],
  ["message: 'Unauthorized - Only organization owners can update the logo'", "message: 'Neautorizat — doar proprietarii organizației pot actualiza logo-ul'"],
  ["message: 'Unauthorized - Only organization owners and managers can create schedule overrides'", "message: 'Neautorizat — doar proprietarii și managerii pot crea excepții de program'"],
  ["message: 'Unauthorized - Only organization owners and managers can delete schedule overrides'", "message: 'Neautorizat — doar proprietarii și managerii pot șterge excepții de program'"],
]

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, files)
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) files.push(full)
  }
  return files
}

let changed = 0
for (const file of walk(srcDir)) {
  let content = fs.readFileSync(file, 'utf8')
  const original = content
  for (const [from, to] of replacements) {
    content = content.split(from).join(to)
  }
  if (content !== original) {
    fs.writeFileSync(file, content)
    changed++
  }
}
console.log(`Updated ${changed} files`)
