import { NextResponse } from 'next/server'

export async function GET(request: Request) {
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