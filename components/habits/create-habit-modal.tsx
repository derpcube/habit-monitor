'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Habit {
  id: string
  title: string
  description?: string
  color: string
  category?: string
  frequency: string
  target: number
  days?: string
  createdAt: string
  updatedAt: string
  entries: any[]
}

interface CreateHabitModalProps {
  isOpen: boolean
  onClose: () => void
  onHabitCreated: (habit: Habit) => void
}

// Expanded color palette organized by hue
const colors = [
  // Reds
  '#EF4444', '#DC2626', '#B91C1C', '#991B1B',
  // Oranges
  '#F97316', '#EA580C', '#C2410C', '#9A3412',
  // Yellows
  '#F59E0B', '#D97706', '#B45309', '#92400E',
  // Greens
  '#10B981', '#059669', '#047857', '#065F46',
  '#22C55E', '#16A34A', '#15803D', '#166534',
  // Blues
  '#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF',
  '#0EA5E9', '#0284C7', '#0369A1', '#075985',
  // Purples
  '#8B5CF6', '#7C3AED', '#6D28D9', '#5B21B6',
  '#A855F7', '#9333EA', '#7E22CE', '#6B21A8',
  // Pinks
  '#EC4899', '#DB2777', '#BE185D', '#9D174D',
  '#F472B6', '#E879F9', '#D946EF', '#C026D3',
  // Teals
  '#14B8A6', '#0D9488', '#0F766E', '#115E59',
  '#06B6D4', '#0891B2', '#0E7490', '#155E75',
  // Grays
  '#6B7280', '#4B5563', '#374151', '#1F2937'
]

const frequencies = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'custom_days', label: 'Specific Days' },
  { value: 'monthly', label: 'Monthly' },
]

const daysOfWeek = [
  { value: 'monday', label: 'Mon' },
  { value: 'tuesday', label: 'Tue' },
  { value: 'wednesday', label: 'Wed' },
  { value: 'thursday', label: 'Thu' },
  { value: 'friday', label: 'Fri' },
  { value: 'saturday', label: 'Sat' },
  { value: 'sunday', label: 'Sun' },
]

const categories = [
  'Health & Fitness',
  'Learning & Growth',
  'Study',
  'Productivity',
  'Self Care',
  'Social',
  'Finance',
  'Hobbies',
  'General'
]

export default function CreateHabitModal({ isOpen, onClose, onHabitCreated }: CreateHabitModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(colors[0])
  const [customColor, setCustomColor] = useState('')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [category, setCategory] = useState('General')
  const [frequency, setFrequency] = useState('daily')
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [target, setTarget] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleDayToggle = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    )
  }

  const handleColorSelect = (selectedColor: string) => {
    setColor(selectedColor)
    setCustomColor('')
  }

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value
    setCustomColor(newColor)
    setColor(newColor)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (!title.trim()) {
      setError('Title is required')
      setIsLoading(false)
      return
    }

    if (frequency === 'custom_days' && selectedDays.length === 0) {
      setError('Please select at least one day')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/habits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          color,
          category,
          frequency,
          target,
          days: frequency === 'custom_days' ? JSON.stringify(selectedDays) : undefined,
        }),
      })

      if (response.ok) {
        const newHabit = await response.json()
        onHabitCreated(newHabit)
        resetForm()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to create habit')
      }
    } catch (error) {
      setError('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setColor(colors[0])
    setCustomColor('')
    setShowColorPicker(false)
    setCategory('General')
    setFrequency('daily')
    setSelectedDays([])
    setTarget(1)
    setError('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create New Habit</h2>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X size={20} />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Habit Title *
              </label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Drink 8 glasses of water"
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description (optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Additional details about your habit..."
                rows={3}
                className="w-full px-3 py-2 border border-input rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Color
              </label>
              <div className="space-y-3">
                {/* Preset Colors Grid */}
                <div className="grid grid-cols-8 gap-2">
                  {colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleColorSelect(c)}
                      className={`w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                        color === c 
                          ? 'border-gray-900 dark:border-white scale-110 shadow-lg' 
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
                
                {/* Custom Color Picker */}
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                  >
                    {showColorPicker ? 'Hide' : 'Custom Color'}
                  </button>
                  {showColorPicker && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={customColor || color}
                        onChange={handleCustomColorChange}
                        className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                        title="Pick a custom color"
                      />
                      <input
                        type="text"
                        value={customColor || color}
                        onChange={(e) => handleCustomColorChange(e)}
                        placeholder="#000000"
                        className="w-20 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  )}
                </div>
                
                {/* Selected Color Preview */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Selected:</span>
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm font-mono text-gray-500 dark:text-gray-400">{color}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Frequency
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {frequencies.map((freq) => (
                  <option key={freq.value} value={freq.value}>
                    {freq.label}
                  </option>
                ))}
              </select>
            </div>

            {frequency === 'custom_days' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Days
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {daysOfWeek.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => handleDayToggle(day.value)}
                      className={`p-2 text-xs rounded-md transition-colors ${
                        selectedDays.includes(day.value)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target (per {frequency === 'daily' ? 'day' : frequency === 'weekly' ? 'week' : frequency === 'custom_days' ? 'selected day' : 'month'})
              </label>
              <Input
                type="number"
                min={1}
                value={target}
                onChange={(e) => setTarget(parseInt(e.target.value) || 1)}
                className="w-full"
              />
            </div>

            {error && (
              <div className="text-red-600 dark:text-red-400 text-sm text-center">{error}</div>
            )}

            <div className="flex space-x-3">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? 'Creating...' : 'Create Habit'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 