import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { sendEmail, isEmailConfigured } from '@/lib/email'
import { buildPasswordResetEmail } from '@/lib/emails/password-reset-email'
import {
  buildPasswordResetUrl,
  generatePasswordResetToken,
  getPasswordResetExpiry,
  hashPasswordResetToken,
} from '@/lib/password-reset'

const forgotPasswordSchema = z.object({
  email: z.string().email('Adresă de e-mail invalidă'),
})

const SUCCESS_MESSAGE =
  'Dacă există un cont activ asociat acestei adrese de e-mail, veți primi în curând un link de resetare a parolei.'

export async function POST(request: Request) {
  try {
    if (!isEmailConfigured()) {
      return NextResponse.json(
        { error: 'Serviciul de e-mail nu este configurat. Contactați administratorul.' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { email } = forgotPasswordSchema.parse(body)
    const normalizedEmail = email.trim().toLowerCase()

    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        firstName: true,
        email: true,
        isActive: true,
        isDisabled: true,
      },
    })

    if (user && user.isActive && !user.isDisabled) {
      const rawToken = generatePasswordResetToken()
      const hashedToken = hashPasswordResetToken(rawToken)
      const expiresAt = getPasswordResetExpiry()

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: hashedToken,
          passwordResetExpires: expiresAt,
        },
      })

      const resetUrl = buildPasswordResetUrl(rawToken)
      const emailContent = buildPasswordResetEmail({
        firstName: user.firstName,
        resetUrl,
        expiresInMinutes: 60,
      })

      await sendEmail({
        to: user.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      })
    }

    return NextResponse.json({ message: SUCCESS_MESSAGE })
  } catch (error) {
    console.error('Forgot password failed:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message ?? 'Date invalide' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Nu am putut procesa solicitarea. Încercați din nou.' },
      { status: 500 }
    )
  }
}
