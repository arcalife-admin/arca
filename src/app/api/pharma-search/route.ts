export { dynamic } from '@/lib/api-config'

import { NextRequest } from 'next/server'
import { requireAuth, isAuthError } from '@/lib/require-auth'

const OFFICIAL_SOURCE_SITES = ['anm.ro', 'ema.europa.eu', 'pubmed.ncbi.nlm.nih.gov']

export async function GET(req: NextRequest) {
  const auth = await requireAuth()
  if (isAuthError(auth)) return auth

  const query = req.nextUrl.searchParams.get('q')
  const officialOnly = req.nextUrl.searchParams.get('official') === '1'
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY
  const GOOGLE_CX = process.env.GOOGLE_CX

  if (!GOOGLE_API_KEY || !GOOGLE_CX) {
    return new Response(JSON.stringify({ error: 'Lipsesc credențialele API' }), {
      status: 500,
    })
  }

  if (!query) {
    return new Response(JSON.stringify({ error: 'Lipsește parametrul query' }), {
      status: 400,
    })
  }

  const searchQuery = officialOnly
    ? `${query} medicament prospect site:anm.ro OR site:ema.europa.eu`
    : query

  const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(
    searchQuery
  )}&key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}`

  try {
    const res = await fetch(url)
    const data = await res.json()

    const results = (data.items ?? []).map((item: { title: string; snippet: string; link: string }) => ({
      title: item.title,
      snippet: item.snippet,
      link: item.link,
      isOfficial: OFFICIAL_SOURCE_SITES.some((site) => item.link.includes(site)),
    }))

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: 'Căutarea a eșuat' }), {
      status: 500,
    })
  }
}
