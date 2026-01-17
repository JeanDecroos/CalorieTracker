import { useQuery } from '@tanstack/react-query'
import { useFoodLogs } from './foodLogs'
import { useActivities } from './activities'
import { getMonthStart, getMonthEnd, getDaysInMonth } from '@/utils/dateUtils'

export interface MonthlyTotals {
  monthStart: Date
  monthEnd: Date
  totalConsumed: number
  totalBurned: number
  netCalories: number
  totalProtein: number
  dailyAverageConsumed: number
  dailyAverageBurned: number
  dailyAverageNet: number
  dailyAverageProtein: number
  daysInMonth: number
  daysLogged: number
}

export function useMonthlyTotals(date: Date = new Date()) {
  const monthStart = getMonthStart(date)
  const monthEnd = getMonthEnd(date)
  const daysInMonth = getDaysInMonth(date)

  const { data: foodLogs = [], isSuccess: foodLogsSuccess } = useFoodLogs(monthStart, monthEnd)
  const { data: activities = [], isSuccess: activitiesSuccess } = useActivities(monthStart, monthEnd)

  return useQuery({
    queryKey: ['monthly-totals', monthStart.toISOString(), monthEnd.toISOString()],
    queryFn: async (): Promise<MonthlyTotals> => {
      // Calculate totals
      const totalConsumed = foodLogs.reduce((sum, log) => sum + log.calories, 0)
      const totalBurned = activities.reduce((sum, activity) => sum + (activity.calories_burned || 0), 0)
      const netCalories = totalConsumed - totalBurned
      const totalProtein = foodLogs.reduce((sum, log) => sum + log.protein, 0)

      // Get unique days with logs
      const daysWithLogs = new Set(
        foodLogs.map(log => log.date).concat(activities.map(activity => activity.date))
      )
      const daysLogged = daysWithLogs.size

      // Calculate daily averages
      const dailyAverageConsumed = daysLogged > 0 ? totalConsumed / daysLogged : 0
      const dailyAverageBurned = daysLogged > 0 ? totalBurned / daysLogged : 0
      const dailyAverageNet = daysLogged > 0 ? netCalories / daysLogged : 0
      const dailyAverageProtein = daysLogged > 0 ? totalProtein / daysLogged : 0

      return {
        monthStart,
        monthEnd,
        totalConsumed,
        totalBurned,
        netCalories,
        totalProtein,
        dailyAverageConsumed,
        dailyAverageBurned,
        dailyAverageNet,
        dailyAverageProtein,
        daysInMonth,
        daysLogged,
      }
    },
    enabled: foodLogsSuccess && activitiesSuccess,
  })
}