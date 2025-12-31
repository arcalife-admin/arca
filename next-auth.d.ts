import NextAuth from "next-auth"

declare module "next-auth" {
  interface User {
    organizationId?: string
    firstName?: string
    lastName?: string
  }
  interface Session {
    user: {
      id: string
      firstName?: string | null
      lastName?: string | null
      name?: string | null
      email?: string | null
      image?: string | null
      role?: string
      organizationId?: string
    }
  }
} 