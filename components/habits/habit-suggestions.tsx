'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Lightbulb, 
  Plus, 
  X, 
  Star,
  TrendingUp,
  Clock,
  Target,
  Brain,
  Sparkles,
  CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface HabitSuggestion {
  id: string
  title: string
  description: string
  category: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  estimatedTime: string
  benefits: string[]
  color: string
  confidence: number
  reason: string
}

interface HabitSuggestionsProps {
  onAddSuggestion: (suggestion: HabitSuggestion) => void
  userHabits: Array<{ title: string; category?: string }>
}

export default function HabitSuggestions({ onAddSuggestion, userHabits }: HabitSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<HabitSuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Smart suggestions based on user's existing habits
  const generateSmartSuggestions = (): HabitSuggestion[] => {
    const existingCategories = userHabits.map(h => h.category).filter(Boolean)
    const baseHabits: HabitSuggestion[] = [
      {
        id: '1',
        title: 'Morning Meditation',
        description: 'Start your day with 10 minutes of mindfulness meditation',
        category: 'Wellness',
        difficulty: 'Easy',
        estimatedTime: '10 minutes',
        benefits: ['Reduces stress', 'Improves focus', 'Better emotional regulation'],
        color: '#8B5CF6',
        confidence: 0.92,
        reason: 'Most successful habit trackers start with mindfulness practices'
      },
      {
        id: '2',
        title: 'Daily Reading',
        description: 'Read for 20 minutes every day to expand knowledge',
        category: 'Learning',
        difficulty: 'Easy',
        estimatedTime: '20 minutes',
        benefits: ['Improves vocabulary', 'Expands knowledge', 'Enhances focus'],
        color: '#10B981',
        confidence: 0.88,
        reason: 'Reading creates compound learning benefits over time'
      },
      {
        id: '3',
        title: 'Evening Walk',
        description: 'Take a 15-minute walk to unwind and reflect',
        category: 'Fitness',
        difficulty: 'Easy',
        estimatedTime: '15 minutes',
        benefits: ['Improves cardiovascular health', 'Reduces stress', 'Better sleep'],
        color: '#F59E0B',
        confidence: 0.85,
        reason: 'Light exercise in the evening promotes better sleep patterns'
      },
      {
        id: '4',
        title: 'Gratitude Journal',
        description: 'Write down 3 things you\'re grateful for each day',
        category: 'Wellness',
        difficulty: 'Easy',
        estimatedTime: '5 minutes',
        benefits: ['Improves mood', 'Increases life satisfaction', 'Better relationships'],
        color: '#EF4444',
        confidence: 0.90,
        reason: 'Gratitude practices have strong scientific backing for mental health'
      },
      {
        id: '5',
        title: 'Drink 8 Glasses of Water',
        description: 'Stay hydrated throughout the day',
        category: 'Health',
        difficulty: 'Medium',
        estimatedTime: 'Throughout day',
        benefits: ['Better energy', 'Clearer skin', 'Improved metabolism'],
        color: '#06B6D4',
        confidence: 0.87,
        reason: 'Hydration is fundamental for all bodily functions'
      },
      {
        id: '6',
        title: 'Learn New Skill',
        description: 'Dedicate 30 minutes to learning something new',
        category: 'Learning',
        difficulty: 'Medium',
        estimatedTime: '30 minutes',
        benefits: ['Career growth', 'Mental stimulation', 'Personal satisfaction'],
        color: '#8B5CF6',
        confidence: 0.83,
        reason: 'Continuous learning is key to personal and professional growth'
      },
      {
        id: '7',
        title: 'Digital Detox Hour',
        description: 'One hour before bed without screens',
        category: 'Wellness',
        difficulty: 'Hard',
        estimatedTime: '1 hour',
        benefits: ['Better sleep quality', 'Reduced anxiety', 'More present relationships'],
        color: '#6366F1',
        confidence: 0.79,
        reason: 'Screen time before bed significantly impacts sleep quality'
      }
    ]

    // If user has fitness habits, suggest complementary ones
    if (existingCategories.includes('Fitness')) {
      baseHabits.push({
        id: '8',
        title: 'Post-Workout Protein',
        description: 'Have a protein-rich snack within 30 minutes of exercising',
        category: 'Nutrition',
        difficulty: 'Easy',
        estimatedTime: '5 minutes',
        benefits: ['Better muscle recovery', 'Improved performance', 'Sustained energy'],
        color: '#F97316',
        confidence: 0.91,
        reason: 'Since you exercise regularly, proper nutrition will amplify your results'
      })
    }

    // If user has learning habits, suggest complementary ones
    if (existingCategories.includes('Learning')) {
      baseHabits.push({
        id: '9',
        title: 'Daily Note Review',
        description: 'Spend 10 minutes reviewing and organizing your notes',
        category: 'Learning',
        difficulty: 'Easy',
        estimatedTime: '10 minutes',
        benefits: ['Better retention', 'Improved organization', 'Enhanced insights'],
        color: '#10B981',
        confidence: 0.86,
        reason: 'Since you\'re already learning, reviewing notes will improve retention significantly'
      })
    }

    return baseHabits.sort((a, b) => b.confidence - a.confidence).slice(0, 6)
  }

  useEffect(() => {
    // Simulate AI processing
    const timer = setTimeout(() => {
      setSuggestions(generateSmartSuggestions())
      setLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [userHabits])

  const categories = ['all', 'Wellness', 'Fitness', 'Learning', 'Health', 'Nutrition']
  const filteredSuggestions = selectedCategory === 'all' 
    ? suggestions 
    : suggestions.filter(s => s.category === selectedCategory)

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'Hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-2 mb-6">
          <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Brain className="w-4 h-4 text-white animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI Habit Suggestions</h2>
        </div>
        
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-6">
          <Sparkles className="w-8 h-8 text-purple-500 mx-auto animate-spin" />
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Analyzing your patterns to suggest perfect habits...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Lightbulb className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Smart Suggestions</h2>
        </div>
        <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
          AI Powered
        </Badge>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="capitalize"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Suggestions Grid */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredSuggestions.map((suggestion, index) => (
            <motion.div
              key={suggestion.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: suggestion.color }}
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {suggestion.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {suggestion.description}
                    </p>
                  </div>
                </div>
                
                <Button
                  size="sm"
                  onClick={() => onAddSuggestion(suggestion)}
                  className="flex items-center space-x-1 flex-shrink-0"
                  style={{ backgroundColor: suggestion.color }}
                >
                  <Plus className="w-3 h-3" />
                  <span>Add</span>
                </Button>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <Badge className={getDifficultyColor(suggestion.difficulty)}>
                    {suggestion.difficulty}
                  </Badge>
                  <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>{suggestion.estimatedTime}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                    <Star className="w-3 h-3" />
                    <span>{Math.round(suggestion.confidence * 100)}% match</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <span className="font-medium">Why this habit: </span>
                  {suggestion.reason}
                </p>
              </div>

              <div className="mt-3">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Benefits:</p>
                <div className="flex flex-wrap gap-1">
                  {suggestion.benefits.map((benefit, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {benefit}
                    </Badge>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredSuggestions.length === 0 && (
        <div className="text-center py-8">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            No suggestions found for this category.
          </p>
        </div>
      )}
    </div>
  )
} 