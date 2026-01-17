'use client'

import { useState } from 'react'
import { Plus, X, Save, Activity } from 'lucide-react'
import { useAddActivity } from '@/lib/queries/activities'
import { formatDateForDB } from '@/utils/dateUtils'

interface ActivityWizardProps {
  date?: Date
  onClose?: () => void
}

export function ActivityWizard({ date, onClose }: ActivityWizardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activityName, setActivityName] = useState('')
  const [caloriesBurned, setCaloriesBurned] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('')
  const [error, setError] = useState<string | null>(null)

  const addActivity = useAddActivity()

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

  if (!isOpen) {
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
            if (onClose) onClose()
          }}
          className="text-slate-400 hover:text-slate-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="mb-4 px-3 py-3 rounded-xl text-sm bg-rose-50 border border-rose-200 text-rose-700">
          {error}
        </div>
      )}

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
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
    </div>
  )
}
