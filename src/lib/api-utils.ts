// Helper function to retry API calls with exponential backoff
export const retryApiCall = async (apiCall: () => Promise<any>, maxRetries = 3) => {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error: any) {
      lastError = error;

      // Check if it's a network or server error that might be retryable
      const isRetryableError =
        error?.status >= 500 || // Server errors
        error?.status === 429 || // Rate limiting
        error?.message?.includes('network') ||
        error?.message?.includes('timeout') ||
        error?.message?.includes('connection') ||
        error?.message?.includes('fetch');

      if (isRetryableError && attempt < maxRetries) {
        console.warn(`API call attempt ${attempt} failed, retrying...`, error.message);
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      }

      // If it's not a retryable error or we've exhausted retries, throw the error
      throw error;
    }
  }

  throw lastError;
};

// Helper function to safely execute database operations with retry logic
export const executeWithRetry = async <T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> => {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
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
        error?.message?.includes('pool');

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
};

// Helper function to validate session and get user data
export const validateSession = async (getServerSession: any, authOptions: any) => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error('Unauthorized - No valid session');
  }

  // Ensure we have the required user data
  if (!session.user.organizationId) {
    throw new Error('Unauthorized - Missing organization ID');
  }

  return session;
}; 