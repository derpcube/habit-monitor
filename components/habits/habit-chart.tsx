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
import { Calendar, TrendingUp, Target, Flame } from 'lucide-react'

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
  category?: string
  frequency: string
  target: number
  createdAt: string
  updatedAt: string
  entries: HabitEntry[]
}

interface HabitChartProps {
  habit: Habit
}

export default function HabitChart({ habit }: HabitChartProps) {
  const [chartData, setChartData] = useState<any>(null)

  useEffect(() => {
    generateChartData()
  }, [habit])

  const generateChartData = () => {
    // Generate last 30 days
    const days = []
    const today = new Date()
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      days.push(date)
    }

    const labels = days.map(date => 
      date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    )

    const data = days.map(date => {
      const dateString = date.toISOString().split('T')[0]
      const entry = habit.entries?.find(entry => 
        entry && entry.date && entry.date.split('T')[0] === dateString
      )
      return entry?.completed ? entry.value || 1 : 0
    })

    const completionData = days.map(date => {
      const dateString = date.toISOString().split('T')[0]
      const entry = habit.entries?.find(entry => 
        entry && entry.date && entry.date.split('T')[0] === dateString
      )
      return entry?.completed ? 1 : 0
    })

    setChartData({
      labels,
      datasets: [
        {
          label: 'Completion',
          data: completionData,
          borderColor: habit.color,
          backgroundColor: `${habit.color}20`,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: habit.color,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
        },
      ],
    })
  }

  const getHabitStats = () => {
    if (!habit.entries || habit.entries.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        completionRate: 0,
        totalCompletions: 0,
        last30Days: 0,
      }
    }

    const completedEntries = habit.entries.filter(entry => entry.completed)
    const totalCompletions = completedEntries.length
    const completionRate = habit.entries.length > 0 ? Math.round((totalCompletions / habit.entries.length) * 100) : 0

    // Calculate current streak
    const sortedEntries = habit.entries
      .filter(entry => entry.completed)
      .map(entry => new Date(entry.date))
      .sort((a, b) => b.getTime() - a.getTime())

    let currentStreak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < sortedEntries.length; i++) {
      const date = new Date(sortedEntries[i])
      date.setHours(0, 0, 0, 0)
      
      const expectedDate = new Date(today)
      expectedDate.setDate(today.getDate() - i)
      
      if (date.getTime() === expectedDate.getTime()) {
        currentStreak++
      } else {
        break
      }
    }

    // Calculate longest streak
    let longestStreak = 0
    let tempStreak = 0
    
    const allDates = []
    const startDate = new Date(habit.createdAt)
    const endDate = new Date()
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      allDates.push(new Date(d))
    }

    allDates.forEach(date => {
      const dateString = date.toISOString().split('T')[0]
      const entry = habit.entries.find(entry => 
        entry.date.split('T')[0] === dateString && entry.completed
      )
      
      if (entry) {
        tempStreak++
        longestStreak = Math.max(longestStreak, tempStreak)
      } else {
        tempStreak = 0
      }
    })

    // Last 30 days completions
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const last30Days = habit.entries.filter(entry => {
      const entryDate = new Date(entry.date)
      return entryDate >= thirtyDaysAgo && entry.completed
    }).length

    return {
      currentStreak,
      longestStreak,
      completionRate,
      totalCompletions,
      last30Days,
    }
  }

  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return '🔥🔥🔥'
    if (streak >= 14) return '🔥🔥'
    if (streak >= 7) return '🔥'
    if (streak >= 3) return '⭐'
    return '⚪'
  }

  const stats = getHabitStats()
  const streakEmoji = getStreakEmoji(stats.currentStreak)

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return context.parsed.y === 1 ? 'Completed' : 'Not completed'
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxTicksLimit: 6,
        }
      },
      y: {
        beginAtZero: true,
        max: 1,
        ticks: {
          stepSize: 1,
          callback: function(value: any) {
            return value === 1 ? 'Done' : value === 0 ? 'Pending' : ''
          }
        },
        grid: {
          color: '#f3f4f6',
        }
      },
    },
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: habit.color }}
          />
          <div>
            <h3 className="font-semibold text-gray-900">{habit.title}</h3>
            <p className="text-sm text-gray-500">{habit.category}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-2xl" title={`${stats.currentStreak} day streak`}>
            {streakEmoji}
          </span>
          <span className="text-sm font-medium text-gray-600">
            {stats.currentStreak}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-medium text-gray-600">Current Streak</span>
          </div>
          <p className="text-lg font-bold text-gray-900 mt-1">{stats.currentStreak}</p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-medium text-gray-600">Best Streak</span>
          </div>
          <p className="text-lg font-bold text-gray-900 mt-1">{stats.longestStreak}</p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-green-500" />
            <span className="text-xs font-medium text-gray-600">Success Rate</span>
          </div>
          <p className="text-lg font-bold text-gray-900 mt-1">{stats.completionRate}%</p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-purple-500" />
            <span className="text-xs font-medium text-gray-600">Last 30 Days</span>
          </div>
          <p className="text-lg font-bold text-gray-900 mt-1">{stats.last30Days}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-40">
        {chartData && (
          <Line data={chartData} options={chartOptions} />
        )}
      </div>
    </div>
  )
} 