'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Clock, 
  Calendar, 
  TrendingUp, 
  Zap,
  Target,
  Sun,
  Moon,
  AlertCircle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getHabitAnalyticsAI } from '@/lib/ai-analytics'

interface Habit {
  id: string
  title: string
  color: string
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

interface SmartScheduleProps {
  habits: Habit[]
  onRefresh?: () => void
}

export default function SmartSchedule({ habits, onRefresh }: SmartScheduleProps) {
  const [schedule, setSchedule] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient && habits.length > 0) {
      generateSchedule()
    }
  }, [habits, isClient])

  const generateSchedule = () => {
    if (!isClient) return
    
    setIsLoading(true)
    try {
      const ai = getHabitAnalyticsAI()
      const scheduleData = ai.generateOptimalSchedule(habits)
      setSchedule(scheduleData)
    } catch (error) {
      console.error('Error generating schedule:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getTimeIcon = (time: string) => {
    const hour = parseInt(time.split(':')[0])
    if (hour < 12) return Sun
    return Moon
  }

  const getSuccessColor = (successRate: number) => {
    if (successRate > 0.8) return 'text-green-600 dark:text-green-400'
    if (successRate > 0.6) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty < 4) return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
    if (difficulty < 7) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
    return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
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
        <div className="mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Smart Schedule</h2>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  if (!schedule || !schedule.schedule) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <div className="mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Smart Schedule</span>
          </h2>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">No schedule available. Add some habits to get started!</p>
          <Button onClick={generateSchedule} className="mt-4" size="sm">
            Generate Schedule
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Smart Schedule</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={generateSchedule}>
          <Zap className="w-4 h-4" />
        </Button>
      </div>
      <div className="space-y-3 sm:space-y-4">
        {schedule.schedule.map((item: any, index: number) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/30"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                {item.habitTitle}
              </h3>
              <div className="flex items-center space-x-2">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{item.time}</span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">{item.reason}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Target className="w-3 h-3 text-green-500" />
                <span className="text-xs text-green-600 dark:text-green-400">
                  {Math.round((item.predictedSuccess || 0.75) * 100)}% success rate
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Difficulty: {Math.round((item.predictedDifficulty || 0.5) * 100)}%
              </div>
            </div>
          </motion.div>
        ))}
        
        {schedule.tips && schedule.tips.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 text-sm">💡 Tips</h4>
            <ul className="space-y-1">
              {schedule.tips.map((tip: string, index: number) => (
                <li key={index} className="text-xs sm:text-sm text-blue-800 dark:text-blue-300">
                  • {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
} 