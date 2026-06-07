#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const apiDir = path.join(__dirname, '../src/app/api')

const replacements = [
  [/error: 'Unauthorized'/g, "error: 'Neautorizat'"],
  [/error: "Unauthorized"/g, 'error: "Neautorizat"'],
  [/error: 'Forbidden'/g, "error: 'Acces interzis'"],
  [/error: "Forbidden"/g, 'error: "Acces interzis"'],
  [/error: 'Not found'/g, "error: 'Nu a fost găsit'"],
  [/error: 'Not Found'/g, "error: 'Nu a fost găsit'"],
  [/error: 'Internal server error'/g, "error: 'Eroare internă de server'"],
  [/error: 'Internal Server Error'/g, "error: 'Eroare internă de server'"],
  [/error: 'Failed to fetch'/g, "error: 'Încărcarea datelor a eșuat'"],
  [/error: 'Failed to create'/g, "error: 'Crearea a eșuat'"],
  [/error: 'Failed to update'/g, "error: 'Actualizarea a eșuat'"],
  [/error: 'Failed to delete'/g, "error: 'Ștergerea a eșuat'"],
  [/error: 'Failed to save'/g, "error: 'Salvarea a eșuat'"],
  [/error: 'Failed to load'/g, "error: 'Încărcarea a eșuat'"],
  [/error: 'Patient not found'/g, "error: 'Pacientul nu a fost găsit'"],
  [/error: 'Task not found'/g, "error: 'Sarcina nu a fost găsită'"],
  [/error: 'Task not found or insufficient permissions'/g, "error: 'Sarcina nu a fost găsită sau permisiuni insuficiente'"],
  [/error: 'Reminder not found'/g, "error: 'Memento negăsit'"],
  [/error: 'No actions to undo'/g, "error: 'Nu există acțiuni de anulat'"],
  [/error: 'Procedure not found for undo \(add\)'/g, "error: 'Procedura nu a fost găsită'"],
  [/error: 'No backup found for deleted procedure'/g, "error: 'Nu s-a găsit copie de rezervă pentru procedura ștearsă'"],
  [/error: 'No backup found for edited procedure'/g, "error: 'Nu s-a găsit copie de rezervă pentru procedura editată'"],
  [/error: 'Unsupported action for undo'/g, "error: 'Acțiune neacceptată pentru anulare'"],
  [/error: 'Failed to update reminder'/g, "error: 'Actualizarea mementoului a eșuat'"],
  [/error: 'Failed to fetch assignments'/g, "error: 'Încărcarea atribuirilor a eșuat'"],
  [/error: 'Failed to create sealing procedures'/g, "error: 'Crearea procedurilor de sigilare a eșuat'"],
  [/error: 'Appointment not found'/g, "error: 'Programarea nu a fost găsită'"],
  [/error: 'Organization not found'/g, "error: 'Organizația nu a fost găsită'"],
  [/error: 'User not found'/g, "error: 'Utilizatorul nu a fost găsit'"],
  [/error: 'Invalid input'/g, "error: 'Date introduse invalide'"],
  [/error: 'Validation failed'/g, "error: 'Validarea a eșuat'"],
  [/message: 'Registration failed'/g, "message: 'Înregistrarea a eșuat'"],
  [/message: 'Unauthorized'/g, "message: 'Neautorizat'"],
  [/subject: 'Appointment Confirmation'/g, "subject: 'Confirmare programare'"],
]

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, files)
    else if (entry.name.endsWith('.ts')) files.push(full)
  }
  return files
}

let changed = 0
for (const file of walk(apiDir)) {
  let content = fs.readFileSync(file, 'utf8')
  const original = content
  for (const [pattern, replacement] of replacements) {
    content = content.replace(pattern, replacement)
  }
  if (content !== original) {
    fs.writeFileSync(file, content)
    changed++
  }
}
console.log(`Updated ${changed} API route files`)
