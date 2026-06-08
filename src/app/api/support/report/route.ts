export { dynamic } from '@/lib/api-config'

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import nodemailer from 'nodemailer'
import * as Sentry from '@sentry/nextjs'
import { isSentryEnabled } from '@/lib/sentry'

interface ReportBody {
  description?: string
  pageUrl?: string
  userAgent?: string
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
    }

    const body = (await request.json()) as ReportBody
    const description = body.description?.trim()

    if (!description) {
      return NextResponse.json({ error: 'Descrierea este obligatorie' }, { status: 400 })
    }

    const supportEmail =
      process.env.SUPPORT_EMAIL?.trim() ||
      process.env.EMAIL_FROM?.trim() ||
      process.env.SMTP_USER?.trim()

    if (!supportEmail) {
      return NextResponse.json(
        { error: 'E-mailul de suport nu este configurat' },
        { status: 503 }
      )
    }

    const userName = [session.user.firstName, session.user.lastName]
      .filter(Boolean)
      .join(' ')
    const reportContext = {
      description,
      pageUrl: body.pageUrl || 'unknown',
      userAgent: body.userAgent || 'unknown',
      userEmail: session.user.email || 'unknown',
      userName: userName || 'unknown',
      userId: session.user.id,
      organizationId: session.user.organizationId,
      role: session.user.role,
    }

    if (isSentryEnabled()) {
      Sentry.withScope((scope) => {
        scope.setUser({
          id: session.user.id,
          email: session.user.email || undefined,
        })
        scope.setContext('support_report', reportContext)
        Sentry.captureMessage('User support report submitted', 'info')
      })
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    const subject = `[Arca Support] Report from ${userName || session.user.email}`
    const text = [
      'Support report from Arca Life',
      '',
      `Description:\n${description}`,
      '',
      `Page: ${reportContext.pageUrl}`,
      `User: ${reportContext.userName} (${reportContext.userEmail})`,
      `User ID: ${reportContext.userId}`,
      `Organization ID: ${reportContext.organizationId || 'n/a'}`,
      `Role: ${reportContext.role || 'n/a'}`,
      `User agent: ${reportContext.userAgent}`,
      `Time: ${new Date().toISOString()}`,
    ].join('\n')

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: supportEmail,
      replyTo: session.user.email || undefined,
      subject,
      text,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Support report failed:', error)

    if (isSentryEnabled()) {
      Sentry.captureException(error)
    }

    return NextResponse.json({ error: 'Trimiterea raportului de suport a eșuat' }, { status: 500 })
  }
}
