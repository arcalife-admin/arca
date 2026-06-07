# WhatsApp Business — Arca Life support (NL → RO)

Copy these templates when configuring WhatsApp Business for clinic support.

## Profile

- **Business name:** Arca Life Support
- **Category:** Software company / Technical support
- **Description (RO):** Suport tehnic Arca Life pentru clinica dvs. Contactați-ne pe WhatsApp.
- **Description (EN):** Arca Life technical support for your clinic. Contact us on WhatsApp.

## Away message (outside hours)

**Romanian:**

```
Bună! Mesajul tău a fost primit.

Suportul Arca Life răspunde în programul de lucru:
• RO: Lun–Vineri 10:00–19:00 (EET)
• NL: Mon–Fri 9:00–18:00 (CET)

Pentru urgențe, trimiteți mesaj pe WhatsApp cu „URGENT” în titlu.

Mulțumim!
```

**English:**

```
Hi! We received your message.

Arca Life support replies during business hours:
• RO: Mon–Fri 10:00–19:00 (EET)
• NL: Mon–Fri 9:00–18:00 (CET)

For emergencies, send a WhatsApp message with “URGENT” in the first line.

Thank you!
```

## Greeting message (first contact / business hours)

**Romanian:**

```
Bună! Sunt suportul tehnic Arca Life.

Trimite:
1) Ce problemă ai
2) Captură de ecran (dacă e posibil)
3) AnyDesk ID (doar dacă ți s-a cerut ajutor la distanță)

Răspund cât mai curând în programul de lucru.
```

**English:**

```
Hi! This is Arca Life technical support.

Please send:
1) What went wrong
2) A screenshot (if possible)
3) AnyDesk ID (only if remote help was requested)

We’ll reply as soon as possible during business hours.
```

## Quick replies (suggested labels)

| Label | Message |
|-------|---------|
| `anydesk` | Vă rog deschideți AnyDesk pe PC-ul de la recepție, trimiteți ID-ul (9 cifre) și rămâneți la calculator. / Please open AnyDesk on the reception PC, send the 9-digit ID, and stay at the computer. |
| `screenshot` | Puteți trimite o captură de ecran a erorii? / Can you send a screenshot of the error? |
| `refresh` | Încercați să reîmprospătați pagina (F5) sau să folosiți Chrome. / Try refreshing the page (F5) or use Chrome. |
| `received` | Am primit mesajul. Revin în curând. / Message received. We’ll get back to you shortly. |

## Setup checklist

1. Install WhatsApp Business on the phone number used in `NEXT_PUBLIC_SUPPORT_WHATSAPP`.
2. Set business hours to match `NEXT_PUBLIC_SUPPORT_HOURS_*` in `.env`.
3. Enable away message outside those hours.
4. Add quick replies above for faster responses.
5. Pin the clinic contact and test from a clinic phone.
