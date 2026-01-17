import { useMemo } from 'react'
import { useTodayFoodLogs, useFoodLogs } from './foodLogs'
import { useDayActivities } from './activities'
import { formatDateForDB } from '@/utils/dateUtils'
import { isSameDay } from 'date-fns'

export interface DayTotals {
  date: Date
  caloriesConsumed: number
  caloriesBurned: number
  netCalories: number
  protein: number
}

export function useDayTotals(date: Date = new Date()) {
  const isToday = isSameDay(date, new Date())
  
  // Use different hooks based on whether it's today or another day
  const { data: todayFoodLogs, isLoading: todayFoodLogsLoading } = useTodayFoodLogs()
  const { data: dayFoodLogs, isLoading: dayFoodLogsLoading } = useFoodLogs(date, date)
  const { data: dayActivities, isLoading: activitiesLoading } = useDayActivities(date)

  const foodLogs = isToday ? todayFoodLogs : dayFoodLogs
  const isLoading = (isToday ? todayFoodLogsLoading : dayFoodLogsLoading) || activitiesLoading

  // Calculate totals
  const totals: DayTotals | null = useMemo(() => {
    if (isLoading || !foodLogs || !dayActivities) return null

    const logs = foodLogs || []
    const activities = dayActivities || []

    const caloriesConsumed = logs.reduce((sum, log) => sum + log.calories, 0)
    const caloriesBurned = activities.reduce((sum, activity) => sum + (activity.calories_burned || 0), 0)
    const netCalories = caloriesConsumed - caloriesBurned
    const protein = logs.reduce((sum, log) => sum + log.protein, 0)

    return {
      date,
      caloriesConsumed,
      caloriesBurned,
      netCalories,
      protein,
    }
  }, [date, foodLogs, dayActivities, isLoading])

  return {
    data: totals,
    isLoading,
  }
}