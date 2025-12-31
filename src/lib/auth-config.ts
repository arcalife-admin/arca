import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { UserRole } from '@prisma/client'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials')
        }

        try {
          const prisma = db.getPrismaClient();
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          })

          if (!user) {
            throw new Error('User not found')
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            throw new Error('Invalid password')
          }

          // Update last login timestamp
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
          })

          return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            organizationId: user.organizationId
          }
        } catch (error) {
          console.error('Auth error:', error);

          // Handle specific database errors
          if (error instanceof Error) {
            if (error.message.includes('prepared statement') ||
              error.message.includes('already exists') ||
              error.message.includes('42P05')) {
              throw new Error('Database connection issue. Please try again.');
            }
          }

          throw error;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Make sure to explicitly cast user to include potentially unknown properties
        const typedUser = user as any;
        token.id = user.id;
        token.firstName = typedUser.firstName;
        token.lastName = typedUser.lastName;
        token.role = typedUser.role;
        token.organizationId = typedUser.organizationId;
      }
      return token;
    },
    async session({ session, token }: { session: any, token: any }) {
      if (session?.user) {
        session.user.id = token.id;

        // If firstName/lastName are missing in token but we have the user ID,
        // fetch them from the database
        if ((!token.firstName || !token.lastName) && token.id) {
          try {
            const prisma = db.getPrismaClient();
            const dbUser = await prisma.user.findUnique({
              where: { id: token.id },
              select: { firstName: true, lastName: true }
            });

            if (dbUser) {
              session.user.firstName = dbUser.firstName;
              session.user.lastName = dbUser.lastName;

              // Also update token for future requests
              token.firstName = dbUser.firstName;
              token.lastName = dbUser.lastName;
            } else {
              session.user.firstName = token.firstName || null;
              session.user.lastName = token.lastName || null;
            }
          } catch (error) {
            console.error('Session callback error:', error);
            session.user.firstName = token.firstName || null;
            session.user.lastName = token.lastName || null;
          }
        } else {
          session.user.firstName = token.firstName || null;
          session.user.lastName = token.lastName || null;
        }

        session.user.role = token.role;
        session.user.organizationId = token.organizationId;
      }
      return session;
    }
  },
  events: {
    async signOut() {
      // Redirect to home sign-in screen after sign out
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
  }
} 