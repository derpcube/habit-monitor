import { NextRequest } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from './auth'
import { prisma } from './prisma'

// Types for security utilities
export interface SecurityContext {
  userId?: string
  ipAddress?: string
  userAgent?: string
  timestamp: Date
}

export interface AuditLogData {
  action: string
  details?: any
  severity?: 'low' | 'medium' | 'high' | 'critical'
}

export interface SecurityIncidentData {
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  userId?: string
}

// Get security context from request
export function getSecurityContext(request: NextRequest): Omit<SecurityContext, 'userId'> {
  return {
    ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    timestamp: new Date(),
  }
}

// Log user actions for audit trail
export async function logUserAction(
  userId: string,
  context: Omit<SecurityContext, 'userId'>,
  data: AuditLogData
) {
  try {
    await prisma.userAuditLog.create({
      data: {
        userId,
        action: data.action,
        details: data.details,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        timestamp: context.timestamp,
      }
    })
  } catch (error) {
    console.error('Failed to log user action:', error)
  }
}

// Log security incidents
export async function logSecurityIncident(
  context: Omit<SecurityContext, 'userId'>,
  data: SecurityIncidentData
) {
  try {
    await prisma.securityIncident.create({
      data: {
        type: data.type,
        severity: data.severity,
        description: data.description,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        userId: data.userId,
        createdAt: context.timestamp,
      }
    })
    
    // Log critical incidents to console for immediate attention
    if (data.severity === 'critical') {
      console.error('CRITICAL SECURITY INCIDENT:', {
        type: data.type,
        description: data.description,
        ip: context.ipAddress,
        userId: data.userId,
        timestamp: context.timestamp,
      })
    }
  } catch (error) {
    console.error('Failed to log security incident:', error)
  }
}

// Validate and sanitize input data
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // Remove potential XSS vectors
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim()
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput)
  }
  
  if (input && typeof input === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value)
    }
    return sanitized
  }
  
  return input
}

// Check if user is authorized to access resource
export async function checkUserAuthorization(
  request: NextRequest,
  resourceUserId?: string
): Promise<{ authorized: boolean; userId?: string; reason?: string }> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return { authorized: false, reason: 'Not authenticated' }
    }
    
    // Check if user account is in good standing
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        accountStatus: true,
        lockedUntil: true,
      }
    })
    
    if (!user) {
      return { authorized: false, reason: 'User not found' }
    }
    
    if (user.accountStatus !== 'active') {
      return { authorized: false, reason: 'Account not active' }
    }
    
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      return { authorized: false, reason: 'Account temporarily locked' }
    }
    
    // Check resource-specific authorization
    if (resourceUserId && user.id !== resourceUserId) {
      return { authorized: false, reason: 'Insufficient permissions' }
    }
    
    return { authorized: true, userId: user.id }
  } catch (error) {
    console.error('Authorization check failed:', error)
    return { authorized: false, reason: 'Authorization check failed' }
  }
}

// Detect suspicious activity patterns
export function detectSuspiciousActivity(context: SecurityContext, data: any): {
  suspicious: boolean
  reasons: string[]
} {
  const reasons: string[] = []
  
  // Check for rapid requests (this would be better implemented with Redis)
  // For now, just basic checks
  
  // Check for unusual user agents
  if (context.userAgent) {
    const suspiciousAgents = [
      'curl',
      'wget',
      'python',
      'bot',
      'crawler',
      'scraper',
    ]
    
    if (suspiciousAgents.some(agent => 
      context.userAgent!.toLowerCase().includes(agent)
    )) {
      reasons.push('Suspicious user agent detected')
    }
  }
  
  // Check for common SQL injection patterns in data
  if (typeof data === 'string') {
    const sqlPatterns = [
      /union\s+select/i,
      /drop\s+table/i,
      /delete\s+from/i,
      /insert\s+into/i,
      /update\s+.*set/i,
      /--/,
      /\/\*/,
    ]
    
    if (sqlPatterns.some(pattern => pattern.test(data))) {
      reasons.push('Potential SQL injection attempt')
    }
  }
  
  // Check for XSS patterns
  if (typeof data === 'string') {
    const xssPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
    ]
    
    if (xssPatterns.some(pattern => pattern.test(data))) {
      reasons.push('Potential XSS attempt')
    }
  }
  
  return {
    suspicious: reasons.length > 0,
    reasons,
  }
}

// Generate secure backup codes for 2FA
export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = []
  
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = Math.random().toString(36).substring(2, 10).toUpperCase()
    codes.push(code)
  }
  
  return codes
}

// Validate password strength
export function validatePasswordStrength(password: string): {
  valid: boolean
  score: number
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0
  
  // Length check
  if (password.length >= 8) score += 1
  else feedback.push('Password should be at least 8 characters')
  
  if (password.length >= 12) score += 1
  
  // Character variety checks
  if (/[a-z]/.test(password)) score += 1
  else feedback.push('Add lowercase letters')
  
  if (/[A-Z]/.test(password)) score += 1
  else feedback.push('Add uppercase letters')
  
  if (/\d/.test(password)) score += 1
  else feedback.push('Add numbers')
  
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password)) score += 1
  else feedback.push('Add special characters')
  
  // Common patterns to avoid
  const commonPatterns = [
    /123456/,
    /password/i,
    /qwerty/i,
    /admin/i,
    /user/i,
  ]
  
  if (commonPatterns.some(pattern => pattern.test(password))) {
    score -= 2
    feedback.push('Avoid common patterns')
  }
  
  return {
    valid: score >= 4 && feedback.length === 0,
    score: Math.max(0, Math.min(10, score)),
    feedback,
  }
}

// Rate limiting helper
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  key: string, 
  maxRequests: number, 
  windowMs: number
): { allowed: boolean; resetTime?: number } {
  const now = Date.now()
  const record = rateLimitStore.get(key)
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return { allowed: true }
  }
  
  if (record.count >= maxRequests) {
    return { allowed: false, resetTime: record.resetTime }
  }
  
  record.count++
  return { allowed: true }
} 