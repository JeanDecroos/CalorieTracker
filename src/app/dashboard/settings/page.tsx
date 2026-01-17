'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useProfile, useUpdateProfile, GoalInput } from '@/lib/queries/profiles'
import { DatePicker } from '@/components/DatePicker'
import { Navigation } from '@/components/Navigation'
import { Save, Loader2, Activity, Link2, CheckCircle2, XCircle } from 'lucide-react'

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
  const [age, setAge] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Strava connection state
  const [stravaConnected, setStravaConnected] = useState(false)
  const [checkingStrava, setCheckingStrava] = useState(true)
  const [syncingStrava, setSyncingStrava] = useState(false)

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
      setAge(profile.age?.toString() || '')
      setWeightKg(profile.weight_kg?.toString() || '')
      
      if (profile.goal_duration_weeks) {
        setDurationMethod('weeks')
        setDurationWeeks(profile.goal_duration_weeks.toString())
      } else if (profile.goal_end_date) {
        setDurationMethod('end_date')
        setEndDate(profile.goal_end_date)
      }
    }
  }, [profile])

  // Check Strava connection status
  useEffect(() => {
    if (!mounted) return

    const checkStravaConnection = async () => {
      try {
        const { data, error } = await supabase
          .from('strava_connections')
          .select('id')
          .single()

        setStravaConnected(!error && !!data)
      } catch (error) {
        setStravaConnected(false)
      } finally {
        setCheckingStrava(false)
      }
    }

    checkStravaConnection()

    // Check for URL parameters (from OAuth callback)
    const params = new URLSearchParams(window.location.search)
    const stravaConnectedParam = params.get('strava_connected')
    const stravaError = params.get('strava_error')

    if (stravaConnectedParam === 'true') {
      setStravaConnected(true)
      alert('Strava connected successfully!')
      // Clean up URL
      window.history.replaceState({}, '', '/dashboard/settings')
    } else if (stravaError) {
      alert(`Strava connection error: ${stravaError}`)
      // Clean up URL
      window.history.replaceState({}, '', '/dashboard/settings')
    }
  }, [mounted, supabase])


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
      router.push('/dashboard/challenge/week')
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

  const handleConnectStrava = () => {
    window.location.href = '/api/strava/auth'
  }

  const handleSyncStrava = async () => {
    setSyncingStrava(true)
    try {
      const response = await fetch('/api/strava/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ days: 365 }), // Sync last year to catch older activities
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync activities')
      }

      let message = `Synced ${data.synced} new activities from Strava!`
      if (data.skipped > 0) {
        message += ` (${data.skipped} already synced)`
      }
      if (data.failed > 0) {
        message += `\n\n⚠️ ${data.failed} activities failed to sync.`
        if (data.failed_details && data.failed_details.length > 0) {
          message += `\nErrors: ${data.failed_details.map((f: any) => f.error).join(', ')}`
        }
      }
      if (data.total === 0) {
        message = 'No activities found in Strava for the date range.'
      }

      alert(message)
    } catch (error: any) {
      alert(error.message || 'Failed to sync Strava activities')
    } finally {
      setSyncingStrava(false)
    }
  }

  const handleDisconnectStrava = async () => {
    if (!confirm('Are you sure you want to disconnect Strava? This will not delete your synced activities.')) {
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        alert('You must be logged in to disconnect Strava')
        return
      }

      const { error } = await supabase
        .from('strava_connections')
        .delete()
        .eq('user_id', user.id)

      if (error) throw error

      setStravaConnected(false)
      alert('Strava disconnected successfully')
    } catch (error: any) {
      alert(error.message || 'Failed to disconnect Strava')
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
      <Navigation />

      {/* Main Content */}
      <main className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Profile Information */}
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Profile Information</h2>
            <p className="text-slate-600 text-sm">
              Age and weight are used for calorie estimation when syncing Strava activities.
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="age" className="text-sm font-semibold text-slate-600 mb-1.5 block">
                  Age (years)
                </label>
                <input
                  id="age"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Optional"
                  min="1"
                  max="150"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all tabular-nums"
                />
              </div>

              <div>
                <label htmlFor="weight" className="text-sm font-semibold text-slate-600 mb-1.5 block">
                  Weight (kg)
                </label>
                <input
                  id="weight"
                  type="number"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  placeholder="Optional"
                  min="1"
                  max="500"
                  step="0.1"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all tabular-nums"
                />
              </div>
            </div>

            <button
              onClick={async () => {
                setIsSubmitting(true)
                try {
                  const profileInput: GoalInput = {
                    age: age ? parseInt(age, 10) : null,
                    weight_kg: weightKg ? parseFloat(weightKg) : null,
                  }
                  await updateProfile.mutateAsync(profileInput)
                  alert('Profile information saved successfully!')
                } catch (error: any) {
                  alert(error.message || 'Failed to save profile information')
                } finally {
                  setIsSubmitting(false)
                }
              }}
              disabled={isSubmitting || updateProfile.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting || updateProfile.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Profile Info
                </>
              )}
            </button>
          </div>
        </div>

        {/* Nutrition Goal */}
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

        {/* Strava Integration Section */}
        <div className="mt-8 bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Activity className="w-6 h-6 text-orange-600" />
              Strava Integration
            </h2>
            <p className="text-slate-600 text-sm">
              Connect your Strava account to automatically sync your activities and calories burned.
            </p>
          </div>

          {checkingStrava ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
          ) : stravaConnected ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-emerald-900">Connected to Strava</div>
                  <div className="text-sm text-emerald-700 mt-0.5">
                    Your Strava account is connected and ready to sync activities.
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSyncStrava}
                  disabled={syncingStrava}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {syncingStrava ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <Activity className="w-4 h-4" />
                      Sync Activities (Last 30 Days)
                    </>
                  )}
                </button>
                <button
                  onClick={handleDisconnectStrava}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all"
                >
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                <XCircle className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-slate-900">Not Connected</div>
                  <div className="text-sm text-slate-600 mt-0.5">
                    Connect your Strava account to automatically import activities.
                  </div>
                </div>
              </div>

              <button
                onClick={handleConnectStrava}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Link2 className="w-4 h-4" />
                Connect Strava Account
              </button>
            </div>
          )}
        </div>

        {/* Privacy Policy Link */}
        <div className="mt-8 text-center">
          <a
            href="/privacy"
            className="text-sm text-slate-500 hover:text-indigo-600 transition-colors"
          >
            Privacy Policy
          </a>
        </div>
      </main>
    </div>
  )
}
