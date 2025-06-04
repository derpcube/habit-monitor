"use client"

import React from 'react'
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns'
import { Flame, Trophy, Target, Calendar, TrendingUp } from 'lucide-react'

interface HabitEntry {
  id: string
  date: string
  completed: boolean
  value: number
}

interface Habit {
  id: string
  title: string
  color: string
  entries: HabitEntry[]
}

interface StreakDisplayProps {
  habit: Habit
}

export function HabitStreakDisplay({ habit }: StreakDisplayProps) {
  const streakData = calculateStreakData(habit.entries)
  
  return (
    <div className="bg-white rounded-lg border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">{habit.title}</h3>
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: habit.color }} />
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StreakStat
          icon={<Flame className="h-5 w-5 text-orange-500" />}
          label="Current Streak"
          value={streakData.currentStreak}
          unit="days"
          color="orange"
        />
        
        <StreakStat
          icon={<Trophy className="h-5 w-5 text-yellow-500" />}
          label="Best Streak"
          value={streakData.bestStreak}
          unit="days"
          color="yellow"
        />
        
        <StreakStat
          icon={<Target className="h-5 w-5 text-blue-500" />}
          label="Completion Rate"
          value={streakData.completionRate}
          unit="%"
          color="blue"
        />
        
        <StreakStat
          icon={<TrendingUp className="h-5 w-5 text-green-500" />}
          label="Total Completed"
          value={streakData.totalCompleted}
          unit="times"
          color="green"
        />
      </div>
      
      <WeeklyProgress habit={habit} />
      
      {streakData.currentStreak > 0 && (
        <MotivationalMessage streak={streakData.currentStreak} />
      )}
    </div>
  )
}

function StreakStat({ 
  icon, 
  label, 
  value, 
  unit, 
  color 
}: {
  icon: React.ReactNode
  label: string
  value: number
  unit: string
  color: string
}) {
  const colorClasses = {
    orange: 'bg-orange-50 border-orange-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
  }
  
  return (
    <div className={`p-3 rounded-lg border ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs font-medium text-gray-600">{label}</span>
      </div>
      <div className="text-lg font-bold text-gray-900">
        {value}
        <span className="text-xs font-normal text-gray-500 ml-1">{unit}</span>
      </div>
    </div>
  )
}

function WeeklyProgress({ habit }: { habit: Habit }) {
  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }) // Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  
  const getEntryForDate = (date: Date) => {
    return habit.entries.find(entry => 
      isSameDay(parseISO(entry.date), date)
    )
  }
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">This Week</span>
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((date, index) => {
          const entry = getEntryForDate(date)
          const isToday = isSameDay(date, today)
          const isCompleted = entry?.completed || false
          
          return (
            <div key={index} className="flex flex-col items-center space-y-1">
              <div className="text-xs text-gray-500 font-medium">
                {format(date, 'EEE').substring(0, 1)}
              </div>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isToday
                    ? 'bg-gray-200 text-gray-600 ring-2 ring-blue-500'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {format(date, 'd')}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MotivationalMessage({ streak }: { streak: number }) {
  const getMotivationalMessage = (streak: number): { message: string; emoji: string } => {
    if (streak >= 100) return { message: "Incredible! You're a habit master! 🏆", emoji: "🏆" }
    if (streak >= 50) return { message: "Amazing consistency! You're unstoppable! 🚀", emoji: "🚀" }
    if (streak >= 30) return { message: "Fantastic! You've built a solid habit! 💪", emoji: "💪" }
    if (streak >= 21) return { message: "Great job! They say 21 days makes a habit! 🎯", emoji: "🎯" }
    if (streak >= 14) return { message: "Two weeks strong! Keep it up! 🌟", emoji: "🌟" }
    if (streak >= 7) return { message: "One week completed! You're building momentum! 🔥", emoji: "🔥" }
    if (streak >= 3) return { message: "Great start! Consistency is key! 👍", emoji: "👍" }
    return { message: "Every journey starts with a single step! 🌱", emoji: "🌱" }
  }
  
  const { message, emoji } = getMotivationalMessage(streak)
  
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
      <div className="flex items-center gap-2">
        <span className="text-lg">{emoji}</span>
        <span className="text-sm font-medium text-blue-800">{message}</span>
      </div>
    </div>
  )
}

function calculateStreakData(entries: HabitEntry[]) {
  const sortedEntries = entries
    .filter(entry => entry.completed)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  
  let currentStreak = 0
  let bestStreak = 0
  let tempStreak = 0
  
  // Calculate current streak
  const today = new Date()
  let checkDate = new Date(today)
  
  for (let i = 0; i < 365; i++) { // Check last year
    const dateStr = checkDate.toISOString().split('T')[0]
    const hasEntry = sortedEntries.some(entry => entry.date.startsWith(dateStr))
    
    if (hasEntry) {
      if (i === 0 || currentStreak > 0) {
        currentStreak++
      }
    } else if (i > 0) {
      break
    }
    
    checkDate.setDate(checkDate.getDate() - 1)
  }
  
  // Calculate best streak
  let consecutiveDays = 0
  let lastDate: Date | null = null
  
  for (const entry of sortedEntries.reverse()) {
    const entryDate = new Date(entry.date)
    
    if (lastDate) {
      const dayDiff = Math.abs((entryDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
      if (dayDiff === 1) {
        consecutiveDays++
      } else {
        bestStreak = Math.max(bestStreak, consecutiveDays)
        consecutiveDays = 1
      }
    } else {
      consecutiveDays = 1
    }
    
    lastDate = entryDate
  }
  bestStreak = Math.max(bestStreak, consecutiveDays)
  
  const totalCompleted = entries.filter(entry => entry.completed).length
  const completionRate = entries.length > 0 
    ? Math.round((totalCompleted / entries.length) * 100) 
    : 0
  
  return {
    currentStreak,
    bestStreak,
    completionRate,
    totalCompleted,
  }
} 