'use client'

import { useWeeklyBanking } from '@/lib/queries/weeklyCalculations'
import { TrendingUp, TrendingDown, Target, Calendar, Flame } from 'lucide-react'
import { format } from 'date-fns'

export function WeekAnalysis() {
  const { data: banking, isLoading } = useWeeklyBanking()

  if (isLoading || !banking) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/3"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  const progressPercentage = banking.weeklyGoal > 0 
    ? Math.min(100, Math.max(0, (banking.totalConsumed / banking.weeklyGoal) * 100))
    : 0

  const netProgressPercentage = banking.goalInfo && banking.goalInfo.unit === 'per_day' && banking.daysElapsed > 0 && banking.goalInfo.amount > 0
    ? Math.min(100, Math.max(0, ((banking.netCalories / (banking.goalInfo.amount * banking.daysElapsed)) * 100)))
    : null

  const isOnTrack = banking.variance >= -100 && banking.variance <= 100

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Target className="w-6 h-6 text-indigo-600" />
          Week Analysis
        </h2>
        <p className="text-sm text-slate-600">
          {banking.daysElapsed} of 7 days completed this week
        </p>
      </div>

      {/* Goal Info */}
      {banking.goalInfo && (
        <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="text-sm font-semibold text-indigo-900 mb-1">
                Current Goal
              </div>
              <div className="text-sm text-indigo-700">
                {banking.goalInfo.description || `${banking.goalInfo.amount} kcal ${banking.goalInfo.unit === 'per_day' ? 'per day' : 'per week'}`}
              </div>
            </div>
            {banking.goalInfo.endDate && (
              <div className="text-xs text-indigo-600 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Ends {format(new Date(banking.goalInfo.endDate), 'MMM d, yyyy')}
              </div>
            )}
            {banking.goalInfo.durationWeeks && !banking.goalInfo.endDate && (
              <div className="text-xs text-indigo-600">
                {banking.goalInfo.durationWeeks} weeks
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Consumed */}
        <div className="p-4 bg-slate-50 rounded-xl">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Consumed
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            {banking.totalConsumed.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">kcal</div>
        </div>

        {/* Burned */}
        {banking.totalBurned > 0 && (
          <div className="p-4 bg-emerald-50 rounded-xl">
            <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">
              Burned
            </div>
            <div className="text-2xl font-bold text-emerald-700 tabular-nums">
              -{banking.totalBurned.toLocaleString()}
            </div>
            <div className="text-xs text-emerald-600 mt-1">kcal</div>
          </div>
        )}

        {/* Net */}
        <div className={`p-4 rounded-xl ${
          banking.netCalories >= 0 ? 'bg-slate-50' : 'bg-emerald-50'
        }`}>
          <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${
            banking.netCalories >= 0 ? 'text-slate-500' : 'text-emerald-600'
          }`}>
            Net
          </div>
          <div className={`text-2xl font-bold tabular-nums ${
            banking.netCalories >= 0 ? 'text-slate-900' : 'text-emerald-700'
          }`}>
            {banking.netCalories >= 0 ? '+' : ''}
            {banking.netCalories.toLocaleString()}
          </div>
          <div className={`text-xs mt-1 ${
            banking.netCalories >= 0 ? 'text-slate-500' : 'text-emerald-600'
          }`}>
            kcal
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold text-slate-700">
            Weekly Progress
          </div>
          <div className="text-sm text-slate-600 tabular-nums">
            {banking.totalConsumed.toLocaleString()} / {banking.weeklyGoal.toLocaleString()} kcal
          </div>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="text-xs text-slate-500 mt-1">
          {progressPercentage.toFixed(1)}% of weekly goal
        </div>
      </div>

      {/* Status Message */}
      <div className={`p-4 rounded-xl flex items-start gap-3 ${
        isOnTrack
          ? 'bg-emerald-50 border border-emerald-200'
          : banking.variance > 0
          ? 'bg-blue-50 border border-blue-200'
          : 'bg-amber-50 border border-amber-200'
      }`}>
        {isOnTrack ? (
          <TrendingUp className={`w-5 h-5 mt-0.5 ${
            banking.variance >= 0 ? 'text-emerald-600' : 'text-blue-600'
          }`} />
        ) : (
          <TrendingDown className="w-5 h-5 mt-0.5 text-amber-600" />
        )}
        <div className="flex-1">
          <div className={`text-sm font-semibold mb-1 ${
            isOnTrack
              ? banking.variance >= 0
                ? 'text-emerald-900'
                : 'text-blue-900'
              : 'text-amber-900'
          }`}>
            {banking.statusText}
          </div>
          {banking.goalInfo && (
            <div className="text-xs text-slate-600 mt-1">
              {banking.goalInfo.unit === 'per_day' ? (
                <>
                  Daily goal: {banking.goalInfo.amount} kcal/day · 
                  Expected after {banking.daysElapsed} days: {(banking.goalInfo.amount * banking.daysElapsed).toLocaleString()} kcal
                </>
              ) : (
                <>
                  Weekly goal: {banking.goalInfo.amount.toLocaleString()} kcal/week
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Goal Progress (if goal-based) */}
      {banking.goalInfo && banking.goalInfo.unit === 'per_day' && (
        <div className="mt-6 pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Flame className="w-4 h-4 text-indigo-600" />
              Goal Progress (Net Calories)
            </div>
            <div className="text-sm text-slate-600 tabular-nums">
              {banking.netCalories >= 0 ? '+' : ''}{banking.netCalories.toLocaleString()} / {banking.goalInfo.amount >= 0 ? '+' : ''}{(banking.goalInfo.amount * banking.daysElapsed).toLocaleString()} kcal
            </div>
          </div>
          {banking.goalInfo.amount > 0 && banking.daysElapsed > 0 && (
            <>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
                  style={{ width: `${Math.min(100, Math.max(0, netProgressPercentage || 0))}%` }}
                />
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {netProgressPercentage ? netProgressPercentage.toFixed(1) : 0}% of goal after {banking.daysElapsed} days
              </div>
            </>
          )}
          {banking.goalInfo.amount <= 0 && (
            <div className="text-xs text-slate-500 mt-1">
              Target: {banking.goalInfo.amount.toLocaleString()} kcal/day · 
              After {banking.daysElapsed} days: {(banking.goalInfo.amount * banking.daysElapsed).toLocaleString()} kcal
            </div>
          )}
        </div>
      )}
    </div>
  )
}
