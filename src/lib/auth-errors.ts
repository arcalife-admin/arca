/** Map NextAuth English error strings to Romanian */
export const authErrorMap: Record<string, string> = {
  'Invalid credentials': 'Date de autentificare invalide',
  'User not found': 'Utilizator negăsit',
  'Invalid password': 'Parolă incorectă',
  'Database connection issue. Please try again.': 'Problemă de conexiune la baza de date. Încercați din nou.',
  CredentialsSignin: 'Autentificarea a eșuat. Verificați datele introduse.',
  MFA_REQUIRED: 'Introduceți codul de autentificare în doi pași (MFA).',
  MFA_INVALID: 'Cod MFA invalid. Încercați din nou.',
  INVALID_CREDENTIALS: 'Date de autentificare invalide',
  SERVER_ERROR: 'Eroare de server. Încercați din nou.',
}

export function translateAuthError(error: string): string {
  return authErrorMap[error] ?? error
}
