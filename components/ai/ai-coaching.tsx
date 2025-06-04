'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Brain, 
  Target, 
  TrendingUp, 
  CheckCircle, 
  Star,
  MessageCircle,
  Zap,
  Award,
  Calendar
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getHabitAnalyticsAI } from '@/lib/ai-analytics'

interface Habit {
  id: string
  title: string
  entries: Array<{
    date: string
    completed: boolean
    value: number
    mood?: number
    difficulty?: number
    timeOfDay?: string
    completedAt?: string
  }>
  category?: string
  frequency: string
}

interface AICoachingProps {
  habits: Habit[]
  onRefresh?: () => void
}

export default function AICoaching({ habits, onRefresh }: AICoachingProps) {
  const [coaching, setCoaching] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedSection, setExpandedSection] = useState<string | null>('motivation')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient) {
      generateCoaching()
    }
  }, [habits, isClient])

  const generateCoaching = async () => {
    if (!isClient) return
    
    setIsLoading(true)
    try {
      const ai = getHabitAnalyticsAI()
      const coachingData = ai.generatePersonalizedCoaching(habits)
      setCoaching(coachingData)
    } catch (error) {
      console.error('Error generating coaching:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isClient) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        </div>
      </div>
    )
  }

  if (!coaching) return null

  const sections = [
    {
      id: 'motivation',
      title: 'Your AI Coach',
      icon: MessageCircle,
      content: (
        <div className="space-y-3 sm:space-y-4">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 rounded-lg p-3 sm:p-4">
            <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-2 text-sm sm:text-base">
              {coaching.motivationalMessage}
            </h4>
            <p className="text-purple-700 dark:text-purple-400 text-xs sm:text-sm">
              {coaching.encouragement}
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            <Target className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Focus Area: <strong>{coaching.focusArea}</strong></span>
          </div>
        </div>
      )
    },
    {
      id: 'action-plan',
      title: 'Action Plan',
      icon: Zap,
      content: (
        <div className="space-y-2 sm:space-y-3">
          {coaching.actionPlan.map((action: string, index: number) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg touch-manipulation"
            >
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0">
                {index + 1}
              </div>
              <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 flex-1 leading-relaxed">{action}</p>
            </motion.div>
          ))}
        </div>
      )
    },
    {
      id: 'weekly-goals',
      title: 'Weekly Goals',
      icon: Award,
      content: (
        <div className="space-y-2 sm:space-y-3">
          {coaching.weeklyGoals.map((goal: string, index: number) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/20 touch-manipulation"
            >
              <Star className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs sm:text-sm text-green-800 dark:text-green-300 flex-1 leading-relaxed">{goal}</p>
            </motion.div>
          ))}
        </div>
      )
    }
  ]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Brain className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">AI Coaching</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={generateCoaching}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 sm:p-2"
        >
          <Brain className="w-3 h-3 sm:w-4 sm:h-4" />
        </Button>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {sections.map((section) => {
          const IconComponent = section.icon
          const isExpanded = expandedSection === section.id

          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                className="w-full p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between touch-manipulation"
              >
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">{section.title}</h3>
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                </motion.div>
              </button>
              
              <motion.div
                initial={false}
                animate={{ height: isExpanded ? 'auto' : 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="p-3 sm:p-4">
                  {section.content}
                </div>
              </motion.div>
            </motion.div>
          )
        })}
      </div>

      {/* Mobile-specific tips */}
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600 block sm:hidden">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          💪 Tap sections to expand • Your personalized coaching updates daily
        </p>
      </div>
    </div>
  )
} 