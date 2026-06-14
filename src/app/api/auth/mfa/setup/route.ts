export { dynamic } from '@/lib/api-config'

import { NextResponse } from 'next/server'
import { requireAuth, isAuthError, hasManagerPermissions } from '@/lib/require-auth'
import { db } from '@/lib/db'
import { generateTotpSecret, buildTotpUri } from '@/lib/mfa'

/** Generate a TOTP secret for the authenticated user (not yet enabled). */
export async function POST() {
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
}
