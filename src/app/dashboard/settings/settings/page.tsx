'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useProfile, useUpdateProfile, GoalInput } from '@/lib/queries/profiles'
import { DatePicker } from '@/components/DatePicker'
import { LogOut, Save, Loader2, ArrowLeft } from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const supabase = createClient()
  const { data: profile, isLoading: profileLoading } = useProfile()
  const updateProfile = useUpdateProfile()

  const [goalDescription, setGoalDescription] = useState('')
  const [goalAmount, setGoalAmount] = useState('')
  const [goalUnit, setGoalUnit] = useState<'per_day' | 'per_week'>('per_day')
  const [durationMethod, setDurationMethod] = useState<'weeks' | 'end_date'>('weeks')
  const [durationWeeks, setDurationWeeks] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    // Check authentication
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login')
      }
    })
  }, [router, supabase, mounted])

  // Populate form when profile loads
  useEffect(() => {
    if (profile) {
      setGoalDescription(profile.goal_description || '')
      setGoalAmount(profile.goal_amount?.toString() || '')
      setGoalUnit(profile.goal_unit || 'per_day')
      
      if (profile.goal_duration_weeks) {
        setDurationMethod('weeks')
        setDurationWeeks(profile.goal_duration_weeks.toString())
      } else if (profile.goal_end_date) {
        setDurationMethod('end_date')
        setEndDate(profile.goal_end_date)
      }
    }
  }, [profile])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const goalInput: GoalInput = {
        goal_description: goalDescription || null,
        goal_amount: goalAmount ? parseInt(goalAmount, 10) : null,
        goal_unit: goalUnit,
      }

      if (durationMethod === 'weeks') {
        if (!durationWeeks || parseInt(durationWeeks, 10) <= 0) {
          alert('Please enter a valid number of weeks')
          setIsSubmitting(false)
          return
        }
        goalInput.goal_duration_weeks = parseInt(durationWeeks, 10)
        goalInput.goal_end_date = null
      } else {
        if (!endDate) {
          alert('Please select an end date')
          setIsSubmitting(false)
          return
        }
        goalInput.goal_end_date = endDate
        goalInput.goal_duration_weeks = null
      }

      if (!goalInput.goal_amount || goalInput.goal_amount <= 0) {
        alert('Please enter a valid goal amount')
        setIsSubmitting(false)
        return
      }

      await updateProfile.mutateAsync(goalInput)
      
      // Show success and redirect
      alert('Goal saved successfully!')
      router.push('/')
    } catch (error: any) {
      alert(error.message || 'Failed to save goal')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClearGoal = async () => {
    if (!confirm('Are you sure you want to clear your current goal?')) {
      return
    }

    try {
      const goalInput: GoalInput = {
        goal_description: null,
        goal_amount: null,
        goal_unit: null,
        goal_duration_weeks: null,
        goal_end_date: null,
      }

      await updateProfile.mutateAsync(goalInput)
      alert('Goal cleared successfully!')
      
      // Reset form
      setGoalDescription('')
      setGoalAmount('')
      setGoalUnit('per_day')
      setDurationMethod('weeks')
      setDurationWeeks('')
      setEndDate('')
    } catch (error: any) {
      alert(error.message || 'Failed to clear goal')
    }
  }

  if (!mounted || profileLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  // Calculate min date for end date picker (today)
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-slate-500 hover:text-indigo-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Settings
              </h1>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-500 hover:text-indigo-600 font-medium text-sm flex items-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto p-6">
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Nutrition Goal</h2>
            <p className="text-slate-600 text-sm">
              Set a custom calorie goal with a duration. You can define goals like "500 kcal deficit per day" 
              or "2000 kcal per day" for a specific period.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Goal Description */}
            <div>
              <label htmlFor="goal-description" className="text-sm font-semibold text-slate-600 mb-1.5 block">
                Goal Description (Optional)
              </label>
              <input
                id="goal-description"
                type="text"
                value={goalDescription}
                onChange={(e) => setGoalDescription(e.target.value)}
                placeholder="e.g., 500 kcal deficit per day"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Goal Amount and Unit */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="goal-amount" className="text-sm font-semibold text-slate-600 mb-1.5 block">
                  Goal Amount *
                </label>
                <input
                  id="goal-amount"
                  type="number"
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(e.target.value)}
                  placeholder="500"
                  min="1"
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all tabular-nums"
                />
              </div>

              <div>
                <label htmlFor="goal-unit" className="text-sm font-semibold text-slate-600 mb-1.5 block">
                  Unit *
                </label>
                <select
                  id="goal-unit"
                  value={goalUnit}
                  onChange={(e) => setGoalUnit(e.target.value as 'per_day' | 'per_week')}
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                >
                  <option value="per_day">Per Day</option>
                  <option value="per_week">Per Week</option>
                </select>
              </div>
            </div>

            {/* Duration Method */}
            <div>
              <label className="text-sm font-semibold text-slate-600 mb-2 block">
                Duration Method *
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDurationMethod('weeks')}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                    durationMethod === 'weeks'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Duration (Weeks)
                </button>
                <button
                  type="button"
                  onClick={() => setDurationMethod('end_date')}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                    durationMethod === 'end_date'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  End Date
                </button>
              </div>
            </div>

            {/* Duration Input (Conditional) */}
            {durationMethod === 'weeks' ? (
              <div>
                <label htmlFor="duration-weeks" className="text-sm font-semibold text-slate-600 mb-1.5 block">
                  Duration (Weeks) *
                </label>
                <input
                  id="duration-weeks"
                  type="number"
                  value={durationWeeks}
                  onChange={(e) => setDurationWeeks(e.target.value)}
                  placeholder="8"
                  min="1"
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all tabular-nums"
                />
              </div>
            ) : (
              <div>
                <label htmlFor="end-date" className="text-sm font-semibold text-slate-600 mb-1.5 block">
                  End Date *
                </label>
                <DatePicker
                  id="end-date"
                  value={endDate}
                  onChange={setEndDate}
                  min={today}
                  required
                  placeholder="YYYY-MM-DD"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pr-12 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            )}

            {/* Current Goal Display */}
            {profile?.goal_amount && (
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                <div className="text-sm font-semibold text-indigo-900 mb-1">Current Goal</div>
                <div className="text-sm text-indigo-700">
                  {profile.goal_description || `${profile.goal_amount} kcal ${profile.goal_unit === 'per_day' ? 'per day' : 'per week'}`}
                  {profile.goal_start_date && (
                    <span className="ml-2 text-indigo-600">
                      (Started: {new Date(profile.goal_start_date).toLocaleDateString()})
                    </span>
                  )}
                  {profile.goal_end_date && (
                    <span className="ml-2 text-indigo-600">
                      (Ends: {new Date(profile.goal_end_date).toLocaleDateString()})
                    </span>
                  )}
                  {profile.goal_duration_weeks && !profile.goal_end_date && (
                    <span className="ml-2 text-indigo-600">
                      ({profile.goal_duration_weeks} weeks)
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              {profile?.goal_amount && (
                <button
                  type="button"
                  onClick={handleClearGoal}
                  disabled={isSubmitting || updateProfile.isPending}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Clear Goal
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting || updateProfile.isPending}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting || updateProfile.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Goal
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
