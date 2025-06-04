import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { prisma } from "./prisma"

// Track failed login attempts (in production, use Redis)
const loginAttempts = new Map<string, { count: number; lockedUntil?: number }>()

const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes

function checkLoginAttempts(email: string): { allowed: boolean; remainingAttempts?: number } {
  const attempts = loginAttempts.get(email)
  
  if (!attempts) {
    return { allowed: true }
  }
  
  if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
    return { allowed: false }
  }
  
  if (attempts.lockedUntil && Date.now() >= attempts.lockedUntil) {
    // Reset after lockout period
    loginAttempts.delete(email)
    return { allowed: true }
  }
  
  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    attempts.lockedUntil = Date.now() + LOCKOUT_DURATION
    return { allowed: false }
  }
  
  return { 
    allowed: true, 
    remainingAttempts: MAX_LOGIN_ATTEMPTS - attempts.count 
  }
}

function recordFailedAttempt(email: string) {
  const attempts = loginAttempts.get(email) || { count: 0 }
  attempts.count++
  
  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    attempts.lockedUntil = Date.now() + LOCKOUT_DURATION
  }
  
  loginAttempts.set(email, attempts)
}

function clearLoginAttempts(email: string) {
  loginAttempts.delete(email)
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours (instead of 30 days default)
    updateAge: 2 * 60 * 60, // 2 hours
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Check login attempts
        const attemptCheck = checkLoginAttempts(credentials.email)
        if (!attemptCheck.allowed) {
          throw new Error("Account temporarily locked due to too many failed attempts")
        }

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
            select: {
              id: true,
              email: true,
              name: true,
              password: true,
              emailVerified: true,
              createdAt: true,
            }
          })

          if (!user || !user.password) {
            recordFailedAttempt(credentials.email)
            return null
          }

          const isPasswordValid = await compare(credentials.password, user.password)

          if (!isPasswordValid) {
            recordFailedAttempt(credentials.email)
            return null
          }

          // Clear failed attempts on successful login
          clearLoginAttempts(credentials.email)

          // Update last login
          await prisma.user.update({
            where: { id: user.id },
            data: { updatedAt: new Date() }
          })

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            emailVerified: user.emailVerified,
          }
        } catch (error) {
          console.error("Authentication error:", error)
          recordFailedAttempt(credentials.email)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Additional sign-in security checks
      if (account?.provider === "credentials") {
        // Check if user account is in good standing
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id }
        })
        
        if (!dbUser) {
          return false
        }
        
        // You could add additional checks here like:
        // - Account suspension status
        // - Email verification requirement
        // - Terms of service acceptance
      }
      
      return true
    },
    async session({ session, token }) {
      if (token?.sub) {
        // Add additional user data to session
        const user = await prisma.user.findUnique({
          where: { id: token.sub },
          select: {
            id: true,
            name: true,
            email: true,
            emailVerified: true,
            createdAt: true,
          }
        })
        
        if (user) {
          session.user = {
            ...session.user,
            id: user.id,
            emailVerified: user.emailVerified,
            memberSince: user.createdAt,
          }
        }
      }
      return session
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.sub = user.id
        token.emailVerified = user.emailVerified
      }
      
      // Refresh user data on token refresh
      if (trigger === "update" && token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: {
            id: true,
            name: true,
            email: true,
            emailVerified: true,
          }
        })
        
        if (dbUser) {
          token.name = dbUser.name
          token.email = dbUser.email
          token.emailVerified = dbUser.emailVerified
        }
      }
      
      return token
    },
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      // Log successful sign-ins for security monitoring
      console.log(`User ${user.email} signed in via ${account?.provider}`)
      
      if (isNewUser) {
        console.log(`New user registered: ${user.email}`)
      }
    },
    async signOut({ token }) {
      // Log sign-outs
      console.log(`User signed out: ${token?.email}`)
    },
  },
  debug: process.env.NODE_ENV === "development",
} 