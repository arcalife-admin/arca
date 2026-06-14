export { dynamic } from '@/lib/api-config'

import { NextResponse } from 'next/server'
import { requireAuth, isAuthError } from '@/lib/require-auth'
import { db } from '@/lib/db'
import { buildMfaSetupPayload } from '@/lib/mfa-setup'

/** Current user's MFA status (for profile settings). */
export async function GET() {
  try {
    const auth = await requireAuth()
    if (isAuthError(auth)) return auth

    const prisma = db.getPrismaClient()
    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: {
        email: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
        role: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilizator negăsit' }, { status: 404 })
    }

    const pendingSetup = Boolean(user.twoFactorSecret && !user.twoFactorEnabled)

    let pendingSetupData: {
      secret: string
      otpauthUrl: string
      qrDataUrl: string
    } | null = null

    if (pendingSetup && user.twoFactorSecret) {
      pendingSetupData = await buildMfaSetupPayload(user.email, user.twoFactorSecret)
    }

    return NextResponse.json({
      enabled: user.twoFactorEnabled,
      pendingSetup,
      pendingSetupData,
      isPrivileged:
        user.role === 'ORGANIZATION_OWNER' || user.role === 'MANAGER',
    })
  } catch (error) {
    console.error('MFA status error:', error)
    return NextResponse.json({ error: 'Eroare internă de server' }, { status: 500 })
  }
}
