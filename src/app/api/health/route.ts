import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkEnvironment } from '@/lib/env-check';

export async function GET(request: NextRequest) {
  try {
    // Check environment
    const envCheck = checkEnvironment();

    // Check database health
    const dbHealth = await db.healthCheck();

    const healthStatus = {
      status: dbHealth.status === 'healthy' ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      environment: envCheck,
      database: dbHealth,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };

    const statusCode = dbHealth.status === 'healthy' ? 200 : 503;

    return NextResponse.json(healthStatus, { status: statusCode });
  } catch (error) {
    console.error('❌ Health check failed:', error);

    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: checkEnvironment(),
    }, { status: 500 });
  }
} 