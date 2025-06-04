'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Calendar, 
  Clock, 
  Target, 
  Zap, 
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

interface HabitSchedulerProps {
  habits: Habit[]
  onScheduleUpdate?: (schedule: any) => void
}

interface ScheduleEntry {
  habitId: string
  habitTitle: string
  time: string
  duration: number
  priority: 'high' | 'medium' | 'low'
  reason: string
  energyLevel: 'high' | 'medium' | 'low'
  successRate: number
}

export default function HabitScheduler({ habits, onScheduleUpdate }: HabitSchedulerProps) {
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<string>('today')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient && habits.length > 0) {
      generateOptimalSchedule()
    }
  }, [habits, selectedDay, isClient])

  const generateOptimalSchedule = async () => {
    if (!isClient) return
    
    setIsLoading(true)
    try {
      const ai = getHabitAnalyticsAI()
      const optimalScheduleData = ai.generateOptimalSchedule(habits)
      
      // Convert to schedule entries format
      const scheduleEntries: ScheduleEntry[] = optimalScheduleData.schedule.map((item: any, index: number) => ({
        habitId: item.habitId || habits[index % habits.length]?.id || `habit-${index}`,
        habitTitle: item.habitTitle || habits.find(h => h.id === item.habitId)?.title || 'Unknown Habit',
        time: item.time || '09:00',
        duration: 30, // Default duration since it's not in the API response
        priority: item.predictedDifficulty > 0.7 ? 'high' : item.predictedDifficulty > 0.4 ? 'medium' : 'low',
        reason: item.reason || 'Optimal timing based on your patterns',
        energyLevel: item.predictedDifficulty > 0.7 ? 'low' : item.predictedDifficulty > 0.4 ? 'medium' : 'high',
        successRate: item.predictedSuccess || 0.75
      }))
      
      setSchedule(scheduleEntries)
      onScheduleUpdate?.(scheduleEntries)
    } catch (error) {
      console.error('Error generating optimal schedule:', error)
      // Fallback schedule
      const fallbackSchedule: ScheduleEntry[] = habits.slice(0, 3).map((habit, index) => ({
        habitId: habit.id,
        habitTitle: habit.title,
        time: ['07:00', '12:00', '18:00'][index],
        duration: 30,
        priority: ['high', 'medium', 'low'][index] as 'high' | 'medium' | 'low',
        reason: 'Default timing suggestion',
        energyLevel: ['high', 'medium', 'low'][index] as 'high' | 'medium' | 'low',
        successRate: 0.7
      }))
      setSchedule(fallbackSchedule)
    } finally {
      setIsLoading(false)
    }
  }

  const getDayOptions = () => [
    { value: 'today', label: 'Today', icon: Calendar },
    { value: 'tomorrow', label: 'Tomorrow', icon: Sparkles },
    { value: 'optimal', label: 'Optimal Day', icon: Target }
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800'
      case 'low': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800'
    }
  }

  const getEnergyIcon = (energyLevel: string) => {
    switch (energyLevel) {
      case 'high': return <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
      case 'medium': return <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
      case 'low': return <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
      default: return <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Optimal Schedule</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={generateOptimalSchedule}
          disabled={isLoading}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 sm:p-2"
        >
          <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Day Selection */}
      <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
        {getDayOptions().map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setSelectedDay(value)}
            className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors touch-manipulation ${
              selectedDay === value
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3 sm:space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 sm:h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : schedule.length === 0 ? (
        <div className="text-center py-6 sm:py-8">
          <AlertCircle className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-sm sm:text-lg font-medium text-gray-900 dark:text-white mb-2">No Schedule Available</h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-4">
            Add some habits to generate your optimal schedule
          </p>
          <Button onClick={generateOptimalSchedule} size="sm">
            Generate Schedule
          </Button>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {schedule.map((entry, index) => (
            <motion.div
              key={`${entry.habitId}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">
                    {entry.habitTitle}
                  </h3>
                  <div className="flex items-center space-x-3 sm:space-x-4 mt-1 sm:mt-2">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{entry.time}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Target className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{entry.duration}min</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {getEnergyIcon(entry.energyLevel)}
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 capitalize">{entry.energyLevel}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-1 sm:space-y-2 ml-2">
                  <Badge variant="outline" className={`text-xs ${getPriorityColor(entry.priority)}`}>
                    {entry.priority.toUpperCase()}
                  </Badge>
                  <div className="flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-gray-500">{Math.round(entry.successRate * 100)}%</span>
                  </div>
                </div>
              </div>
              
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {entry.reason}
              </p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Mobile-specific tips */}
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600 block sm:hidden">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          📅 Your AI-optimized schedule • Tap days to switch views
        </p>
      </div>
    </div>
  )
} 