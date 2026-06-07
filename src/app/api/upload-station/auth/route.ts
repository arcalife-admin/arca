import { NextRequest, NextResponse } from 'next/server';
import {
  createUploadStationToken,
  uploadStationCookieOptions,
  UPLOAD_STATION_COOKIE,
  validateUploadStationPin,
} from '@/lib/upload-station-auth';

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json();

    if (!pin || typeof pin !== 'string') {
      return NextResponse.json({ error: 'PIN-ul este obligatoriu' }, { status: 400 });
    }

    if (!process.env.UPLOAD_STATION_PIN) {
      return NextResponse.json({ error: 'Stația de încărcare nu este configurată' }, { status: 503 });
    }

    if (!validateUploadStationPin(pin)) {
      return NextResponse.json({ error: 'PIN invalid' }, { status: 401 });
    }

    const token = createUploadStationToken();
    const response = NextResponse.json({ success: true });
    response.cookies.set(UPLOAD_STATION_COOKIE, token, uploadStationCookieOptions);
    return response;
  } catch (error) {
    console.error('Upload station auth error:', error);
    return NextResponse.json({ error: 'Autentificarea a eșuat' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(UPLOAD_STATION_COOKIE, '', { ...uploadStationCookieOptions, maxAge: 0 });
  return response;
}
