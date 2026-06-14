import { Resend } from 'resend'
import nodemailer from 'nodemailer'

export type SendEmailOptions = {
  to: string
  subject: string
  html: string
  text?: string
}

function getFromAddress(): string {
  return process.env.EMAIL_FROM?.trim() || process.env.SMTP_USER?.trim() || 'info@arcalife.com'
}

async function sendWithResend(options: SendEmailOptions): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('RESEND_API_KEY nu este configurat')
  }

  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from: getFromAddress(),
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  })

  if (error) {
    throw new Error(error.message)
  }
}

async function sendWithSmtp(options: SendEmailOptions): Promise<void> {
  const host = process.env.SMTP_HOST?.trim()
  const user = process.env.SMTP_USER?.trim()
  const pass = process.env.SMTP_PASS?.trim()

  if (!host || !user || !pass) {
    throw new Error('Configurația SMTP nu este completă')
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user, pass },
  })

  await transporter.sendMail({
    from: getFromAddress(),
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  })
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  if (process.env.RESEND_API_KEY?.trim()) {
    await sendWithResend(options)
    return
  }

  await sendWithSmtp(options)
}

export function isEmailConfigured(): boolean {
  if (process.env.RESEND_API_KEY?.trim()) return true

  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim()
  )
}
