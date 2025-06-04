import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logUserAction, getSecurityContext } from '@/lib/security'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json'
    const includeEntries = searchParams.get('includeEntries') !== 'false'
    
    if (!['json', 'csv'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Use json or csv' },
        { status: 400 }
      )
    }

    // Log the data export request
    const context = getSecurityContext(request)
    await logUserAction(session.user.id, context, {
      action: 'data_export',
      details: { format, includeEntries },
    })

    // Fetch user data
    const userData = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        habits: {
          include: {
            entries: includeEntries ? {
              orderBy: { date: 'desc' }
            } : false
          }
        },
        aiRecommendations: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prepare export data (remove sensitive information)
    const exportData = {
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        createdAt: userData.createdAt,
        memberSince: userData.createdAt,
      },
      habits: userData.habits.map(habit => ({
        id: habit.id,
        title: habit.title,
        description: habit.description,
        color: habit.color,
        category: habit.category,
        frequency: habit.frequency,
        target: habit.target,
        days: habit.days,
        createdAt: habit.createdAt,
        updatedAt: habit.updatedAt,
        ...(includeEntries && {
          entries: habit.entries?.map(entry => ({
            id: entry.id,
            date: entry.date,
            completed: entry.completed,
            value: entry.value,
            notes: entry.notes,
            completedAt: entry.completedAt,
            timeOfDay: entry.timeOfDay,
            mood: entry.mood,
            difficulty: entry.difficulty,
          }))
        })
      })),
      aiRecommendations: userData.aiRecommendations.map(rec => ({
        id: rec.id,
        type: rec.recommendationType,
        data: rec.recommendationData,
        createdAt: rec.createdAt,
        usedAt: rec.usedAt,
        dismissed: rec.dismissed,
      })),
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        format,
        includeEntries,
        version: '1.0'
      }
    }

    if (format === 'csv') {
      const csv = convertToCSV(exportData)
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="habit-data-${userData.id}-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    // JSON format
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="habit-data-${userData.id}-${new Date().toISOString().split('T')[0]}.json"`
      }
    })

  } catch (error) {
    console.error('Data export error:', error)
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    )
  }
}

function convertToCSV(data: any): string {
  const lines: string[] = []
  
  // User info header
  lines.push('=== USER INFORMATION ===')
  lines.push('Field,Value')
  lines.push(`ID,${data.user.id}`)
  lines.push(`Name,${data.user.name || ''}`)
  lines.push(`Email,${data.user.email}`)
  lines.push(`Member Since,${data.user.createdAt}`)
  lines.push('')
  
  // Habits
  lines.push('=== HABITS ===')
  lines.push('ID,Title,Description,Color,Category,Frequency,Target,Created At')
  
  data.habits.forEach((habit: any) => {
    lines.push([
      habit.id,
      `"${habit.title}"`,
      `"${habit.description || ''}"`,
      habit.color,
      habit.category,
      habit.frequency,
      habit.target,
      habit.createdAt
    ].join(','))
  })
  
  lines.push('')
  
  // Habit entries (if included)
  if (data.habits.some((h: any) => h.entries)) {
    lines.push('=== HABIT ENTRIES ===')
    lines.push('Habit ID,Habit Title,Date,Completed,Value,Notes,Time of Day,Mood,Difficulty')
    
    data.habits.forEach((habit: any) => {
      if (habit.entries) {
        habit.entries.forEach((entry: any) => {
          lines.push([
            habit.id,
            `"${habit.title}"`,
            entry.date,
            entry.completed,
            entry.value,
            `"${entry.notes || ''}"`,
            entry.timeOfDay || '',
            entry.mood || '',
            entry.difficulty || ''
          ].join(','))
        })
      }
    })
    
    lines.push('')
  }
  
  // AI Recommendations
  lines.push('=== AI RECOMMENDATIONS ===')
  lines.push('ID,Type,Created At,Used At,Dismissed')
  
  data.aiRecommendations.forEach((rec: any) => {
    lines.push([
      rec.id,
      rec.type,
      rec.createdAt,
      rec.usedAt || '',
      rec.dismissed
    ].join(','))
  })
  
  return lines.join('\n')
} 