import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { zodMessages } from '@/lib/zod-messages'

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Parola actuală este obligatorie'),
    newPassword: z.string().min(8, 'Parola nouă trebuie să aibă cel puțin 8 caractere'),
    confirmPassword: z.string().min(1, zodMessages.required),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: zodMessages.passwordsDoNotMatch,
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'Parola nouă trebuie să fie diferită de parola actuală',
    path: ['newPassword'],
  })

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Neautorizat' }, { status: 401 })
    }

    const body = await request.json()
    const { currentPassword, newPassword } = changePasswordSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        password: true,
        isActive: true,
        isDisabled: true,
      },
    })

    if (!user) {
      return NextResponse.json({ message: 'Utilizatorul nu a fost găsit' }, { status: 404 })
    }

    if (!user.isActive || user.isDisabled) {
      return NextResponse.json({ message: 'Cont dezactivat' }, { status: 403 })
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ message: 'Parola actuală este incorectă' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

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
      message: 'Parola a fost schimbată cu succes',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0]?.message ?? 'Date invalide' },
        { status: 400 }
      )
    }

    console.error('Change password failed:', error)
    return NextResponse.json(
      { message: 'Schimbarea parolei a eșuat. Încercați din nou.' },
      { status: 500 }
    )
  }
}
