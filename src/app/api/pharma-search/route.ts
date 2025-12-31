import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q')
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY
  const GOOGLE_CX = process.env.GOOGLE_CX

  if (!GOOGLE_API_KEY || !GOOGLE_CX) {
    return new Response(JSON.stringify({ error: 'Missing API credentials' }), {
      status: 500,
    })
  }

  if (!query) {
    return new Response(JSON.stringify({ error: 'Missing query parameter' }), {
      status: 400,
    })
  }

  const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(
    query
  )}&key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}`

  try {
    const res = await fetch(url)
    const data = await res.json()

    const results = data.items?.map((item: any) => ({
      title: item.title,
      snippet: item.snippet,
      link: item.link,
    })) || []

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: 'Search failed' }), {
      status: 500,
    })
  }
}
