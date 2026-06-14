import { generateSecret, generateURI, verifySync } from 'otplib'
import { UserRole } from '@prisma/client'

const APP_NAME = 'ArcaLife'

export const PRIVILEGED_ROLES: UserRole[] = ['ORGANIZATION_OWNER', 'MANAGER']

export function isPrivilegedRole(role: UserRole | string): boolean {
  return PRIVILEGED_ROLES.includes(role as UserRole)
}

export function generateTotpSecret(): string {
  return generateSecret()
}

export function buildTotpUri(email: string, secret: string): string {
  return generateURI({
    issuer: APP_NAME,
    label: email,
    secret,
  })
}

export function verifyTotp(secret: string, token: string): boolean {
  const normalized = token.trim().replace(/\s/g, '')
  if (!/^\d{6}$/.test(normalized)) return false
  try {
    const result = verifySync({ secret, token: normalized })
    return result.valid
  } catch {
    return false
  }
}

export function isMfaEnforcementEnabled(): boolean {
  if (process.env.ENFORCE_MFA_FOR_PRIVILEGED === 'false') return false
  return process.env.NODE_ENV === 'production'
}
