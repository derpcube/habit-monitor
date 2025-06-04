'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Lightbulb, 
  AlertTriangle, 
  CheckCircle, 
  BarChart3,
  Sparkles,
  ChevronRight,
  Clock,
  Calendar,
  Zap,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getHabitAnalyticsAI } from '@/lib/ai-analytics'

interface AIInsight {
  type: 'prediction' | 'pattern' | 'recommendation' | 'streak' | 'optimization'
  title: string
  description: string
  confidence: number
  actionable?: boolean
  priority: 'high' | 'medium' | 'low'
  data?: any
  showActionButton?: boolean
}

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
}

interface AIInsightsProps {
  habits: Habit[]
  onRefresh?: () => void
  onCreateHabit?: (habitData: any) => void
}

const getInsightIcon = (type: string) => {
  switch (type) {
    case 'prediction':
      return AlertCircle
    case 'pattern':
      return TrendingUp
    case 'recommendation':
      return Lightbulb
    case 'streak':
      return Target
    case 'optimization':
      return BarChart3
    default:
      return Sparkles
  }
}

const getInsightColor = (priority: string, type: string) => {
  if (priority === 'high') {
    return 'from-red-500 to-pink-500'
  } else if (priority === 'medium') {
    return 'from-blue-500 to-purple-500'
  } else {
    return 'from-green-500 to-emerald-500'
  }
}

const getInsightBgColor = (priority: string) => {
  if (priority === 'high') {
    return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
  } else if (priority === 'medium') {
    return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
  } else {
    return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
  }
}

export default function AIInsights({ habits, onRefresh, onCreateHabit }: AIInsightsProps) {
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null)
  const [predictions, setPredictions] = useState<{ [habitId: string]: any }>({})
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    loadUsedRecommendations()
    analyzeHabits()
  }, [habits])

  // Auto-hide notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type })
  }

  const loadUsedRecommendations = async () => {
    try {
      // For now, we'll use local storage instead of the API
      const usedRecommendations = JSON.parse(localStorage.getItem('usedRecommendations') || '[]')
      const ai = getHabitAnalyticsAI()
      ai.setUsedRecommendations(usedRecommendations)
    } catch (error) {
      console.error('Error loading used recommendations:', error)
    }
  }

  const trackRecommendationUsage = async (insight: AIInsight) => {
    if (insight.data?.recommendationType) {
      try {
        const ai = getHabitAnalyticsAI()
        const recommendationKey = ai.markRecommendationAsUsed(
          insight.data.recommendationType, 
          insight.data
        )
        
        // Save to localStorage
        const usedRecommendations = JSON.parse(localStorage.getItem('usedRecommendations') || '[]')
        usedRecommendations.push(recommendationKey)
        localStorage.setItem('usedRecommendations', JSON.stringify(usedRecommendations))
      } catch (error) {
        console.error('Error tracking recommendation usage:', error)
      }
    }
  }

  const analyzeHabits = async () => {
    setIsLoading(true)
    try {
      const habitData = habits.map(habit => ({
        id: habit.id,
        title: habit.title,
        entries: habit.entries,
        category: habit.category,
        frequency: habit.frequency
      }))

      const ai = getHabitAnalyticsAI()
      const aiInsights = await ai.analyzeHabits(habitData)
      setInsights(aiInsights)

      // Get predictions for each habit
      const predictionPromises = habitData.map(async (habit) => {
        if (habit.entries.length >= 3) {
          const prediction = await ai.predictTomorrowSuccess(habit)
          return { habitId: habit.id, prediction }
        }
        return null
      })

      const predictionResults = await Promise.all(predictionPromises)
      const predictionsMap: { [habitId: string]: any } = {}
      
      predictionResults.forEach(result => {
        if (result) {
          predictionsMap[result.habitId] = result.prediction
        }
      })

      setPredictions(predictionsMap)
    } catch (error) {
      console.error('Error analyzing habits:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence * 100)}%`
  }

  const handleTakeAction = async (insight: AIInsight, index: number) => {
    setActionLoading(index)
    
    try {
      // Track that this recommendation was used
      await trackRecommendationUsage(insight)
      
      switch (insight.type) {
        case 'recommendation':
          await handleRecommendationAction(insight)
          break
        case 'pattern':
          await handlePatternAction(insight)
          break
        case 'optimization':
          await handleOptimizationAction(insight)
          break
        case 'prediction':
          await handlePredictionAction(insight)
          break
        default:
          console.log('Action not implemented for this insight type')
      }
    } catch (error) {
      console.error('Error taking action:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleRecommendationAction = async (insight: AIInsight) => {
    console.log('🤖 Creating habit from AI recommendation:', insight)
    
    if (insight.data?.recommendedHabit) {
      const recommendedHabit = insight.data.recommendedHabit
      console.log('📋 Recommended habit data:', recommendedHabit)
      
      // Create the recommended habit
      const habitData = {
        title: recommendedHabit.title,
        description: `AI-recommended habit: ${recommendedHabit.description}`,
        category: recommendedHabit.category,
        frequency: 'daily',
        target: 1,
        color: getCategoryColor(recommendedHabit.category)
      }

      console.log('🚀 Sending habit data to API:', habitData)

      try {
        const response = await fetch('/api/habits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(habitData)
        })

        console.log('📡 API Response status:', response.status)

        if (response.ok) {
          const newHabit = await response.json()
          console.log('✅ Successfully created habit:', newHabit)
          onRefresh?.()
          
          // Show success feedback to user
          showNotification(`✅ Successfully created "${recommendedHabit.title}" habit!`, 'success')
          
          // Re-analyze to update insights
          setTimeout(() => analyzeHabits(), 1000)
        } else {
          const errorData = await response.json()
          console.error('❌ Server error creating habit:', errorData)
          showNotification(`❌ Failed to create habit: ${errorData.error || 'Unknown error'}`, 'error')
        }
      } catch (error) {
        console.error('🔥 Network error creating recommended habit:', error)
        showNotification(`❌ Network error: Could not create habit. Please check your connection and try again.`, 'error')
      }
    } else {
      console.error('❌ No recommended habit data found in insight')
      showNotification(`❌ Error: No habit data found in recommendation`, 'error')
    }
  }

  const handlePatternAction = async (insight: AIInsight) => {
    if (insight.data?.bestDay) {
      // For pattern insights about best days, create a reminder habit
      const reminderHabit = {
        title: `${insight.data.bestDay} Power Session`,
        description: `AI suggests focusing your most important habits on ${insight.data.bestDay}s when you perform best`,
        category: 'Productivity',
        frequency: 'weekly',
        target: 1,
        days: JSON.stringify([insight.data.bestDay.toLowerCase()]),
        color: '#8B5CF6'
      }

      try {
        const response = await fetch('/api/habits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reminderHabit)
        })

        if (response.ok) {
          onRefresh?.()
          console.log(`Created ${insight.data.bestDay} focus habit`)
        }
      } catch (error) {
        console.error('Error creating pattern-based habit:', error)
      }
    } else if (insight.data?.correlation) {
      // For correlation insights, create a habit stacking reminder
      const stackingHabit = {
        title: `Habit Stack: ${insight.data.habit1} + ${insight.data.habit2}`,
        description: `AI detected these habits work well together. Try doing them consecutively.`,
        category: 'Productivity',
        frequency: 'daily',
        target: 1,
        color: '#06B6D4'
      }

      try {
        const response = await fetch('/api/habits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(stackingHabit)
        })

        if (response.ok) {
          onRefresh?.()
          console.log('Created habit stacking reminder')
        }
      } catch (error) {
        console.error('Error creating habit stack:', error)
      }
    }
  }

  const handleOptimizationAction = async (insight: AIInsight) => {
    if (insight.data?.worstDay) {
      // Create a motivational/prep habit for difficult days
      const motivationHabit = {
        title: `${insight.data.worstDay} Motivation Boost`,
        description: `AI-powered motivation for your challenging day. Start small and build momentum.`,
        category: 'Wellness',
        frequency: 'weekly',
        target: 1,
        days: JSON.stringify([insight.data.worstDay.toLowerCase()]),
        color: '#F59E0B'
      }

      try {
        const response = await fetch('/api/habits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(motivationHabit)
        })

        if (response.ok) {
          onRefresh?.()
          console.log(`Created motivation habit for ${insight.data.worstDay}`)
        }
      } catch (error) {
        console.error('Error creating motivation habit:', error)
      }
    } else if (insight.data?.optimalHours) {
      // Create a reminder for optimal timing
      const timingHabit = {
        title: 'Optimal Timing Reminder',
        description: `AI suggests scheduling habits during your peak performance hours for better success.`,
        category: 'Productivity',
        frequency: 'daily',
        target: 1,
        color: '#10B981'
      }

      try {
        const response = await fetch('/api/habits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(timingHabit)
        })

        if (response.ok) {
          onRefresh?.()
          console.log('Created optimal timing reminder')
        }
      } catch (error) {
        console.error('Error creating timing habit:', error)
      }
    }
  }

  const handlePredictionAction = async (insight: AIInsight) => {
    if (insight.data?.habitId) {
      // Create a streak recovery or reminder habit
      const habit = habits.find(h => h.id === insight.data.habitId)
      if (habit) {
        const recoveryHabit = {
          title: `${habit.title} - Extra Support`,
          description: `AI detected this habit might need extra attention. This is your backup reminder and motivation.`,
          category: 'Support',
          frequency: 'daily',
          target: 1,
          color: '#EF4444'
        }

        try {
          const response = await fetch('/api/habits', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(recoveryHabit)
          })

          if (response.ok) {
            onRefresh?.()
            console.log(`Created support habit for ${habit.title}`)
          }
        } catch (error) {
          console.error('Error creating support habit:', error)
        }
      }
    }
  }

  const getCategoryColor = (category: string): string => {
    const colorMap: { [key: string]: string } = {
      'Health': '#10B981',
      'Productivity': '#3B82F6',
      'Wellness': '#8B5CF6',
      'Learning': '#F59E0B',
      'General': '#6B7280'
    }
    return colorMap[category] || '#6B7280'
  }

  const getActionLabel = (type: string): string => {
    switch (type) {
      case 'recommendation':
        return 'Create Habit'
      case 'pattern':
        return 'Use Pattern'
      case 'optimization':
        return 'Optimize'
      case 'prediction':
        return 'Add Support'
      default:
        return 'Take Action'
    }
  }

  const shouldShowActionButton = (insight: AIInsight): boolean => {
    // Show action button if explicitly set to true, or if actionable and not explicitly set to false
    return insight.showActionButton === true || (insight.actionable === true && insight.showActionButton !== false)
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg animate-pulse"></div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI Insights</h2>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="space-y-4">
        {/* Notification Display */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`p-3 rounded-lg border ${
                notification.type === 'success' 
                  ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200'
                  : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{notification.message}</span>
                <button
                  onClick={() => setNotification(null)}
                  className="ml-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AI Insights</h2>
          </div>
          {isLoading && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Analyzing...</span>
            </div>
          )}
        </div>

        {/* Tomorrow's Predictions */}
        {Object.keys(predictions).length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-500" />
              Tomorrow's Predictions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(predictions).map(([habitId, prediction]) => {
                const habit = habits.find(h => h.id === habitId)
                if (!habit) return null

                const probability = prediction.probability
                const isHighRisk = probability < 0.4
                const isHighSuccess = probability > 0.8

                return (
                  <motion.div
                    key={habitId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg border ${
                      isHighRisk 
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                        : isHighSuccess
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white truncate">
                        {habit.title}
                      </h4>
                      <div className={`text-sm font-bold ${
                        isHighRisk ? 'text-red-600 dark:text-red-400' 
                        : isHighSuccess ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {Math.round(probability * 100)}%
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          isHighRisk ? 'bg-red-500' 
                          : isHighSuccess ? 'bg-green-500'
                          : 'bg-yellow-500'
                        }`}
                        style={{ width: `${probability * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {prediction.recommendation}
                    </p>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}

        {/* AI Insights */}
        <div className="space-y-4">
          <AnimatePresence>
            {insights.map((insight, index) => {
              const IconComponent = getInsightIcon(insight.type)
              const isExpanded = expandedInsight === index

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${getInsightBgColor(insight.priority)}`}
                  onClick={() => setExpandedInsight(isExpanded ? null : index)}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${getInsightColor(insight.priority, insight.type)} flex items-center justify-center flex-shrink-0`}>
                      <IconComponent className="w-4 h-4 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                          {insight.title}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatConfidence(insight.confidence)} confident
                          </span>
                          <ChevronRight 
                            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                          />
                        </div>
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-300 text-sm mt-1 leading-relaxed">
                        {insight.description}
                      </p>

                      <AnimatePresence>
                        {isExpanded && insight.data && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600"
                          >
                            {insight.type === 'pattern' && insight.data.bestDay && (
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                <strong>Best Day:</strong> {insight.data.bestDay} ({Math.round(insight.data.rate * 100)}% success rate)
                              </div>
                            )}
                            
                            {insight.type === 'optimization' && insight.data.worstDay && (
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                <strong>Needs Improvement:</strong> {insight.data.worstDay} ({Math.round(insight.data.rate * 100)}% success rate)
                              </div>
                            )}
                            
                            {insight.type === 'pattern' && insight.data.correlation && (
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                <strong>Correlation Strength:</strong> {Math.round(insight.data.correlation * 100)}%
                              </div>
                            )}
                            
                            {shouldShowActionButton(insight) && (
                              <div className="mt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs"
                                  disabled={actionLoading === index}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleTakeAction(insight, index)
                                  }}
                                >
                                  {actionLoading === index ? (
                                    <div className="w-3 h-3 mr-1 animate-spin rounded-full border border-gray-400 border-t-transparent"></div>
                                  ) : (
                                    <Zap className="w-3 h-3 mr-1" />
                                  )}
                                  {actionLoading === index ? 'Creating...' : getActionLabel(insight.type)}
                                </Button>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {insights.length === 0 && (
            <div className="text-center py-8">
              <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No insights yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Complete more habits to unlock AI-powered insights and predictions!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 