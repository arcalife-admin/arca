import { cookies } from 'next/headers';
import crypto from 'crypto';

export const UPLOAD_STATION_COOKIE = 'upload-station-session';
const SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000; // 12 hours

function getSecret() {
  return process.env.UPLOAD_STATION_SECRET || process.env.NEXTAUTH_SECRET || 'upload-station-dev-secret';
}

export function createUploadStationToken(): string {
  const payload = Date.now().toString();
  const sig = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

export function verifyUploadStationToken(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;

  const expected = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
  if (sig.length !== expected.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;

  const issuedAt = Number.parseInt(payload, 10);
  if (!Number.isFinite(issuedAt)) return false;

  return Date.now() - issuedAt < SESSION_MAX_AGE_MS;
}

export async function isUploadStationAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(UPLOAD_STATION_COOKIE)?.value;
  return verifyUploadStationToken(token);
}

export function validateUploadStationPin(pin: string): boolean {
  const expected = process.env.UPLOAD_STATION_PIN;
  if (!expected || !pin) return false;
  return pin === expected;
}

export const uploadStationCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_MAX_AGE_MS / 1000,
};
