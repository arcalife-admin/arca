#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const apiDir = path.join(__dirname, '../src/app/api')

const replacements = [
  [/error: 'Failed to fetch waiting list stats'/g, "error: 'Încărcarea statisticilor listei de așteptare a eșuat'"],
  [/error: 'Failed to fetch waiting list'/g, "error: 'Încărcarea listei de așteptare a eșuat'"],
  [/error: 'Failed to create waiting list entry'/g, "error: 'Crearea intrării în lista de așteptare a eșuat'"],
  [/error: 'Failed to update waiting list entry'/g, "error: 'Actualizarea intrării din lista de așteptare a eșuat'"],
  [/error: 'Waiting list entry ID is required'/g, "error: 'ID-ul intrării din lista de așteptare este obligatoriu'"],
  [/error: 'Failed to delete waiting list entry'/g, "error: 'Ștergerea intrării din lista de așteptare a eșuat'"],
  [/error: 'Waiting appointment not found'/g, "error: 'Programarea din lista de așteptare nu a fost găsită'"],
  [/error: 'Failed to move waiting appointment to pending'/g, "error: 'Mutarea programării în așteptare a eșuat'"],
  [/error: 'Failed to fetch vendors'/g, "error: 'Încărcarea furnizorilor a eșuat'"],
  [/error: 'Vendor name is required'/g, "error: 'Numele furnizorului este obligatoriu'"],
  [/error: 'Failed to create vendor'/g, "error: 'Crearea furnizorului a eșuat'"],
  [/error: 'Vendor not found'/g, "error: 'Furnizorul nu a fost găsit'"],
  [/error: 'Failed to update vendor'/g, "error: 'Actualizarea furnizorului a eșuat'"],
  [/error: 'Cannot delete vendor with associated orders or requests'/g, "error: 'Nu se poate șterge furnizorul cu comenzi sau cereri asociate'"],
  [/error: 'Failed to delete vendor'/g, "error: 'Ștergerea furnizorului a eșuat'"],
  [/message: 'Vendor deleted successfully'/g, "message: 'Furnizorul a fost șters cu succes'"],
  [/error: 'Insufficient permissions'/g, "error: 'Permisiuni insuficiente'"],
  [/error: 'User with this email already exists'/g, "error: 'Există deja un utilizator cu acest e-mail'"],
  [/error: 'Cannot disable or delete organization owner'/g, "error: 'Nu se poate dezactiva sau șterge proprietarul organizației'"],
  [/error: 'Cannot disable your own account'/g, "error: 'Nu vă puteți dezactiva propriul cont'"],
  [/error: 'Invalid request body'/g, "error: 'Corpul cererii este invalid'"],
  [/error: 'Invalid email address'/g, "error: 'Adresă de e-mail invalidă'"],
  [/error: 'First name is required'/g, "error: 'Prenumele este obligatoriu'"],
  [/error: 'Last name is required'/g, "error: 'Numele este obligatoriu'"],
  [/error: 'Phone is required'/g, "error: 'Telefonul este obligatoriu'"],
  [/error: 'Address is required'/g, "error: 'Adresa este obligatorie'"],
  [/error: 'Organization name is required'/g, "error: 'Numele organizației este obligatoriu'"],
  [/error: 'Password must be at least 8 characters'/g, "error: 'Parola trebuie să aibă cel puțin 8 caractere'"],
  [/error: 'Phone number is required'/g, "error: 'Numărul de telefon este obligatoriu'"],
  [/error: 'First name must be at least 2 characters'/g, "error: 'Prenumele trebuie să aibă cel puțin 2 caractere'"],
  [/error: 'Last name must be at least 2 characters'/g, "error: 'Numele trebuie să aibă cel puțin 2 caractere'"],
  [/z\.string\(\)\.min\(1, 'First name is required'\)/g, "z.string().min(1, 'Prenumele este obligatoriu')"],
  [/z\.string\(\)\.min\(1, 'Last name is required'\)/g, "z.string().min(1, 'Numele este obligatoriu')"],
  [/z\.string\(\)\.email\('Invalid email address'\)/g, "z.string().email('Adresă de e-mail invalidă')"],
  [/z\.string\(\)\.min\(1, 'Phone is required'\)/g, "z.string().min(1, 'Telefonul este obligatoriu')"],
  [/z\.string\(\)\.min\(1, 'Address is required'\)/g, "z.string().min(1, 'Adresa este obligatorie')"],
  [/z\.string\(\)\.min\(1, 'Organization name is required'\)/g, "z.string().min(1, 'Numele organizației este obligatoriu')"],
  [/z\.string\(\)\.min\(8, 'Password must be at least 8 characters'\)/g, "z.string().min(8, 'Parola trebuie să aibă cel puțin 8 caractere')"],
  [/z\.string\(\)\.min\(1, 'Phone number is required'\)/g, "z.string().min(1, 'Numărul de telefon este obligatoriu')"],
  [/z\.string\(\)\.min\(2, 'First name must be at least 2 characters'\)/g, "z.string().min(2, 'Prenumele trebuie să aibă cel puțin 2 caractere')"],
  [/z\.string\(\)\.min\(2, 'Last name must be at least 2 characters'\)/g, "z.string().min(2, 'Numele trebuie să aibă cel puțin 2 caractere')"],
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
