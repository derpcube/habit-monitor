'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Calendar, 
  Target, 
  BarChart3, 
  TrendingUp, 
  Clock,
  Edit,
  Trash2,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Habit {
  id: string
  title: string
  description?: string
  color: string
  category?: string
  frequency: string
  target: number
  days?: string
  createdAt: string
  updatedAt: string
  entries: HabitEntry[]
}

interface HabitEntry {
  id: string
  date: string
  completed: boolean
  value: number
  notes?: string
  completedAt?: string
  timeOfDay?: string
  mood?: number
  difficulty?: number
}

interface HabitDetailModalProps {
  habit: Habit | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (habit: Habit) => void
  onDelete?: (habitId: string) => void
}

export default function HabitDetailModal({ 
  habit, 
  isOpen, 
  onClose, 
  onEdit, 
  onDelete 
}: HabitDetailModalProps) {
  const [deleteConfirmation, setDeleteConfirmation] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setDeleteConfirmation(false)
    }
  }, [isOpen])

  if (!habit) return null

  const calculateStats = () => {
    const totalEntries = habit.entries.length
    const completedEntries = habit.entries.filter(e => e.completed).length
    const completionRate = totalEntries > 0 ? (completedEntries / totalEntries) * 100 : 0
    
    // Calculate current streak
    const sortedEntries = habit.entries
      .filter(entry => entry.completed)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    let currentStreak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < sortedEntries.length; i++) {
      const entryDate = new Date(sortedEntries[i].date)
      entryDate.setHours(0, 0, 0, 0)
      
      const expectedDate = new Date(today)
      expectedDate.setDate(today.getDate() - i)
      
      if (entryDate.getTime() === expectedDate.getTime()) {
        currentStreak++
      } else {
        break
      }
    }

    // Calculate longest streak
    let longestStreak = 0
    let tempStreak = 0
    const allEntries = habit.entries
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    for (let i = 0; i < allEntries.length; i++) {
      if (allEntries[i].completed) {
        tempStreak++
        longestStreak = Math.max(longestStreak, tempStreak)
      } else {
        tempStreak = 0
      }
    }

    return {
      totalEntries,
      completedEntries,
      completionRate,
      currentStreak,
      longestStreak
    }
  }

  const getRecentEntries = () => {
    return habit.entries
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const getFrequencyDisplay = () => {
    if (habit.frequency === 'custom_days' && habit.days) {
      try {
        const selectedDays = JSON.parse(habit.days)
        return `Custom: ${selectedDays.join(', ')}`
      } catch {
        return habit.frequency
      }
    }
    return habit.frequency.charAt(0).toUpperCase() + habit.frequency.slice(1)
  }

  const stats = calculateStats()
  const recentEntries = getRecentEntries()

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl mx-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: habit.color }}
                />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {habit.title}
                </h2>
                {habit.category && (
                  <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                    {habit.category}
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(habit)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
                
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteConfirmation(true)}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="p-6 space-y-6">
                {/* Description */}
                {habit.description && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </h3>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                        {habit.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Habit Details */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Habit Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center space-x-2 mb-1">
                        <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                          Frequency
                        </span>
                      </div>
                      <p className="text-sm text-blue-900 dark:text-blue-100">
                        {getFrequencyDisplay()}
                      </p>
                    </div>
                    
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center space-x-2 mb-1">
                        <Target className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-xs font-medium text-green-700 dark:text-green-300">
                          Target
                        </span>
                      </div>
                      <p className="text-sm text-green-900 dark:text-green-100">
                        {habit.target} {habit.target === 1 ? 'time' : 'times'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Statistics */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Statistics
                  </h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
                        {Math.round(stats.completionRate)}%
                      </div>
                      <div className="text-xs text-purple-600 dark:text-purple-400">
                        Completion Rate
                      </div>
                    </div>
                    
                    <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                      <div className="text-lg font-bold text-orange-900 dark:text-orange-100">
                        {stats.currentStreak}
                      </div>
                      <div className="text-xs text-orange-600 dark:text-orange-400">
                        Current Streak
                      </div>
                    </div>
                    
                    <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="text-lg font-bold text-red-900 dark:text-red-100">
                        {stats.longestStreak}
                      </div>
                      <div className="text-xs text-red-600 dark:text-red-400">
                        Best Streak
                      </div>
                    </div>
                    
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {stats.totalEntries}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Total Entries
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                {recentEntries.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Recent Activity
                    </h3>
                    <div className="space-y-2">
                      {recentEntries.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            {entry.completed ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-500" />
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {formatDate(entry.date)}
                              </p>
                              {entry.notes && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  {entry.notes}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {entry.completed ? 'Completed' : 'Missed'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Creation Date */}
                <div className="text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-4">
                  Created on {new Date(habit.createdAt).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>

            {/* Delete Confirmation */}
            <AnimatePresence>
              {deleteConfirmation && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute inset-0 bg-white dark:bg-gray-800 flex items-center justify-center"
                >
                  <div className="text-center p-6">
                    <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      Delete Habit
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      Are you sure you want to delete "{habit.title}"? This action cannot be undone.
                    </p>
                    <div className="flex justify-center space-x-3">
                      <Button
                        variant="outline"
                        onClick={() => setDeleteConfirmation(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          onDelete?.(habit.id)
                          onClose()
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
} 