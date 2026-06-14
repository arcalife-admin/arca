import crypto from 'crypto'

const RESET_TOKEN_BYTES = 32
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000

export function generatePasswordResetToken(): string {
  return crypto.randomBytes(RESET_TOKEN_BYTES).toString('hex')
}

export function hashPasswordResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function getPasswordResetExpiry(): Date {
  return new Date(Date.now() + RESET_TOKEN_TTL_MS)
}

export function buildPasswordResetUrl(token: string): string {
  const baseUrl = process.env.NEXTAUTH_URL?.replace(/\/$/, '') || 'http://localhost:3000'
  return `${baseUrl}/ro/reset-password?token=${encodeURIComponent(token)}`
}
