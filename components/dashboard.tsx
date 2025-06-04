'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Plus, Settings, LogOut, Calendar, TrendingUp, Target, BarChart3, Flame } from 'lucide-react'
import { Button } from '@/components/ui/button'
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

export default function Dashboard() {
  const { data: session } = useSession()
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
      // Defensive check for entries
      if (!habit || !habit.entries) return
      
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Habit Monitor</h1>
              <div className="hidden sm:block text-sm text-gray-500">
                Welcome back, {session?.user?.name || session?.user?.email}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center space-x-2"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">New Habit</span>
              </Button>
              <Button
                variant="ghost"
                onClick={() => signOut()}
                className="flex items-center space-x-2 text-gray-600"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200 bg-white rounded-t-xl mt-6">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group inline-flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {activeTab === 'overview' && (
          <div className="bg-white rounded-b-xl shadow-sm border-t-0 border">
            <div className="p-8">
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-blue-500 rounded-lg">
                      <Calendar className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-700">Today's Progress</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {todayStats.completed}/{todayStats.total}
                      </p>
                      <p className="text-sm text-blue-600">{todayStats.percentage}% complete</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-green-500 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-700">Longest Streak</p>
                      <p className="text-2xl font-bold text-green-900">{longestStreak}</p>
                      <p className="text-sm text-green-600">days</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-purple-500 rounded-lg">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-700">Total Habits</p>
                      <p className="text-2xl font-bold text-purple-900">{habits.length}</p>
                      <p className="text-sm text-purple-600">active</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Habits List */}
                <div className="lg:col-span-2">
                  <div className="border-b pb-4 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Habits</h2>
                    <p className="text-gray-600 text-sm">Quick view of your habits</p>
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
          <div className="bg-white rounded-b-xl shadow-sm border-t-0 border">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Your Habits</h2>
              <p className="text-gray-600 text-sm">Manage and track all your habits</p>
            </div>
            <HabitList 
              habits={habits} 
              onHabitUpdated={handleHabitUpdated}
              onRefresh={handleRefresh}
            />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-white rounded-b-xl shadow-sm border-t-0 border">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Analytics</h2>
              <p className="text-gray-600 text-sm">Detailed insights into your habit performance</p>
            </div>
            <div className="p-6">
              {habits.length === 0 ? (
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No analytics yet</h3>
                  <p className="text-gray-500 mb-4">
                    Create some habits to view detailed analytics and charts.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <StatsOverview habits={habits} />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          <div className="bg-white rounded-b-xl shadow-sm border-t-0 border">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <span>Streak Monitor</span>
              </h2>
              <p className="text-gray-600 text-sm">Track your consistency and celebrate your streaks</p>
            </div>
            <div className="p-6">
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