'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useFoodLogs } from '@/lib/queries/foodLogs'
import { useMealTemplates } from '@/lib/queries/mealTemplates'
import { MealWizard } from '@/components/MealWizard'
import { ViewSwitcher, ViewType } from '@/components/ViewSwitcher'
import { Plus, Bookmark, TrendingUp, UtensilsCrossed } from 'lucide-react'
import { getWeekStart, getWeekEnd } from '@/utils/dateUtils'
import { format } from 'date-fns'

export default function MealsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const supabase = createClient()
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showMealWizard, setShowMealWizard] = useState(false)
  
  // Determine current view from pathname
  const getCurrentView = (): ViewType => {
    if (pathname?.includes('/day')) return 'day'
    if (pathname?.includes('/week')) return 'week'
    if (pathname?.includes('/month')) return 'month'
    if (pathname?.includes('/goal')) return 'goal'
    return 'day' // default
  }

  const [currentView, setCurrentView] = useState<ViewType>(getCurrentView())

  // Update view when pathname changes
  useEffect(() => {
    if (mounted) {
      const newView = getCurrentView()
      if (newView !== currentView) {
        setCurrentView(newView)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, mounted])

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view)
    router.push(`/dashboard/meals/${view}`)
  }

  const today = new Date()
  const weekStart = getWeekStart(today)
  const weekEnd = getWeekEnd(today)
  
  const { data: foodLogs = [], isLoading: foodLogsLoading } = useFoodLogs(weekStart, weekEnd)
  const { data: templates = [], isLoading: templatesLoading } = useMealTemplates()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login')
      }
    })
  }, [router, supabase, mounted])

  if (!mounted || foodLogsLoading || templatesLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  // Calculate statistics
  const totalMeals = foodLogs.length
  const totalCalories = foodLogs.reduce((sum, log) => sum + log.calories, 0)
  const totalProtein = foodLogs.reduce((sum, log) => sum + log.protein, 0)
  const avgCaloriesPerMeal = totalMeals > 0 ? Math.round(totalCalories / totalMeals) : 0

  // Recent meals (last 5)
  const recentMeals = foodLogs
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  // Meal preps with low stock
  const lowStockPreps = templates.filter(
    (t) => t.stock !== null && t.stock !== undefined && t.stock > 0 && t.stock <= 5
  )

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Meals Overview
            </h1>
            <div className="flex items-center gap-4">
              <ViewSwitcher currentView={currentView} onViewChange={handleViewChange} />
              <button
                onClick={() => {
                  setSelectedDate(new Date())
                  setShowMealWizard(true)
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Meal
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Meals (Week)
                </div>
                <UtensilsCrossed className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900 tabular-nums">
                {totalMeals}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Calories (Week)
                </div>
                <TrendingUp className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900 tabular-nums">
                {totalCalories.toLocaleString()}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Protein (Week)
                </div>
                <TrendingUp className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900 tabular-nums">
                {totalProtein}g
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Avg Calories/Meal
                </div>
                <TrendingUp className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900 tabular-nums">
                {avgCaloriesPerMeal}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Meal Preps Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-3 bg-indigo-50 rounded-xl">
                    <Bookmark className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-slate-900">Meal Preps</h2>
                    <p className="text-sm text-slate-500">{templates.length} templates</p>
                  </div>
                </div>
                <Link
                  href="/dashboard/meal-preps"
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium ml-4"
                >
                  View All →
                </Link>
              </div>
              
              {lowStockPreps.length > 0 && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-sm font-semibold text-amber-700">
                    {lowStockPreps.length} {lowStockPreps.length === 1 ? 'meal prep' : 'meal preps'} with low stock
                  </p>
                </div>
              )}

              {/* Meal Preps List */}
              {templates.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-slate-500 mb-3">No meal preps yet</p>
                  <Link
                    href="/dashboard/meal-preps"
                    className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Create Meal Prep
                  </Link>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {templates.slice(0, 5).map((template) => (
                    <Link
                      key={template.id}
                      href="/dashboard/meal-preps"
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 border border-transparent transition-all group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 text-sm truncate">
                          {template.name}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          <span className="tabular-nums">{template.calories} kcal</span>
                          <span className="tabular-nums">{template.protein}g protein</span>
                          {template.stock !== null && template.stock !== undefined && (
                            <span className={`tabular-nums font-medium ${
                              template.stock > 0 ? 'text-emerald-600' : 'text-amber-600'
                            }`}>
                              Stock: {template.stock}
                            </span>
                          )}
                        </div>
                      </div>
                      {template.category && (
                        <span className="ml-2 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg whitespace-nowrap">
                          {template.category}
                        </span>
                      )}
                    </Link>
                  ))}
                  {templates.length > 5 && (
                    <div className="pt-2 text-center">
                      <Link
                        href="/dashboard/meal-preps"
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        View {templates.length - 5} more →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Recent Meals Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Recent Meals</h2>
              {recentMeals.length === 0 ? (
                <p className="text-sm text-slate-500">No meals logged yet this week</p>
              ) : (
                <div className="space-y-3">
                  {recentMeals.map((meal) => (
                    <div
                      key={meal.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-slate-700 text-sm">{meal.product_name}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          {format(new Date(meal.date), 'MMM d')} · {meal.meal_type || 'Lunch'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-slate-900 tabular-nums">
                          {meal.calories} kcal
                        </div>
                        <div className="text-xs text-slate-500 tabular-nums">
                          {meal.protein}g protein
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

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
    </div>
  )
}
