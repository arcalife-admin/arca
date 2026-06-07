export function validateIntakeBasic(basic: Record<string, unknown>): string | null {
  if (!String(basic.firstName || '').trim() || !String(basic.lastName || '').trim()) {
    return 'Numele și prenumele sunt obligatorii. Reveniți la pasul „Date de bază”.'
  }
  if (!String(basic.dateOfBirth || '').trim()) {
    return 'Data nașterii este obligatorie. Reveniți la pasul „Date de bază”.'
  }
  if (!basic.gender) {
    return 'Sexul este obligatoriu. Reveniți la pasul „Date de bază”.'
  }
  if (!String(basic.cnp || '').trim()) {
    return 'CNP-ul este obligatoriu. Reveniți la pasul „Date de bază”.'
  }

  const address = basic.address as { display_name?: string } | undefined
  if (!String(address?.display_name || '').trim()) {
    return 'Adresa este obligatorie. Reveniți la pasul „Date de bază”.'
  }

  return null
}
