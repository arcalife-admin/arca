// Environment check utility for debugging production issues
export function checkEnvironment() {
  const checks = {
    nodeEnv: process.env.NODE_ENV,
    databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
    nextAuthSecret: process.env.NEXTAUTH_SECRET ? 'Set' : 'Not set',
    nextAuthUrl: process.env.NEXTAUTH_URL ? 'Set' : 'Not set',
    isServer: typeof window === 'undefined',
    isClient: typeof window !== 'undefined',
  };

  console.log('🔍 Environment Check:', checks);
  return checks;
}

export function validateDatabaseConfig() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // Check if it's a valid PostgreSQL URL (both postgres:// and postgresql:// are valid)
  if (!process.env.DATABASE_URL.startsWith('postgres://') && !process.env.DATABASE_URL.startsWith('postgresql://')) {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection string (postgres:// or postgresql://)');
  }

  return true;
} 