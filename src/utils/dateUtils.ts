import { startOfWeek, endOfWeek, differenceInDays, format, startOfMonth, endOfMonth, getDaysInMonth as getDaysInMonthDateFns } from 'date-fns'

/**
 * Get the Monday of the current week for a given date
 */
export function getWeekStart(date: Date = new Date()): Date {
  return startOfWeek(date, { weekStartsOn: 1 }) // 1 = Monday
}

/**
 * Get the Sunday of the current week for a given date
 */
export function getWeekEnd(date: Date = new Date()): Date {
  return endOfWeek(date, { weekStartsOn: 1 }) // 1 = Monday
}

/**
 * Count the number of days elapsed from week start (Monday) to today (inclusive)
 * Returns 1 if today is Monday, 7 if today is Sunday
 */
export function getDaysElapsed(weekStart: Date, today: Date = new Date()): number {
  const days = differenceInDays(today, weekStart) + 1 // +1 to include both start and end days
  return Math.max(1, Math.min(7, days)) // Clamp between 1 and 7
}

/**
 * Format date as YYYY-MM-DD for database queries
 */
export function formatDateForDB(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

/**
 * Get the first day of the month for a given date
 */
export function getMonthStart(date: Date = new Date()): Date {
  return startOfMonth(date)
}

/**
 * Get the last day of the month for a given date
 */
export function getMonthEnd(date: Date = new Date()): Date {
  return endOfMonth(date)
}

/**
 * Get the number of days in a month for a given date
 */
export function getDaysInMonth(date: Date = new Date()): number {
  return getDaysInMonthDateFns(date)
}
