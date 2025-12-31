import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { patientId } = await request.json();
    if (!patientId) {
      return NextResponse.json({ error: 'patientId is required' }, { status: 400 });
    }

    // Fetch patient info
    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient || !patient.email) {
      return NextResponse.json({ error: 'Patient not found or missing email address' }, { status: 404 });
    }

    // Fetch upcoming appointments for the patient
    const now = new Date();
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
    });

    // Build email content
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
    `;

    // Configure nodemailer transport
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false, // upgrade later with STARTTLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: patient.email,
      subject: 'Appointment Confirmation',
      html: htmlContent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return NextResponse.json(
      { error: 'Failed to send confirmation email' },
      { status: 500 }
    );
  }
} 