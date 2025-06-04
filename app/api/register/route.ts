import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Enhanced password validation
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(/^(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
  .regex(/^(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
  .regex(/^(?=.*\d)/, 'Password must contain at least one number')
  .regex(/^(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?])/, 'Password must contain at least one special character')

const registerSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  email: z.string()
    .email('Invalid email address')
    .max(254, 'Email must be less than 254 characters')
    .toLowerCase(),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

// Track registration attempts to prevent spam
const registrationAttempts = new Map<string, { count: number; lastAttempt: number }>()
const MAX_REGISTRATION_ATTEMPTS = 3
const REGISTRATION_COOLDOWN = 60 * 60 * 1000 // 1 hour

function checkRegistrationAttempts(ip: string): boolean {
  const attempts = registrationAttempts.get(ip)
  const now = Date.now()
  
  if (!attempts) {
    registrationAttempts.set(ip, { count: 1, lastAttempt: now })
    return true
  }
  
  // Reset if cooldown period has passed
  if (now - attempts.lastAttempt > REGISTRATION_COOLDOWN) {
    registrationAttempts.set(ip, { count: 1, lastAttempt: now })
    return true
  }
  
  if (attempts.count >= MAX_REGISTRATION_ATTEMPTS) {
    return false
  }
  
  attempts.count++
  attempts.lastAttempt = now
  return true
}

// Simple email domain validation (you can expand this list)
const allowedEmailDomains = process.env.ALLOWED_EMAIL_DOMAINS?.split(',') || []
const blockedEmailDomains = [
  '10minutemail.com',
  'tempmail.org',
  'guerrillamail.com',
  'mailinator.com',
  // Add more disposable email domains as needed
]

function validateEmailDomain(email: string): { valid: boolean; reason?: string } {
  const domain = email.split('@')[1]?.toLowerCase()
  
  if (!domain) {
    return { valid: false, reason: 'Invalid email format' }
  }
  
  // Check if domain is blocked
  if (blockedEmailDomains.includes(domain)) {
    return { valid: false, reason: 'Disposable email addresses are not allowed' }
  }
  
  // Check if only specific domains are allowed (if configured)
  if (allowedEmailDomains.length > 0 && !allowedEmailDomains.includes(domain)) {
    return { valid: false, reason: 'Email domain not allowed' }
  }
  
  return { valid: true }
}

export async function POST(req: NextRequest) {
  try {
    // Get IP for rate limiting
    const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown'
    
    // Check registration attempts
    if (!checkRegistrationAttempts(ip)) {
      return NextResponse.json(
        { 
          error: 'Too many registration attempts', 
          message: 'Please wait before trying to register again' 
        },
        { status: 429 }
      )
    }

    const body = await req.json()
    
    // Validate input
    const validationResult = registerSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input', 
          details: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      )
    }

    const { name, email, password } = validationResult.data

    // Validate email domain
    const emailValidation = validateEmailDomain(email)
    if (!emailValidation.valid) {
      return NextResponse.json(
        { error: emailValidation.reason },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Hash password with higher cost for better security
    const hashedPassword = await hash(password, 14)

    // Create user with additional security fields
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      }
    })

    // Log successful registration for monitoring
    console.log(`New user registered: ${email} from IP: ${ip}`)

    return NextResponse.json(
      { 
        message: 'User created successfully', 
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    
    // Don't expose internal errors to client
    return NextResponse.json(
      { 
        error: 'Registration failed', 
        message: 'An error occurred during registration. Please try again.' 
      },
      { status: 500 }
    )
  }
} 