"use client"

import React, { useState } from 'react'
import { 
  Check, 
  Undo2, 
  Bell, 
  Calendar, 
  Copy, 
  Archive, 
  Edit, 
  MoreHorizontal,
  Zap,
  Timer
} from 'lucide-react'
import { useToast } from './ui/toast'

interface Habit {
  id: string
  title: string
  category: string
  frequency: string
  target: number
}

interface HabitQuickActionsProps {
  habit: Habit
  isCompleted?: boolean
  onComplete?: (habitId: string) => void
  onUndo?: (habitId: string) => void
  onEdit?: (habitId: string) => void
  onArchive?: (habitId: string) => void
  onDuplicate?: (habitId: string) => void
  onScheduleReminder?: (habitId: string, time: string) => void
}

export function HabitQuickActions({
  habit,
  isCompleted = false,
  onComplete,
  onUndo,
  onEdit,
  onArchive,
  onDuplicate,
  onScheduleReminder
}: HabitQuickActionsProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [showReminderDialog, setShowReminderDialog] = useState(false)
  const { addToast } = useToast()

  const handleQuickComplete = () => {
    if (isCompleted) {
      onUndo?.(habit.id)
      addToast({
        title: 'Undone!',
        description: `Marked "${habit.title}" as incomplete`,
        variant: 'default',
        duration: 3000
      })
    } else {
      onComplete?.(habit.id)
      addToast({
        title: 'Great job! 🎉',
        description: `Completed "${habit.title}"`,
        variant: 'success',
        duration: 3000
      })
    }
  }

  const handleDuplicate = () => {
    onDuplicate?.(habit.id)
    addToast({
      title: 'Habit duplicated',
      description: `Created a copy of "${habit.title}"`,
      variant: 'success'
    })
    setShowDropdown(false)
  }

  const handleArchive = () => {
    onArchive?.(habit.id)
    addToast({
      title: 'Habit archived',
      description: `"${habit.title}" has been archived`,
      variant: 'default'
    })
    setShowDropdown(false)
  }

  const quickReminderTimes = [
    { label: 'In 1 hour', value: new Date(Date.now() + 60 * 60 * 1000).toISOString() },
    { label: 'This evening (6 PM)', value: getTodayAt(18).toISOString() },
    { label: 'Tomorrow morning (9 AM)', value: getTomorrowAt(9).toISOString() },
  ]

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        {/* Quick Complete/Undo Button */}
        <button
          onClick={handleQuickComplete}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-200
            ${isCompleted 
              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }
          `}
        >
          {isCompleted ? (
            <>
              <Undo2 className="h-4 w-4" />
              <span className="hidden sm:inline">Undo</span>
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              <span className="hidden sm:inline">Complete</span>
            </>
          )}
        </button>

        {/* Quick Reminder Button */}
        <button
          onClick={() => setShowReminderDialog(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors"
          title="Set reminder"
        >
          <Bell className="h-4 w-4" />
          <span className="hidden sm:inline">Remind</span>
        </button>

        {/* More Actions Dropdown */}
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
          <button
            onClick={() => {
              onEdit?.(habit.id)
              setShowDropdown(false)
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Edit className="h-4 w-4" />
            Edit habit
          </button>
          
          <button
            onClick={handleDuplicate}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Copy className="h-4 w-4" />
            Duplicate
          </button>
          
          <button
            onClick={() => {
              onScheduleReminder?.(habit.id, getTomorrowAt(9).toISOString())
              setShowDropdown(false)
              addToast({
                title: 'Reminder scheduled',
                description: 'You\'ll be reminded tomorrow at 9 AM',
                variant: 'success'
              })
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Calendar className="h-4 w-4" />
            Schedule for tomorrow
          </button>
          
          <div className="border-t border-gray-100 my-1" />
          
          <button
            onClick={handleArchive}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <Archive className="h-4 w-4" />
            Archive habit
          </button>
        </div>
      )}

      {/* Quick Reminder Dialog */}
      {showReminderDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Set reminder for "{habit.title}"
            </h3>
            
            <div className="space-y-3">
              {quickReminderTimes.map((time, index) => (
                <button
                  key={index}
                  onClick={() => {
                    onScheduleReminder?.(habit.id, time.value)
                    setShowReminderDialog(false)
                    addToast({
                      title: 'Reminder set! ⏰',
                      description: `You'll be reminded ${time.label.toLowerCase()}`,
                      variant: 'success'
                    })
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <Timer className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{time.label}</span>
                </button>
              ))}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowReminderDialog(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop for dropdown */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  )
}

// Smart Suggestions Component
export function HabitSmartSuggestions({ 
  habits, 
  onCreateFromSuggestion 
}: { 
  habits: Habit[]
  onCreateFromSuggestion: (suggestion: any) => void 
}) {
  const suggestions = generateSmartSuggestions(habits)
  
  if (suggestions.length === 0) return null

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="h-5 w-5 text-purple-600" />
        <h3 className="font-medium text-purple-900">Smart Suggestions</h3>
      </div>
      
      <div className="space-y-2">
        {suggestions.slice(0, 3).map((suggestion, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-100">
            <div>
              <p className="text-sm font-medium text-gray-900">{suggestion.title}</p>
              <p className="text-xs text-gray-600">{suggestion.reason}</p>
            </div>
            <button
              onClick={() => onCreateFromSuggestion(suggestion)}
              className="px-3 py-1 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-colors"
            >
              Add
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// Utility functions
function getTodayAt(hour: number): Date {
  const date = new Date()
  date.setHours(hour, 0, 0, 0)
  return date
}

function getTomorrowAt(hour: number): Date {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  date.setHours(hour, 0, 0, 0)
  return date
}

function generateSmartSuggestions(habits: Habit[]) {
  const suggestions = []
  
  // Analyze existing habits to suggest complementary ones
  const categories = habits.map(h => h.category)
  const hasHealthHabits = categories.includes('Health')
  const hasProductivityHabits = categories.includes('Productivity')
  const hasMindfulnessHabits = categories.includes('Mindfulness')
  
  if (!hasHealthHabits) {
    suggestions.push({
      title: 'Drink 8 glasses of water',
      category: 'Health',
      frequency: 'daily',
      target: 8,
      reason: 'Great foundation for healthy habits'
    })
  }
  
  if (!hasMindfulnessHabits && habits.length > 2) {
    suggestions.push({
      title: '5-minute meditation',
      category: 'Mindfulness',
      frequency: 'daily',
      target: 1,
      reason: 'Perfect complement to your active lifestyle'
    })
  }
  
  if (!hasProductivityHabits) {
    suggestions.push({
      title: 'Plan tomorrow evening',
      category: 'Productivity',
      frequency: 'daily',
      target: 1,
      reason: 'Boost productivity and reduce stress'
    })
  }
  
  return suggestions
} 