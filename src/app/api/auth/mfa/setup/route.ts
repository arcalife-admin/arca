export { dynamic } from '@/lib/api-config'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isAuthError, hasManagerPermissions } from '@/lib/require-auth'
import { db } from '@/lib/db'
import { generateTotpSecret } from '@/lib/mfa'
import { buildMfaSetupPayload } from '@/lib/mfa-setup'

function isMissingMfaColumnError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const msg = error.message.toLowerCase()
  return (
    msg.includes('twofactorenabled') ||
    msg.includes('twofactorsecret') ||
    (msg.includes('column') && msg.includes('does not exist'))
  )
}

/**
 * Generate or reuse a TOTP secret for MFA setup.
 * Reuses an existing pending secret so re-clicks don't desync Authenticator.
 * Pass { "reset": true } to discard a pending setup and start fresh.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth()
    if (isAuthError(auth)) return auth

    if (!hasManagerPermissions(auth.user.role)) {
      return NextResponse.json({ error: 'Permisiuni insuficiente' }, { status: 403 })
    }

    let reset = false
    try {
      const body = await request.json()
      reset = Boolean(body?.reset)
    } catch {
      // empty body is fine
    }

    const prisma = db.getPrismaClient()
    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { email: true, twoFactorEnabled: true, twoFactorSecret: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilizator negăsit' }, { status: 404 })
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json({ error: 'MFA este deja activat' }, { status: 400 })
    }

    let secret: string

    if (user.twoFactorSecret && !reset) {
      // Reuse pending secret — do not rotate on every button click
      secret = user.twoFactorSecret
    } else {
      secret = generateTotpSecret()
      await prisma.user.update({
        where: { id: auth.user.id },
        data: { twoFactorSecret: secret, twoFactorEnabled: false },
      })
    }

    const payload = await buildMfaSetupPayload(user.email, secret)

    return NextResponse.json({
      ...payload,
      reused: Boolean(user.twoFactorSecret && !reset),
    })
  } catch (error) {
    console.error('MFA setup error:', error)

    if (isMissingMfaColumnError(error)) {
      return NextResponse.json(
        {
          error:
            'Baza de date nu are coloanele MFA. Rulați: npx prisma migrate deploy',
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Configurarea MFA a eșuat. Încercați din nou.' },
      { status: 500 }
    )
  }
}
