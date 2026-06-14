import { createHmac, randomBytes } from 'crypto'
import { UserRole } from '@prisma/client'

const APP_NAME = 'ArcaLife'
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export const PRIVILEGED_ROLES: UserRole[] = ['ORGANIZATION_OWNER', 'MANAGER']

export function isPrivilegedRole(role: UserRole | string): boolean {
  return PRIVILEGED_ROLES.includes(role as UserRole)
}

function base32Encode(buffer: Buffer): string {
  let bits = 0
  let value = 0
  let output = ''

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i]
    bits += 8

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31]
  }

  return output
}

function base32Decode(encoded: string): Buffer {
  const cleaned = encoded.replace(/=+$/g, '').toUpperCase()
  let bits = 0
  let value = 0
  const output: number[] = []

  for (const char of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(char)
    if (idx === -1) continue
    value = (value << 5) | idx
    bits += 5

    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255)
      bits -= 8
    }
  }

  return Buffer.from(output)
}

function generateHotp(secret: string, counter: number): string {
  const key = base32Decode(secret)
  const buffer = Buffer.alloc(8)
  buffer.writeBigUInt64BE(BigInt(counter))

  const hmac = createHmac('sha1', key).update(buffer).digest()
  const offset = hmac[hmac.length - 1] & 0x0f
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)

  return (code % 1_000_000).toString().padStart(6, '0')
}

function generateTotpAt(secret: string, timestampMs: number): string {
  const counter = Math.floor(timestampMs / 1000 / 30)
  return generateHotp(secret, counter)
}

export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20))
}

export function buildTotpUri(email: string, secret: string): string {
  const label = encodeURIComponent(`${APP_NAME}:${email}`)
  const issuer = encodeURIComponent(APP_NAME)
  const params = new URLSearchParams({
    secret,
    issuer: APP_NAME,
    algorithm: 'SHA1',
    digits: '6',
    period: '30',
  })
  return `otpauth://totp/${label}?${params.toString()}`
}

export function verifyTotp(secret: string, token: string): boolean {
  const normalized = token.trim().replace(/\s/g, '')
  if (!/^\d{6}$/.test(normalized)) return false

  const now = Date.now()
  // Allow ±5 time steps (~2.5 min) for clock skew and slow entry
  for (let step = -5; step <= 5; step++) {
    if (generateTotpAt(secret, now + step * 30_000) === normalized) {
      return true
    }
  }
  return false
}

export function isMfaEnforcementEnabled(): boolean {
  if (process.env.ENFORCE_MFA_FOR_PRIVILEGED === 'false') return false
  return process.env.NODE_ENV === 'production'
}
