import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'

export async function auth() {
  const session = await getServerSession(authOptions)
  return session
} 