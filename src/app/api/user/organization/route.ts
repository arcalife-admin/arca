import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth-config'

export const dynamic = 'force-dynamic'

async function geocodeAddress(address: string) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        address
      )}&addressdetails=1&limit=1`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'Dentiva/1.0',
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to geocode address')
    }

    const data = await response.json()

    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon)
      }
    }

    return null
  } catch (error) {
    console.error('Error geocoding address:', error)
    return null
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organization: true
      }
    })

    if (!user?.organization) {
      return NextResponse.json({ error: 'User not associated with an organization' }, { status: 404 })
    }

    let { latitude, longitude } = user.organization

    // If coordinates are missing or invalid (0,0), try to geocode the address
    if (!latitude || !longitude || (latitude === 0 && longitude === 0)) {
      const geocoded = await geocodeAddress(user.organization.address)

      if (geocoded) {
        // Update the organization with the geocoded coordinates
        await prisma.organization.update({
          where: { id: user.organization.id },
          data: {
            latitude: geocoded.lat,
            longitude: geocoded.lon
          }
        })

        latitude = geocoded.lat
        longitude = geocoded.lon

      }
    }

    return NextResponse.json({
      id: user.organization.id,
      name: user.organization.name,
      address: user.organization.address,
      latitude: latitude,
      longitude: longitude,
      phone: user.organization.phone,
      email: user.organization.email,
      logoUrl: user.organization.logoUrl
    })
  } catch (error) {
    console.error('Error fetching organization:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 