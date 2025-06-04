import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { withAuth } from "next-auth/middleware"

// Rate limiting store (in production, use Redis or similar)
const rateLimit = new Map<string, { count: number; lastReset: number }>()

const RATE_LIMIT_MAX = 100 // requests per window
const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes

function getRateLimitKey(request: NextRequest): string {
  // Use IP address and user agent for more accurate rate limiting
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'
  return `${ip}-${userAgent.slice(0, 50)}`
}

function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const record = rateLimit.get(key)

  if (!record || now - record.lastReset > RATE_LIMIT_WINDOW) {
    rateLimit.set(key, { count: 1, lastReset: now })
    return true
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false
  }

  record.count++
  return true
}

export default withAuth(
  function middleware(request: NextRequest) {
    const response = NextResponse.next()

    // Security Headers
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';"
    )
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

    // Rate limiting for API routes
    if (request.nextUrl.pathname.startsWith('/api/')) {
      const rateLimitKey = getRateLimitKey(request)
      
      if (!checkRateLimit(rateLimitKey)) {
        return new NextResponse(
          JSON.stringify({ 
            error: 'Too many requests', 
            message: 'Please slow down and try again later' 
          }),
          { 
            status: 429, 
            headers: { 
              'Content-Type': 'application/json',
              'Retry-After': '900' // 15 minutes
            } 
          }
        )
      }
    }

    // CSRF protection for state-changing methods
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      const origin = request.headers.get('origin')
      const host = request.headers.get('host')
      
      if (origin && host && !origin.includes(host)) {
        return new NextResponse(
          JSON.stringify({ error: 'CSRF protection: Invalid origin' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    return response
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to auth pages and API auth routes
        if (req.nextUrl.pathname.startsWith('/login') || 
            req.nextUrl.pathname.startsWith('/register') ||
            req.nextUrl.pathname.startsWith('/api/auth') ||
            req.nextUrl.pathname.startsWith('/api/register') ||
            req.nextUrl.pathname === '/') {
          return true
        }
        
        // Require authentication for all other routes
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
} 