export { dynamic } from '@/lib/api-config'

import { NextResponse } from 'next/server'
import { requireAuth, isAuthError } from '@/lib/require-auth'

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export async function GET(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 404 })
  }

  const auth = await requireAuth()
  if (isAuthError(auth)) return auth

  const { searchParams } = new URL(request.url)
  const fromLat = searchParams.get('fromLat')
  const fromLon = searchParams.get('fromLon')
  const toLat = searchParams.get('toLat')
  const toLon = searchParams.get('toLon')

  if (!fromLat || !fromLon || !toLat || !toLon) {
    return NextResponse.json({ error: 'Coordonatele lipsesc' }, { status: 400 })
  }

  const fromLatNum = parseFloat(fromLat)
  const fromLonNum = parseFloat(fromLon)
  const toLatNum = parseFloat(toLat)
  const toLonNum = parseFloat(toLon)

  const distanceKm = calculateDistance(fromLatNum, fromLonNum, toLatNum, toLonNum)

  const drivingTimeMinutes = Math.round(distanceKm * 2.5)
  const cyclingTimeMinutes = Math.round(distanceKm * 6)

  return NextResponse.json({
    coordinates: {
      from: { lat: fromLatNum, lon: fromLonNum },
      to: { lat: toLatNum, lon: toLonNum }
    },
    distance: {
      kilometers: distanceKm,
      meters: Math.round(distanceKm * 1000)
    },
    travelTimes: {
      driving: {
        duration: drivingTimeMinutes,
        averageSpeed: '24 km/h'
      },
      cycling: {
        duration: cyclingTimeMinutes,
        averageSpeed: '10 km/h'
      }
    }
  })
}
