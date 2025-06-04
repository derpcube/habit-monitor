'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Plus, Settings, LogOut, Calendar, TrendingUp, Target, BarChart3, Flame, Moon, Sun, Brain, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/theme-provider'
import HabitList from '@/components/habits/habit-list'
import CreateHabitModal from '@/components/habits/create-habit-modal'
import StatsOverview from '@/components/stats/stats-overview'
import StreakMonitor from '@/components/stats/streak-monitor'
import HabitChart from '@/components/habits/habit-chart'
import AIInsights from '@/components/ai-insights'
import AIWeeklyForecast from '@/components/ai-weekly-forecast'
import AICoaching from '@/components/ai/ai-coaching'
import SmartSchedule from '@/components/ai/smart-schedule'
import QuickActions from '@/components/habits/quick-actions'
import HabitSuggestions from '@/components/habits/habit-suggestions'

interface Habit {
  id: string
  title: string
  description?: string
  color: string
  category?: string
  frequency: string
  target: number
  days?: string // This should be a JSON string in the database
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

type DashboardTab = 'overview' | 'habits' | 'analytics' | 'streaks' | 'ai' | 'forecast'

// Helper function to check if habit should be active today
const isHabitActiveToday = (habit: Habit): boolean => {
  if (habit.frequency === 'daily') return true
  if (habit.frequency === 'monthly') return true // Simplified for now
  if (habit.frequency === 'weekly') return true // Simplified for now
  
  if (habit.frequency === 'custom_days' && habit.days) {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    const selectedDays = typeof habit.days === 'string' ? JSON.parse(habit.days) : habit.days
    return selectedDays.includes(today)
  }
  
  return true
}

interface DashboardProps {
  initialHabits?: Habit[]
}

export default function Dashboard({ initialHabits = [] }: DashboardProps) {
  const { data: session } = useSession()
  const { theme, toggleTheme } = useTheme()
  const [habits, setHabits] = useState<Habit[]>(initialHabits || [])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchHabits()
  }, [])

  const fetchHabits = async () => {
    try {
      const response = await fetch('/api/habits')
      if (response.ok) {
        const data = await response.json()
        // Ensure each habit has an entries array
        const habitsWithEntries = data.map((habit: any) => ({
          ...habit,
          entries: habit.entries || []
        }))
        setHabits(habitsWithEntries)
      }
    } catch (error) {
      console.error('Error fetching habits:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleHabitCreated = (newHabit: Habit) => {
    const habitWithEntries = {
      ...newHabit,
      entries: newHabit.entries || []
    }
    setHabits([habitWithEntries, ...habits])
    setIsCreateModalOpen(false)
  }

  const handleHabitUpdated = (updatedHabit: Habit) => {
    const habitWithEntries = {
      ...updatedHabit,
      entries: updatedHabit.entries || []
    }
    setHabits(habits.map(h => h.id === habitWithEntries.id ? habitWithEntries : h))
  }

  const handleHabitDeleted = () => {
    fetchHabits() // Refresh the habits list
  }

  const handleRefresh = () => {
    fetchHabits() // Centralized refresh function
  }

  const getTodayStats = () => {
    // Add defensive check for habits array
    if (!habits || !Array.isArray(habits)) {
      return { completed: 0, total: 0, percentage: 0 }
    }

    const today = new Date().toISOString().split('T')[0]
    let completed = 0
    let total = 0

    habits.forEach(habit => {
      // Only count habits that should be active today
      if (!habit || !habit.entries || !isHabitActiveToday(habit)) return
      
      total++
      const todayEntry = habit.entries.find(entry => 
        entry && entry.date && entry.date.split('T')[0] === today && entry.completed
      )
      if (todayEntry) completed++
    })

    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 }
  }

  const getStreakData = () => {
    // Add defensive check for habits array
    if (!habits || !Array.isArray(habits)) {
      return []
    }

    return habits.map(habit => {
      // Defensive check for entries
      if (!habit || !habit.entries) {
        return { habitId: habit?.id || '', title: habit?.title || '', streak: 0 }
      }

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

      return { habitId: habit.id, title: habit.title, streak }
    })
  }

  const todayStats = getTodayStats()
  const streakData = getStreakData()
  const longestStreak = streakData.reduce((max, current) => 
    current.streak > max ? current.streak : max, 0
  )

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: Calendar },
    { id: 'habits' as const, label: 'My Habits', icon: Target },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
    { id: 'streaks' as const, label: 'Streaks', icon: Flame },
    { id: 'ai' as const, label: 'AI Insights', icon: Brain },
    { id: 'forecast' as const, label: 'AI Forecast', icon: Zap },
  ]

  const handleQuickComplete = async (habitId: string) => {
    // Logic for quick completion
    const today = new Date().toISOString().split('T')[0]
    
    try {
      const response = await fetch(`/api/habits/${habitId}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: today,
          completed: true,
          value: 1,
          completedAt: new Date().toISOString()
        })
      })

      if (response.ok) {
        const newEntry = await response.json()
        // Update local state with proper HabitEntry and defensive check
        setHabits(prev => (prev || []).map(habit => 
          habit.id === habitId 
            ? {
                ...habit,
                entries: [...(habit.entries || []), newEntry]
              }
            : habit
        ))
      }
    } catch (error) {
      console.error('Error completing habit:', error)
    }
  }

  const handleAddSuggestion = async (suggestion: any) => {
    try {
      console.log('🤖 Creating habit from AI suggestion:', suggestion)
      
      // Create habit data from suggestion
      const habitData = {
        title: suggestion.title,
        description: suggestion.description,
        category: suggestion.category,
        frequency: 'daily',
        target: 1,
        color: suggestion.color
      }

      console.log('🚀 Sending habit data to API:', habitData)

      const response = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(habitData)
      })

      console.log('📡 API Response status:', response.status)

      if (response.ok) {
        const newHabit = await response.json()
        console.log('✅ Successfully created habit:', newHabit)
        
        // Update local state
        setHabits(prev => [newHabit, ...(prev || [])])
        
        // Show success feedback
        alert(`✅ Successfully created "${suggestion.title}" habit!`)
      } else {
        const errorData = await response.json()
        console.error('❌ Server error creating habit:', errorData)
        alert(`❌ Failed to create habit: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('🔥 Network error creating habit:', error)
      alert(`❌ Network error: Could not create habit. Please check your connection and try again.`)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Habit Monitor</h1>
              <div className="hidden md:block text-sm text-gray-500 dark:text-gray-400">
                Welcome back, {session?.user?.name || session?.user?.email}
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="text-gray-600 dark:text-gray-300"
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </Button>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base px-2 sm:px-4 py-1.5 sm:py-2"
              >
                <Plus size={16} />
                <span className="hidden xs:inline">New</span>
                <span className="hidden sm:inline">Habit</span>
              </Button>
              <Button
                variant="ghost"
                onClick={() => signOut()}
                className="flex items-center space-x-1 sm:space-x-2 text-gray-600 dark:text-gray-300 text-sm sm:text-base px-2 sm:px-4 py-1.5 sm:py-2"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-xl mt-4 sm:mt-6 shadow-sm">
          <nav className="-mb-px flex overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group inline-flex items-center space-x-1 sm:space-x-2 py-3 sm:py-4 px-3 sm:px-6 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Icon size={16} />
                  <span className="hidden xs:inline">{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 pb-6 sm:pb-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Actions Section */}
            <QuickActions 
              habits={habits || []}
              onQuickComplete={handleQuickComplete}
              onCreateHabit={() => setIsCreateModalOpen(true)}
            />
            
            <StatsOverview habits={habits || []} />
            
            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Today's Habits</h2>
              <HabitList 
                habits={(habits || []).filter(h => isHabitActiveToday(h))} 
                onHabitUpdated={handleHabitUpdated}
                onRefresh={handleRefresh}
              />
            </div>
          </div>
        )}

        {activeTab === 'habits' && (
          <div className="space-y-6">
            <HabitSuggestions 
              onAddSuggestion={handleAddSuggestion}
              userHabits={(habits || []).map(h => ({ title: h.title, category: h.category }))}
            />
            <HabitList 
              habits={habits || []} 
              onHabitUpdated={handleHabitUpdated}
              onRefresh={handleRefresh}
            />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {(habits || []).map((habit) => (
              <HabitChart key={habit.id} habit={habit} />
            ))}
          </div>
        )}

        {activeTab === 'streaks' && (
          <div className="space-y-6">
            <StreakMonitor habits={habits || []} />
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AIInsights habits={habits || []} />
            <AICoaching habits={habits || []} />
          </div>
        )}

        {activeTab === 'forecast' && (
          <div className="space-y-6">
            <SmartSchedule habits={habits || []} />
            <AIWeeklyForecast habits={habits || []} />
          </div>
        )}
      </div>

      {/* Create Habit Modal */}
      <CreateHabitModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onHabitCreated={handleHabitCreated}
      />
    </div>
  )
} 