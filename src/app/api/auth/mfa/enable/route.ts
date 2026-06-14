export { dynamic } from '@/lib/api-config'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isAuthError, hasManagerPermissions } from '@/lib/require-auth'
import { db } from '@/lib/db'
import { verifyTotp } from '@/lib/mfa'

const enableSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, 'Codul trebuie să aibă 6 cifre'),
})

/** Verify TOTP code and enable MFA for the authenticated user. */
export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (isAuthError(auth)) return auth

  if (!hasManagerPermissions(auth.user.role)) {
    return NextResponse.json({ error: 'Permisiuni insuficiente' }, { status: 403 })
  }

  const body = await request.json()
  const { code } = enableSchema.parse(body)

  const prisma = db.getPrismaClient()
  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: { twoFactorSecret: true, twoFactorEnabled: true },
  })

  if (!user?.twoFactorSecret) {
    return NextResponse.json(
      { error: 'Rulați mai întâi configurarea MFA' },
      { status: 400 }
    )
  }

  if (user.twoFactorEnabled) {
    return NextResponse.json({ error: 'MFA este deja activat' }, { status: 400 })
  }

  if (!verifyTotp(user.twoFactorSecret, code)) {
    return NextResponse.json({ error: 'Cod MFA invalid' }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: auth.user.id },
    data: { twoFactorEnabled: true },
  })

  return NextResponse.json({ success: true })
}
