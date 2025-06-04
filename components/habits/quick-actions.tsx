'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Zap, 
  Plus, 
  Clock, 
  Target,
  Flame,
  CheckCircle2,
  Calendar,
  TrendingUp,
  Coffee,
  Moon,
  Sun,
  Sunset
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Habit {
  id: string
  title: string
  color: string
  entries: Array<{
    date: string
    completed: boolean
  }>
}

interface QuickActionsProps {
  habits: Habit[]
  onQuickComplete: (habitId: string) => void
  onCreateHabit: () => void
}

export default function QuickActions({ habits, onQuickComplete, onCreateHabit }: QuickActionsProps) {
  const [selectedTime, setSelectedTime] = useState<string>('now')
  
  const getTodayIncompleteHabits = () => {
    const today = new Date().toDateString()
    return habits.filter(habit => {
      const todayEntry = habit.entries.find(entry => 
        new Date(entry.date).toDateString() === today
      )
      return !todayEntry?.completed
    })
  }

  const getStreakCount = (habit: Habit) => {
    const sortedEntries = habit.entries
      .filter(e => e.completed)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    let streak = 0
    const today = new Date()
    
    for (const entry of sortedEntries) {
      const entryDate = new Date(entry.date)
      const daysDiff = Math.floor((today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysDiff === streak) {
        streak++
      } else {
        break
      }
    }
    
    return streak
  }

  const incompleteHabits = getTodayIncompleteHabits()
  const urgentHabits = incompleteHabits.slice(0, 4) // Show max 4 quick actions

  const timeOptions = [
    { value: 'now', label: 'Now', icon: Zap },
    { value: 'morning', label: 'Morning', icon: Coffee },
    { value: 'afternoon', label: 'Afternoon', icon: Sun },
    { value: 'evening', label: 'Evening', icon: Sunset },
    { value: 'night', label: 'Night', icon: Moon },
  ]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Quick Actions</h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onCreateHabit}
          className="text-gray-600 dark:text-gray-400"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Habit
        </Button>
      </div>

      {/* Time Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Complete for:
        </label>
        <div className="flex flex-wrap gap-2">
          {timeOptions.map((option) => {
            const IconComponent = option.icon
            return (
              <Button
                key={option.value}
                variant={selectedTime === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTime(option.value)}
                className="flex items-center space-x-1"
              >
                <IconComponent className="w-3 h-3" />
                <span>{option.label}</span>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Quick Complete Buttons */}
      {urgentHabits.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Today's Pending Habits
          </h3>
          {urgentHabits.map((habit, index) => {
            const streak = getStreakCount(habit)
            
            return (
              <motion.div
                key={habit.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: habit.color }}
                  />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                      {habit.title}
                    </h4>
                    {streak > 0 && (
                      <div className="flex items-center space-x-1 text-xs text-orange-600 dark:text-orange-400">
                        <Flame className="w-3 h-3" />
                        <span>{streak} day streak</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <Button
                  size="sm"
                  onClick={() => onQuickComplete(habit.id)}
                  className="flex items-center space-x-1"
                  style={{ backgroundColor: habit.color }}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Done</span>
                </Button>
              </motion.div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            All caught up!
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            You've completed all your habits for today. Great work!
          </p>
        </div>
      )}

      {/* Quick Stats */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {habits.length - incompleteHabits.length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Completed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {incompleteHabits.length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Remaining</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {Math.round(((habits.length - incompleteHabits.length) / Math.max(habits.length, 1)) * 100)}%
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Progress</div>
          </div>
        </div>
      </div>
    </div>
  )
} 