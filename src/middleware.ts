import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

const defaultLocale = 'ro'
const locales = ['ro']

const RATE_LIMITED_PATHS = [
  '/api/auth/register',
  '/api/upload-station/auth',
  '/api/auth/signin',
  '/api/auth/callback/credentials',
]

function isPublicRegistrationEnabled(): boolean {
  if (process.env.ALLOW_PUBLIC_REGISTRATION === 'true') return true
  if (process.env.ALLOW_PUBLIC_REGISTRATION === 'false') return false
  return process.env.NODE_ENV !== 'production'
}

function getLocaleFromPath(pathname: string): string {
  const segment = pathname.split('/')[1]
  return locales.includes(segment) ? segment : defaultLocale
}

function applyRateLimit(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl
  const shouldRateLimit = RATE_LIMITED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )

  if (!shouldRateLimit || request.method === 'GET') {
    return null
  }

  const ip = getClientIp(request.headers)
  const key = `${ip}:${pathname}`
  const result = checkRateLimit(key, 20, 15 * 60 * 1000)

  if (!result.ok) {
    return NextResponse.json(
      { error: 'Prea multe cereri. Încercați din nou mai târziu.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(result.retryAfterSeconds ?? 60),
        },
      }
    )
  }

  return null
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const rateLimitResponse = applyRateLimit(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  // API routes only need rate limiting — skip locale and auth page logic.
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  const normalizedPath = pathnameHasLocale
    ? pathname
    : `/${defaultLocale}${pathname === '/' ? '' : pathname}`

  const locale = getLocaleFromPath(normalizedPath)
  const isDashboard = normalizedPath.includes('/dashboard')
  const isRegisterPage = /\/register$/.test(normalizedPath)

  if (isDashboard || (isRegisterPage && !isPublicRegistrationEnabled())) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      // NEXTAUTH_URL=http://localhost on Vercel makes auto-detection pick the
      // dev cookie name; production cookies use the __Secure- prefix instead.
      secureCookie: process.env.NODE_ENV === 'production',
    })

    if (isDashboard && !token) {
      const loginUrl = new URL(`/${locale}/login`, request.url)
      loginUrl.searchParams.set('callbackUrl', request.url)
      return NextResponse.redirect(loginUrl)
    }

    if (isRegisterPage && !isPublicRegistrationEnabled()) {
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
    }
  }

  if (!pathnameHasLocale) {
    request.nextUrl.pathname = `/${defaultLocale}${pathname}`
    return NextResponse.rewrite(request.nextUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next|_vercel|.*\\..*).*)',
  ],
}
