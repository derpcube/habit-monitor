import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Additional utility functions for the habit monitor app
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date))
}

export function formatTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const targetDate = new Date(date)
  const diffInMs = now.getTime() - targetDate.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) return "Today"
  if (diffInDays === 1) return "Yesterday"
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
  return `${Math.floor(diffInDays / 365)} years ago`
}

export function generateColor(): string {
  const colors = [
    "#3B82F6", // blue
    "#10B981", // emerald
    "#8B5CF6", // violet
    "#F59E0B", // amber
    "#EF4444", // red
    "#06B6D4", // cyan
    "#84CC16", // lime
    "#F97316", // orange
    "#EC4899", // pink
    "#6366F1", // indigo
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map(word => word.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2)
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export function getDateString(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function isToday(date: Date): boolean {
  const today = new Date()
  return getDateString(date) === getDateString(today)
}

export function isYesterday(date: Date): boolean {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return getDateString(date) === getDateString(yesterday)
}

export function getDaysAgo(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}

export function getStreak(dates: Date[]): number {
  if (dates.length === 0) return 0
  
  const sortedDates = dates
    .map(date => getDateString(date))
    .sort()
    .reverse()
  
  let streak = 0
  const today = getDateString(new Date())
  const yesterday = getDateString(getDaysAgo(1))
  
  // Check if today or yesterday is included
  if (sortedDates[0] !== today && sortedDates[0] !== yesterday) {
    return 0
  }
  
  let currentDate = new Date()
  if (sortedDates[0] === yesterday) {
    currentDate = getDaysAgo(1)
  }
  
  for (let i = 0; i < sortedDates.length; i++) {
    const expectedDate = getDateString(getDaysAgo(i))
    if (sortedDates[i] === expectedDate) {
      streak++
    } else {
      break
    }
  }
  
  return streak
} 