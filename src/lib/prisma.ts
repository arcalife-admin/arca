import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create Prisma client with production-optimized configuration
const createPrismaClient = () => {
  // Ensure we're on the server side
  if (typeof window !== 'undefined') {
    throw new Error('PrismaClient cannot be used in the browser');
  }

  // Validate DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // Handle Supabase connection pooler - disable prepared statements
  let databaseUrl = process.env.DATABASE_URL;
  
  // If using Supabase pooler (port 6543), add pgbouncer parameter to disable prepared statements
  if (databaseUrl.includes(':6543/') && !databaseUrl.includes('pgbouncer=true')) {
    databaseUrl += (databaseUrl.includes('?') ? '&' : '?') + 'pgbouncer=true';
  }

  // Log connection info in development (masked)
  if (process.env.NODE_ENV === 'development') {
    const maskedUrl = databaseUrl.replace(/:([^:@]+)@/, ':****@');
    console.log('🔌 Prisma Client initialized with:', maskedUrl);
  }

  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

  // Add middleware for connection error handling with prepared statement support
  client.$use(async (params, next) => {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // For production, add a small delay to avoid connection conflicts
        if (process.env.NODE_ENV === 'production' && attempt > 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        return await next(params);
      } catch (error: any) {
        lastError = error;

        // Check if it's a connection-related error or prepared statement error
        const isConnectionError =
          error?.code === 'P1001' || // Prisma connection error
          error?.code === 'P1008' || // Prisma connection timeout
          error?.code === 'P1017' || // Prisma connection closed
          error?.message?.includes('connection') ||
          error?.message?.includes('timeout') ||
          error?.message?.includes('pool') ||
          error?.message?.includes('prepared statement') ||
          error?.message?.includes('already exists') ||
          error?.message?.includes('42P05') || // PostgreSQL prepared statement error code
          error?.message?.includes('26000') || // PostgreSQL error: prepared statement does not exist
          error?.message?.includes('Tenant or user not found') || // Supabase specific error
          error?.message?.includes('FATAL'); // PostgreSQL fatal errors

        if (isConnectionError && attempt < maxRetries) {
          console.warn(`Database operation attempt ${attempt} failed, retrying...`, error.message);
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }

        // If it's not a connection error or we've exhausted retries, throw the error
        throw error;
      }
    }

    throw lastError;
  });

  return client;
};

// Only create the client on the server side
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma; 