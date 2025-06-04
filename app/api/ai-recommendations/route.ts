import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const recommendationSchema = z.object({
  recommendationType: z.string(),
  recommendationData: z.any(),
  used: z.boolean().default(false)
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const data = recommendationSchema.parse(body)

    // Create or update recommendation tracking
    const recommendation = await prisma.aiRecommendation.create({
      data: {
        userId: (session.user as any).id,
        recommendationType: data.recommendationType,
        recommendationData: data.recommendationData,
        usedAt: data.used ? new Date() : null
      }
    })

    return NextResponse.json(recommendation)
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

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const recommendations = await prisma.aiRecommendation.findMany({
      where: {
        userId: (session.user as any).id,
        usedAt: { not: null }
      },
      select: {
        recommendationType: true,
        recommendationData: true,
        usedAt: true
      }
    })

    return NextResponse.json(recommendations)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 