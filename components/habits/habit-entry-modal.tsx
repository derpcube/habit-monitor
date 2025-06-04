'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Clock, Heart, Zap, Sun, Moon, Sunrise, Sunset } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface HabitEntryModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: HabitEntryData) => void
  habit: {
    id: string
    title: string
    color: string
  }
  existingEntry?: {
    completed: boolean
    notes?: string
    completedAt?: string
    timeOfDay?: string
    mood?: number
    difficulty?: number
  }
}

interface HabitEntryData {
  completed: boolean
  notes?: string
  completedAt?: string
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night'
  mood?: number
  difficulty?: number
}

const timeOfDayOptions = [
  { value: 'morning', label: 'Morning', icon: Sunrise, color: 'text-orange-500' },
  { value: 'afternoon', label: 'Afternoon', icon: Sun, color: 'text-yellow-500' },
  { value: 'evening', label: 'Evening', icon: Sunset, color: 'text-orange-600' },
  { value: 'night', label: 'Night', icon: Moon, color: 'text-blue-500' },
] as const

export default function HabitEntryModal({
  isOpen,
  onClose,
  onSubmit,
  habit,
  existingEntry
}: HabitEntryModalProps) {
  const [completed, setCompleted] = useState(existingEntry?.completed ?? true)
  const [notes, setNotes] = useState(existingEntry?.notes ?? '')
  const [timeOfDay, setTimeOfDay] = useState<HabitEntryData['timeOfDay']>(
    existingEntry?.timeOfDay as HabitEntryData['timeOfDay'] ?? undefined
  )
  const [mood, setMood] = useState(existingEntry?.mood ?? 5)
  const [difficulty, setDifficulty] = useState(existingEntry?.difficulty ?? 5)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const data: HabitEntryData = {
      completed,
      notes: notes.trim() || undefined,
      completedAt: completed ? new Date().toISOString() : undefined,
      timeOfDay,
      mood: completed ? mood : undefined,
      difficulty: completed ? difficulty : undefined,
    }

    try {
      await onSubmit(data)
      onClose()
    } catch (error) {
      console.error('Error submitting habit entry:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: habit.color }}
              />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {habit.title}
              </h2>
            </div>
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              onClick={handleClose}
              disabled={isSubmitting}
            >
              <X size={20} />
            </Button>
          </div>

          {/* Completion Status */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Status
            </label>
            <div className="flex space-x-3">
              <Button
                type="button"
                variant={completed ? "default" : "outline"}
                onClick={() => setCompleted(true)}
                className="flex-1"
              >
                Completed
              </Button>
              <Button
                type="button"
                variant={!completed ? "default" : "outline"}
                onClick={() => setCompleted(false)}
                className="flex-1"
              >
                Skipped
              </Button>
            </div>
          </div>

          {completed && (
            <>
              {/* Time of Day */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  When did you complete this?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {timeOfDayOptions.map((option) => {
                    const Icon = option.icon
                    return (
                      <Button
                        key={option.value}
                        type="button"
                        variant={timeOfDay === option.value ? "default" : "outline"}
                        onClick={() => setTimeOfDay(option.value)}
                        className="flex items-center justify-center space-x-2 p-3"
                      >
                        <Icon size={16} className={option.color} />
                        <span>{option.label}</span>
                      </Button>
                    )
                  })}
                </div>
              </div>

              {/* Mood Rating */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  How did you feel? ({mood}/10)
                </label>
                <div className="space-y-3">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={mood}
                    onChange={(e) => setMood(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #ef4444 0%, #f59e0b 50%, #10b981 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>😔 Terrible</span>
                    <span>😐 Neutral</span>
                    <span>😊 Amazing</span>
                  </div>
                </div>
              </div>

              {/* Difficulty Rating */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  How difficult was it? ({difficulty}/10)
                </label>
                <div className="space-y-3">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={difficulty}
                    onChange={(e) => setDifficulty(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #10b981 0%, #f59e0b 50%, #ef4444 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>💨 Easy</span>
                    <span>⚖️ Moderate</span>
                    <span>🔥 Very Hard</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={completed ? "How did it go? Any insights?" : "Why did you skip this today?"}
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="flex space-x-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose} 
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="flex-1"
              style={{ backgroundColor: habit.color }}
            >
              {isSubmitting ? 'Saving...' : completed ? 'Mark Complete' : 'Mark Skipped'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
} 