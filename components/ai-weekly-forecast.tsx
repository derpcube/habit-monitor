'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Calendar, 
  Target, 
  AlertTriangle, 
  CheckCircle2,
  Sparkles,
  Brain,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getHabitAnalyticsAI } from '@/lib/ai-analytics'

interface Habit {
  id: string
  title: string
  entries: Array<{
    date: string
    completed: boolean
    value: number
    mood?: number
    difficulty?: number
    timeOfDay?: string
    completedAt?: string
  }>
  category?: string
  frequency: string
  color?: string
  streak?: number
}

interface AIWeeklyForecastProps {
  habits: Habit[]
  onForecastUpdate?: (forecast: any) => void
}

export default function AIWeeklyForecast({ habits, onForecastUpdate }: AIWeeklyForecastProps) {
  const [forecast, setForecast] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedHabit, setSelectedHabit] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient && habits.length > 0) {
      generateForecast()
    }
  }, [habits, isClient])

  const generateForecast = async () => {
    if (!isClient) return
    
    setIsLoading(true)
    try {
      const ai = getHabitAnalyticsAI()
      
      // Generate individual habit predictions
      const habitPredictions = []
      for (const habit of habits.slice(0, 5)) { // Limit to first 5 habits for performance
        try {
          const habitData = {
            id: habit.id,
            title: habit.title,
            entries: habit.entries || [],
            category: habit.category,
            frequency: habit.frequency
          }
          
          const prediction = await ai.predictWeekSuccess(habitData)
          const currentStreak = habit.streak || 0
          
          habitPredictions.push({
            habit: habitData,
            prediction,
            currentStreak
          })
        } catch (error) {
          console.error(`Error predicting for habit ${habit.title}:`, error)
        }
      }
      
      // Generate overall performance forecast
      const performanceForecast = ai.generatePerformanceForecast(habits, 7)
      
      const combinedForecast = {
        habitPredictions,
        performanceForecast,
        generatedAt: new Date().toISOString()
      }
      
      setForecast(combinedForecast)
      onForecastUpdate?.(combinedForecast)
    } catch (error) {
      console.error('Error generating weekly forecast:', error)
      // Fallback forecast
      setForecast({
        habitPredictions: [],
        performanceForecast: {
          forecast: [],
          summary: {
            totalPredictedCompletions: 0,
            streakRisk: [],
            improvementOpportunities: []
          }
        },
        generatedAt: new Date().toISOString()
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getDayName = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { weekday: 'short' })
  }

  const getProbabilityColor = (probability: number) => {
    if (probability >= 0.8) return 'text-green-600 dark:text-green-400'
    if (probability >= 0.6) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300'
      case 'low': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300'
    }
  }

  if (!isClient) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!forecast) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Brain className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Weekly Forecast</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={generateForecast}
          disabled={isLoading}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 sm:p-2"
        >
          <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Habit Predictions */}
      {forecast.habitPredictions && forecast.habitPredictions.length > 0 && (
        <div className="mb-4 sm:mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm sm:text-base">Habit Success Predictions</h3>
          <div className="space-y-3">
            {forecast.habitPredictions.map((item: any, index: number) => (
              <motion.div
                key={item.habit.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/30"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                    {item.habit.title}
                  </h4>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {Math.round((item.prediction.weeklyProbability || 0.7) * 100)}% likely
                    </Badge>
                  </div>
                </div>

                {/* Daily probabilities */}
                {item.prediction.dailyProbabilities && (
                  <div className="grid grid-cols-7 gap-1 mb-3">
                    {Object.entries(item.prediction.dailyProbabilities).map(([day, prob]: [string, any]) => (
                      <div key={day} className="text-center">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          {getDayName(day)}
                        </div>
                        <div className={`text-xs font-medium ${getProbabilityColor(prob)}`}>
                          {Math.round(prob * 100)}%
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Risk factors */}
                {item.prediction.riskFactors && item.prediction.riskFactors.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.prediction.riskFactors.slice(0, 2).map((risk: string, riskIndex: number) => (
                      <Badge 
                        key={riskIndex} 
                        variant="outline" 
                        className="text-xs bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300"
                      >
                        <AlertTriangle className="w-2 h-2 mr-1" />
                        {risk}
                      </Badge>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Summary */}
      {forecast.performanceForecast && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 sm:p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-300">
                  Predicted Completions
                </span>
              </div>
              <div className="text-lg sm:text-xl font-bold text-blue-900 dark:text-blue-300">
                {forecast.performanceForecast.summary?.totalPredictedCompletions || 0}
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 sm:p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                <span className="text-xs sm:text-sm font-medium text-yellow-900 dark:text-yellow-300">
                  Streak Risks
                </span>
              </div>
              <div className="text-lg sm:text-xl font-bold text-yellow-900 dark:text-yellow-300">
                {forecast.performanceForecast.summary?.streakRisk?.length || 0}
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 sm:p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Sparkles className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-xs sm:text-sm font-medium text-green-900 dark:text-green-300">
                  Opportunities
                </span>
              </div>
              <div className="text-lg sm:text-xl font-bold text-green-900 dark:text-green-300">
                {forecast.performanceForecast.summary?.improvementOpportunities?.length || 0}
              </div>
            </div>
          </div>

          {/* Opportunities */}
          {forecast.performanceForecast.summary?.improvementOpportunities?.length > 0 && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2 text-sm">🌟 This Week's Opportunities</h4>
              <ul className="space-y-1">
                {forecast.performanceForecast.summary.improvementOpportunities.slice(0, 3).map((opportunity: string, index: number) => (
                  <li key={index} className="text-xs sm:text-sm text-green-800 dark:text-green-300">
                    • {opportunity}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Mobile-specific tips */}
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600 block sm:hidden">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          🔮 AI predictions update daily • Tap refresh for latest forecast
        </p>
      </div>
    </div>
  )
} 