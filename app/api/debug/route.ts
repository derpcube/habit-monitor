import { NextResponse } from 'next/server'

export async function GET() {
  const envCheck = {
    hasDatabase: !!process.env.DATABASE_URL,
    hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    databaseType: process.env.DATABASE_URL?.split('://')[0] || 'none',
    nodeEnv: process.env.NODE_ENV,
  }

  return NextResponse.json(envCheck)
} 