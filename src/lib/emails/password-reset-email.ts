type PasswordResetEmailParams = {
  firstName: string
  resetUrl: string
  expiresInMinutes: number
}

export function buildPasswordResetEmail(params: PasswordResetEmailParams): {
  subject: string
  html: string
  text: string
} {
  const { firstName, resetUrl, expiresInMinutes } = params
  const greeting = firstName ? `Bună ziua, ${firstName},` : 'Bună ziua,'

  const subject = 'Resetare parolă ArcaLife'

  const text = [
    greeting,
    '',
    'Am primit o solicitare de resetare a parolei pentru contul dvs. ArcaLife.',
    '',
    'Pentru a seta o parolă nouă, accesați linkul de mai jos:',
    resetUrl,
    '',
    `Linkul este valabil ${expiresInMinutes} de minute.`,
    '',
    'Dacă nu ați solicitat resetarea parolei, puteți ignora acest e-mail. Parola dvs. rămâne neschimbată.',
    '',
    'Cu stimă,',
    'Echipa ArcaLife',
  ].join('\n')

  const html = `
<!DOCTYPE html>
<html lang="ro">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f9fafb;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f9fafb;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:32px;">
            <tr>
              <td>
                <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;color:#111827;">Resetare parolă</h1>
                <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#374151;">${greeting}</p>
                <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#374151;">
                  Am primit o solicitare de resetare a parolei pentru contul dvs. ArcaLife.
                </p>
                <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#374151;">
                  Apăsați butonul de mai jos pentru a seta o parolă nouă:
                </p>
                <p style="margin:0 0 24px;text-align:center;">
                  <a href="${resetUrl}" style="display:inline-block;background-color:#ef4444;color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;padding:12px 24px;border-radius:8px;">
                    Resetează parola
                  </a>
                </p>
                <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#6b7280;">
                  Dacă butonul nu funcționează, copiați și lipiți acest link în browser:
                </p>
                <p style="margin:0 0 24px;font-size:14px;line-height:1.6;word-break:break-all;">
                  <a href="${resetUrl}" style="color:#ef4444;">${resetUrl}</a>
                </p>
                <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#6b7280;">
                  Linkul este valabil ${expiresInMinutes} de minute.
                </p>
                <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#6b7280;">
                  Dacă nu ați solicitat resetarea parolei, puteți ignora acest e-mail. Parola dvs. rămâne neschimbată.
                </p>
                <p style="margin:0;font-size:14px;line-height:1.6;color:#374151;">
                  Cu stimă,<br />
                  Echipa ArcaLife
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim()

  return { subject, html, text }
}
