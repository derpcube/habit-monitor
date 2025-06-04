'use client'

import { motion } from 'framer-motion'
import { Flame, Trophy, Target, Calendar } from 'lucide-react'

interface HabitEntry {
  id: string
  date: string
  completed: boolean
  value: number
  notes?: string
}

interface Habit {
  id: string
  title: string
  description?: string
  color: string
  category?: string
  frequency: string
  target: number
  createdAt: string
  updatedAt: string
  entries: HabitEntry[]
}

interface StreakMonitorProps {
  habits: Habit[]
}

export default function StreakMonitor({ habits }: StreakMonitorProps) {
  const getHabitStreak = (habit: Habit) => {
    if (!habit || !habit.entries) return 0
    
    const completedDates = habit.entries
      .filter(entry => entry && entry.completed)
      .map(entry => new Date(entry.date))
      .sort((a, b) => b.getTime() - a.getTime())

    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < completedDates.length; i++) {
      const date = new Date(completedDates[i])
      date.setHours(0, 0, 0, 0)
      
      const expectedDate = new Date(today)
      expectedDate.setDate(today.getDate() - i)
      
      if (date.getTime() === expectedDate.getTime()) {
        streak++
      } else {
        break
      }
    }

    return streak
  }

  const getStreakLevel = (streak: number) => {
    if (streak >= 100) return { level: 'LEGENDARY', emoji: '🏆', color: 'text-yellow-500', bgColor: 'bg-yellow-50' }
    if (streak >= 50) return { level: 'MASTER', emoji: '🔥🔥🔥', color: 'text-red-500', bgColor: 'bg-red-50' }
    if (streak >= 30) return { level: 'EXPERT', emoji: '🔥🔥', color: 'text-orange-500', bgColor: 'bg-orange-50' }
    if (streak >= 14) return { level: 'ADVANCED', emoji: '🔥', color: 'text-red-400', bgColor: 'bg-red-50' }
    if (streak >= 7) return { level: 'INTERMEDIATE', emoji: '⭐', color: 'text-blue-500', bgColor: 'bg-blue-50' }
    if (streak >= 3) return { level: 'BEGINNER', emoji: '🌟', color: 'text-purple-500', bgColor: 'bg-purple-50' }
    return { level: 'STARTING', emoji: '⚪', color: 'text-gray-500', bgColor: 'bg-gray-50' }
  }

  const getTodayProgress = () => {
    const today = new Date().toISOString().split('T')[0]
    let completed = 0
    let total = habits.length

    habits.forEach(habit => {
      if (!habit || !habit.entries) return
      
      const todayEntry = habit.entries.find(entry => 
        entry && entry.date && entry.date.split('T')[0] === today && entry.completed
      )
      if (todayEntry) completed++
    })

    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 }
  }

  const getOverallStreak = () => {
    if (habits.length === 0) return 0
    
    const today = new Date()
    let streak = 0

    for (let i = 0; i < 365; i++) { // Check up to a year
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      const dateString = date.toISOString().split('T')[0]

      let hasAnyCompletion = false
      habits.forEach(habit => {
        if (!habit || !habit.entries) return
        
        const entry = habit.entries.find(entry => 
          entry && entry.date && entry.date.split('T')[0] === dateString && entry.completed
        )
        if (entry) hasAnyCompletion = true
      })

      if (hasAnyCompletion) {
        streak++
      } else {
        break
      }
    }

    return streak
  }

  const habitStreaks = habits.map(habit => ({
    habit,
    streak: getHabitStreak(habit),
    level: getStreakLevel(getHabitStreak(habit))
  })).sort((a, b) => b.streak - a.streak)

  const overallStreak = getOverallStreak()
  const overallLevel = getStreakLevel(overallStreak)
  const todayProgress = getTodayProgress()

  return (
    <div className="space-y-6">
      {/* Overall Streak */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center justify-center space-x-3 mb-4"
          >
            <span className="text-6xl">{overallLevel.emoji}</span>
          </motion.div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {overallStreak} Day Streak!
          </h3>
          <p className={`text-sm font-medium ${overallLevel.color} uppercase tracking-wide`}>
            {overallLevel.level}
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Keep going! You've built amazing consistency.
          </p>
        </div>

        {/* Today's Progress */}
        <div className={`${overallLevel.bgColor} rounded-lg p-4`}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-700">Today's Progress</h4>
            <span className="text-sm font-medium text-gray-600">
              {todayProgress.completed}/{todayProgress.total}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${todayProgress.percentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full"
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {todayProgress.percentage}% complete
          </p>
        </div>
      </div>

      {/* Individual Habit Streaks */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Flame className="w-5 h-5 text-orange-500" />
          <span>Habit Streaks</span>
        </h3>
        
        {habitStreaks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No habits tracked yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {habitStreaks.map(({ habit, streak, level }, index) => (
              <motion.div
                key={habit.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`${level.bgColor} rounded-lg p-4 border-l-4`}
                style={{ borderLeftColor: habit.color }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <span className="text-2xl">{level.emoji}</span>
                    <div>
                      <h4 className="font-medium text-gray-900">{habit.title}</h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>{habit.category}</span>
                        <span>•</span>
                        <span className={level.color}>{level.level}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{streak}</p>
                    <p className="text-sm text-gray-600">days</p>
                  </div>
                </div>
                
                {/* Mini progress visualization */}
                <div className="mt-3 flex space-x-1">
                  {Array.from({ length: Math.min(streak, 30) }, (_, i) => (
                    <div
                      key={i}
                      className="w-2 h-6 rounded-full"
                      style={{ 
                        backgroundColor: habit.color,
                        opacity: 1 - (i * 0.02)
                      }}
                    />
                  ))}
                  {streak > 30 && (
                    <div className="flex items-center text-xs text-gray-500 ml-2">
                      +{streak - 30} more
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Streak Milestones */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <span>Next Milestones</span>
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          {[
            { days: 7, emoji: '⭐', label: 'One Week' },
            { days: 14, emoji: '🔥', label: 'Two Weeks' },
            { days: 30, emoji: '🔥🔥', label: 'One Month' },
            { days: 100, emoji: '🏆', label: 'Legendary' }
          ].map((milestone) => {
            const daysLeft = Math.max(0, milestone.days - overallStreak)
            const isAchieved = overallStreak >= milestone.days
            
            return (
              <div
                key={milestone.days}
                className={`p-3 rounded-lg border-2 ${
                  isAchieved 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">{milestone.emoji}</span>
                  <span className="font-medium text-gray-900">{milestone.label}</span>
                </div>
                <p className="text-sm text-gray-600">
                  {isAchieved ? (
                    <span className="text-green-600 font-medium">✓ Achieved!</span>
                  ) : (
                    `${daysLeft} days to go`
                  )}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
} 