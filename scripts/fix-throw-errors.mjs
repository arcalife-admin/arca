#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

const replacements = [
  ["throw new Error('Încărcarea addresses')", "throw new Error('Încărcarea adreselor a eșuat')"],
  ["throw new Error('Încărcarea waiting list')", "throw new Error('Încărcarea listei de așteptare a eșuat')"],
  ["throw new Error('Încărcarea codes')", "throw new Error('Încărcarea codurilor a eșuat')"],
  ["throw new Error('Încărcarea pending appointments')", "throw new Error('Încărcarea programărilor în așteptare a eșuat')"],
  ["throw new Error('Încărcarea practitioners')", "throw new Error('Încărcarea practicienilor a eșuat')"],
  ["throw new Error('Încărcarea patients')", "throw new Error('Încărcarea pacienților a eșuat')"],
  ["throw new Error('Încărcarea tasks')", "throw new Error('Încărcarea sarcinilor a eșuat')"],
  ["throw new Error('Încărcarea finance settings')", "throw new Error('Încărcarea setărilor financiare a eșuat')"],
  ["throw new Error('Încărcarea procedure income')", "throw new Error('Încărcarea veniturilor din proceduri a eșuat')"],
  ["throw new Error('Încărcarea income data')", "throw new Error('Încărcarea datelor de venit a eșuat')"],
  ["throw new Error('Încărcarea expense data')", "throw new Error('Încărcarea datelor de cheltuieli a eșuat')"],
  ["throw new Error('Încărcarea financial summary')", "throw new Error('Încărcarea sumarului financiar a eșuat')"],
  ["throw new Error('Încărcarea board')", "throw new Error('Încărcarea panoului a eșuat')"],
  ["throw new Error('Încărcarea waiting list stats')", "throw new Error('Încărcarea statisticilor listei de așteptare a eșuat')"],
  ["throw new Error('Încărcarea waiting list entries')", "throw new Error('Încărcarea intrărilor din lista de așteptare a eșuat')"],
  ["throw new Error('Încărcarea instructions')", "throw new Error('Încărcarea instrucțiunilor a eșuat')"],
  ["throw new Error('Încărcarea patients')", "throw new Error('Încărcarea pacienților a eșuat')"],
]

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, files)
    else if (entry.name.endsWith('.tsx')) files.push(full)
  }
  return files
}

for (const file of [...walk('src/app'), ...walk('src/components')]) {
  let content = fs.readFileSync(file, 'utf8')
  const original = content
  for (const [from, to] of replacements) {
    content = content.split(from).join(to)
  }
  if (content !== original) fs.writeFileSync(file, content)
}
console.log('Fixed throw errors')
