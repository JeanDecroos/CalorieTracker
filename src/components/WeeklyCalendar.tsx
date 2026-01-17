'use client'

import { useState } from 'react'
import { format, startOfWeek, addDays, isSameDay, isToday, isSameWeek } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, Trash2, ChevronDown, ChevronUp, X, Save, Loader2 } from 'lucide-react'
import { MealWizard } from './MealWizard'
import { ActivityWizard } from './ActivityWizard'
import { useFoodLogs, FoodLog, useUpdateFoodLog } from '@/lib/queries/foodLogs'
import { useActivities, Activity, useUpdateActivity } from '@/lib/queries/activities'
import { useDeleteFoodLog } from '@/lib/queries/foodLogs'
import { useDeleteActivity } from '@/lib/queries/activities'
import { getWeekStart, getWeekEnd } from '@/utils/dateUtils'

export function WeeklyCalendar() {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showMealWizard, setShowMealWizard] = useState(false)
  const [showActivityWizard, setShowActivityWizard] = useState(false)
  const [expandedMeals, setExpandedMeals] = useState<Record<string, boolean>>({})
  const [editingFoodLog, setEditingFoodLog] = useState<FoodLog | null>(null)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)

  const weekStart = getWeekStart(currentWeek)
  const weekEnd = getWeekEnd(currentWeek)
  
  const { data: foodLogs = [], isLoading: foodLogsLoading } = useFoodLogs(weekStart, weekEnd)
  const { data: activities = [], isLoading: activitiesLoading } = useActivities(weekStart, weekEnd)
  const deleteFoodLog = useDeleteFoodLog()
  const deleteActivity = useDeleteActivity()

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(addDays(currentWeek, direction === 'next' ? 7 : -7))
  }

  const goToToday = () => {
    setCurrentWeek(new Date())
  }

  const getDayFoodLogs = (date: Date) => {
    return foodLogs.filter((log) => isSameDay(new Date(log.date), date))
  }

  const getDayActivities = (date: Date) => {
    return activities.filter((activity) => isSameDay(new Date(activity.date), date))
  }

  const getDayTotals = (date: Date) => {
    const dayLogs = getDayFoodLogs(date)
    const dayActivities = getDayActivities(date)
    
    const caloriesConsumed = dayLogs.reduce((sum, log) => sum + log.calories, 0)
    const caloriesBurned = dayActivities.reduce((sum, activity) => sum + (activity.calories_burned || 0), 0)
    const netCalories = caloriesConsumed - caloriesBurned
    const protein = dayLogs.reduce((sum, log) => sum + log.protein, 0)

    return { caloriesConsumed, caloriesBurned, netCalories, protein }
  }

  const handleAddMeal = (date: Date) => {
    // Normalize date to local timezone at midnight to avoid timezone issues
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    setSelectedDate(normalizedDate)
    setShowMealWizard(true)
  }

  const handleAddActivity = (date: Date) => {
    // Normalize date to local timezone at midnight to avoid timezone issues
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    setSelectedDate(normalizedDate)
    setShowActivityWizard(true)
  }

  const toggleMealExpansion = (dateKey: string, mealType: string) => {
    const key = `${dateKey}-${mealType}`
    setExpandedMeals((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const getMealsByType = (dayLogs: FoodLog[]) => {
    const mealsByType: Record<string, FoodLog[]> = {
      Breakfast: [],
      Lunch: [],
      Dinner: [],
      Snack: [],
    }

    dayLogs.forEach((log) => {
      const mealType = log.meal_type || 'Lunch'
      if (mealsByType[mealType]) {
        mealsByType[mealType].push(log)
      } else {
        // Fallback to Lunch if meal_type is not one of the expected values
        mealsByType['Lunch'].push(log)
      }
    })

    return mealsByType
  }

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateWeek('prev')}
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-slate-900">
            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </h2>
          {!isSameWeek(currentWeek, new Date(), { weekStartsOn: 1 }) && (
            <button
              onClick={goToToday}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Today
            </button>
          )}
        </div>

        <button
          onClick={() => navigateWeek('next')}
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDays.map((day) => {
          const dayLogs = getDayFoodLogs(day)
          const dayActivities = getDayActivities(day)
          const totals = getDayTotals(day)
          const isCurrentDay = isToday(day)
          const dateKey = day.toISOString()

          return (
            <div
              key={day.toISOString()}
              className={`bg-white rounded-2xl p-4 border ${
                isCurrentDay
                  ? 'border-indigo-300 shadow-lg shadow-indigo-100'
                  : 'border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]'
              }`}
            >
              {/* Day Header */}
              <div className="mb-3">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  {format(day, 'EEE')}
                </div>
                <div
                  className={`text-lg font-bold ${
                    isCurrentDay ? 'text-indigo-600' : 'text-slate-900'
                  }`}
                >
                  {format(day, 'd')}
                </div>
              </div>

              {/* Day Totals */}
              <div className="mb-3 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Consumed:</span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {totals.caloriesConsumed} kcal
                  </span>
                </div>
                {totals.caloriesBurned > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Burned:</span>
                    <span className="font-semibold text-emerald-600 tabular-nums">
                      -{totals.caloriesBurned} kcal
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-slate-100">
                  <span className="text-slate-700 font-medium">Net:</span>
                  <span
                    className={`font-bold tabular-nums ${
                      totals.netCalories >= 0 ? 'text-slate-900' : 'text-emerald-600'
                    }`}
                  >
                    {totals.netCalories >= 0 ? '+' : ''}
                    {totals.netCalories} kcal
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Protein:</span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {totals.protein}g
                  </span>
                </div>
              </div>

              {/* Add Buttons */}
              <div className="space-y-2 mb-3">
                <button
                  onClick={() => handleAddMeal(day)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-3 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Meal
                </button>
                <button
                  onClick={() => handleAddActivity(day)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Activity
                </button>
              </div>

              {/* Food Logs */}
              {dayLogs.length > 0 && (() => {
                const mealsByType = getMealsByType(dayLogs)
                const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const

                return (
                  <div className="mb-2 space-y-2">
                    {mealTypes.map((mealType) => {
                      const meals = mealsByType[mealType]
                      if (meals.length === 0) return null

                      const expansionKey = `${dateKey}-${mealType}`
                      const isExpanded = expandedMeals[expansionKey] ?? false

                      return (
                        <div key={mealType}>
                          <button
                            onClick={() => toggleMealExpansion(dateKey, mealType)}
                            className="w-full flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors group"
                          >
                            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              {mealType}
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </button>
                          {isExpanded && (
                            <div className="space-y-1.5 mt-2">
                              {meals.map((log) => (
                                <div
                                  key={log.id}
                                  onClick={() => setEditingFoodLog(log)}
                                  className="flex items-start justify-between p-2 bg-slate-50 rounded-lg group cursor-pointer hover:bg-slate-100 transition-colors"
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs font-medium text-slate-700 truncate">
                                      {log.product_name}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                      {log.calories} kcal · {log.protein}g protein
                                    </div>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (confirm('Delete this food entry?')) {
                                        deleteFoodLog.mutate(log.id)
                                      }
                                    }}
                                    disabled={deleteFoodLog.isPending}
                                    className="ml-2 p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100"
                                    title="Delete entry"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })()}

              {/* Activities */}
              {dayActivities.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Activities
                  </div>
                  <div className="space-y-1.5">
                    {dayActivities.map((activity) => (
                      <div
                        key={activity.id}
                        onClick={() => setEditingActivity(activity)}
                        className="flex items-start justify-between p-2 bg-emerald-50 rounded-lg group cursor-pointer hover:bg-emerald-100 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-emerald-700 truncate">
                            {activity.activity_name}
                          </div>
                          <div className="text-xs text-emerald-600">
                            {activity.calories_burned !== null ? `-${activity.calories_burned}` : '0'} kcal
                            {activity.duration_minutes && ` · ${activity.duration_minutes} min`}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm('Delete this activity?')) {
                              deleteActivity.mutate(activity.id)
                            }
                          }}
                          disabled={deleteActivity.isPending}
                          className="ml-2 p-1 text-emerald-300 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100"
                          title="Delete activity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {dayLogs.length === 0 && dayActivities.length === 0 && (
                <div className="text-center py-4 text-slate-300 text-xs">
                  No entries yet
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Meal Wizard Modal */}
      {showMealWizard && selectedDate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <MealWizard
              date={selectedDate}
              onClose={() => {
                setShowMealWizard(false)
                setSelectedDate(null)
              }}
            />
          </div>
        </div>
      )}

      {/* Activity Wizard Modal */}
      {showActivityWizard && selectedDate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full">
            <ActivityWizard
              date={selectedDate}
              onClose={() => {
                setShowActivityWizard(false)
                setSelectedDate(null)
              }}
            />
          </div>
        </div>
      )}

      {/* Edit Food Log Modal */}
      {editingFoodLog && (
        <EditFoodLogModal
          foodLog={editingFoodLog}
          onClose={() => setEditingFoodLog(null)}
        />
      )}

      {/* Edit Activity Modal */}
      {editingActivity && (
        <EditActivityModal
          activity={editingActivity}
          onClose={() => setEditingActivity(null)}
        />
      )}
    </div>
  )
}

function EditFoodLogModal({ foodLog, onClose }: { foodLog: FoodLog; onClose: () => void }) {
  const [productName, setProductName] = useState(foodLog.product_name)
  const [calories, setCalories] = useState(foodLog.calories.toString())
  const [protein, setProtein] = useState(foodLog.protein.toString())
  const [grams, setGrams] = useState(foodLog.grams.toString())
  const [mealType, setMealType] = useState(foodLog.meal_type || 'Lunch')
  const [showWarning, setShowWarning] = useState(false)

  const updateFoodLog = useUpdateFoodLog()

  const originalCalories = foodLog.calories
  const hasChanges = 
    productName !== foodLog.product_name ||
    parseInt(calories, 10) !== foodLog.calories ||
    parseInt(protein, 10) !== foodLog.protein ||
    parseInt(grams, 10) !== foodLog.grams ||
    mealType !== (foodLog.meal_type || 'Lunch')

  const handleSave = async () => {
    const caloriesNum = parseInt(calories, 10)
    const proteinNum = parseInt(protein, 10)
    const gramsNum = parseInt(grams, 10)

    if (isNaN(caloriesNum) || caloriesNum < 0) {
      alert('Please enter a valid calorie count')
      return
    }
    if (isNaN(proteinNum) || proteinNum < 0) {
      alert('Please enter a valid protein amount')
      return
    }
    if (isNaN(gramsNum) || gramsNum <= 0) {
      alert('Please enter a valid gram amount')
      return
    }

    if (caloriesNum !== originalCalories) {
      setShowWarning(true)
    }

    try {
      await updateFoodLog.mutateAsync({
        id: foodLog.id,
        input: {
          product_name: productName,
          calories: caloriesNum,
          protein: proteinNum,
          grams: gramsNum,
          meal_type: mealType,
        },
      })
      onClose()
    } catch (error: any) {
      alert(error.message || 'Failed to update food entry')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-3xl p-6 max-w-md w-full shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
            Edit Food Entry
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="product-name" className="text-sm font-semibold text-slate-600 mb-1.5 block">
              Product Name
            </label>
            <input
              id="product-name"
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          <div>
            <label htmlFor="calories" className="text-sm font-semibold text-slate-600 mb-1.5 block">
              Calories
            </label>
            <input
              id="calories"
              type="number"
              value={calories}
              onChange={(e) => {
                setCalories(e.target.value)
                if (parseInt(e.target.value, 10) !== originalCalories) {
                  setShowWarning(true)
                } else {
                  setShowWarning(false)
                }
              }}
              min="0"
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all tabular-nums"
            />
            {parseInt(calories, 10) !== originalCalories && (
              <div className="mt-1 text-xs text-slate-400">
                Original: <span className="line-through">{originalCalories}</span>
              </div>
            )}
          </div>

          {showWarning && parseInt(calories, 10) !== originalCalories && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-amber-600 text-sm">⚠️</span>
                <div className="text-xs text-amber-800">
                  <strong>Remember:</strong> Be honest with your calorie tracking. Adjusting calories incorrectly can undermine your health goals and progress.
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="protein" className="text-sm font-semibold text-slate-600 mb-1.5 block">
                Protein (g)
              </label>
              <input
                id="protein"
                type="number"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                min="0"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all tabular-nums"
              />
            </div>

            <div>
              <label htmlFor="grams" className="text-sm font-semibold text-slate-600 mb-1.5 block">
                Grams
              </label>
              <input
                id="grams"
                type="number"
                value={grams}
                onChange={(e) => setGrams(e.target.value)}
                min="1"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-600 mb-2 block">
              Meal Type
            </label>
            <div className="flex gap-2">
              {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((type) => (
                <button
                  key={type}
                  onClick={() => setMealType(type)}
                  className={`flex-1 py-2 px-4 rounded-xl font-medium transition-all text-xs ${
                    mealType === type
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={updateFoodLog.isPending || !hasChanges}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {updateFoodLog.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function EditActivityModal({ activity, onClose }: { activity: Activity; onClose: () => void }) {
  const [activityName, setActivityName] = useState(activity.activity_name)
  const [caloriesBurned, setCaloriesBurned] = useState(activity.calories_burned?.toString() || '')
  const [durationMinutes, setDurationMinutes] = useState(activity.duration_minutes?.toString() || '')
  const [showWarning, setShowWarning] = useState(false)

  const updateActivity = useUpdateActivity()

  const originalCalories = activity.calories_burned
  const hasChanges =
    activityName !== activity.activity_name ||
    (caloriesBurned !== '' ? parseInt(caloriesBurned, 10) : null) !== activity.calories_burned ||
    (durationMinutes !== '' ? parseInt(durationMinutes, 10) : null) !== activity.duration_minutes

  const handleSave = async () => {
    const caloriesNum = caloriesBurned !== '' ? parseInt(caloriesBurned, 10) : null
    const durationNum = durationMinutes !== '' ? parseInt(durationMinutes, 10) : null

    if (!activityName.trim()) {
      alert('Please enter an activity name')
      return
    }
    if (caloriesBurned !== '' && (isNaN(caloriesNum!) || caloriesNum! < 0)) {
      alert('Please enter a valid number of calories burned (or leave blank)')
      return
    }
    if (durationMinutes !== '' && (isNaN(durationNum!) || durationNum! < 0)) {
      alert('Please enter a valid duration in minutes (or leave blank)')
      return
    }

    try {
      await updateActivity.mutateAsync({
        id: activity.id,
        input: {
          activity_name: activityName.trim(),
          calories_burned: caloriesNum,
          duration_minutes: durationNum,
          calorie_source: caloriesNum !== originalCalories ? 'manual' : activity.calorie_source,
        },
      })
      onClose()
    } catch (error: any) {
      alert(error.message || 'Failed to update activity')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-3xl p-6 max-w-md w-full shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
            Edit Activity
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="activity-name" className="text-sm font-semibold text-slate-600 mb-1.5 block">
              Activity Name
            </label>
            <input
              id="activity-name"
              type="text"
              value={activityName}
              onChange={(e) => setActivityName(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          <div>
            <label htmlFor="calories-burned" className="text-sm font-semibold text-slate-600 mb-1.5 block">
              Calories Burned
            </label>
            <input
              id="calories-burned"
              type="number"
              value={caloriesBurned}
              onChange={(e) => {
                setCaloriesBurned(e.target.value)
                if (parseInt(e.target.value, 10) !== originalCalories) {
                  setShowWarning(true)
                } else {
                  setShowWarning(false)
                }
              }}
              min="0"
              placeholder="0"
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all tabular-nums"
            />
            {caloriesBurned !== '' && parseInt(caloriesBurned, 10) !== originalCalories && (
              <div className="mt-1 text-xs text-slate-400">
                Original: <span className="line-through">{originalCalories !== null ? originalCalories : 'N/A'}</span>
              </div>
            )}
          </div>

          {showWarning && caloriesBurned !== '' && parseInt(caloriesBurned, 10) !== originalCalories && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-amber-600 text-sm">⚠️</span>
                <div className="text-xs text-amber-800">
                  <strong>Remember:</strong> Be honest with your calorie tracking. Adjusting calories incorrectly can undermine your health goals and progress.
                </div>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="duration-minutes" className="text-sm font-semibold text-slate-600 mb-1.5 block">
              Duration (min)
            </label>
            <input
              id="duration-minutes"
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              min="0"
              placeholder="Optional"
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all tabular-nums"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={updateActivity.isPending || !hasChanges}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {updateActivity.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
