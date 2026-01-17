import { useQuery } from '@tanstack/react-query'
import { useProfile, calculateWeeklyFromDaily } from './profiles'
import { useFoodLogs } from './foodLogs'
import { useActivities } from './activities'
import { getWeekStart, getWeekEnd, getDaysElapsed } from '@/utils/dateUtils'

export interface WeeklyBankingStatus {
  weeklyGoal: number
  totalConsumed: number
  totalBurned: number
  netCalories: number
  expectedConsumption: number
  variance: number
  daysElapsed: number
  statusText: string
  goalInfo?: {
    description?: string | null
    amount: number
    unit: 'per_day' | 'per_week'
    startDate?: string | null
    endDate?: string | null
    durationWeeks?: number | null
  } | null
}

export function useWeeklyBanking() {
  const today = new Date()
  const weekStart = getWeekStart(today)
  const weekEnd = getWeekEnd(today)
  const daysElapsed = getDaysElapsed(weekStart, today)

  const { data: profile, isSuccess: profileSuccess } = useProfile()
  const { data: foodLogs = [], isSuccess: foodLogsSuccess } = useFoodLogs(weekStart, weekEnd)
  const { data: activities = [], isSuccess: activitiesSuccess } = useActivities(weekStart, weekEnd)

  return useQuery({
    queryKey: ['weekly-banking', weekStart.toISOString(), profile?.id],
    queryFn: async (): Promise<WeeklyBankingStatus> => {
      // Calculate totals
      const totalConsumed = (foodLogs || []).reduce((sum, log) => sum + log.calories, 0)
      const totalBurned = (activities || []).reduce((sum, activity) => sum + (activity.calories_burned || 0), 0)
      const netCalories = totalConsumed - totalBurned

      // Determine weekly goal based on profile goal or fallback to weekly_calorie_goal
      let weeklyGoal: number
      let goalInfo: WeeklyBankingStatus['goalInfo'] = null

      if (profile?.goal_amount && profile.goal_unit) {
        // Use new goal system
        if (profile.goal_unit === 'per_day') {
          weeklyGoal = calculateWeeklyFromDaily(profile.goal_amount)
        } else {
          weeklyGoal = profile.goal_amount
        }
        goalInfo = {
          description: profile.goal_description,
          amount: profile.goal_amount,
          unit: profile.goal_unit,
          startDate: profile.goal_start_date || null,
          endDate: profile.goal_end_date || null,
          durationWeeks: profile.goal_duration_weeks || null,
        }
      } else {
        // Fallback to legacy weekly_calorie_goal
        weeklyGoal = profile?.weekly_calorie_goal || 14000
      }

      // Calculate expected consumption based on daily average
      const dailyGoal = weeklyGoal / 7
      const expectedConsumption = dailyGoal * daysElapsed
      
      // For goal-based calculations, compare net calories to goal
      // If user has a goal, we compare net calories (consumed - burned) to the goal
      // Otherwise, we use the legacy consumed vs expected consumption
      const variance = goalInfo 
        ? (dailyGoal * daysElapsed) - netCalories
        : expectedConsumption - totalConsumed

      let statusText: string
      if (goalInfo) {
        // Goal-based status messages
        if (variance > 0) {
          statusText = `You are ${Math.round(variance)}kcal under your goal`
        } else if (variance < 0) {
          statusText = `You are ${Math.round(Math.abs(variance))}kcal over your goal`
        } else {
          statusText = 'You are exactly on track with your goal'
        }
      } else {
        // Legacy status messages
        if (variance > 0) {
          statusText = `You are ${Math.round(variance)}kcal under schedule`
        } else if (variance < 0) {
          statusText = `You are ${Math.round(Math.abs(variance))}kcal over budget`
        } else {
          statusText = 'You are exactly on schedule'
        }
      }

      return {
        weeklyGoal,
        totalConsumed,
        totalBurned,
        netCalories,
        expectedConsumption,
        variance,
        daysElapsed,
        statusText,
        goalInfo,
      }
    },
    enabled: profileSuccess && foodLogsSuccess && activitiesSuccess,
  })
}
