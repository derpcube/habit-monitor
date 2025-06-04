import * as tf from '@tensorflow/tfjs'

interface HabitData {
  id: string
  title: string
  entries: Array<{
    date: string
    completed: boolean
    value: number
    completedAt?: string
    timeOfDay?: string
    mood?: number
    difficulty?: number
    notes?: string
  }>
  category?: string
  frequency: string
  createdAt?: string
}

interface AIInsight {
  type: 'prediction' | 'pattern' | 'recommendation' | 'streak' | 'optimization'
  title: string
  description: string
  confidence: number
  actionable?: boolean
  priority: 'high' | 'medium' | 'low'
  data?: any
  showActionButton?: boolean
  recommendationId?: string
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

interface EnhancedHabit {
  id: string
  title: string
  entries: HabitEntry[]
  category?: string
  frequency: string
  color: string
}

export class HabitAnalyticsAI {
  private model?: tf.LayersModel
  private usedRecommendations: Set<string> = new Set()
  private isInitialized: boolean = false
  private isClient: boolean = false
  
  constructor() {
    // Only initialize on client side
    this.isClient = typeof window !== 'undefined'
    if (this.isClient && !this.isInitialized) {
      this.initializeModel()
    }
  }

  private async initializeModel() {
    // Skip if already initialized or not on client
    if (this.isInitialized || !this.isClient) {
      return
    }

    try {
      // Dispose any existing models to prevent variable conflicts
      if (this.model) {
        this.model.dispose()
      }

      // Create a unique name scope to avoid conflicts
      const timestamp = Date.now()
      const modelName = `habit_model_${timestamp}`
      
      // Create a simple neural network for habit completion prediction
      this.model = tf.sequential({
        name: modelName,
        layers: [
          tf.layers.dense({ 
            inputShape: [7], 
            units: 16, 
            activation: 'relu',
            name: `dense1_${timestamp}`
          }),
          tf.layers.dropout({ 
            rate: 0.2,
            name: `dropout_${timestamp}`
          }),
          tf.layers.dense({ 
            units: 8, 
            activation: 'relu',
            name: `dense2_${timestamp}`
          }),
          tf.layers.dense({ 
            units: 1, 
            activation: 'sigmoid',
            name: `output_${timestamp}`
          })
        ]
      })

      this.model.compile({
        optimizer: 'adam',
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      })

      this.isInitialized = true
    } catch (error) {
      console.warn('TensorFlow.js model initialization failed:', error)
      // Continue without the model - analytics will work without ML predictions
      this.model = undefined
      this.isInitialized = true
    }
  }

  // Initialize the recommendation tracking system
  public setUsedRecommendations(usedRecommendations: string[]) {
    this.usedRecommendations = new Set(usedRecommendations)
  }

  // Check if a recommendation has been used
  private isRecommendationUsed(recommendationType: string, data: any): boolean {
    const recommendationKey = this.generateRecommendationKey(recommendationType, data)
    return this.usedRecommendations.has(recommendationKey)
  }

  // Generate a unique key for a recommendation
  private generateRecommendationKey(type: string, data: any): string {
    switch (type) {
      case 'timing_optimization':
        return `timing_${data.optimalHours?.map((h: any) => h.hour).join(',')}`
      case 'day_optimization':
        return `day_${data.bestDay || data.worstDay}`
      case 'habit_correlation':
        return `correlation_${data.habit1}_${data.habit2}`
      case 'habit_suggestion':
        return `suggestion_${data.recommendedHabit?.title}`
      case 'habit_stacking':
        return `stacking_${data.habit1}_${data.habit2}`
      default:
        return `${type}_${JSON.stringify(data).slice(0, 50)}`
    }
  }

  // Mark a recommendation as used
  public markRecommendationAsUsed(recommendationType: string, data: any): string {
    const recommendationKey = this.generateRecommendationKey(recommendationType, data)
    this.usedRecommendations.add(recommendationKey)
    return recommendationKey
  }

  // Analyze completion patterns for a specific day of week
  private analyzeWeekdayPatterns(habits: HabitData[]): AIInsight[] {
    const insights: AIInsight[] = []
    const weekdayStats: { [key: number]: { completed: number; total: number } } = {}

    habits.forEach(habit => {
      habit.entries.forEach(entry => {
        const date = new Date(entry.date)
        const dayOfWeek = date.getDay()
        
        if (!weekdayStats[dayOfWeek]) {
          weekdayStats[dayOfWeek] = { completed: 0, total: 0 }
        }
        
        weekdayStats[dayOfWeek].total++
        if (entry.completed) weekdayStats[dayOfWeek].completed++
      })
    })

    // Find best and worst performing days
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayPerformances = Object.entries(weekdayStats).map(([day, stats]) => ({
      day: parseInt(day),
      dayName: dayNames[parseInt(day)],
      rate: stats.total > 0 ? stats.completed / stats.total : 0,
      total: stats.total
    })).filter(d => d.total >= 3) // Only consider days with enough data

    if (dayPerformances.length > 0) {
      const bestDay = dayPerformances.reduce((max, current) => current.rate > max.rate ? current : max)
      const worstDay = dayPerformances.reduce((min, current) => current.rate < min.rate ? current : min)

      if (bestDay.rate > 0.8 && !this.isRecommendationUsed('day_optimization', { bestDay: bestDay.dayName })) {
        insights.push({
          type: 'pattern',
          title: `${bestDay.dayName} Champion`,
          description: `You perform exceptionally well on ${bestDay.dayName}s with a ${Math.round(bestDay.rate * 100)}% completion rate. Consider scheduling your most important habits on this day.`,
          confidence: 0.9,
          actionable: true,
          showActionButton: true,
          priority: 'medium',
          data: { bestDay: bestDay.dayName, rate: bestDay.rate, recommendationType: 'day_optimization' }
        })
      }

      if (worstDay.rate < 0.5 && worstDay.total >= 5 && !this.isRecommendationUsed('day_optimization', { worstDay: worstDay.dayName })) {
        insights.push({
          type: 'optimization',
          title: `${worstDay.dayName} Needs Attention`,
          description: `Your completion rate drops to ${Math.round(worstDay.rate * 100)}% on ${worstDay.dayName}s. Consider reducing habit load or creating special motivation for this day.`,
          confidence: 0.8,
          actionable: true,
          showActionButton: true,
          priority: 'high',
          data: { worstDay: worstDay.dayName, rate: worstDay.rate, recommendationType: 'day_optimization' }
        })
      }

      // Add informational insights (without action buttons) for moderate performance days
      if (bestDay.rate > 0.6 && bestDay.rate <= 0.8) {
        insights.push({
          type: 'pattern',
          title: `${bestDay.dayName} Performance`,
          description: `You have a solid ${Math.round(bestDay.rate * 100)}% completion rate on ${bestDay.dayName}s. This is a reliable day for your habits.`,
          confidence: 0.7,
          actionable: false,
          showActionButton: false,
          priority: 'low',
          data: { bestDay: bestDay.dayName, rate: bestDay.rate }
        })
      }
    }

    return insights
  }

  // Predict streak vulnerability
  private analyzeStreakVulnerability(habits: HabitData[]): AIInsight[] {
    const insights: AIInsight[] = []

    habits.forEach(habit => {
      const recentEntries = habit.entries
        .slice(-14) // Last 14 days
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      if (recentEntries.length < 7) return

      const completionPattern = recentEntries.map(e => e.completed ? 1 : 0)
      const recentCompletionRate = completionPattern.reduce((sum: number, val: number) => sum + val, 0) / completionPattern.length

      // Calculate streak stability (variance in recent performance)
      const variance = this.calculateVariance(completionPattern)
      
      if (recentCompletionRate > 0.7 && variance > 0.15) {
        insights.push({
          type: 'prediction',
          title: `"${habit.title}" Streak at Risk`,
          description: `Your ${habit.title} habit shows inconsistent patterns recently. There's a ${Math.round((1 - recentCompletionRate) * 100)}% chance of missing it tomorrow. Consider setting a reminder or simplifying the habit.`,
          confidence: 0.75,
          actionable: true,
          priority: 'high',
          data: { habitId: habit.id, riskScore: 1 - recentCompletionRate }
        })
      }
    })

    return insights
  }

  // Find habit correlations
  private findHabitCorrelations(habits: HabitData[]): AIInsight[] {
    const insights: AIInsight[] = []
    
    if (habits.length < 2) return insights

    for (let i = 0; i < habits.length; i++) {
      for (let j = i + 1; j < habits.length; j++) {
        const habit1 = habits[i]
        const habit2 = habits[j]
        
        const correlation = this.calculateHabitCorrelation(habit1, habit2)
        
        if (correlation > 0.6 && !this.isRecommendationUsed('habit_correlation', { habit1: habit1.title, habit2: habit2.title })) {
          insights.push({
            type: 'pattern',
            title: `Strong Connection Found`,
            description: `"${habit1.title}" and "${habit2.title}" show a ${Math.round(correlation * 100)}% correlation. When you complete one, you're very likely to complete the other. Consider pairing them together.`,
            confidence: correlation,
            actionable: true,
            showActionButton: true,
            priority: 'medium',
            data: { 
              habit1: habit1.title, 
              habit2: habit2.title, 
              correlation,
              recommendationType: 'habit_correlation'
            }
          })
        }
      }
    }

    return insights
  }

  // Recommend optimal habit timing
  private analyzeOptimalTiming(habits: HabitData[]): AIInsight[] {
    const insights: AIInsight[] = []
    
    const hourlyStats: { [hour: number]: { completed: number; total: number } } = {}
    const timeOfDayStats: { [period: string]: { completed: number; total: number } } = {}

    habits.forEach(habit => {
      habit.entries.forEach(entry => {
        // Use completedAt if available, otherwise fall back to entry date
        const date = entry.completedAt ? new Date(entry.completedAt) : new Date(entry.date)
        const hour = date.getHours()
        
        if (!hourlyStats[hour]) {
          hourlyStats[hour] = { completed: 0, total: 0 }
        }
        
        hourlyStats[hour].total++
        if (entry.completed) {
          hourlyStats[hour].completed++
        }

        // Use timeOfDay if available
        if (entry.timeOfDay && entry.completed) {
          if (!timeOfDayStats[entry.timeOfDay]) {
            timeOfDayStats[entry.timeOfDay] = { completed: 0, total: 0 }
          }
          timeOfDayStats[entry.timeOfDay].completed++
          timeOfDayStats[entry.timeOfDay].total++
        }
      })
    })

    // Find optimal hours
    const hourlyPerformance = Object.entries(hourlyStats)
      .map(([hour, stats]) => ({
        hour: parseInt(hour),
        rate: stats.total > 0 ? stats.completed / stats.total : 0,
        total: stats.total
      }))
      .filter(h => h.total >= 3)
      .sort((a, b) => b.rate - a.rate)

    if (hourlyPerformance.length > 0) {
      const bestHours = hourlyPerformance.slice(0, 3)
      const timeRanges = this.formatTimeRanges(bestHours.map(h => h.hour))
      
      if (!this.isRecommendationUsed('timing_optimization', { optimalHours: bestHours })) {
        insights.push({
          type: 'optimization',
          title: 'Your Peak Performance Hours',
          description: `You're most successful with habits during ${timeRanges}. Consider scheduling new habits during these windows for better success rates.`,
          confidence: 0.8,
          actionable: false, // Making this informational only
          showActionButton: false,
          priority: 'medium',
          data: { optimalHours: bestHours, recommendationType: 'timing_optimization' }
        })
      }
    }

    // Analyze time of day patterns if data is available
    if (Object.keys(timeOfDayStats).length > 0) {
      const timeOfDayPerformance = Object.entries(timeOfDayStats)
        .map(([period, stats]) => ({
          period,
          rate: stats.total > 0 ? stats.completed / stats.total : 0,
          total: stats.total
        }))
        .filter(p => p.total >= 3)
        .sort((a, b) => b.rate - a.rate)

      if (timeOfDayPerformance.length > 0) {
        const bestPeriod = timeOfDayPerformance[0]
        
        insights.push({
          type: 'pattern',
          title: `Best Time of Day: ${bestPeriod.period.charAt(0).toUpperCase() + bestPeriod.period.slice(1)}`,
          description: `You complete ${Math.round(bestPeriod.rate * 100)}% of your habits during ${bestPeriod.period} sessions. This is your optimal productivity window.`,
          confidence: 0.85,
          actionable: false,
          showActionButton: false,
          priority: 'medium',
          data: { bestPeriod: bestPeriod.period, rate: bestPeriod.rate }
        })
      }
    }

    // Find energy level patterns
    const energyInsights = this.analyzeEnergyPatterns(hourlyPerformance)
    insights.push(...energyInsights)

    return insights
  }

  // Generate smart habit recommendations
  private generateSmartRecommendations(habits: HabitData[]): AIInsight[] {
    const insights: AIInsight[] = []
    
    // Analyze categories
    const categories = new Map<string, number>()
    habits.forEach(habit => {
      const category = habit.category || 'General'
      categories.set(category, (categories.get(category) || 0) + 1)
    })

    // Recommend complementary habits based on existing ones
    const recommendations = this.getComplementaryHabits(habits)
    
    recommendations.forEach(rec => {
      if (!this.isRecommendationUsed('habit_suggestion', { recommendedHabit: rec })) {
        insights.push({
          type: 'recommendation',
          title: `Suggested: ${rec.title}`,
          description: rec.description,
          confidence: rec.confidence,
          actionable: true,
          showActionButton: true,
          priority: 'medium',
          data: { 
            recommendedHabit: rec,
            recommendationType: 'habit_suggestion'
          }
        })
      }
    })

    // Add habit stacking recommendations
    const stackingRecommendations = this.generateHabitStackingRecommendations(habits)
    insights.push(...stackingRecommendations)

    // Add difficulty adjustment recommendations
    const difficultyRecommendations = this.analyzeDifficultyAdjustments(habits)
    insights.push(...difficultyRecommendations)

    // Add recovery strategy recommendations
    const recoveryRecommendations = this.generateRecoveryStrategies(habits)
    insights.push(...recoveryRecommendations)

    return insights
  }

  // Generate habit stacking recommendations
  private generateHabitStackingRecommendations(habits: HabitData[]): AIInsight[] {
    const insights: AIInsight[] = []
    
    // Find habits that are often completed on the same day
    const dailyCompletions = new Map<string, Set<string>>()
    
    habits.forEach(habit => {
      habit.entries.forEach(entry => {
        if (entry.completed) {
          const date = entry.date.split('T')[0]
          if (!dailyCompletions.has(date)) {
            dailyCompletions.set(date, new Set())
          }
          dailyCompletions.get(date)!.add(habit.id)
        }
      })
    })

    // Find potential stacking opportunities
    const stackingOpportunities = new Map<string, number>()
    
    for (const [date, habitIds] of Array.from(dailyCompletions.entries())) {
      if (habitIds.size >= 2) {
        const habitArray = Array.from(habitIds).sort()
        for (let i = 0; i < habitArray.length; i++) {
          for (let j = i + 1; j < habitArray.length; j++) {
            const pair = `${habitArray[i]}:${habitArray[j]}`
            stackingOpportunities.set(pair, (stackingOpportunities.get(pair) || 0) + 1)
          }
        }
      }
    }

    // Generate recommendations for high-frequency pairs
    for (const [pair, frequency] of Array.from(stackingOpportunities.entries())) {
      if (frequency >= 5) { // At least 5 co-occurrences
        const [habit1Id, habit2Id] = pair.split(':')
        const habit1 = habits.find(h => h.id === habit1Id)
        const habit2 = habits.find(h => h.id === habit2Id)
        
        if (habit1 && habit2 && !this.isRecommendationUsed('habit_stacking', { habit1: habit1.title, habit2: habit2.title })) {
          insights.push({
            type: 'pattern',
            title: 'Habit Stacking Opportunity',
            description: `You often complete "${habit1.title}" and "${habit2.title}" on the same day. Consider doing them consecutively to build a powerful habit stack.`,
            confidence: Math.min(0.9, frequency / 10),
            actionable: true,
            showActionButton: true,
            priority: 'medium',
            data: { 
              habit1: habit1.title, 
              habit2: habit2.title, 
              frequency,
              stackingType: 'sequential',
              recommendationType: 'habit_stacking'
            }
          })
        }
      }
    }

    return insights
  }

  // Analyze difficulty adjustments needed
  private analyzeDifficultyAdjustments(habits: HabitData[]): AIInsight[] {
    const insights: AIInsight[] = []
    
    habits.forEach(habit => {
      const recentEntries = habit.entries.slice(-21) // Last 3 weeks
      if (recentEntries.length < 14) return // Need at least 2 weeks of data
      
      const completionRate = recentEntries.filter(e => e.completed).length / recentEntries.length
      
      // Suggest making habit easier if completion rate is very low
      if (completionRate < 0.3) {
        insights.push({
          type: 'optimization',
          title: `Simplify "${habit.title}"`,
          description: `Your completion rate for this habit is ${Math.round(completionRate * 100)}%. Consider breaking it into smaller steps or reducing the target to build momentum.`,
          confidence: 0.8,
          actionable: true,
          priority: 'high',
          data: { 
            habitId: habit.id, 
            currentRate: completionRate,
            adjustment: 'simplify' 
          }
        })
      }
      
      // Suggest making habit more challenging if completion rate is very high
      else if (completionRate > 0.9 && recentEntries.length >= 21) {
        insights.push({
          type: 'optimization',
          title: `Level Up "${habit.title}"`,
          description: `You're crushing this habit with ${Math.round(completionRate * 100)}% completion! Consider increasing the challenge or adding a related habit.`,
          confidence: 0.7,
          actionable: true,
          priority: 'medium',
          data: { 
            habitId: habit.id, 
            currentRate: completionRate,
            adjustment: 'challenge' 
          }
        })
      }
    })
    
    return insights
  }

  // Generate recovery strategies for broken streaks
  private generateRecoveryStrategies(habits: HabitData[]): AIInsight[] {
    const insights: AIInsight[] = []
    
    habits.forEach(habit => {
      const recentEntries = habit.entries
        .slice(-7) // Last week
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      
      if (recentEntries.length < 5) return
      
      // Check if there was a recent streak break
      const missedDays = recentEntries.filter(e => !e.completed).length
      const completedDays = recentEntries.filter(e => e.completed).length
      
      if (missedDays >= 2 && completedDays >= 2) {
        // They've had both successes and failures recently - good recovery candidate
        insights.push({
          type: 'optimization',
          title: `Recovery Plan for "${habit.title}"`,
          description: `You've missed ${missedDays} days recently but also succeeded ${completedDays} times. Focus on consistency over perfection - aim for just completing it once in the next 2 days.`,
          confidence: 0.75,
          actionable: true,
          priority: 'medium',
          data: { 
            habitId: habit.id, 
            missedDays, 
            completedDays,
            strategy: 'recovery' 
          }
        })
      }
    })
    
    return insights
  }

  // Analyze energy patterns throughout the day
  private analyzeEnergyPatterns(hourlyPerformance: Array<{hour: number, rate: number, total: number}>): AIInsight[] {
    const insights: AIInsight[] = []
    
    if (hourlyPerformance.length < 4) return insights
    
    // Group hours into time periods
    const morningHours = hourlyPerformance.filter(h => h.hour >= 6 && h.hour < 12)
    const afternoonHours = hourlyPerformance.filter(h => h.hour >= 12 && h.hour < 17)
    const eveningHours = hourlyPerformance.filter(h => h.hour >= 17 && h.hour < 22)
    
    const periods = [
      { name: 'morning', hours: morningHours, label: 'Morning (6 AM - 12 PM)' },
      { name: 'afternoon', hours: afternoonHours, label: 'Afternoon (12 PM - 5 PM)' },
      { name: 'evening', hours: eveningHours, label: 'Evening (5 PM - 10 PM)' }
    ].filter(p => p.hours.length > 0)
    
    // Calculate average performance for each period
    const periodPerformance = periods.map(period => ({
      ...period,
      avgRate: period.hours.reduce((sum, h) => sum + h.rate, 0) / period.hours.length
    })).sort((a, b) => b.avgRate - a.avgRate)
    
    if (periodPerformance.length >= 2) {
      const bestPeriod = periodPerformance[0]
      const worstPeriod = periodPerformance[periodPerformance.length - 1]
      
      if (bestPeriod.avgRate - worstPeriod.avgRate > 0.2) {
        insights.push({
          type: 'pattern',
          title: 'Energy Level Pattern Detected',
          description: `You perform ${Math.round((bestPeriod.avgRate - worstPeriod.avgRate) * 100)}% better in the ${bestPeriod.name} compared to ${worstPeriod.name}. Plan your most important habits accordingly.`,
          confidence: 0.75,
          actionable: false, // Making this informational only
          showActionButton: false,
          priority: 'medium',
          data: { 
            bestPeriod: bestPeriod.name,
            worstPeriod: worstPeriod.name,
            difference: bestPeriod.avgRate - worstPeriod.avgRate
          }
        })
      }
    }
    
    return insights
  }

  // Helper methods
  private calculateVariance(data: number[]): number {
    const mean = data.reduce((sum: number, val: number) => sum + val, 0) / data.length
    const squaredDiffs = data.map(val => Math.pow(val - mean, 2))
    return squaredDiffs.reduce((sum: number, val: number) => sum + val, 0) / data.length
  }

  private calculateHabitCorrelation(habit1: HabitData, habit2: HabitData): number {
    const dates1 = new Set(habit1.entries.map(e => e.date.split('T')[0]))
    const dates2 = new Set(habit2.entries.map(e => e.date.split('T')[0]))
    
    const commonDates = Array.from(dates1).filter(date => dates2.has(date))
    
    if (commonDates.length < 5) return 0 // Need enough data
    
    let bothCompleted = 0
    let eitherCompleted = 0
    
    commonDates.forEach(date => {
      const entry1 = habit1.entries.find(e => e.date.split('T')[0] === date)
      const entry2 = habit2.entries.find(e => e.date.split('T')[0] === date)
      
      if (entry1?.completed && entry2?.completed) {
        bothCompleted++
      }
      if (entry1?.completed || entry2?.completed) {
        eitherCompleted++
      }
    })
    
    return eitherCompleted > 0 ? bothCompleted / eitherCompleted : 0
  }

  private formatTimeRanges(hours: number[]): string {
    if (hours.length === 0) return 'various times'
    
    const ranges: string[] = []
    
    hours.forEach(hour => {
      if (hour >= 6 && hour < 12) {
        ranges.push('morning')
      } else if (hour >= 12 && hour < 17) {
        ranges.push('afternoon')
      } else if (hour >= 17 && hour < 21) {
        ranges.push('evening')
      } else {
        ranges.push('night')
      }
    })
    
    return Array.from(new Set(ranges)).join(' and ')
  }

  private getComplementaryHabits(existingHabits: HabitData[]): Array<{
    title: string
    description: string
    confidence: number
    category: string
  }> {
    const recommendations = []
    const categories = existingHabits.map(h => h.category || 'General')
    
    // Health & fitness recommendations
    if (categories.includes('Health') && !existingHabits.some(h => h.title.toLowerCase().includes('water'))) {
      recommendations.push({
        title: 'Drink 8 glasses of water',
        description: 'Since you have health habits, staying hydrated will amplify their benefits.',
        confidence: 0.8,
        category: 'Health'
      })
    }
    
    // Productivity recommendations
    if (categories.includes('Productivity') && !existingHabits.some(h => h.title.toLowerCase().includes('meditation'))) {
      recommendations.push({
        title: '10-minute morning meditation',
        description: 'Meditation can significantly boost your existing productivity habits.',
        confidence: 0.75,
        category: 'Wellness'
      })
    }
    
    // Learning recommendations
    if (existingHabits.length >= 3 && !categories.includes('Learning')) {
      recommendations.push({
        title: 'Read for 20 minutes',
        description: 'Adding a learning habit can create synergy with your existing routine.',
        confidence: 0.7,
        category: 'Learning'
      })
    }
    
    return recommendations.slice(0, 2) // Limit to 2 recommendations
  }

  // Main analysis function that integrates all the enhanced analytics
  public async analyzeHabits(habits: HabitData[]): Promise<AIInsight[]> {
    if (!habits || habits.length === 0) {
      return [{
        type: 'recommendation',
        title: 'Start Your Journey',
        description: 'Create your first habit to begin receiving AI-powered insights and recommendations!',
        confidence: 1.0,
        actionable: true,
        priority: 'high'
      }]
    }

    const allInsights: AIInsight[] = [
      ...this.analyzeWeekdayPatterns(habits),
      ...this.analyzeStreakVulnerability(habits),
      ...this.findHabitCorrelations(habits),
      ...this.analyzeOptimalTiming(habits),
      ...this.generateSmartRecommendations(habits),
      ...this.analyzeEnhancedPatterns(habits),
      ...this.analyzeTimePatterns(habits),
      ...this.analyzeMoodCorrelations(habits),
      ...this.analyzeDifficultyTrends(habits),
    ]

    // Sort by priority and confidence
    return allInsights
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
        if (priorityDiff !== 0) return priorityDiff
        return b.confidence - a.confidence
      })
      .slice(0, 8) // Limit to top 8 insights
  }

  analyzeEnhancedPatterns(habits: HabitData[]): AIInsight[] {
    const insights: AIInsight[] = []
    
    habits.forEach(habit => {
      const completedEntries = habit.entries.filter(e => e.completed)
      
      if (completedEntries.length < 5) return
      
      // Analyze completion times
      const completionTimes = completedEntries
        .filter(e => e.completedAt)
        .map(e => new Date(e.completedAt!).getHours())
      
      if (completionTimes.length >= 3) {
        const avgHour = completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
        const timeOfDay = avgHour < 12 ? 'morning' : avgHour < 17 ? 'afternoon' : 'evening'
        
        insights.push({
          type: 'pattern',
          title: `Optimal Time Pattern for ${habit.title}`,
          description: `You typically complete "${habit.title}" in the ${timeOfDay} (around ${Math.round(avgHour)}:00). Consider scheduling it during this time consistently.`,
          confidence: 0.8,
          priority: 'medium',
          actionable: true,
          data: { habitId: habit.id, optimalTime: timeOfDay, avgHour }
        })
      }
    })
    
    return insights
  }

  analyzeTimePatterns(habits: HabitData[]): AIInsight[] {
    const insights: AIInsight[] = []
    
    // Analyze time-of-day success rates
    const timeSuccessRates: Record<string, { completed: number; total: number }> = {
      morning: { completed: 0, total: 0 },
      afternoon: { completed: 0, total: 0 },
      evening: { completed: 0, total: 0 },
      night: { completed: 0, total: 0 }
    }
    
    habits.forEach(habit => {
      habit.entries.forEach(entry => {
        if (entry.timeOfDay) {
          timeSuccessRates[entry.timeOfDay].total++
          if (entry.completed) {
            timeSuccessRates[entry.timeOfDay].completed++
          }
        }
      })
    })
    
    // Find best performing time of day
    let bestTime = 'morning'
    let bestRate = 0
    
    Object.entries(timeSuccessRates).forEach(([time, stats]) => {
      if (stats.total >= 5) {
        const rate = stats.completed / stats.total
        if (rate > bestRate) {
          bestRate = rate
          bestTime = time
        }
      }
    })
    
    if (bestRate > 0.8) {
      insights.push({
        type: 'optimization',
        title: `Peak Performance Time Identified`,
        description: `Your ${bestTime} habits have a ${Math.round(bestRate * 100)}% success rate. Consider moving struggling habits to this time slot.`,
        confidence: 0.85,
        priority: 'high',
        actionable: true,
        showActionButton: true,
        data: { bestTime, successRate: bestRate, recommendationType: 'time_optimization' }
      })
    }
    
    return insights
  }

  analyzeMoodCorrelations(habits: HabitData[]): AIInsight[] {
    const insights: AIInsight[] = []
    
    habits.forEach(habit => {
      const entriesWithMood = habit.entries.filter(e => e.completed && e.mood)
      
      if (entriesWithMood.length < 5) return
      
      const avgMood = entriesWithMood.reduce((sum, e) => sum + (e.mood || 0), 0) / entriesWithMood.length
      
      if (avgMood >= 8) {
        insights.push({
          type: 'recommendation',
          title: `${habit.title} Boosts Your Mood`,
          description: `Completing "${habit.title}" consistently improves your mood (average: ${avgMood.toFixed(1)}/10). This habit is a key contributor to your wellbeing.`,
          confidence: 0.9,
          priority: 'medium',
          actionable: false,
          data: { habitId: habit.id, avgMood }
        })
      } else if (avgMood <= 4) {
        insights.push({
          type: 'optimization',
          title: `${habit.title} May Need Adjustment`,
          description: `Your mood after "${habit.title}" averages ${avgMood.toFixed(1)}/10. Consider modifying the approach or timing to make it more enjoyable.`,
          confidence: 0.8,
          priority: 'high',
          actionable: true,
          showActionButton: true,
          data: { habitId: habit.id, avgMood, recommendationType: 'habit_adjustment' }
        })
      }
    })
    
    return insights
  }

  analyzeDifficultyTrends(habits: HabitData[]): AIInsight[] {
    const insights: AIInsight[] = []
    
    habits.forEach(habit => {
      const entriesWithDifficulty = habit.entries
        .filter(e => e.completed && e.difficulty)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      
      if (entriesWithDifficulty.length < 7) return
      
      // Analyze if difficulty is trending up or down
      const recentEntries = entriesWithDifficulty.slice(-5)
      const earlierEntries = entriesWithDifficulty.slice(0, 5)
      
      const recentAvg = recentEntries.reduce((sum, e) => sum + (e.difficulty || 0), 0) / recentEntries.length
      const earlierAvg = earlierEntries.reduce((sum, e) => sum + (e.difficulty || 0), 0) / earlierEntries.length
      
      const difficultyChange = recentAvg - earlierAvg
      
      if (difficultyChange <= -2) {
        insights.push({
          type: 'recommendation',
          title: `${habit.title} is Getting Easier`,
          description: `The difficulty of "${habit.title}" has decreased from ${earlierAvg.toFixed(1)} to ${recentAvg.toFixed(1)}. Great progress! Consider increasing the challenge slightly.`,
          confidence: 0.85,
          priority: 'medium',
          actionable: true,
          showActionButton: true,
          data: { 
            habitId: habit.id, 
            difficultyChange, 
            recentAvg, 
            earlierAvg, 
            recommendationType: 'increase_challenge' 
          }
        })
      } else if (difficultyChange >= 2) {
        insights.push({
          type: 'optimization',
          title: `${habit.title} Becoming More Challenging`,
          description: `The difficulty of "${habit.title}" has increased from ${earlierAvg.toFixed(1)} to ${recentAvg.toFixed(1)}. Consider breaking it into smaller steps.`,
          confidence: 0.8,
          priority: 'high',
          actionable: true,
          showActionButton: true,
          data: { 
            habitId: habit.id, 
            difficultyChange, 
            recentAvg, 
            earlierAvg, 
            recommendationType: 'simplify_habit' 
          }
        })
      }
    })
    
    return insights
  }

  // Predict habit completion probability for tomorrow
  public async predictTomorrowSuccess(habit: HabitData): Promise<{
    probability: number
    factors: string[]
    recommendation: string
  }> {
    const recentEntries = habit.entries
      .slice(-14)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    if (recentEntries.length < 3) {
      return {
        probability: 0.5,
        factors: ['Insufficient data'],
        recommendation: 'Keep tracking to get better predictions!'
      }
    }

    // Simple prediction based on recent patterns
    const recentCompletionRate = recentEntries
      .slice(0, 7)
      .reduce((sum, entry) => sum + (entry.completed ? 1 : 0), 0) / Math.min(7, recentEntries.length)

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowDayOfWeek = tomorrow.getDay()

    // Adjust probability based on day of week pattern
    const dayOfWeekEntries = habit.entries.filter(entry => {
      return new Date(entry.date).getDay() === tomorrowDayOfWeek
    })

    let dayOfWeekRate = 0.5
    if (dayOfWeekEntries.length >= 3) {
      dayOfWeekRate = dayOfWeekEntries.reduce((sum, entry) => sum + (entry.completed ? 1 : 0), 0) / dayOfWeekEntries.length
    }

    const probability = (recentCompletionRate * 0.7 + dayOfWeekRate * 0.3)
    
    const factors = []
    if (recentCompletionRate > 0.8) factors.push('Strong recent performance')
    if (recentCompletionRate < 0.4) factors.push('Recent struggles')
    if (dayOfWeekRate > 0.7) factors.push('Good day-of-week track record')
    if (dayOfWeekRate < 0.4) factors.push('Challenging day of week historically')

    let recommendation = ''
    if (probability < 0.4) {
      recommendation = 'Consider setting a reminder or simplifying this habit for tomorrow.'
    } else if (probability > 0.8) {
      recommendation = 'You\'re on track for success! Keep up the great work.'
    } else {
      recommendation = 'Focus extra attention on this habit tomorrow to maintain momentum.'
    }

    return {
      probability: Math.max(0.1, Math.min(0.9, probability)),
      factors,
      recommendation
    }
  }

  // New method for advanced habit completion prediction using multiple factors
  public async predictWeekSuccess(habit: HabitData): Promise<{
    dailyProbabilities: { [day: string]: number }
    weeklyProbability: number
    riskFactors: string[]
    successFactors: string[]
    recommendations: string[]
  }> {
    const recentEntries = habit.entries
      .slice(-30) // Last month
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    if (recentEntries.length < 7) {
      return {
        dailyProbabilities: {},
        weeklyProbability: 0.5,
        riskFactors: ['Insufficient historical data'],
        successFactors: [],
        recommendations: ['Continue tracking to get better predictions']
      }
    }

    // Calculate probabilities for each day of the week
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dailyProbabilities: { [day: string]: number } = {}
    
    dayNames.forEach((dayName, dayIndex) => {
      const dayEntries = habit.entries.filter(entry => {
        return new Date(entry.date).getDay() === dayIndex
      })
      
      if (dayEntries.length >= 2) {
        const completionRate = dayEntries.reduce((sum, entry) => sum + (entry.completed ? 1 : 0), 0) / dayEntries.length
        dailyProbabilities[dayName] = completionRate
      } else {
        dailyProbabilities[dayName] = 0.5
      }
    })
    
    const weeklyProbability = Object.values(dailyProbabilities).reduce((sum, rate) => sum + rate, 0) / Object.values(dailyProbabilities).length
    
    const riskFactors = []
    const successFactors = []
    const recommendations = []

    if (weeklyProbability < 0.5) {
      riskFactors.push('Low weekly completion rate')
      recommendations.push('Consider increasing the frequency or intensity of your habits')
    } else {
      successFactors.push('High weekly completion rate')
      recommendations.push('Keep up the great work!')
    }

    return {
      dailyProbabilities,
      weeklyProbability,
      riskFactors,
      successFactors,
      recommendations
    }
  }

  // Advanced AI Features - Habit Difficulty Prediction
  public async predictHabitDifficulty(habit: HabitData, targetDate: Date): Promise<{
    predictedDifficulty: number
    factors: string[]
    recommendations: string[]
    confidence: number
  }> {
    const recentEntries = habit.entries
      .filter(e => e.completed && e.difficulty)
      .slice(-30)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    if (recentEntries.length < 5) {
      return {
        predictedDifficulty: 5,
        factors: ['Insufficient difficulty data'],
        recommendations: ['Start tracking difficulty ratings for better predictions'],
        confidence: 0.3
      }
    }

    const dayOfWeek = targetDate.getDay()
    const hour = targetDate.getHours()
    
    // Calculate base difficulty from recent entries
    const avgDifficulty = recentEntries.reduce((sum, e) => sum + (e.difficulty || 5), 0) / recentEntries.length
    
    // Adjust based on day of week patterns
    const dayOfWeekEntries = habit.entries.filter(e => {
      return e.completed && e.difficulty && new Date(e.date).getDay() === dayOfWeek
    })
    
    let dayAdjustment = 0
    if (dayOfWeekEntries.length >= 3) {
      const dayAvgDifficulty = dayOfWeekEntries.reduce((sum, e) => sum + (e.difficulty || 5), 0) / dayOfWeekEntries.length
      dayAdjustment = dayAvgDifficulty - avgDifficulty
    }

    // Adjust based on time of day if completedAt data is available
    let timeAdjustment = 0
    const timeEntries = recentEntries.filter(e => e.completedAt)
    if (timeEntries.length >= 3) {
      const similarTimeEntries = timeEntries.filter(e => {
        const entryHour = new Date(e.completedAt!).getHours()
        return Math.abs(entryHour - hour) <= 2
      })
      
      if (similarTimeEntries.length >= 2) {
        const timeAvgDifficulty = similarTimeEntries.reduce((sum, e) => sum + (e.difficulty || 5), 0) / similarTimeEntries.length
        timeAdjustment = timeAvgDifficulty - avgDifficulty
      }
    }

    const predictedDifficulty = Math.max(1, Math.min(10, avgDifficulty + dayAdjustment + timeAdjustment))
    
    const factors = []
    const recommendations = []
    
    if (dayAdjustment > 1) {
      factors.push('This day of week tends to be more challenging')
      recommendations.push('Consider preparing extra motivation for this day')
    } else if (dayAdjustment < -1) {
      factors.push('This day of week is typically easier')
      recommendations.push('Good day to tackle this habit')
    }
    
    if (timeAdjustment > 1) {
      factors.push('This time of day shows higher difficulty')
      recommendations.push('Consider scheduling this habit at a different time')
    } else if (timeAdjustment < -1) {
      factors.push('This time of day is optimal for this habit')
    }

    if (predictedDifficulty > 7) {
      recommendations.push('Consider breaking this habit into smaller steps today')
    } else if (predictedDifficulty < 4) {
      recommendations.push('Great day to push yourself a bit harder')
    }

    return {
      predictedDifficulty: Math.round(predictedDifficulty * 10) / 10,
      factors,
      recommendations,
      confidence: Math.min(0.9, recentEntries.length / 20)
    }
  }

  // Smart Scheduling AI
  public generateOptimalSchedule(habits: HabitData[]): {
    schedule: Array<{
      time: string
      habitId: string
      habitTitle: string
      predictedDifficulty: number
      predictedSuccess: number
      reason: string
    }>
    tips: string[]
  } {
    const schedule: Array<{
      time: string
      habitId: string
      habitTitle: string
      predictedDifficulty: number
      predictedSuccess: number
      reason: string
    }> = []
    const tips: string[] = []
    
    // Analyze each habit's optimal timing
    const habitTimingData = habits.map(habit => {
      const hourlyStats: { [hour: number]: { completed: number; total: number; avgDifficulty: number } } = {}
      
      habit.entries.forEach(entry => {
        if (entry.completedAt) {
          const hour = new Date(entry.completedAt).getHours()
          if (!hourlyStats[hour]) {
            hourlyStats[hour] = { completed: 0, total: 0, avgDifficulty: 0 }
          }
          hourlyStats[hour].total++
          if (entry.completed) {
            hourlyStats[hour].completed++
            hourlyStats[hour].avgDifficulty += entry.difficulty || 5
          }
        }
      })
      
      // Find best time slots
      const bestTimes = Object.entries(hourlyStats)
        .filter(([_, stats]) => stats.total >= 2)
        .map(([hour, stats]) => ({
          hour: parseInt(hour),
          successRate: stats.completed / stats.total,
          avgDifficulty: stats.avgDifficulty / stats.completed || 5
        }))
        .sort((a, b) => b.successRate - a.successRate)
      
      return {
        habit,
        bestTimes: bestTimes.slice(0, 3),
        avgDifficulty: habit.entries
          .filter(e => e.completed && e.difficulty)
          .reduce((sum, e, _, arr) => sum + (e.difficulty || 5) / arr.length, 0) || 5
      }
    })

    // Create morning schedule (6-12)
    const morningHabits = habitTimingData
      .filter(h => h.bestTimes.some(t => t.hour >= 6 && t.hour < 12))
      .sort((a, b) => a.avgDifficulty - b.avgDifficulty) // Easier habits first
    
    morningHabits.slice(0, 3).forEach((habitData, index) => {
      const optimalTime = habitData.bestTimes.find(t => t.hour >= 6 && t.hour < 12) || habitData.bestTimes[0]
      if (optimalTime) {
        schedule.push({
          time: `${(optimalTime.hour || 8) + index}:00`,
          habitId: habitData.habit.id,
          habitTitle: habitData.habit.title,
          predictedDifficulty: optimalTime.avgDifficulty,
          predictedSuccess: optimalTime.successRate || 0.7,
          reason: `Your ${Math.round((optimalTime.successRate || 0.7) * 100)}% success rate at this time`
        })
      }
    })

    // Create evening schedule (17-21)
    const eveningHabits = habitTimingData
      .filter(h => h.bestTimes.some(t => t.hour >= 17 && t.hour < 21))
      .filter(h => !morningHabits.includes(h))
      .sort((a, b) => b.avgDifficulty - a.avgDifficulty) // Harder habits when energy might be lower
    
    eveningHabits.slice(0, 2).forEach((habitData, index) => {
      const optimalTime = habitData.bestTimes.find(t => t.hour >= 17 && t.hour < 21) || habitData.bestTimes[0]
      if (optimalTime) {
        schedule.push({
          time: `${(optimalTime.hour || 19) + index}:00`,
          habitId: habitData.habit.id,
          habitTitle: habitData.habit.title,
          predictedDifficulty: optimalTime.avgDifficulty,
          predictedSuccess: optimalTime.successRate || 0.6,
          reason: `Consistent performance at this time`
        })
      }
    })

    // Generate tips
    if (schedule.length > 0) {
      tips.push('Schedule is based on your historical performance patterns')
      
      const avgMorningSuccess = schedule
        .filter(s => parseInt(s.time.split(':')[0]) < 12)
        .reduce((sum, s, _, arr) => sum + s.predictedSuccess / arr.length, 0)
      
      if (avgMorningSuccess > 0.8) {
        tips.push('You\'re a morning person! Front-load your difficult habits')
      } else {
        tips.push('Consider lighter habits in the morning, save energy for later')
      }
    } else {
      tips.push('Complete more habits to generate personalized scheduling recommendations')
    }

    return { schedule, tips }
  }

  // Personalized Coaching System
  public generatePersonalizedCoaching(habits: HabitData[]): {
    motivationalMessage: string
    focusArea: string
    actionPlan: string[]
    encouragement: string
    weeklyGoals: string[]
  } {
    const totalHabits = habits.length
    const activeHabits = habits.filter(h => h.entries.some(e => 
      new Date(e.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ))
    
    const recentEntries = habits.flatMap(h => h.entries)
      .filter(e => new Date(e.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    
    const completionRate = recentEntries.length > 0 
      ? recentEntries.filter(e => e.completed).length / recentEntries.length 
      : 0

    const avgMood = recentEntries
      .filter(e => e.completed && e.mood)
      .reduce((sum, e, _, arr) => sum + (e.mood || 5) / arr.length, 0) || 5

    const avgDifficulty = recentEntries
      .filter(e => e.completed && e.difficulty)
      .reduce((sum, e, _, arr) => sum + (e.difficulty || 5) / arr.length, 0) || 5

    let motivationalMessage = ''
    let focusArea = ''
    let encouragement = ''
    
    if (completionRate > 0.8) {
      motivationalMessage = "You're absolutely crushing it! Your consistency is inspiring."
      encouragement = "You've built incredible momentum - keep riding this wave!"
      focusArea = "Habit Optimization"
    } else if (completionRate > 0.6) {
      motivationalMessage = "Solid progress! You're building strong foundations."
      encouragement = "Every habit you complete is an investment in your future self."
      focusArea = "Consistency Building"
    } else if (completionRate > 0.4) {
      motivationalMessage = "You're learning and growing. Progress isn't always linear."
      encouragement = "Small steps still move you forward. You've got this!"
      focusArea = "Momentum Recovery"
    } else {
      motivationalMessage = "Every expert was once a beginner. Today is a fresh start."
      encouragement = "Focus on one habit at a time. Small wins build big victories."
      focusArea = "Foundation Building"
    }

    const actionPlan = []
    const weeklyGoals = []

    // Personalized action plan based on performance
    if (completionRate < 0.5) {
      actionPlan.push("Choose your easiest habit and commit to it for 3 days straight")
      actionPlan.push("Set reminders for your most important habit")
      actionPlan.push("Prepare your environment the night before")
      weeklyGoals.push("Complete at least 3 habits this week")
      weeklyGoals.push("Track your mood after each completion")
    } else if (completionRate < 0.8) {
      actionPlan.push("Link your newest habit to an existing routine")
      actionPlan.push("Focus on your top 3 priority habits this week")
      actionPlan.push("Experiment with different times of day")
      weeklyGoals.push("Achieve 70% completion rate across all habits")
      weeklyGoals.push("Try habit stacking with your strongest habit")
    } else {
      actionPlan.push("Consider adding a challenging new habit")
      actionPlan.push("Mentor someone else in habit building")
      actionPlan.push("Optimize your routine for maximum efficiency")
      weeklyGoals.push("Maintain your excellent streak")
      weeklyGoals.push("Help optimize your habit timing based on energy")
    }

    // Mood-based adjustments
    if (avgMood < 6) {
      actionPlan.unshift("Focus on habits that boost your mood first")
      weeklyGoals.push("Aim for an average mood of 7+ after habit completion")
    }

    // Difficulty-based adjustments
    if (avgDifficulty > 7) {
      actionPlan.push("Consider breaking down difficult habits into smaller steps")
      weeklyGoals.push("Reduce average difficulty to 6 or below")
    }

    return {
      motivationalMessage,
      focusArea,
      actionPlan,
      encouragement,
      weeklyGoals
    }
  }

  // Performance Forecasting
  public generatePerformanceForecast(habits: HabitData[], days: number = 7): {
    forecast: Array<{
      date: string
      predictedCompletions: number
      predictedMood: number
      riskFactors: string[]
      opportunities: string[]
    }>
    summary: {
      totalPredictedCompletions: number
      streakRisk: string[]
      improvementOpportunities: string[]
    }
  } {
    const forecast = []
    const today = new Date()
    
    for (let i = 0; i < days; i++) {
      const forecastDate = new Date(today)
      forecastDate.setDate(today.getDate() + i)
      
      let predictedCompletions = 0
      let predictedMood = 5
      const riskFactors = []
      const opportunities = []
      
      // Analyze each habit for this day
      habits.forEach(habit => {
        const dayOfWeek = forecastDate.getDay()
        const dayEntries = habit.entries.filter(e => new Date(e.date).getDay() === dayOfWeek)
        
        if (dayEntries.length >= 2) {
          const dayCompletionRate = dayEntries.filter(e => e.completed).length / dayEntries.length
          predictedCompletions += dayCompletionRate
          
          const dayMoodEntries = dayEntries.filter(e => e.completed && e.mood)
          if (dayMoodEntries.length > 0) {
            const dayAvgMood = dayMoodEntries.reduce((sum, e) => sum + (e.mood || 5), 0) / dayMoodEntries.length
            predictedMood = Math.max(predictedMood, dayAvgMood)
          }
          
          if (dayCompletionRate < 0.5) {
            riskFactors.push(`${habit.title} typically struggles on this day`)
          } else if (dayCompletionRate > 0.8) {
            opportunities.push(`${habit.title} performs excellently on this day`)
          }
        } else {
          predictedCompletions += 0.6 // Default assumption
        }
      })
      
      // Add general risk factors
      if (forecastDate.getDay() === 0 || forecastDate.getDay() === 6) {
        if (predictedCompletions < habits.length * 0.5) {
          riskFactors.push('Weekend schedule disruption')
        } else {
          opportunities.push('Good weekend structure')
        }
      }
      
      forecast.push({
        date: forecastDate.toISOString().split('T')[0],
        predictedCompletions: Math.round(predictedCompletions),
        predictedMood: Math.round(predictedMood * 10) / 10,
        riskFactors,
        opportunities
      })
    }
    
    const totalPredictedCompletions = forecast.reduce((sum, day) => sum + day.predictedCompletions, 0)
    const streakRisk = []
    const improvementOpportunities = []
    
    // Analyze streak risks
    const lowPerformanceDays = forecast.filter(day => day.predictedCompletions < habits.length * 0.4)
    if (lowPerformanceDays.length > 0) {
      streakRisk.push(`Risk of streak breaks on: ${lowPerformanceDays.map(d => d.date).join(', ')}`)
    }
    
    // Find improvement opportunities
    const highPerformanceDays = forecast.filter(day => day.predictedCompletions > habits.length * 0.8)
    if (highPerformanceDays.length > 0) {
      improvementOpportunities.push(`Leverage high-energy days: ${highPerformanceDays.map(d => d.date).join(', ')}`)
    }
    
    return {
      forecast,
      summary: {
        totalPredictedCompletions,
        streakRisk,
        improvementOpportunities
      }
    }
  }
}

// Export a lazy-loaded singleton instance for client-side use only
let _habitAnalyticsAI: HabitAnalyticsAI | null = null

export const getHabitAnalyticsAI = (): HabitAnalyticsAI => {
  if (typeof window === 'undefined') {
    // Return a mock instance for server-side rendering
    return {
      analyzeHabits: async () => [],
      generatePersonalizedCoaching: () => ({
        motivationalMessage: 'Loading AI insights...',
        focusArea: 'Initialization',
        actionPlan: ['Please wait while AI analytics initializes'],
        encouragement: 'Your insights will be ready soon!',
        weeklyGoals: ['Continue tracking your habits']
      }),
      generateOptimalSchedule: () => ({
        schedule: [],
        tips: ['AI scheduling will be available once analytics loads']
      }),
      generatePerformanceForecast: () => ({
        forecast: [],
        summary: {
          totalPredictedCompletions: 0,
          streakRisk: [],
          improvementOpportunities: []
        }
      }),
      predictTomorrowSuccess: async () => ({
        probability: 0.5,
        factors: ['Loading...'],
        recommendation: 'AI predictions loading...'
      }),
      predictWeekSuccess: async () => ({
        dailyProbabilities: {},
        weeklyProbability: 0.5,
        riskFactors: ['Loading...'],
        successFactors: [],
        recommendations: ['AI insights loading...']
      }),
      predictHabitDifficulty: async () => ({
        predictedDifficulty: 5,
        factors: ['Loading...'],
        recommendations: ['AI predictions loading...'],
        confidence: 0.5
      }),
      markRecommendationAsUsed: () => '',
      setUsedRecommendations: () => {}
    } as any
  }

  if (!_habitAnalyticsAI) {
    _habitAnalyticsAI = new HabitAnalyticsAI()
  }
  return _habitAnalyticsAI
}

// Keep the old export for backward compatibility but make it lazy
export const habitAnalyticsAI = getHabitAnalyticsAI()