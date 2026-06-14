import QRCode from 'qrcode'
import { buildTotpUri } from '@/lib/mfa'

export async function buildMfaSetupPayload(email: string, secret: string) {
  const otpauthUrl = buildTotpUri(email, secret)
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl, {
    width: 200,
    margin: 1,
    errorCorrectionLevel: 'M',
  })
  return { secret, otpauthUrl, qrDataUrl }
}
