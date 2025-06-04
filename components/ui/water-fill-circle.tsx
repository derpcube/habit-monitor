'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface WaterFillCircleProps {
  percentage: number
  size?: number
  completed: number
  total: number
}

export default function WaterFillCircle({ 
  percentage, 
  size = 120, 
  completed, 
  total 
}: WaterFillCircleProps) {
  const [animatedPercentage, setAnimatedPercentage] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentage(percentage)
    }, 300)
    return () => clearTimeout(timer)
  }, [percentage])

  // Color interpolation based on percentage
  const getWaterColor = (progress: number) => {
    if (progress === 0) return 'rgba(239, 68, 68, 0.8)' // Red
    if (progress === 100) return 'rgba(34, 197, 94, 0.9)' // Green
    
    // Use a darker, more contrasted color scheme for better visibility
    if (progress <= 50) {
      // Interpolate from red to dark orange/brown for low percentages
      const red = Math.round(239 - (100 * progress / 50))
      const green = Math.round(68 + (100 * progress / 50))
      const blue = 68
      return `rgba(${red}, ${green}, ${blue}, 0.9)` // Higher opacity for better visibility
    } else {
      // Interpolate from orange to green for higher percentages
      const red = Math.round(139 - (105 * (progress - 50) / 50))
      const green = Math.round(168 + (29 * (progress - 50) / 50))
      const blue = Math.round(68 + (26 * (progress - 50) / 50))
      return `rgba(${red}, ${green}, ${blue}, 0.9)`
    }
  }

  // Glow effect color
  const getGlowColor = (progress: number) => {
    if (progress === 0) return 'rgba(239, 68, 68, 0.3)'
    if (progress === 100) return 'rgba(34, 197, 94, 0.4)'
    
    if (progress <= 50) {
      const red = Math.round(239 - (100 * progress / 50))
      const green = Math.round(68 + (100 * progress / 50))
      const blue = 68
      return `rgba(${red}, ${green}, ${blue}, 0.4)`
    } else {
      const red = Math.round(139 - (105 * (progress - 50) / 50))
      const green = Math.round(168 + (29 * (progress - 50) / 50))
      const blue = Math.round(68 + (26 * (progress - 50) / 50))
      return `rgba(${red}, ${green}, ${blue}, 0.4)`
    }
  }

  const waterColor = getWaterColor(animatedPercentage)
  const glowColor = getGlowColor(animatedPercentage)
  const fillHeight = (animatedPercentage / 100) * size

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Water Fill Circle */}
      <div 
        className="relative rounded-full overflow-hidden border-4 border-gray-200 dark:border-gray-600"
        style={{ 
          width: size, 
          height: size,
          boxShadow: `0 0 20px ${glowColor}`
        }}
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900" />
        
        {/* Water Fill */}
        <motion.div
          className="absolute bottom-0 left-0 right-0"
          initial={{ height: 0 }}
          animate={{ height: fillHeight }}
          transition={{ 
            duration: 2, 
            ease: [0.4, 0.0, 0.2, 1],
            delay: 0.2
          }}
          style={{
            background: `linear-gradient(180deg, ${waterColor} 0%, ${waterColor.replace('0.85', '0.95')} 100%)`,
          }}
        />

        {/* Water Surface Animation */}
        <motion.div
          className="absolute left-0 right-0"
          style={{
            bottom: fillHeight,
            height: 8,
            background: `linear-gradient(90deg, transparent, ${waterColor.replace('0.85', '0.6')}, transparent)`,
          }}
          animate={{
            x: [-10, 10, -10],
            opacity: [0.6, 1, 0.6]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Bubbles Effect */}
        {animatedPercentage > 0 && (
          <>
            <motion.div
              className="absolute w-2 h-2 rounded-full"
              style={{
                background: waterColor.replace('0.85', '0.4'),
                left: '25%',
                bottom: fillHeight * 0.3,
              }}
              animate={{
                y: [-5, -15, -25],
                opacity: [0, 1, 0],
                scale: [0.5, 1, 0.3]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: 0.5
              }}
            />
            <motion.div
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{
                background: waterColor.replace('0.85', '0.3'),
                right: '30%',
                bottom: fillHeight * 0.6,
              }}
              animate={{
                y: [-3, -12, -20],
                opacity: [0, 0.8, 0],
                scale: [0.3, 0.8, 0.2]
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                delay: 1.2
              }}
            />
          </>
        )}

        {/* Shine Effect */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%)',
          }}
          animate={{
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Percentage Text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className={`text-center z-10 ml-1 ${
              animatedPercentage === 100 ? '-mt-6 ml-3' : '-mt-7'
            }`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <div className={`font-bold drop-shadow-lg ${
              animatedPercentage === 100 ? 'text-4xl text-white' : 'text-3xl text-black dark:text-white'
            }`}>
              {Math.round(animatedPercentage)}%
            </div>
          </motion.div>
        </div>

        {/* Count Text - Separate positioning */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="text-center z-10 mt-8"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <div className="text-sm text-black dark:text-white font-medium drop-shadow-lg">
              {completed}/{total}
            </div>
          </motion.div>
        </div>

        {/* Completion Celebration - Moved outside circle */}
        {animatedPercentage === 100 && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-green-400"
              initial={{ scale: 1, opacity: 0 }}
              animate={{ 
                scale: [1, 1.1, 1.05], 
                opacity: [0, 1, 0.8] 
              }}
              transition={{ 
                duration: 1, 
                ease: "easeOut" 
              }}
            />
          </>
        )}
      </div>

      {/* Status Text */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {animatedPercentage === 100 
            ? "Perfect! All habits completed! 🌟" 
            : animatedPercentage >= 75 
            ? "Almost there! Keep going! 💪"
            : animatedPercentage >= 50
            ? "Great progress! 👍"
            : animatedPercentage > 0
            ? "Good start! 🌱"
            : "Let's begin your journey! ✨"
          }
        </p>
      </motion.div>
    </div>
  )
} 