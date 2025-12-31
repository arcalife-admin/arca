import { NextResponse } from 'next/server'

// Haversine formula to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in kilometers
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
  const { searchParams } = new URL(request.url)
  const fromLat = searchParams.get('fromLat')
  const fromLon = searchParams.get('fromLon')
  const toLat = searchParams.get('toLat')
  const toLon = searchParams.get('toLon')

  if (!fromLat || !fromLon || !toLat || !toLon) {
    return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 })
  }

  // Validate coordinates
  const fromLatNum = parseFloat(fromLat)
  const fromLonNum = parseFloat(fromLon)
  const toLatNum = parseFloat(toLat)
  const toLonNum = parseFloat(toLon)

  if (isNaN(fromLatNum) || isNaN(fromLonNum) || isNaN(toLatNum) || isNaN(toLonNum)) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
  }

  if (fromLatNum < -90 || fromLatNum > 90 || toLatNum < -90 || toLatNum > 90) {
    return NextResponse.json({ error: 'Invalid latitude (must be between -90 and 90)' }, { status: 400 })
  }

  if (fromLonNum < -180 || fromLonNum > 180 || toLonNum < -180 || toLonNum > 180) {
    return NextResponse.json({ error: 'Invalid longitude (must be between -180 and 180)' }, { status: 400 })
  }

  // Check if coordinates are (0,0) which indicates missing data
  if (toLatNum === 0 && toLonNum === 0) {
    return NextResponse.json({
      error: 'Clinic coordinates not set. Please update the organization address in the database.'
    }, { status: 400 })
  }

  try {
    // Calculate distance and travel times
    const distanceKm = calculateDistance(fromLatNum, fromLonNum, toLatNum, toLonNum)

    // Realistic city travel times
    const drivingTimeMinutes = Math.round(distanceKm * 2.5) // ~24 km/h average in city traffic
    const cyclingTimeMinutes = Math.round(distanceKm * 6) // ~10 km/h average in city

    return NextResponse.json({
      driving: {
        duration: drivingTimeMinutes,
        distance: Math.round(distanceKm * 1000) // Convert to meters
      },
      cycling: {
        duration: cyclingTimeMinutes,
        distance: Math.round(distanceKm * 1000) // Convert to meters
      }
    })
  } catch (error) {
    console.error('Error calculating travel time:', error)
    return NextResponse.json(
      { error: 'Failed to calculate travel time' },
      { status: 500 }
    )
  }
} 