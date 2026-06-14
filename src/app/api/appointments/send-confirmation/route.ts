export { dynamic } from '@/lib/api-config'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import nodemailer from 'nodemailer'
import { requireAuth, isAuthError } from '@/lib/require-auth'

export async function POST(request: Request) {
  try {
    const auth = await requireAuth()
    if (isAuthError(auth)) return auth

    const { patientId } = await request.json()
    if (!patientId) {
      return NextResponse.json({ error: 'patientId is required' }, { status: 400 })
    }

    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        organizationId: auth.user.organizationId,
      },
    })

    if (!patient || !patient.email) {
      return NextResponse.json({ error: 'Pacientul nu a fost găsit sau lipsește adresa de e-mail' }, { status: 404 })
    }

    const now = new Date()
    const upcoming = await prisma.appointment.findMany({
      where: {
        patientId,
        startTime: {
          gte: now,
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    })

    const htmlContent = `
      <p>Dear ${patient.firstName || ''},</p>
      <p>Here is the confirmation of your upcoming appointment${upcoming.length > 1 ? 's' : ''}:</p>
      <ul>
        ${upcoming
        .map(
          (a) =>
            `<li><strong>${new Date(a.startTime).toLocaleString()}</strong> – ${a.type}</li>`
        )
        .join('')}
      </ul>
      <p>If you have any questions, please contact us.</p>
      <p>Best regards,<br/>Your Dental Clinic</p>
    `

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: patient.email,
      subject: 'Confirmare programare',
      html: htmlContent,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending confirmation email:', error)
    return NextResponse.json(
      { error: 'Trimiterea e-mailului de confirmare a eșuat' },
      { status: 500 }
    )
  }
}
