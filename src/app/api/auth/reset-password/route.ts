import { NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { hashPasswordResetToken } from '@/lib/password-reset'
import { zodMessages } from '@/lib/zod-messages'

const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Token invalid'),
    password: z.string().min(8, 'Parola trebuie să aibă cel puțin 8 caractere'),
    confirmPassword: z.string().min(1, zodMessages.required),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: zodMessages.passwordsDoNotMatch,
    path: ['confirmPassword'],
  })

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token, password } = resetPasswordSchema.parse(body)
    const hashedToken = hashPasswordResetToken(token.trim())

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        isActive: true,
        isDisabled: true,
      },
    })

    if (!user || !user.isActive || user.isDisabled) {
      return NextResponse.json(
        { error: 'Linkul de resetare este invalid sau a expirat. Solicitați un link nou.' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      message: 'Parola a fost resetată cu succes. Vă puteți autentifica cu noua parolă.',
    })
  } catch (error) {
    console.error('Reset password failed:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message ?? 'Date invalide' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Resetarea parolei a eșuat. Încercați din nou.' },
      { status: 500 }
    )
  }
}
