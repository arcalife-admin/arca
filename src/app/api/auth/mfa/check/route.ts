export { dynamic } from '@/lib/api-config'

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { db } from '@/lib/db'
import { verifyTotp } from '@/lib/mfa'

const checkSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  totpCode: z.string().optional(),
})

/**
 * Pre-login MFA check. Validates credentials and MFA without creating a session.
 * NextAuth masks custom authorize() errors as CredentialsSignin — this endpoint
 * returns explicit error codes for the login UI.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, totpCode } = checkSchema.parse(body)

    const prisma = db.getPrismaClient()
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        password: true,
        isActive: true,
        isDisabled: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
      },
    })

    const invalid = () =>
      NextResponse.json({ ok: false, error: 'INVALID_CREDENTIALS' }, { status: 401 })

    if (!user || !user.isActive || user.isDisabled) {
      return invalid()
    }

    const passwordValid = await bcrypt.compare(password, user.password)
    if (!passwordValid) {
      return invalid()
    }

    const mfaRequired = Boolean(user.twoFactorEnabled && user.twoFactorSecret)

    if (mfaRequired) {
      const code = totpCode?.trim()
      if (!code) {
        return NextResponse.json({
          ok: false,
          error: 'MFA_REQUIRED',
          mfaRequired: true,
        })
      }
      if (!verifyTotp(user.twoFactorSecret!, code)) {
        return NextResponse.json({
          ok: false,
          error: 'MFA_INVALID',
          mfaRequired: true,
        })
      }
    }

    return NextResponse.json({ ok: true, mfaRequired })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'INVALID_CREDENTIALS' }, { status: 400 })
    }
    console.error('MFA check error:', error)
    return NextResponse.json({ ok: false, error: 'SERVER_ERROR' }, { status: 500 })
  }
}
