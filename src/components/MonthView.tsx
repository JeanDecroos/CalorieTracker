'use client'

import { useState } from 'react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { TrendingUp, TrendingDown, Target } from 'lucide-react'
import { MonthlyCalendar, CalendarMode } from './MonthlyCalendar'
import { useMonthlyTotals } from '@/lib/queries/monthlyCalculations'
import { useProfile } from '@/lib/queries/profiles'

interface MonthViewProps {
  mode?: CalendarMode
}

export function MonthView({ mode = 'all' }: MonthViewProps) {
  const [currentMonth] = useState(new Date())
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)

  const { data: monthlyTotals, isLoading } = useMonthlyTotals(currentMonth)
  const { data: profile } = useProfile()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-slate-200 rounded w-1/3"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!monthlyTotals) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
        <p className="text-slate-500 text-center py-8">Loading monthly data...</p>
      </div>
    )
  }

  // Calculate monthly goal if profile has a goal
  let monthlyGoal: number | null = null
  let goalDescription: string | null = null

  if (profile?.goal_amount && profile.goal_unit) {
    if (profile.goal_unit === 'per_day') {
      monthlyGoal = profile.goal_amount * monthlyTotals.daysInMonth
      goalDescription = `${profile.goal_amount} kcal/day`
    } else {
      // per_week goal - calculate monthly (assuming ~4.33 weeks per month)
      const weeksInMonth = monthlyTotals.daysInMonth / 7
      monthlyGoal = profile.goal_amount * weeksInMonth
      goalDescription = `${profile.goal_amount} kcal/week`
    }
  }

  const goalProgress = monthlyGoal ? (monthlyTotals.netCalories / monthlyGoal) * 100 : null
  const goalVariance = monthlyGoal ? monthlyGoal - monthlyTotals.netCalories : null

  return (
    <div className="space-y-6">
      {/* Monthly Calendar Grid */}
      <MonthlyCalendar mode={mode} />

      {/* Monthly Summary Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-900 mb-2">Monthly Summary</h3>
          <p className="text-sm text-slate-600">
            {format(monthStart, 'MMM d')} - {format(monthEnd, 'MMM d, yyyy')} · {monthlyTotals.daysLogged} of {monthlyTotals.daysInMonth} days logged
          </p>
        </div>

        {/* Total Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-slate-50 rounded-xl">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Total Consumed
            </div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums">
              {monthlyTotals.totalConsumed.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-1">kcal</div>
          </div>

          {monthlyTotals.totalBurned > 0 && (
            <div className="p-4 bg-emerald-50 rounded-xl">
              <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">
                Total Burned
              </div>
              <div className="text-2xl font-bold text-emerald-700 tabular-nums">
                -{monthlyTotals.totalBurned.toLocaleString()}
              </div>
              <div className="text-xs text-emerald-600 mt-1">kcal</div>
            </div>
          )}

          <div className={`p-4 rounded-xl ${
            monthlyTotals.netCalories >= 0 ? 'bg-slate-50' : 'bg-emerald-50'
          }`}>
            <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${
              monthlyTotals.netCalories >= 0 ? 'text-slate-500' : 'text-emerald-600'
            }`}>
              Net Calories
            </div>
            <div className={`text-2xl font-bold tabular-nums ${
              monthlyTotals.netCalories >= 0 ? 'text-slate-900' : 'text-emerald-700'
            }`}>
              {monthlyTotals.netCalories >= 0 ? '+' : ''}
              {monthlyTotals.netCalories.toLocaleString()}
            </div>
            <div className={`text-xs mt-1 ${
              monthlyTotals.netCalories >= 0 ? 'text-slate-500' : 'text-emerald-600'
            }`}>
              kcal
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Total Protein
            </div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums">
              {monthlyTotals.totalProtein.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-1">g</div>
          </div>
        </div>

        {/* Daily Averages */}
        <div className="mb-6 pt-6 border-t border-slate-100">
          <h4 className="text-sm font-semibold text-slate-700 mb-4">Daily Averages</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-xs text-slate-500 mb-1">Consumed</div>
              <div className="text-lg font-bold text-slate-900 tabular-nums">
                {Math.round(monthlyTotals.dailyAverageConsumed).toLocaleString()}
              </div>
              <div className="text-xs text-slate-400">kcal/day</div>
            </div>

            {monthlyTotals.dailyAverageBurned > 0 && (
              <div className="p-3 bg-emerald-50 rounded-lg">
                <div className="text-xs text-emerald-600 mb-1">Burned</div>
                <div className="text-lg font-bold text-emerald-700 tabular-nums">
                  {Math.round(monthlyTotals.dailyAverageBurned).toLocaleString()}
                </div>
                <div className="text-xs text-emerald-500">kcal/day</div>
              </div>
            )}

            <div className={`p-3 rounded-lg ${
              monthlyTotals.dailyAverageNet >= 0 ? 'bg-slate-50' : 'bg-emerald-50'
            }`}>
              <div className={`text-xs mb-1 ${
                monthlyTotals.dailyAverageNet >= 0 ? 'text-slate-500' : 'text-emerald-600'
              }`}>
                Net
              </div>
              <div className={`text-lg font-bold tabular-nums ${
                monthlyTotals.dailyAverageNet >= 0 ? 'text-slate-900' : 'text-emerald-700'
              }`}>
                {monthlyTotals.dailyAverageNet >= 0 ? '+' : ''}
                {Math.round(monthlyTotals.dailyAverageNet).toLocaleString()}
              </div>
              <div className={`text-xs ${
                monthlyTotals.dailyAverageNet >= 0 ? 'text-slate-400' : 'text-emerald-500'
              }`}>
                kcal/day
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-xs text-slate-500 mb-1">Protein</div>
              <div className="text-lg font-bold text-slate-900 tabular-nums">
                {Math.round(monthlyTotals.dailyAverageProtein).toLocaleString()}
              </div>
              <div className="text-xs text-slate-400">g/day</div>
            </div>
          </div>
        </div>

        {/* Goal Progress (if goal exists) */}
        {monthlyGoal && goalProgress !== null && goalVariance !== null && (
          <div className="pt-6 border-t border-slate-100">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-semibold text-slate-700">Goal Progress</span>
                </div>
                <div className="text-sm text-slate-600 tabular-nums">
                  {monthlyTotals.netCalories >= 0 ? '+' : ''}
                  {monthlyTotals.netCalories.toLocaleString()} / {monthlyGoal >= 0 ? '+' : ''}
                  {Math.round(monthlyGoal).toLocaleString()} kcal
                </div>
              </div>
              {profile?.goal_description && (
                <div className="text-xs text-slate-500 mb-2">
                  {profile.goal_description} ({goalDescription})
                </div>
              )}
            </div>
            
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden mb-2">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  goalProgress >= 100 ? 'bg-emerald-600' : 
                  goalProgress >= 90 ? 'bg-indigo-600' : 
                  'bg-indigo-400'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, goalProgress))}%` }}
              />
            </div>
            
            <div className="flex items-center gap-2">
              {goalVariance > 0 ? (
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              ) : goalVariance < 0 ? (
                <TrendingDown className="w-4 h-4 text-amber-600" />
              ) : null}
              <div className={`text-xs font-medium ${
                goalVariance > 0 ? 'text-emerald-600' : 
                goalVariance < 0 ? 'text-amber-600' : 
                'text-slate-600'
              }`}>
                {goalVariance > 0 
                  ? `${Math.round(goalVariance).toLocaleString()} kcal under goal`
                  : goalVariance < 0
                  ? `${Math.round(Math.abs(goalVariance)).toLocaleString()} kcal over goal`
                  : 'Exactly on target'}
              </div>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {goalProgress.toFixed(1)}% of monthly goal
            </div>
          </div>
        )}
      </div>
    </div>
  )
}