import { PrismaClient } from '@prisma/client';

async function testConnection() {
  console.log('🔍 Testing database connection...\n');
  
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set in environment variables');
    process.exit(1);
  }

  // Mask password in connection string for logging
  const maskedUrl = process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@');
  console.log('📋 Connection string:', maskedUrl);
  console.log('');

  // Parse connection string to check format
  try {
    const url = new URL(process.env.DATABASE_URL);
    console.log('✅ Connection string format is valid');
    console.log('   Protocol:', url.protocol);
    console.log('   Host:', url.hostname);
    console.log('   Port:', url.port);
    console.log('   Database:', url.pathname.substring(1));
    console.log('   Username:', url.username);
    console.log('');
  } catch (error) {
    console.error('❌ Invalid connection string format:', error.message);
    process.exit(1);
  }

  // Test Prisma connection
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });

  try {
    console.log('🔄 Attempting to connect to database...');
    
    // Try a simple query
    const result = await prisma.$queryRaw`SELECT version() as version`;
    console.log('✅ Successfully connected to database!');
    console.log('   Database version:', result[0]?.version || 'Unknown');
    console.log('');

    // Try to query a table to verify schema
    try {
      const userCount = await prisma.user.count();
      console.log(`✅ Schema is accessible (found ${userCount} users)`);
    } catch (schemaError) {
      console.warn('⚠️  Could not query User table:', schemaError.message);
      console.log('   This might mean migrations haven\'t been run yet');
    }

  } catch (error) {
    console.error('❌ Failed to connect to database');
    console.error('');
    console.error('Error details:');
    console.error('   Message:', error.message);
    console.error('   Code:', error.code);
    console.error('');
    
    // Provide specific guidance based on error
    if (error.message.includes('Tenant or user not found')) {
      console.error('💡 This error typically means:');
      console.error('   1. The database credentials are incorrect');
      console.error('   2. The project reference in the connection string is wrong');
      console.error('   3. The database name should match your Supabase project reference');
      console.error('');
      console.error('   For Supabase connection pooler (port 6543):');
      console.error('   - Database name should be your project reference (e.g., brojrqpiqnoorwnehntj)');
      console.error('   - Not "postgres"');
      console.error('');
      console.error('   Try using the direct connection string (port 5432) instead:');
      console.error('   postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-[REGION].pooler.supabase.com:5432/postgres');
    } else if (error.message.includes('SSL') || error.message.includes('ssl')) {
      console.error('💡 SSL connection issue detected');
      console.error('   Try adding ?sslmode=require to your connection string');
    } else if (error.message.includes('password') || error.message.includes('authentication')) {
      console.error('💡 Authentication failed');
      console.error('   Check your password in the Supabase dashboard');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection().catch(console.error);

