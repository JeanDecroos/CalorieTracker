'use client'

import { useState } from 'react'
import { useTodayFoodLogs, useDeleteFoodLog } from '@/lib/queries/foodLogs'
import { Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'

export function FoodLogList() {
  const { data: foodLogs, isLoading } = useTodayFoodLogs()
  const deleteFoodLog = useDeleteFoodLog()
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  const toggleSection = (mealType: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [mealType]: !prev[mealType],
    }))
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
        <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-3">Today&apos;s Logs</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-slate-200 rounded-xl"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!foodLogs || foodLogs.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
        <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-3">
          Today&apos;s Logs ({format(new Date(), 'MMM d, yyyy')})
        </h3>
        <div className="text-center py-12 text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
          <p className="text-sm font-medium">No fuel added yet. Start by searching above!</p>
        </div>
      </div>
    )
  }

  const totalCalories = foodLogs.reduce((sum, log) => sum + log.calories, 0)
  const totalProtein = foodLogs.reduce((sum, log) => sum + log.protein, 0)

  // Group food logs by meal type
  const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack']
  const groupedLogs = mealTypes.reduce((acc, mealType) => {
    acc[mealType] = foodLogs.filter((log) => (log.meal_type || 'Lunch') === mealType)
    return acc
  }, {} as Record<string, typeof foodLogs>)

  // Calculate totals for each meal type
  const mealTypeTotals = mealTypes.reduce((acc, mealType) => {
    const logs = groupedLogs[mealType] || []
    acc[mealType] = {
      calories: logs.reduce((sum, log) => sum + log.calories, 0),
      protein: logs.reduce((sum, log) => sum + log.protein, 0),
    }
    return acc
  }, {} as Record<string, { calories: number; protein: number }>)

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
          Today&apos;s Logs ({format(new Date(), 'MMM d, yyyy')})
        </h3>
        <div className="text-sm text-slate-500">
          <span className="font-bold text-slate-900 tabular-nums">{totalCalories.toLocaleString()}</span> kcal ·{' '}
          <span className="font-bold text-slate-900 tabular-nums">{totalProtein}</span>g protein
        </div>
      </div>
      
      <div className="space-y-6">
        {mealTypes.map((mealType) => {
          const logs = groupedLogs[mealType] || []
          const totals = mealTypeTotals[mealType]

          // Skip empty meal types
          if (logs.length === 0) return null

          const isExpanded = expandedSections[mealType] ?? false

          return (
            <div key={mealType} className="space-y-2">
              {/* Meal Type Header */}
              <button
                onClick={() => toggleSection(mealType)}
                className="w-full flex items-center justify-between pb-2 border-b border-slate-100 hover:border-slate-200 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                  )}
                  <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide group-hover:text-slate-900 transition-colors">
                    {mealType}
                  </h4>
                  <span className="text-xs text-slate-400 font-medium">
                    ({logs.length} {logs.length === 1 ? 'item' : 'items'})
                  </span>
                </div>
                {totals.calories > 0 && (
                  <div className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-700 tabular-nums">{totals.calories}</span> kcal ·{' '}
                    <span className="font-semibold text-slate-700 tabular-nums">{totals.protein}</span>g protein
                  </div>
                )}
              </button>

              {/* Meal Items - Collapsible */}
              {isExpanded && (
                <div className="space-y-1 pt-1">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex justify-between items-center py-2.5 px-2 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-slate-700 text-sm">{log.product_name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          <span className="font-semibold tabular-nums">{log.calories}</span> kcal ·{' '}
                          <span className="font-semibold tabular-nums">{log.protein}</span>g protein
                          {log.grams > 0 && (
                            <>
                              {' · '}
                              <span className="font-semibold tabular-nums">{log.grams}</span>g
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm('Delete this food entry?')) {
                            deleteFoodLog.mutate(log.id)
                          }
                        }}
                        disabled={deleteFoodLog.isPending}
                        className="ml-4 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
