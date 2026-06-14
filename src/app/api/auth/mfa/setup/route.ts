export { dynamic } from '@/lib/api-config'

import { NextResponse } from 'next/server'
import { requireAuth, isAuthError, hasManagerPermissions } from '@/lib/require-auth'
import { db } from '@/lib/db'
import { generateTotpSecret, buildTotpUri } from '@/lib/mfa'

function isMissingMfaColumnError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const msg = error.message.toLowerCase()
  return (
    msg.includes('twofactorenabled') ||
    msg.includes('twofactorsecret') ||
    msg.includes('column') && msg.includes('does not exist')
  )
}

/** Generate a TOTP secret for the authenticated user (not yet enabled). */
export async function POST() {
  try {
    const auth = await requireAuth()
    if (isAuthError(auth)) return auth

    if (!hasManagerPermissions(auth.user.role)) {
      return NextResponse.json({ error: 'Permisiuni insuficiente' }, { status: 403 })
    }

    const prisma = db.getPrismaClient()
    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { email: true, twoFactorEnabled: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilizator negăsit' }, { status: 404 })
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json({ error: 'MFA este deja activat' }, { status: 400 })
    }

    const secret = generateTotpSecret()

    await prisma.user.update({
      where: { id: auth.user.id },
      data: { twoFactorSecret: secret },
    })

    return NextResponse.json({
      secret,
      otpauthUrl: buildTotpUri(user.email, secret),
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
