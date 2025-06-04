import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { habitAnalyticsAI } from '@/lib/ai-analytics'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's habits with entries
    const habits = await prisma.habit.findMany({
      where: {
        user: {
          email: session.user.email
        }
      },
      include: {
        entries: {
          orderBy: {
            date: 'desc'
          },
          take: 100 // Last 100 entries per habit should be enough for analysis
        }
      }
    })

    // Convert to the format expected by AI
    const habitData = habits.map(habit => ({
      id: habit.id,
      title: habit.title,
      entries: habit.entries.map(entry => ({
        date: entry.date.toISOString(),
        completed: entry.completed,
        value: entry.value
      })),
      category: habit.category,
      frequency: habit.frequency
    }))

    // Get AI insights
    const insights = await habitAnalyticsAI.analyzeHabits(habitData)

    // Get predictions for each habit
    const predictions = await Promise.all(
      habitData.map(async (habit) => {
        if (habit.entries.length >= 3) {
          const prediction = await habitAnalyticsAI.predictTomorrowSuccess(habit)
          return { habitId: habit.id, prediction }
        }
        return null
      })
    )

    const validPredictions = predictions.filter(p => p !== null)

    return NextResponse.json({
      insights,
      predictions: validPredictions,
      totalHabits: habits.length,
      analyzedHabits: habitData.filter(h => h.entries.length >= 3).length
    })

  } catch (error) {
    console.error('Error generating AI insights:', error)
    return NextResponse.json(
      { error: 'Failed to generate AI insights' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get basic habit statistics for quick AI overview
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email
      },
      include: {
        habits: {
          include: {
            entries: {
              orderBy: {
                date: 'desc'
              },
              take: 30 // Last 30 days
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate some quick stats
    const totalHabits = user.habits.length
    const today = new Date().toISOString().split('T')[0]
    
    let todayCompleted = 0
    let totalEntries = 0
    let completedEntries = 0
    
    user.habits.forEach(habit => {
      const todayEntry = habit.entries.find(entry => 
        entry.date.toISOString().split('T')[0] === today
      )
      if (todayEntry?.completed) {
        todayCompleted++
      }
      
      totalEntries += habit.entries.length
      completedEntries += habit.entries.filter(e => e.completed).length
    })

    const overallCompletionRate = totalEntries > 0 ? completedEntries / totalEntries : 0

    return NextResponse.json({
      totalHabits,
      todayCompleted,
      overallCompletionRate: Math.round(overallCompletionRate * 100),
      readyForAI: user.habits.some(h => h.entries.length >= 7) // At least one habit with a week of data
    })

  } catch (error) {
    console.error('Error getting AI overview:', error)
    return NextResponse.json(
      { error: 'Failed to get AI overview' },
      { status: 500 }
    )
  }
} 