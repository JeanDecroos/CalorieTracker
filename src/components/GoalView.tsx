'use client'

import { Target, Calendar, TrendingUp, TrendingDown, Flame, Clock, CheckCircle2 } from 'lucide-react'
import { useProfile } from '@/lib/queries/profiles'
import { useWeeklyBanking } from '@/lib/queries/weeklyCalculations'
import { format, differenceInDays, differenceInWeeks } from 'date-fns'
import Link from 'next/link'

export function GoalView() {
  const { data: profile, isLoading: profileLoading } = useProfile()
  const { data: banking, isLoading: bankingLoading } = useWeeklyBanking()

  if (profileLoading || bankingLoading) {
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

  if (!profile?.goal_amount || !profile?.goal_unit) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">No Goal Set</h3>
          <p className="text-sm text-slate-600 mb-6">
            Set a nutrition goal to track your progress and stay motivated.
          </p>
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]"
          >
            <Target className="w-5 h-5" />
            Set Goal
          </Link>
        </div>
      </div>
    )
  }

  const goalInfo = profile.goal_unit === 'per_day' 
    ? { amount: profile.goal_amount, unit: 'per_day' as const }
    : { amount: profile.goal_amount, unit: 'per_week' as const }

  const startDate = profile.goal_start_date ? new Date(profile.goal_start_date) : null
  const endDate = profile.goal_end_date ? new Date(profile.goal_end_date) : null
  const durationWeeks = profile.goal_duration_weeks

  // Calculate progress
  const today = new Date()
  const daysSinceStart = startDate ? differenceInDays(today, startDate) + 1 : 0
  const weeksSinceStart = startDate ? Math.ceil(daysSinceStart / 7) : 0

  // Calculate expected progress
  let expectedProgress: number
  let currentProgress: number
  let progressPercentage: number
  let remainingDays: number | null = null
  let remainingWeeks: number | null = null

  if (goalInfo.unit === 'per_day') {
    expectedProgress = goalInfo.amount * daysSinceStart
    currentProgress = banking?.netCalories || 0
    progressPercentage = expectedProgress > 0 
      ? Math.min(100, Math.max(0, (currentProgress / expectedProgress) * 100))
      : 0
    
    if (endDate) {
      remainingDays = Math.max(0, differenceInDays(endDate, today))
    } else if (durationWeeks) {
      const totalDays = durationWeeks * 7
      remainingDays = Math.max(0, totalDays - daysSinceStart)
    }
  } else {
    // per_week
    expectedProgress = goalInfo.amount * weeksSinceStart
    currentProgress = banking?.totalConsumed || 0
    progressPercentage = expectedProgress > 0
      ? Math.min(100, Math.max(0, (currentProgress / expectedProgress) * 100))
      : 0
    
    if (endDate) {
      remainingWeeks = Math.max(0, differenceInWeeks(endDate, today))
    } else if (durationWeeks) {
      remainingWeeks = Math.max(0, durationWeeks - weeksSinceStart)
    }
  }

  const variance = expectedProgress - currentProgress
  const isOnTrack = variance >= -100 && variance <= 100

  // Calculate completion status
  const isCompleted = endDate && today > endDate
  const isActive = !isCompleted && (endDate ? today <= endDate : true)

  return (
    <div className="space-y-6">
      {/* Goal Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <Target className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Your Goal</h2>
              {profile.goal_description ? (
                <p className="text-sm text-slate-600 mt-1">{profile.goal_description}</p>
              ) : (
                <p className="text-sm text-slate-600 mt-1">
                  {goalInfo.amount.toLocaleString()} kcal {goalInfo.unit === 'per_day' ? 'per day' : 'per week'}
                </p>
              )}
            </div>
          </div>
          <Link
            href="/settings"
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Edit Goal
          </Link>
        </div>

        {/* Goal Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-slate-50 rounded-xl">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Goal Amount
            </div>
            <div className="text-xl font-bold text-slate-900 tabular-nums">
              {goalInfo.amount.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              kcal {goalInfo.unit === 'per_day' ? '/day' : '/week'}
            </div>
          </div>

          {startDate && (
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Started
              </div>
              <div className="text-lg font-bold text-slate-900">
                {format(startDate, 'MMM d, yyyy')}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {daysSinceStart} {daysSinceStart === 1 ? 'day' : 'days'} ago
              </div>
            </div>
          )}

          {endDate && (
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {isCompleted ? 'Completed' : 'End Date'}
              </div>
              <div className="text-lg font-bold text-slate-900">
                {format(endDate, 'MMM d, yyyy')}
              </div>
              {!isCompleted && remainingDays !== null && (
                <div className="text-xs text-slate-500 mt-1">
                  {remainingDays} {remainingDays === 1 ? 'day' : 'days'} remaining
                </div>
              )}
            </div>
          )}

          {durationWeeks && !endDate && (
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Duration
              </div>
              <div className="text-lg font-bold text-slate-900">
                {durationWeeks} {durationWeeks === 1 ? 'week' : 'weeks'}
              </div>
              {remainingWeeks !== null && (
                <div className="text-xs text-slate-500 mt-1">
                  {remainingWeeks} {remainingWeeks === 1 ? 'week' : 'weeks'} remaining
                </div>
              )}
            </div>
          )}
        </div>

        {/* Status Badge */}
        {isActive && (
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg mb-6 ${
            isOnTrack
              ? 'bg-emerald-50 border border-emerald-200'
              : 'bg-amber-50 border border-amber-200'
          }`}>
            {isOnTrack ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-amber-600" />
            )}
            <span className={`text-sm font-semibold ${
              isOnTrack ? 'text-emerald-900' : 'text-amber-900'
            }`}>
              {isOnTrack ? 'On Track' : 'Needs Attention'}
            </span>
          </div>
        )}

        {isCompleted && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg mb-6 bg-indigo-50 border border-indigo-200">
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-semibold text-indigo-900">Goal Completed</span>
          </div>
        )}
      </div>

      {/* Progress Visualization */}
      {banking && isActive && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Flame className="w-5 h-5 text-indigo-600" />
              Progress Overview
            </h3>
            <p className="text-sm text-slate-600">
              {goalInfo.unit === 'per_day' 
                ? `Current net calories: ${banking.netCalories >= 0 ? '+' : ''}${banking.netCalories.toLocaleString()} kcal`
                : `Current week consumed: ${banking.totalConsumed.toLocaleString()} kcal`
              }
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold text-slate-700">
                {goalInfo.unit === 'per_day' ? 'Daily Goal Progress' : 'Weekly Goal Progress'}
              </div>
              <div className="text-sm text-slate-600 tabular-nums">
                {currentProgress >= 0 ? '+' : ''}{currentProgress.toLocaleString()} / {expectedProgress >= 0 ? '+' : ''}{Math.round(expectedProgress).toLocaleString()} kcal
              </div>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  progressPercentage >= 100 
                    ? 'bg-emerald-600' 
                    : progressPercentage >= 90 
                    ? 'bg-indigo-600' 
                    : isOnTrack
                    ? 'bg-blue-500'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}
              />
            </div>
            <div className="text-xs text-slate-500 mt-2">
              {progressPercentage.toFixed(1)}% of expected progress
            </div>
          </div>

          {/* Variance Status */}
          <div className={`p-4 rounded-xl flex items-start gap-3 ${
            isOnTrack
              ? 'bg-emerald-50 border border-emerald-200'
              : variance > 0
              ? 'bg-blue-50 border border-blue-200'
              : 'bg-amber-50 border border-amber-200'
          }`}>
            {isOnTrack ? (
              <TrendingUp className={`w-5 h-5 mt-0.5 ${
                variance >= 0 ? 'text-emerald-600' : 'text-blue-600'
              }`} />
            ) : (
              <TrendingDown className="w-5 h-5 mt-0.5 text-amber-600" />
            )}
            <div className="flex-1">
              <div className={`text-sm font-semibold mb-1 ${
                isOnTrack
                  ? variance >= 0
                    ? 'text-emerald-900'
                    : 'text-blue-900'
                  : 'text-amber-900'
              }`}>
                {variance > 0
                  ? `${Math.round(variance).toLocaleString()} kcal ahead of target`
                  : variance < 0
                  ? `${Math.round(Math.abs(variance)).toLocaleString()} kcal behind target`
                  : 'Exactly on target'}
              </div>
              <div className="text-xs text-slate-600 mt-1">
                {goalInfo.unit === 'per_day' ? (
                  <>
                    Expected after {daysSinceStart} {daysSinceStart === 1 ? 'day' : 'days'}: {Math.round(expectedProgress).toLocaleString()} kcal · 
                    Current: {currentProgress >= 0 ? '+' : ''}{currentProgress.toLocaleString()} kcal
                  </>
                ) : (
                  <>
                    Expected after {weeksSinceStart} {weeksSinceStart === 1 ? 'week' : 'weeks'}: {Math.round(expectedProgress).toLocaleString()} kcal · 
                    Current: {currentProgress.toLocaleString()} kcal
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Banking Info (if available) */}
      {banking && banking.goalInfo && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
          <h3 className="text-lg font-bold text-slate-900 mb-4">This Week's Progress</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Consumed
              </div>
              <div className="text-xl font-bold text-slate-900 tabular-nums">
                {banking.totalConsumed.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 mt-1">kcal</div>
            </div>

            {banking.totalBurned > 0 && (
              <div className="p-4 bg-emerald-50 rounded-xl">
                <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">
                  Burned
                </div>
                <div className="text-xl font-bold text-emerald-700 tabular-nums">
                  -{banking.totalBurned.toLocaleString()}
                </div>
                <div className="text-xs text-emerald-600 mt-1">kcal</div>
              </div>
            )}

            <div className={`p-4 rounded-xl ${
              banking.netCalories >= 0 ? 'bg-slate-50' : 'bg-emerald-50'
            }`}>
              <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${
                banking.netCalories >= 0 ? 'text-slate-500' : 'text-emerald-600'
              }`}>
                Net
              </div>
              <div className={`text-xl font-bold tabular-nums ${
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

            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Status
              </div>
              <div className={`text-sm font-bold ${
                banking.variance >= -100 && banking.variance <= 100
                  ? 'text-emerald-600'
                  : banking.variance > 0
                  ? 'text-blue-600'
                  : 'text-amber-600'
              }`}>
                {banking.statusText}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}