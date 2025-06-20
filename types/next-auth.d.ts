import { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      emailVerified?: Date | null
      memberSince?: Date
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    id: string
    emailVerified?: Date | null
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    sub: string
    emailVerified?: Date | null
  }
} 