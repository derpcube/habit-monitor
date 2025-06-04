'use client'

import { useState, useEffect, useRef } from 'react'
import { Check, Circle, Calendar, TrendingUp, Trash2, Edit3, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDateShort, isToday, getDateString } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

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

interface HabitListProps {
  habits: Habit[]
  onHabitUpdated: (habit: Habit) => void
  onRefresh: () => void
}

export default function HabitList({ habits, onHabitUpdated, onRefresh }: HabitListProps) {
  const [completingHabits, setCompletingHabits] = useState<Set<string>>(new Set())
  const [deletingHabits, setDeletingHabits] = useState<Set<string>>(new Set())
  const [showMenu, setShowMenu] = useState<string | null>(null)
  const [recentlyCompleted, setRecentlyCompleted] = useState<Set<string>>(new Set())
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const toggleHabitCompletion = async (habit: Habit) => {
    const today = getDateString(new Date())
    
    // Prevent multiple rapid clicks
    if (completingHabits.has(habit.id)) {
      return
    }
    
    // Defensive check for entries
    const entries = habit.entries || []
    const todayEntry = entries.find(entry => 
      entry && entry.date && entry.date.split('T')[0] === today
    )
    
    const isCompleted = todayEntry?.completed || false
    
    setCompletingHabits(prev => new Set(prev).add(habit.id))

    // Add to recently completed for visual feedback
    if (!isCompleted) {
      setRecentlyCompleted(prev => new Set(prev).add(habit.id))
      // Remove from recently completed after animation
      setTimeout(() => {
        setRecentlyCompleted(prev => {
          const updated = new Set(prev)
          updated.delete(habit.id)
          return updated
        })
      }, 1500)
    }

    try {
      const response = await fetch(`/api/habits/${habit.id}/entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: today,
          completed: !isCompleted,
        }),
      })

      if (response.ok) {
        // Add a small delay to prevent rapid clicking and show loading state
        setTimeout(() => {
          onRefresh()
          setCompletingHabits(prev => {
            const updated = new Set(prev)
            updated.delete(habit.id)
            return updated
          })
        }, 800)
      } else {
        // Handle error case
        setCompletingHabits(prev => {
          const updated = new Set(prev)
          updated.delete(habit.id)
          return updated
        })
        setRecentlyCompleted(prev => {
          const updated = new Set(prev)
          updated.delete(habit.id)
          return updated
        })
      }
    } catch (error) {
      console.error('Error toggling habit:', error)
      // Remove from recently completed on error
      setRecentlyCompleted(prev => {
        const updated = new Set(prev)
        updated.delete(habit.id)
        return updated
      })
      setCompletingHabits(prev => {
        const updated = new Set(prev)
        updated.delete(habit.id)
        return updated
      })
    }
  }

  const deleteHabit = async (habitId: string) => {
    if (!confirm('Are you sure you want to delete this habit? This action cannot be undone.')) {
      return
    }

    setDeletingHabits(prev => new Set(prev).add(habitId))

    try {
      const response = await fetch(`/api/habits/${habitId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        onRefresh()
      } else {
        alert('Failed to delete habit. Please try again.')
      }
    } catch (error) {
      console.error('Error deleting habit:', error)
      alert('Failed to delete habit. Please try again.')
    } finally {
      setDeletingHabits(prev => {
        const updated = new Set(prev)
        updated.delete(habitId)
        return updated
      })
      setShowMenu(null)
    }
  }

  const getHabitStreak = (habit: Habit) => {
    // Defensive check for entries
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

  const getWeekProgress = (habit: Habit) => {
    // Defensive check for entries
    if (!habit || !habit.entries) return 0
    
    const today = new Date()
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const weekEntries = habit.entries.filter(entry => {
      if (!entry || !entry.date) return false
      const entryDate = new Date(entry.date)
      return entryDate >= lastWeek && entryDate <= today && entry.completed
    })
    
    return weekEntries.length
  }

  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return '🔥🔥🔥'
    if (streak >= 14) return '🔥🔥'
    if (streak >= 7) return '🔥'
    if (streak >= 3) return '⭐'
    return ''
  }

  // Group habits by category
  const habitsByCategory = habits.reduce((acc, habit) => {
    const category = habit.category || 'General'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(habit)
    return acc
  }, {} as Record<string, Habit[]>)

  if (habits.length === 0) {
    return (
      <div className="p-8 text-center">
        <Circle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No habits yet</h3>
        <p className="text-gray-500 mb-4">
          Create your first habit to start tracking your progress.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {Object.entries(habitsByCategory).map(([category, categoryHabits]) => (
        <div key={category} className="space-y-3">
          <div className="flex items-center space-x-2 px-6 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              {category}
            </h3>
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-xs text-gray-500">{categoryHabits.length} habits</span>
          </div>
          
          <div className="divide-y divide-gray-100">
            <AnimatePresence>
              {categoryHabits.map((habit) => {
                if (!habit) return null
                
                const today = getDateString(new Date())
                const entries = habit.entries || []
                const todayEntry = entries.find(entry => 
                  entry && entry.date && entry.date.split('T')[0] === today
                )
                const isCompletedToday = todayEntry?.completed || false
                const isProcessing = completingHabits.has(habit.id)
                const isDeleting = deletingHabits.has(habit.id)
                const isRecentlyCompleted = recentlyCompleted.has(habit.id)
                const streak = getHabitStreak(habit)
                const weekProgress = getWeekProgress(habit)
                const streakEmoji = getStreakEmoji(streak)

                return (
                  <motion.div
                    key={habit.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="p-6 hover:bg-gray-50 transition-colors relative"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleHabitCompletion(habit)}
                            disabled={isProcessing || isDeleting}
                            className={`h-8 w-8 rounded-full border-2 transition-all duration-300 relative overflow-hidden ${
                              isCompletedToday
                                ? 'bg-green-500 border-green-500 text-white hover:bg-green-600 shadow-lg'
                                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                            }`}
                          >
                            <AnimatePresence mode="wait">
                              {isProcessing ? (
                                <motion.div
                                  key="loading"
                                  initial={{ opacity: 0, scale: 0.5 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.5 }}
                                  className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-transparent"
                                />
                              ) : isCompletedToday ? (
                                <motion.div
                                  key="completed"
                                  initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
                                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                  exit={{ opacity: 0, scale: 0.5, rotate: 180 }}
                                  transition={{ type: "spring", duration: 0.5 }}
                                >
                                  <Check size={16} />
                                </motion.div>
                              ) : (
                                <motion.div
                                  key="empty"
                                  initial={{ opacity: 0, scale: 0.5 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.5 }}
                                />
                              )}
                            </AnimatePresence>
                            
                            {/* Success ripple effect */}
                            {isRecentlyCompleted && (
                              <motion.div
                                initial={{ scale: 0, opacity: 0.8 }}
                                animate={{ scale: 3, opacity: 0 }}
                                transition={{ duration: 0.6 }}
                                className="absolute inset-0 bg-green-400 rounded-full"
                                style={{ pointerEvents: 'none' }}
                              />
                            )}
                          </Button>
                        </motion.div>

                        <div className="flex-1">
                          <motion.div 
                            className="flex items-center space-x-3"
                            animate={isRecentlyCompleted ? { scale: [1, 1.02, 1] } : {}}
                            transition={{ duration: 0.3 }}
                          >
                            <div
                              className="w-3 h-3 rounded-full transition-all duration-300"
                              style={{ backgroundColor: habit.color }}
                            />
                            <h3 className={`font-medium transition-all duration-300 ${
                              isCompletedToday ? 'text-gray-500 line-through' : 'text-gray-900'
                            }`}>
                              {habit.title}
                            </h3>
                            {streakEmoji && (
                              <motion.span 
                                className="text-lg" 
                                title={`${streak} day streak!`}
                                animate={isRecentlyCompleted ? { scale: [1, 1.3, 1] } : {}}
                                transition={{ duration: 0.4, delay: 0.2 }}
                              >
                                {streakEmoji}
                              </motion.span>
                            )}
                          </motion.div>
                          {habit.description && (
                            <p className="text-sm text-gray-500 mt-1 ml-6">
                              {habit.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 ml-6">
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <TrendingUp size={12} />
                              <span>{streak} day streak</span>
                            </div>
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <Calendar size={12} />
                              <span>{weekProgress}/7 this week</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowMenu(showMenu === habit.id ? null : habit.id)}
                          disabled={isDeleting}
                          className="h-8 w-8 text-gray-400 hover:text-gray-600"
                        >
                          {isDeleting ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-transparent" />
                          ) : (
                            <MoreVertical size={16} />
                          )}
                        </Button>

                        {showMenu === habit.id && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border z-10" 
                            ref={menuRef}
                          >
                            <div className="py-1">
                              <button
                                onClick={() => deleteHabit(habit.id)}
                                className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors"
                              >
                                <Trash2 size={14} />
                                <span>Delete Habit</span>
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </div>

                      <div className="text-sm text-gray-500 ml-4">
                        {habit.frequency === 'daily' && 'Daily'}
                        {habit.frequency === 'weekly' && 'Weekly'}
                        {habit.frequency === 'monthly' && 'Monthly'}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </div>
      ))}
    </div>
  )
} 