'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useActivities } from '@/lib/queries/activities'
import { ActivityWizard } from '@/components/ActivityWizard'
import { ViewSwitcher, ViewType } from '@/components/ViewSwitcher'
import { Plus, Activity, TrendingUp, Calendar } from 'lucide-react'
import { getWeekStart, getWeekEnd } from '@/utils/dateUtils'
import { format } from 'date-fns'

export default function ActivitiesPage() {
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const supabase = createClient()
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showActivityWizard, setShowActivityWizard] = useState(false)
  
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
    router.push(`/dashboard/activities/${view}`)
  }

  const today = new Date()
  const weekStart = getWeekStart(today)
  const weekEnd = getWeekEnd(today)
  
  const { data: activities = [], isLoading: activitiesLoading } = useActivities(weekStart, weekEnd)

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

  if (!mounted || activitiesLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  // Calculate statistics
  const totalActivities = activities.length
  const totalCaloriesBurned = activities.reduce((sum, activity) => sum + activity.calories_burned, 0)
  const totalDuration = activities.reduce((sum, activity) => sum + (activity.duration_minutes || 0), 0)
  const avgCaloriesPerActivity = totalActivities > 0 ? Math.round(totalCaloriesBurned / totalActivities) : 0

  // Recent activities (last 5)
  const recentActivities = activities
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Activities Overview
            </h1>
            <div className="flex items-center gap-4">
              <ViewSwitcher currentView={currentView} onViewChange={handleViewChange} />
              <button
                onClick={() => {
                  setSelectedDate(new Date())
                  setShowActivityWizard(true)
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Activity
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Activities (Week)
                </div>
                <Activity className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900 tabular-nums">
                {totalActivities}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Calories Burned (Week)
                </div>
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-3xl font-bold text-emerald-700 tabular-nums">
                {totalCaloriesBurned.toLocaleString()}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Duration (Week)
                </div>
                <Calendar className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900 tabular-nums">
                {totalDuration > 0 ? `${Math.round(totalDuration / 60)}h ${totalDuration % 60}m` : '0m'}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Avg Calories/Activity
                </div>
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900 tabular-nums">
                {avgCaloriesPerActivity}
              </div>
            </div>
          </div>

          {/* Recent Activities Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Recent Activities</h2>
            {recentActivities.length === 0 ? (
              <p className="text-sm text-slate-500">No activities logged yet this week</p>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-emerald-700 text-sm">{activity.activity_name}</div>
                      <div className="text-xs text-emerald-600 mt-1">
                        {format(new Date(activity.date), 'MMM d')}
                        {activity.duration_minutes && ` · ${activity.duration_minutes} min`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-emerald-700 tabular-nums">
                        -{activity.calories_burned} kcal
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

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
    </div>
  )
}
