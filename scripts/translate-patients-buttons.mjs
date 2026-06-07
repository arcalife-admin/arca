#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/app/[locale]/dashboard/patients/[id]/page.tsx')
let c = fs.readFileSync(file, 'utf8')

const pairs = [
  [/(\n\s+)Cancel(\n)/g, '$1Anulează$2'],
  [/(\n\s+)Close(\n)/g, '$1Închide$2'],
  ['cancelText="Cancel"', 'cancelText="Anulează"'],
  ["{updatePatient.isPending ? 'Saving...' : 'Save Changes'}", "{updatePatient.isPending ? 'Se salvează...' : 'Salvează modificările'}"],
  ["{updateAsaScore.isPending ? 'Saving...' : 'Save ASA Score'}", "{updateAsaScore.isPending ? 'Se salvează...' : 'Salvează scorul ASA'}"],
  ["{updatePpsScore.isPending ? 'Saving...' : 'Save PPS Assessment'}", "{updatePpsScore.isPending ? 'Se salvează...' : 'Salvează evaluarea PPS'}"],
  ["{updateScreeningRecallScore.isPending ? 'Saving...' : 'Save Termeni recall screening'}", "{updateScreeningRecallScore.isPending ? 'Se salvează...' : 'Salvează termenii recall screening'}"],
  ["{updateCleaningRecallScore.isPending ? 'Saving...' : 'Save Termeni recall curățare'}", "{updateCleaningRecallScore.isPending ? 'Se salvează...' : 'Salvează termenii recall curățare'}"],
  ['Save Changes', 'Salvează modificările'],
  ['+ Add Custom Treatment', '+ Adaugă tratament personalizat'],
  ['Add a new treatment to the periodontal treatment cart.', 'Adăugați un tratament nou în coșul de tratament parodontal.'],
  ['⚡ Quick Add Standalone Treatments', '⚡ Adăugare rapidă tratamente independente'],
  ['Add Tooth-Specific Treatment', 'Adaugă tratament pe dinte'],
  ["{record.action === 'DISABLE' ? 'Disabled' : 'Enabled'}", "{record.action === 'DISABLE' ? 'Dezactivat' : 'Activat'}"],
  ["{new Date(patient.healthInsurance.validUntil) > new Date() ? 'Active' : 'Expired'}", "{new Date(patient.healthInsurance.validUntil) > new Date() ? 'Activ' : 'Expirat'}"],
  ['Add {selectedTreatments.length} Treatment{selectedTreatments.length !== 1 ? \'s\' : \'\'} to Plan', 'Adaugă {selectedTreatments.length} tratament{selectedTreatments.length !== 1 ? \'e\' : \'\'} în plan'],
]

for (const [from, to] of pairs) {
  if (from instanceof RegExp) c = c.replace(from, to)
  else c = c.split(from).join(to)
}

fs.writeFileSync(file, c)
console.log('Updated patients/[id]/page.tsx buttons')
