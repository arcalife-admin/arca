export { dynamic } from '@/lib/api-config'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_request: NextRequest) {
  try {
    const dbHealth = await db.healthCheck()
    const statusCode = dbHealth.status === 'healthy' ? 200 : 503

    return NextResponse.json({ status: dbHealth.status === 'healthy' ? 'ok' : 'error' }, { status: statusCode })
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json({ status: 'error' }, { status: 503 })
  }
}
