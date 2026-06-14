import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { verifyTotp } from '@/lib/mfa'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Parolă", type: "password" },
        totpCode: { label: "Cod MFA", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Date de autentificare invalide')
        }

        try {
          const prisma = db.getPrismaClient();
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          })

          if (!user) {
            throw new Error('Utilizator negăsit')
          }

          if (!user.isActive || user.isDisabled) {
            throw new Error('Cont dezactivat')
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            throw new Error('Parolă incorectă')
          }

          if (user.twoFactorEnabled && user.twoFactorSecret) {
            const totpCode = credentials.totpCode?.trim()
            if (!totpCode) {
              throw new Error('MFA_REQUIRED')
            }
            if (!verifyTotp(user.twoFactorSecret, totpCode)) {
              throw new Error('MFA_INVALID')
            }
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
            organizationId: user.organizationId,
            twoFactorEnabled: user.twoFactorEnabled,
          }
        } catch (error) {
          console.error('Auth error:', error);

          // Handle specific database errors
          if (error instanceof Error) {
            if (error.message.includes('prepared statement') ||
              error.message.includes('already exists') ||
              error.message.includes('42P05')) {
              throw new Error('Problemă de conexiune la baza de date. Încercați din nou.');
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