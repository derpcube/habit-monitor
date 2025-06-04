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

  const generateCalendarData = () => {
    const calendar = []
    const today = new Date()
    
    // Generate last 35 days for a 5x7 grid
    for (let i = 34; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      
      const dateString = date.toISOString().split('T')[0]
      const entry = habit.entries?.find(entry => 
        entry && entry.date && entry.date.split('T')[0] === dateString
      )
      
      const isToday = date.toDateString() === today.toDateString()
      
      calendar.push({
        date,
        completed: entry?.completed || false,
        isToday,
      })
    }
    
    return calendar
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
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: habit.color }}
          />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{habit.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{habit.category}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-2xl" title={`${stats.currentStreak} day streak`}>
            {streakEmoji}
          </span>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {stats.currentStreak}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.completionRate}%</div>
          <div className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wide">Completion</div>
        </div>
        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.currentStreak}</div>
          <div className="text-xs text-green-600 dark:text-green-400 uppercase tracking-wide">Current Streak</div>
        </div>
        <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.longestStreak}</div>
          <div className="text-xs text-purple-600 dark:text-purple-400 uppercase tracking-wide">Best Streak</div>
        </div>
      </div>

      {/* Chart */}
      {chartData && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Last 30 Days</h4>
          <div className="h-64">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Activity Calendar</h4>
        <div className="grid grid-cols-7 gap-1">
          {generateCalendarData().map((day, index) => (
            <div
              key={index}
              className={`aspect-square rounded text-xs flex items-center justify-center font-medium transition-colors ${
                day.isToday 
                  ? 'ring-2 ring-blue-500 dark:ring-blue-400' 
                  : ''
              } ${
                day.completed
                  ? 'text-white'
                  : day.date 
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600' 
                    : 'text-gray-300 dark:text-gray-600'
              }`}
              style={{
                backgroundColor: day.completed ? habit.color : undefined,
              }}
              title={day.date ? `${day.date.toLocaleDateString()} - ${day.completed ? 'Completed' : 'Not completed'}` : ''}
            >
              {day.date?.getDate()}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-3 text-xs text-gray-500 dark:text-gray-400">
          <span>Less</span>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-gray-100 dark:bg-gray-700 rounded-sm"></div>
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: `${habit.color}40` }}></div>
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: `${habit.color}80` }}></div>
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: habit.color }}></div>
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  )
} 