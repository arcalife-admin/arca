export { dynamic } from '@/lib/api-config'

import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth-config'
import { isPublicRegistrationEnabled } from '@/lib/require-auth'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  const isAuthenticated = !!(session?.user?.id && session.user.organizationId)

  if (!isAuthenticated && !isPublicRegistrationEnabled()) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  if (!isAuthenticated) {
    const ip = getClientIp(request.headers)
    const rateLimit = checkRateLimit(`geocode:${ip}`, 30, 15 * 60 * 1000)
    if (!rateLimit.ok) {
      return NextResponse.json(
        { error: 'Prea multe cereri. Încercați din nou mai târziu.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfterSeconds ?? 60),
          },
        }
      )
    }
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ error: 'Parametrul query este obligatoriu' }, { status: 400 })
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&addressdetails=1&limit=5`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'Dentiva/1.0',
        },
      }
    )

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching from Nominatim:', error)
    return NextResponse.json(
      { error: 'Încărcarea datelor adresei a eșuat' },
      { status: 500 }
    )
  }
} 