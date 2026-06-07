/** Official ANMDMR human medicines nomenclator (prospect + RCP). */
export function buildAnmdmrNomenclatorUrl(options: {
  commercialName: string
}) {
  const params = new URLSearchParams()
  const commercialName = options.commercialName.split('/')[0].trim()
  params.set('denCom', commercialName)
  return `https://nomenclator.anm.ro/medicamente?${params.toString()}`
}

export function buildMedicationDocumentationLinks(options: { commercialName: string }) {
  return {
    anmdmr: buildAnmdmrNomenclatorUrl(options),
  }
}
