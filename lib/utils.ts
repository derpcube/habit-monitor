import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
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