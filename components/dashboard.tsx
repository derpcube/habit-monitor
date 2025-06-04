'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Plus, Settings, LogOut, Calendar, TrendingUp, Target, BarChart3, Flame, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/theme-provider'
import HabitList from '@/components/habits/habit-list'
import CreateHabitModal from '@/components/habits/create-habit-modal'
import StatsOverview from '@/components/stats/stats-overview'
import StreakMonitor from '@/components/stats/streak-monitor'
import HabitChart from '@/components/habits/habit-chart'

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
}

type DashboardTab = 'overview' | 'habits' | 'analytics' | 'streaks'

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

export default function Dashboard() {
  const { data: session } = useSession()
  const { theme, toggleTheme } = useTheme()
  const [habits, setHabits] = useState<Habit[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview')

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
  ]

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
          <div className="bg-white dark:bg-gray-800 rounded-b-xl shadow-sm border-t-0 border dark:border-gray-700">
            <div className="p-4 sm:p-6 lg:p-8">
              {/* Stats Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 sm:p-6 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 sm:p-3 bg-blue-500 rounded-lg">
                      <Calendar className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300">Today's Progress</p>
                      <p className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {todayStats.completed}/{todayStats.total}
                      </p>
                      <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">{todayStats.percentage}% complete</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 sm:p-6 border border-green-200 dark:border-green-800">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 sm:p-3 bg-green-500 rounded-lg">
                      <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-300">Longest Streak</p>
                      <p className="text-xl sm:text-2xl font-bold text-green-900 dark:text-green-100">{longestStreak}</p>
                      <p className="text-xs sm:text-sm text-green-600 dark:text-green-400">days</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4 sm:p-6 border border-purple-200 dark:border-purple-800 sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 sm:p-3 bg-purple-500 rounded-lg">
                      <Target className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-purple-700 dark:text-purple-300">Total Habits</p>
                      <p className="text-xl sm:text-2xl font-bold text-purple-900 dark:text-purple-100">{habits.length}</p>
                      <p className="text-xs sm:text-sm text-purple-600 dark:text-purple-400">active</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                {/* Habits List */}
                <div className="lg:col-span-2">
                  <div className="border-b dark:border-gray-700 pb-4 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Habits</h2>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Quick view of your habits</p>
                  </div>
                  <HabitList 
                    habits={habits.slice(0, 5)} // Show only first 5 habits in overview
                    onHabitUpdated={handleHabitUpdated}
                    onRefresh={handleRefresh}
                  />
                  {habits.length > 5 && (
                    <div className="mt-4 text-center">
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab('habits')}
                        className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        View All Habits
                      </Button>
                    </div>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="space-y-6">
                  <StatsOverview habits={habits} />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'habits' && (
          <div className="bg-white dark:bg-gray-800 rounded-b-xl shadow-sm border-t-0 border dark:border-gray-700">
            <div className="p-4 sm:p-6 border-b dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Habits</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Manage and track all your habits</p>
            </div>
            <HabitList 
              habits={habits} 
              onHabitUpdated={handleHabitUpdated}
              onRefresh={handleRefresh}
            />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-white dark:bg-gray-800 rounded-b-xl shadow-sm border-t-0 border dark:border-gray-700">
            <div className="p-4 sm:p-6 border-b dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Analytics</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Detailed insights into your habit performance</p>
            </div>
            <div className="p-4 sm:p-6">
              {habits.length === 0 ? (
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No analytics yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Create some habits to view detailed analytics and charts.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <StatsOverview habits={habits} />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {habits.map((habit) => (
                      <HabitChart key={habit.id} habit={habit} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'streaks' && (
          <div className="bg-white dark:bg-gray-800 rounded-b-xl shadow-sm border-t-0 border dark:border-gray-700">
            <div className="p-4 sm:p-6 border-b dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <span>Streak Monitor</span>
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Track your consistency and celebrate your streaks</p>
            </div>
            <div className="p-4 sm:p-6">
              <StreakMonitor habits={habits} />
            </div>
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