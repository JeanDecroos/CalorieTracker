'use client'

import { useState } from 'react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, Trash2, ChevronDown, ChevronUp, X, Save, Loader2 } from 'lucide-react'
import { MealWizard } from './MealWizard'
import { ActivityWizard } from './ActivityWizard'
import { useFoodLogs, FoodLog, useUpdateFoodLog } from '@/lib/queries/foodLogs'
import { useActivities } from '@/lib/queries/activities'
import { useDeleteFoodLog } from '@/lib/queries/foodLogs'
import { useDeleteActivity } from '@/lib/queries/activities'
import { getMonthStart, getMonthEnd } from '@/utils/dateUtils'

export type CalendarMode = 'all' | 'meals' | 'activities'

interface MonthlyCalendarProps {
  mode?: CalendarMode // Default: 'all'
}

export function MonthlyCalendar({ mode = 'all' }: MonthlyCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showMealWizard, setShowMealWizard] = useState(false)
  const [showActivityWizard, setShowActivityWizard] = useState(false)
  const [expandedMeals, setExpandedMeals] = useState<Record<string, boolean>>({})
  const [editingFoodLog, setEditingFoodLog] = useState<FoodLog | null>(null)

  const monthStart = getMonthStart(currentMonth)
  const monthEnd = getMonthEnd(currentMonth)
  
  const { data: foodLogs = [], isLoading: foodLogsLoading } = useFoodLogs(monthStart, monthEnd)
  const { data: activities = [], isLoading: activitiesLoading } = useActivities(monthStart, monthEnd)
  const deleteFoodLog = useDeleteFoodLog()
  const deleteActivity = useDeleteActivity()

  // Get all days for the calendar (including days from previous/next month to fill the grid)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }) // Monday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 }) // Monday
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1))
  }

  const goToCurrentMonth = () => {
    setCurrentMonth(new Date())
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
    const totalDuration = dayActivities.reduce((sum, activity) => sum + (activity.duration_minutes || 0), 0)

    return { caloriesConsumed, caloriesBurned, netCalories, protein, totalDuration, activityCount: dayActivities.length, mealCount: dayLogs.length }
  }

  const handleAddMeal = (date: Date) => {
    setSelectedDate(date)
    setShowMealWizard(true)
  }

  const handleAddActivity = (date: Date) => {
    setSelectedDate(date)
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
        mealsByType['Lunch'].push(log)
      }
    })

    return mealsByType
  }

  const isCurrentMonth = format(currentMonth, 'yyyy-MM') === format(new Date(), 'yyyy-MM')

  // Group days into weeks for grid layout
  const weeks: Date[][] = []
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7))
  }

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="space-y-6">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-slate-900">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          {!isCurrentMonth && (
            <button
              onClick={goToCurrentMonth}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              This Month
            </button>
          )}
        </div>

        <button
          onClick={() => navigateMonth('next')}
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] overflow-x-auto">
        {/* Week Day Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days Grid */}
        <div className="space-y-2">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-2">
              {week.map((day) => {
                const dayLogs = getDayFoodLogs(day)
                const dayActivities = getDayActivities(day)
                const totals = getDayTotals(day)
                const isCurrentDay = isToday(day)
                const isInCurrentMonth = isSameMonth(day, currentMonth)
                const dateKey = day.toISOString()

                return (
                  <div
                    key={day.toISOString()}
                    className={`bg-white rounded-xl p-2 border min-h-[140px] ${
                      isCurrentDay
                        ? 'border-indigo-300 shadow-md shadow-indigo-100'
                        : isInCurrentMonth
                        ? 'border-slate-100 shadow-sm'
                        : 'border-slate-50 opacity-50'
                    }`}
                  >
                    {/* Day Header */}
                    <div className="mb-2">
                      <div
                        className={`text-xs font-bold ${
                          isCurrentDay
                            ? 'text-indigo-600'
                            : isInCurrentMonth
                            ? 'text-slate-900'
                            : 'text-slate-400'
                        }`}
                      >
                        {format(day, 'd')}
                      </div>
                    </div>

                    {/* Day Totals (Compact) */}
                    {(() => {
                      const hasMeals = dayLogs.length > 0
                      const hasActivities = dayActivities.length > 0
                      const hasAnyData = hasMeals || hasActivities
                      
                      if (!hasAnyData) {
                        return (
                          <div className="text-center py-2 text-slate-300 text-xs text-[10px]">
                            No entries
                          </div>
                        )
                      }

                      // Activities mode: Show only activities data
                      if (mode === 'activities') {
                        return (
                          <div className="space-y-0.5 text-xs mb-2">
                            {hasActivities ? (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Activities:</span>
                                  <span className="font-semibold text-slate-900 tabular-nums">
                                    {totals.activityCount}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Burned:</span>
                                  <span className="font-semibold text-emerald-600 tabular-nums">
                                    {totals.caloriesBurned || 0}
                                  </span>
                                </div>
                                {totals.totalDuration > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">Duration:</span>
                                    <span className="font-semibold text-slate-900 tabular-nums">
                                      {totals.totalDuration}m
                                    </span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="text-center py-2 text-slate-300 text-xs text-[10px]">
                                No activities
                              </div>
                            )}
                          </div>
                        )
                      }

                      // Meals mode: Show only meals data
                      if (mode === 'meals') {
                        return (
                          <div className="space-y-0.5 text-xs mb-2">
                            {hasMeals ? (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Meals:</span>
                                  <span className="font-semibold text-slate-900 tabular-nums">
                                    {totals.mealCount}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Consumed:</span>
                                  <span className="font-semibold text-slate-900 tabular-nums">
                                    {totals.caloriesConsumed}
                                  </span>
                                </div>
                                {totals.protein > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">Protein:</span>
                                    <span className="font-semibold text-slate-900 tabular-nums">
                                      {totals.protein}g
                                    </span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="text-center py-2 text-slate-300 text-xs text-[10px]">
                                No meals
                              </div>
                            )}
                          </div>
                        )
                      }

                      // All mode: Show combined data (current behavior)
                      return (
                        <div className="space-y-0.5 text-xs mb-2">
                          <div className="flex justify-between">
                            <span className="text-slate-500">C:</span>
                            <span className="font-semibold text-slate-900 tabular-nums">
                              {totals.caloriesConsumed}
                            </span>
                          </div>
                          {totals.caloriesBurned > 0 && (
                            <div className="flex justify-between">
                              <span className="text-slate-500">B:</span>
                              <span className="font-semibold text-emerald-600 tabular-nums">
                                -{totals.caloriesBurned}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between pt-0.5 border-t border-slate-100">
                            <span className="text-slate-600">N:</span>
                            <span
                              className={`font-bold tabular-nums text-xs ${
                                totals.netCalories >= 0 ? 'text-slate-900' : 'text-emerald-600'
                              }`}
                            >
                              {totals.netCalories >= 0 ? '+' : ''}
                              {totals.netCalories}
                            </span>
                          </div>
                        </div>
                      )
                    })()}

                    {/* Add Buttons (Compact) */}
                    {isInCurrentMonth && (
                      <div className="space-y-1 mt-2">
                        {mode !== 'activities' && (
                          <button
                            onClick={() => handleAddMeal(day)}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-1 px-2 rounded-lg shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-1 text-[10px]"
                          >
                            <Plus className="w-3 h-3" />
                            Meal
                          </button>
                        )}
                        {mode !== 'meals' && (
                          <button
                            onClick={() => handleAddActivity(day)}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-1 px-2 rounded-lg shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-1 text-[10px]"
                          >
                            <Plus className="w-3 h-3" />
                            Activity
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
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