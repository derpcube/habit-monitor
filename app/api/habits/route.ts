import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const habitSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  color: z.string().default('#3B82F6'),
  category: z.string().default('General'),
  frequency: z.enum(['daily', 'weekly', 'custom_days', 'monthly']).default('daily'),
  target: z.number().min(1).default(1),
  days: z.string().optional(), // JSON string of selected days
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const habits = await prisma.habit.findMany({
      where: { userId: (session.user as any).id },
      include: {
        entries: {
          orderBy: { date: 'desc' },
          take: 30, // Last 30 entries for each habit
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(habits)
  } catch (error) {
    console.error('Error fetching habits:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const data = habitSchema.parse(body)

    const habit = await prisma.habit.create({
      data: {
        ...data,
        userId: (session.user as any).id,
      },
    })

    return NextResponse.json(habit, { status: 201 })
  } catch (error) {
    console.error('Error creating habit:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 