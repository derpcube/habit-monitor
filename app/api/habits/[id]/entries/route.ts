import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const entrySchema = z.object({
  date: z.string().optional(),
  completed: z.boolean().default(true),
  value: z.number().min(1).default(1),
  notes: z.string().optional(),
  completedAt: z.string().optional(), // ISO datetime string
  timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'night']).optional(),
  mood: z.number().min(1).max(10).optional(),
  difficulty: z.number().min(1).max(10).optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const habitId = params.id
    const body = await req.json()
    const data = entrySchema.parse(body)

    // Verify habit belongs to user
    const habit = await prisma.habit.findFirst({
      where: { id: habitId, userId: (session.user as any).id },
    })

    if (!habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
    }

    const date = data.date ? new Date(data.date) : new Date()
    date.setHours(0, 0, 0, 0) // Reset time to start of day

    // Upsert entry (update if exists, create if not)
    const entry = await prisma.habitEntry.upsert({
      where: {
        habitId_date: {
          habitId,
          date,
        },
      },
      update: {
        completed: data.completed,
        value: data.value,
        notes: data.notes,
        completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
        timeOfDay: data.timeOfDay,
        mood: data.mood,
        difficulty: data.difficulty,
      },
      create: {
        habitId,
        date,
        completed: data.completed,
        value: data.value,
        notes: data.notes,
        completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
        timeOfDay: data.timeOfDay,
        mood: data.mood,
        difficulty: data.difficulty,
      },
    })

    return NextResponse.json(entry)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 