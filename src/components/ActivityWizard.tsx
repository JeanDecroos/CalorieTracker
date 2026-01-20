'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Save, Activity, Loader2, RefreshCw } from 'lucide-react'
import { useAddActivity } from '@/lib/queries/activities'
import { formatDateForDB } from '@/utils/dateUtils'
import { createClient } from '@/lib/supabase/client'

interface ActivityWizardProps {
  date?: Date
  onClose?: () => void
}

type ActivityMode = 'manual' | 'strava' | 'whoop'

export function ActivityWizard({ date, onClose }: ActivityWizardProps) {
  // If date is provided, we're in a modal - always show the form
  const [isOpen, setIsOpen] = useState(!date)
  const [mode, setMode] = useState<ActivityMode>('manual')
  const [activityName, setActivityName] = useState('')
  const [caloriesBurned, setCaloriesBurned] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  // Connection status
  const [stravaConnected, setStravaConnected] = useState(false)
  const [whoopConnected, setWhoopConnected] = useState(false)
  const [checkingConnections, setCheckingConnections] = useState(true)
  
  // Sync states
  const [syncingStrava, setSyncingStrava] = useState(false)
  const [syncingWhoop, setSyncingWhoop] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)

  const addActivity = useAddActivity()
  const supabase = createClient()

  // If date is provided, always show the form (modal mode)
  const showForm = date ? true : isOpen

  // Check connection status on mount
  useEffect(() => {
    if (!showForm) return
    
    const checkConnections = async () => {
      try {
        // Check Strava connection
        const { data: stravaData, error: stravaError } = await supabase
          .from('strava_connections')
          .select('id')
          .single()
        setStravaConnected(!stravaError && !!stravaData)

        // Check Whoop connection
        const { data: whoopData, error: whoopError } = await supabase
          .from('whoop_connections')
          .select('id')
          .single()
        setWhoopConnected(!whoopError && !!whoopData)
      } catch (error) {
        console.error('Error checking connections:', error)
        setStravaConnected(false)
        setWhoopConnected(false)
      } finally {
        setCheckingConnections(false)
      }
    }

    checkConnections()
  }, [showForm, supabase])

  const handleSave = async () => {
    setError(null)

    if (!activityName.trim()) {
      setError('Please enter an activity name')
      return
    }

    const calories = parseInt(caloriesBurned)
    if (isNaN(calories) || calories <= 0) {
      setError('Please enter a valid number of calories burned')
      return
    }

    const duration = durationMinutes ? parseInt(durationMinutes) : undefined
    if (durationMinutes && (isNaN(duration!) || duration! <= 0)) {
      setError('Please enter a valid duration in minutes')
      return
    }

    try {
      // Use formatDateForDB to avoid timezone issues (toISOString converts to UTC which can shift dates)
      await addActivity.mutateAsync({
        activity_name: activityName.trim(),
        calories_burned: calories,
        duration_minutes: duration,
        date: date ? formatDateForDB(date) : undefined,
      })

      // Reset form
      setIsOpen(false)
      setActivityName('')
      setCaloriesBurned('')
      setDurationMinutes('')
      setError(null)
      
      if (onClose) {
        onClose()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save activity')
    }
  }

  const handleSyncStrava = async () => {
    if (!stravaConnected) {
      window.location.href = '/api/strava/auth'
      return
    }

    setSyncingStrava(true)
    setError(null)
    setSyncResult(null)

    try {
      // Calculate days to sync - if date is provided, sync that specific day plus recent days
      // Otherwise, sync last 30 days
      let days = 30
      if (date) {
        const now = new Date()
        const dateDiff = Math.ceil((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
        days = Math.max(7, dateDiff + 7) // At least 7 days, or date difference + buffer
      }

      const response = await fetch('/api/strava/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ days }),
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
      }
      if (data.total === 0) {
        message = 'No new activities to sync from Strava.'
      }

      setSyncResult(message)

      // Close modal after a short delay if successful
      if (data.synced > 0) {
        setTimeout(() => {
          if (onClose) {
            onClose()
          }
        }, 2000)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sync Strava activities')
    } finally {
      setSyncingStrava(false)
    }
  }

  const handleSyncWhoop = async () => {
    if (!whoopConnected) {
      window.location.href = '/api/whoop/auth'
      return
    }

    setSyncingWhoop(true)
    setError(null)
    setSyncResult(null)

    try {
      // Calculate days to sync - if date is provided, sync that specific day plus recent days
      // Otherwise, sync last 30 days
      let days = 30
      if (date) {
        const now = new Date()
        const dateDiff = Math.ceil((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
        days = Math.max(7, dateDiff + 7) // At least 7 days, or date difference + buffer
      }

      const response = await fetch('/api/whoop/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ days }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync activities')
      }

      let message = `Synced ${data.synced} new activities from Whoop!`
      if (data.skipped > 0) {
        message += ` (${data.skipped} already synced)`
      }
      if (data.failed > 0) {
        message += `\n\n⚠️ ${data.failed} activities failed to sync.`
      }
      if (data.total === 0) {
        message = 'No new activities to sync from Whoop.'
      }

      setSyncResult(message)

      // Close modal after a short delay if successful
      if (data.synced > 0) {
        setTimeout(() => {
          if (onClose) {
            onClose()
          }
        }, 2000)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sync Whoop activities')
    } finally {
      setSyncingWhoop(false)
    }
  }

  const handleConnectStrava = () => {
    window.location.href = '/api/strava/auth'
  }

  const handleConnectWhoop = () => {
    window.location.href = '/api/whoop/auth'
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
      >
        <Plus className="w-4 h-4" />
        Add Activity
      </button>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
          Add Activity
        </h3>
        <button
          onClick={() => {
            setIsOpen(false)
            setActivityName('')
            setCaloriesBurned('')
            setDurationMinutes('')
            setError(null)
            setSyncResult(null)
            setMode('manual')
            if (onClose) onClose()
          }}
          className="text-slate-400 hover:text-slate-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Mode Selection Tabs */}
      <div className="mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => {
              setMode('manual')
              setError(null)
              setSyncResult(null)
            }}
            className={`flex-1 py-2 px-4 rounded-xl font-medium transition-all text-xs ${
              mode === 'manual'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Manual Entry
          </button>
          <button
            onClick={() => {
              setMode('strava')
              setError(null)
              setSyncResult(null)
            }}
            className={`flex-1 py-2 px-4 rounded-xl font-medium transition-all text-xs ${
              mode === 'strava'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Strava
          </button>
          <button
            onClick={() => {
              setMode('whoop')
              setError(null)
              setSyncResult(null)
            }}
            className={`flex-1 py-2 px-4 rounded-xl font-medium transition-all text-xs ${
              mode === 'whoop'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Whoop
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-3 py-3 rounded-xl text-sm bg-rose-50 border border-rose-200 text-rose-700">
          {error}
        </div>
      )}

      {syncResult && (
        <div className="mb-4 px-3 py-3 rounded-xl text-sm bg-emerald-50 border border-emerald-200 text-emerald-700 whitespace-pre-line">
          {syncResult}
        </div>
      )}

      {/* Manual Entry Mode */}
      {mode === 'manual' && (
        <div className="space-y-3">
          <div>
            <label className="text-sm font-semibold text-slate-600 mb-1.5 block">
              Activity Name
            </label>
            <input
              type="text"
              value={activityName}
              onChange={(e) => setActivityName(e.target.value)}
              placeholder="e.g., Running, Cycling, Gym"
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-slate-600 mb-1.5 block">
                Calories Burned
              </label>
              <input
                type="number"
                value={caloriesBurned}
                onChange={(e) => setCaloriesBurned(e.target.value)}
                placeholder="e.g., 300"
                min="1"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-600 mb-1.5 block">
                Duration (min)
              </label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                placeholder="Optional"
                min="1"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => {
                setIsOpen(false)
                setActivityName('')
                setCaloriesBurned('')
                setDurationMinutes('')
                setError(null)
                if (onClose) onClose()
              }}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-4 rounded-xl transition-all text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={addActivity.isPending}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2 text-sm"
            >
              {addActivity.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Strava Sync Mode */}
      {mode === 'strava' && (
        <div className="space-y-4">
          {checkingConnections ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : stravaConnected ? (
            <div className="space-y-3">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-900">Strava Connected</span>
                </div>
                <p className="text-xs text-emerald-700">
                  Click the button below to sync your Strava activities. This will import your recent workouts automatically.
                </p>
              </div>
              <button
                onClick={handleSyncStrava}
                disabled={syncingStrava}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2 text-sm"
              >
                {syncingStrava ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Syncing from Strava...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    Sync from Strava
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-slate-600" />
                  <span className="text-sm font-semibold text-slate-900">Strava Not Connected</span>
                </div>
                <p className="text-xs text-slate-600">
                  Connect your Strava account to automatically sync your workouts and activities.
                </p>
              </div>
              <button
                onClick={handleConnectStrava}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
              >
                <Activity className="w-5 h-5" />
                Connect Strava
              </button>
            </div>
          )}
        </div>
      )}

      {/* Whoop Sync Mode */}
      {mode === 'whoop' && (
        <div className="space-y-4">
          {checkingConnections ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : whoopConnected ? (
            <div className="space-y-3">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-900">Whoop Connected</span>
                </div>
                <p className="text-xs text-emerald-700">
                  Click the button below to sync your Whoop activities. This will import your recent workouts automatically.
                </p>
              </div>
              <button
                onClick={handleSyncWhoop}
                disabled={syncingWhoop}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2 text-sm"
              >
                {syncingWhoop ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Syncing from Whoop...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    Sync from Whoop
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-slate-600" />
                  <span className="text-sm font-semibold text-slate-900">Whoop Not Connected</span>
                </div>
                <p className="text-xs text-slate-600">
                  Connect your Whoop account to automatically sync your workouts and activities.
                </p>
              </div>
              <button
                onClick={handleConnectWhoop}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
              >
                <Activity className="w-5 h-5" />
                Connect Whoop
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
