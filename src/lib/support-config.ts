export interface SupportConfig {
  whatsapp: string | null
  hoursNl: string | null
  hoursRo: string | null
  faqUrl: string | null
}

export const SUPPORT_FAQ_PATH = '/dashboard/support/faq'
export const SUPPORT_REMOTE_SETUP_PATH = '/dashboard/support/remote-setup'
export const ANYDESK_DOWNLOAD_URL = 'https://anydesk.com/en/downloads'

export function getSupportConfig(): SupportConfig {
  const faqOverride = process.env.NEXT_PUBLIC_SUPPORT_FAQ_URL?.trim()

  return {
    whatsapp: process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP?.trim() || null,
    hoursNl: process.env.NEXT_PUBLIC_SUPPORT_HOURS_NL?.trim() || null,
    hoursRo: process.env.NEXT_PUBLIC_SUPPORT_HOURS_RO?.trim() || null,
    faqUrl: faqOverride || SUPPORT_FAQ_PATH,
  }
}

export function isSupportEnabled(config: SupportConfig): boolean {
  return Boolean(config.whatsapp)
}

export function buildWhatsAppUrl(whatsapp: string, message: string): string {
  const digits = whatsapp.replace(/\D/g, '')
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}
