'use client'

import { useState } from 'react'
import { format, addDays, subDays, isToday, isSameDay } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, Trash2, ChevronDown, ChevronUp, X, Save, Loader2 } from 'lucide-react'
import { MealWizard } from './MealWizard'
import { ActivityWizard } from './ActivityWizard'
import { useFoodLogs, FoodLog, useUpdateFoodLog } from '@/lib/queries/foodLogs'
import { useDayActivities, Activity, useUpdateActivity } from '@/lib/queries/activities'
import { useDeleteFoodLog } from '@/lib/queries/foodLogs'
import { useDeleteActivity } from '@/lib/queries/activities'
import { useDayTotals } from '@/lib/queries/dailyCalculations'

export function DayView() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showMealWizard, setShowMealWizard] = useState(false)
  const [showActivityWizard, setShowActivityWizard] = useState(false)
  const [expandedMeals, setExpandedMeals] = useState<Record<string, boolean>>({})
  const [editingFoodLog, setEditingFoodLog] = useState<FoodLog | null>(null)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)

  const { data: dayTotals, isLoading: totalsLoading } = useDayTotals(selectedDate)
  const { data: foodLogs = [], isLoading: foodLogsLoading } = useFoodLogs(selectedDate, selectedDate)
  const { data: activities = [], isLoading: activitiesLoading } = useDayActivities(selectedDate)
  const deleteFoodLog = useDeleteFoodLog()
  const deleteActivity = useDeleteActivity()

  const navigateDay = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => direction === 'next' ? addDays(prev, 1) : subDays(prev, 1))
  }

  const goToToday = () => {
    setSelectedDate(new Date())
  }

  const handleAddMeal = () => {
    setShowMealWizard(true)
  }

  const handleAddActivity = () => {
    setShowActivityWizard(true)
  }

  const toggleMealExpansion = (mealType: string) => {
    setExpandedMeals((prev) => ({
      ...prev,
      [mealType]: !prev[mealType],
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
        mealsByType['Lunch'].push(log)
      }
    })

    return mealsByType
  }

  const isLoading = totalsLoading || foodLogsLoading || activitiesLoading
  const currentDayIsToday = isToday(selectedDate)

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

  const mealsByType = getMealsByType(foodLogs)
  const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const

  return (
    <div className="space-y-6">
      {/* Day Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateDay('prev')}
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-slate-900">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </h2>
          {!currentDayIsToday && (
            <button
              onClick={goToToday}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Today
            </button>
          )}
        </div>

        <button
          onClick={() => navigateDay('next')}
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      {/* Day Summary Card */}
      {dayTotals && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Consumed
              </div>
              <div className="text-2xl font-bold text-slate-900 tabular-nums">
                {dayTotals.caloriesConsumed.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 mt-1">kcal</div>
            </div>

            {dayTotals.caloriesBurned > 0 && (
              <div className="p-4 bg-emerald-50 rounded-xl">
                <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">
                  Burned
                </div>
                <div className="text-2xl font-bold text-emerald-700 tabular-nums">
                  -{dayTotals.caloriesBurned.toLocaleString()}
                </div>
                <div className="text-xs text-emerald-600 mt-1">kcal</div>
              </div>
            )}

            <div className={`p-4 rounded-xl ${
              dayTotals.netCalories >= 0 ? 'bg-slate-50' : 'bg-emerald-50'
            }`}>
              <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${
                dayTotals.netCalories >= 0 ? 'text-slate-500' : 'text-emerald-600'
              }`}>
                Net
              </div>
              <div className={`text-2xl font-bold tabular-nums ${
                dayTotals.netCalories >= 0 ? 'text-slate-900' : 'text-emerald-700'
              }`}>
                {dayTotals.netCalories >= 0 ? '+' : ''}
                {dayTotals.netCalories.toLocaleString()}
              </div>
              <div className={`text-xs mt-1 ${
                dayTotals.netCalories >= 0 ? 'text-slate-500' : 'text-emerald-600'
              }`}>
                kcal
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Protein
              </div>
              <div className="text-2xl font-bold text-slate-900 tabular-nums">
                {dayTotals.protein.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 mt-1">g</div>
            </div>
          </div>

          {/* Add Buttons */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={handleAddMeal}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Meal
            </button>
            <button
              onClick={handleAddActivity}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Activity
            </button>
          </div>

          {/* Food Logs by Meal Type */}
          {foodLogs.length > 0 && (
            <div className="space-y-4">
              {mealTypes.map((mealType) => {
                const meals = mealsByType[mealType]
                if (meals.length === 0) return null

                const isExpanded = expandedMeals[mealType] ?? false

                return (
                  <div key={mealType} className="border border-slate-100 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleMealExpansion(mealType)}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                        )}
                        <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider group-hover:text-slate-600 transition-colors">
                          {mealType}
                        </div>
                        <span className="text-xs text-slate-400 font-medium">
                          ({meals.length} {meals.length === 1 ? 'item' : 'items'})
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        {meals.reduce((sum, log) => sum + log.calories, 0)} kcal · {meals.reduce((sum, log) => sum + log.protein, 0)}g protein
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="divide-y divide-slate-50">
                        {meals.map((log) => (
                          <div
                            key={log.id}
                            onClick={() => setEditingFoodLog(log)}
                            className="flex items-start justify-between p-4 hover:bg-slate-50 transition-colors group cursor-pointer"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-slate-700">
                                {log.product_name}
                              </div>
                              <div className="text-sm text-slate-500 mt-1">
                                {log.calories} kcal · {log.protein}g protein · {log.grams}g
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
                              className="ml-4 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100"
                              title="Delete entry"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Activities */}
          {activities.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                Activities
              </div>
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    onClick={() => setEditingActivity(activity)}
                    className="flex items-start justify-between p-4 bg-emerald-50 rounded-xl group cursor-pointer hover:bg-emerald-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-emerald-700">
                        {activity.activity_name}
                      </div>
                      <div className="text-sm text-emerald-600 mt-1">
                        {activity.calories_burned !== null ? `-${activity.calories_burned} kcal` : '0 kcal (edit to add)'}
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
                      className="ml-4 p-2 text-emerald-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100"
                      title="Delete activity"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {foodLogs.length === 0 && activities.length === 0 && (
            <div className="text-center py-12 text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-sm font-medium">No entries yet for this day</p>
              <p className="text-xs mt-1">Use the buttons above to add meals or activities</p>
            </div>
          )}
        </div>
      )}

      {/* Meal Wizard Modal */}
      {showMealWizard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <MealWizard
              date={selectedDate}
              onClose={() => setShowMealWizard(false)}
            />
          </div>
        </div>
      )}

      {/* Activity Wizard Modal */}
      {showActivityWizard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full">
            <ActivityWizard
              date={selectedDate}
              onClose={() => setShowActivityWizard(false)}
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
  const [caloriesBurned, setCaloriesBurned] = useState(activity.calories_burned?.toString() || '0')
  const [durationMinutes, setDurationMinutes] = useState(activity.duration_minutes?.toString() || '')
  const [showWarning, setShowWarning] = useState(false)

  const updateActivity = useUpdateActivity()

  const originalCalories = activity.calories_burned
  const hasChanges = 
    (caloriesBurned ? parseInt(caloriesBurned, 10) : 0) !== (originalCalories || 0) ||
    (durationMinutes ? parseInt(durationMinutes, 10) : null) !== (activity.duration_minutes || null)

  const handleSave = async () => {
    const caloriesNum = caloriesBurned ? parseInt(caloriesBurned, 10) : 0
    const durationNum = durationMinutes ? parseInt(durationMinutes, 10) : null

    if (caloriesNum < 0) {
      alert('Please enter a valid calorie count (0 or greater)')
      return
    }
    if (durationMinutes && (isNaN(durationNum!) || durationNum! <= 0)) {
      alert('Please enter a valid duration in minutes')
      return
    }

    if (caloriesNum !== (originalCalories || 0)) {
      setShowWarning(true)
    }

    try {
      await updateActivity.mutateAsync({
        id: activity.id,
        input: {
          calories_burned: caloriesNum || null,
          duration_minutes: durationNum || null,
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
            <label className="text-sm font-semibold text-slate-600 mb-1.5 block">
              Activity Name
            </label>
            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700">
              {activity.activity_name}
            </div>
          </div>

          <div>
            <label htmlFor="activity-calories" className="text-sm font-semibold text-slate-600 mb-1.5 block">
              Calories Burned
            </label>
            <input
              id="activity-calories"
              type="number"
              value={caloriesBurned}
              onChange={(e) => {
                setCaloriesBurned(e.target.value)
                const newValue = e.target.value ? parseInt(e.target.value, 10) : 0
                if (newValue !== (originalCalories || 0)) {
                  setShowWarning(true)
                } else {
                  setShowWarning(false)
                }
              }}
              min="0"
              placeholder="0"
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all tabular-nums"
            />
            {originalCalories !== null && parseInt(caloriesBurned, 10) !== originalCalories && (
              <div className="mt-1 text-xs text-slate-400">
                Original: <span className="line-through">{originalCalories}</span>
                {activity.calorie_source && (
                  <span className="ml-2">(from {activity.calorie_source})</span>
                )}
              </div>
            )}
          </div>

          {showWarning && parseInt(caloriesBurned, 10) !== (originalCalories || 0) && (
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
            <label htmlFor="activity-duration" className="text-sm font-semibold text-slate-600 mb-1.5 block">
              Duration (minutes) <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              id="activity-duration"
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              placeholder="Optional"
              min="1"
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