import { prisma } from './prisma';
import { checkEnvironment, validateDatabaseConfig } from './env-check';

// Server-side only database utilities
export const db = {
  // Ensure this is only used on the server
  getPrismaClient: () => {
    if (typeof window !== 'undefined') {
      throw new Error('Database operations cannot be performed in the browser');
    }

    // Validate environment configuration
    try {
      validateDatabaseConfig();
    } catch (error) {
      console.error('❌ Database configuration error:', error);
      throw error;
    }

    return prisma;
  },

  // Helper function to safely execute database operations with retry logic
  executeWithRetry: async <T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> => {
    if (typeof window !== 'undefined') {
      throw new Error('Database operations cannot be performed in the browser');
    }

    // Log environment check for debugging
    checkEnvironment();

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // For production, add a small delay to avoid connection conflicts
        if (process.env.NODE_ENV === 'production' && attempt > 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        return await operation();
      } catch (error: any) {
        lastError = error;

        // Check if it's a connection-related error
        const isConnectionError =
          error?.code === 'P1001' || // Prisma connection error
          error?.code === 'P1008' || // Prisma connection timeout
          error?.code === 'P1017' || // Prisma connection closed
          error?.message?.includes('connection') ||
          error?.message?.includes('timeout') ||
          error?.message?.includes('pool') ||
          error?.message?.includes('DATABASE_URL') ||
          error?.message?.includes('prepared statement') ||
          error?.message?.includes('already exists') ||
          error?.message?.includes('42P05'); // PostgreSQL prepared statement error

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
  },

  // Health check function
  healthCheck: async () => {
    try {
      const prisma = db.getPrismaClient();
      await prisma.$queryRaw`SELECT 1`;
      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
      console.error('❌ Database health check failed:', error);
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  },

  // Connection reset function for production issues
  resetConnection: async () => {
    try {
      const prisma = db.getPrismaClient();
      await prisma.$disconnect();
      // Reconnect will happen automatically on next operation
      return { status: 'reset', timestamp: new Date().toISOString() };
    } catch (error) {
      console.error('❌ Connection reset failed:', error);
      return {
        status: 'reset_failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }
};

export default db; 