# Clinic remote support setup

Operational guide for the Romania clinic. Share with clinic management and print the in-app guide at `/dashboard/support/remote-setup`.

## Before go-live

1. **Designate one support PC** (usually reception) — avoid installing remote tools on every chair unless necessary.
2. **Install AnyDesk** on that PC from [anydesk.com/en/downloads](https://anydesk.com/en/downloads).
3. **Record the AnyDesk ID** in the inventory table (in-app guide or below).
4. **Train staff:** WhatsApp for all support requests, including urgent issues.
5. **Agree SLA in writing:** e.g. WhatsApp same business day; remote by appointment.

## AnyDesk install (Windows)

1. Download and run the AnyDesk installer.
2. Choose *Install AnyDesk on this computer* (not portable only).
3. After install, note the **Your Address** (9-digit ID).
4. Write the ID on a label near the monitor.
5. **Do not** enable unattended access unless technical support explicitly approves it.

## Security and GDPR

- Remote sessions only when **support initiates or approves** via WhatsApp.
- Staff must **verbally confirm** before accepting an incoming connection.
- Prefer **attended access** (someone at the desk during the session).
- Patient data in Arca is confidential — remote access is for troubleshooting the PC/browser, not routine browsing.
- Document support sessions in a simple log (date, staff name, reason).

## PC inventory template

| Location | AnyDesk ID | Notes |
|----------|------------|-------|
| Reception | | Primary support PC |
| Room 1 | | |
| Room 2 | | |

## Alternatives

- **RustDesk** — open-source; contact support if AnyDesk is unavailable.
- **Windows Quick Assist** — no install; temporary session only (Windows 10/11). Search “Quick Assist” in Start menu.

## When staff need help

1. Press **Support** (life-ring button, bottom-left in Arca).
2. Try **FAQ** for common questions.
3. Send **WhatsApp** with description + screenshot.
4. For remote help: open AnyDesk → send ID on WhatsApp → stay at PC.
5. Use **WhatsApp** for urgent issues when the clinic cannot operate.

## Support contact configuration

Set in production `.env`:

```env
NEXT_PUBLIC_SUPPORT_WHATSAPP="31..."
NEXT_PUBLIC_SUPPORT_HOURS_NL="Mon–Fri 9:00–18:00 CET"
NEXT_PUBLIC_SUPPORT_HOURS_RO="Lun–Vineri 10:00–19:00 EET"
SUPPORT_EMAIL="info@arcalife.com"
```

See also: [whatsapp-business-templates.md](./whatsapp-business-templates.md), [uptime-monitoring.md](./uptime-monitoring.md).
