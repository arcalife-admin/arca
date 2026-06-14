import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth-config'
import { UserRole } from '@prisma/client'

export type AuthSession = {
  user: {
    id: string
    role: UserRole
    organizationId: string
    email?: string | null
    firstName?: string | null
    lastName?: string | null
  }
}

export function isPublicRegistrationEnabled(): boolean {
  if (process.env.ALLOW_PUBLIC_REGISTRATION === 'true') return true
  if (process.env.ALLOW_PUBLIC_REGISTRATION === 'false') return false
  return process.env.NODE_ENV !== 'production'
}

export async function requireAuth(): Promise<AuthSession | NextResponse> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || !session.user.organizationId) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  return session as AuthSession
}

export function isAuthError(result: AuthSession | NextResponse): result is NextResponse {
  return result instanceof NextResponse
}

export function hasManagerPermissions(role: string): boolean {
  return role === 'ORGANIZATION_OWNER' || role === 'MANAGER'
}

export async function requireManager(): Promise<AuthSession | NextResponse> {
  const result = await requireAuth()
  if (isAuthError(result)) return result

  if (!hasManagerPermissions(result.user.role)) {
    return NextResponse.json({ error: 'Permisiuni insuficiente' }, { status: 403 })
  }

  return result
}
