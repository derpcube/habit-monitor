'use client'

import { useState, useEffect } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { TrendingUp, Trophy, Target, Calendar } from 'lucide-react'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

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
  frequency: string
  target: number
  createdAt: string
  updatedAt: string
  entries: HabitEntry[]
}

interface StatsOverviewProps {
  habits: Habit[]
}

export default function StatsOverview({ habits }: StatsOverviewProps) {
  const [chartData, setChartData] = useState<any>(null)

  useEffect(() => {
    generateChartData()
  }, [habits])

  const generateChartData = () => {
    // Generate last 7 days
    const days = []
    const today = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      days.push(date)
    }

    const labels = days.map(date => 
      date.toLocaleDateString('en-US', { weekday: 'short' })
    )

    const data = days.map(date => {
      const dateString = date.toISOString().split('T')[0]
      let completedHabits = 0
      let totalHabits = habits.length

      habits.forEach(habit => {
        // Defensive check for habit and entries
        if (!habit || !habit.entries) return
        
        const entry = habit.entries.find(entry => 
          entry && entry.date && entry.date.split('T')[0] === dateString && entry.completed
        )
        if (entry) completedHabits++
      })

      return totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0
    })

    setChartData({
      labels,
      datasets: [
        {
          label: 'Completion Rate',
          data,
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    })
  }

  const getWeeklyStats = () => {
    const today = new Date()
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    let totalCompletions = 0
    let possibleCompletions = 0

    habits.forEach(habit => {
      // Defensive check for habit and entries
      if (!habit || !habit.entries) return
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() - i)
        const dateString = date.toISOString().split('T')[0]
        
        possibleCompletions++
        const entry = habit.entries.find(entry => 
          entry && entry.date && entry.date.split('T')[0] === dateString && entry.completed
        )
        if (entry) totalCompletions++
      }
    })

    const rate = possibleCompletions > 0 ? Math.round((totalCompletions / possibleCompletions) * 100) : 0
    return { rate, totalCompletions }
  }

  const getTopPerformer = () => {
    if (habits.length === 0) return null

    const habitStats = habits.map(habit => {
      // Defensive check for habit and entries
      if (!habit || !habit.entries) {
        return { habit, rate: 0 }
      }
      
      const completedEntries = habit.entries.filter(entry => entry && entry.completed)
      const rate = habit.entries.length > 0 ? Math.round((completedEntries.length / habit.entries.length) * 100) : 0
      return { habit, rate }
    })

    habitStats.sort((a, b) => b.rate - a.rate)
    return habitStats[0]
  }

  const getCurrentStreak = () => {
    if (habits.length === 0) return 0
    
    const today = new Date()
    let streak = 0

    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      const dateString = date.toISOString().split('T')[0]

      let hasCompletions = false
      habits.forEach(habit => {
        // Defensive check for habit and entries
        if (!habit || !habit.entries) return
        
        const entry = habit.entries.find(entry => 
          entry && entry.date && entry.date.split('T')[0] === dateString && entry.completed
        )
        if (entry) hasCompletions = true
      })

      if (hasCompletions) {
        streak++
      } else {
        break
      }
    }

    return streak
  }

  const weeklyStats = getWeeklyStats()
  const topPerformer = getTopPerformer()
  const currentStreak = getCurrentStreak()

  if (habits.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Analytics</h3>
        <div className="text-center py-8">
          <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            Create some habits to view your analytics and progress charts.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Weekly Progress Chart */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">7-Day Progress</h3>
        {chartData && (
          <div className="h-64">
            <Line 
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return `${context.parsed.y}% completed`
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                      callback: function(value) {
                        return value + '%'
                      }
                    }
                  }
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Weekly Summary */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex items-center space-x-3 mb-4">
          <Calendar className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">This Week</h3>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Completion Rate</span>
            <span className="font-semibold text-blue-600">{weeklyStats.rate}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Total Completions</span>
            <span className="font-semibold">{weeklyStats.totalCompletions}</span>
          </div>
        </div>
      </div>

      {/* Top Performer */}
      {topPerformer && topPerformer.habit && (
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center space-x-3 mb-4">
            <Trophy className="h-5 w-5 text-yellow-600" />
            <h3 className="text-lg font-semibold text-gray-900">Top Performer</h3>
          </div>
          <div className="flex items-center space-x-3">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: topPerformer.habit.color }}
            />
            <div className="flex-1">
              <p className="font-medium text-gray-900">{topPerformer.habit.title}</p>
              <p className="text-sm text-gray-500">{topPerformer.rate}% completion rate</p>
            </div>
          </div>
        </div>
      )}

      {/* Current Streak */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex items-center space-x-3 mb-4">
          <Target className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Current Streak</h3>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-green-600">{currentStreak}</p>
          <p className="text-sm text-gray-500">
            {currentStreak === 1 ? 'day' : 'days'} with at least one habit completed
          </p>
        </div>
      </div>
    </div>
  )
} 