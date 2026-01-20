'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { WeeklyProgressBar } from '@/components/WeeklyProgressBar'
import { WeeklyBankingCard } from '@/components/WeeklyBankingCard'
import { MealWizard } from '@/components/MealWizard'
import { FoodLogList } from '@/components/FoodLogList'
import { WeeklyCalendar } from '@/components/WeeklyCalendar'
import { useWeeklyBanking } from '@/lib/queries/weeklyCalculations'

export default function ChallengeWeekPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const supabase = createClient()
  const { data: banking, isLoading: bankingLoading } = useWeeklyBanking()

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

  if (!mounted || bankingLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <main className="max-w-7xl mx-auto p-6">
      <div className="space-y-6">
        {/* Calendar Grid */}
        <WeeklyCalendar />
        
        {/* Progress Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Top Left - Progress (2x1) */}
          {banking && (
            <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
              <WeeklyProgressBar
                totalConsumed={banking.totalConsumed}
                weeklyGoal={banking.weeklyGoal}
                expectedConsumption={banking.expectedConsumption}
                variance={banking.variance}
              />
            </div>
          )}

          {/* Top Right - Banking Status (1x1) */}
          <div className="md:col-span-1">
            <WeeklyBankingCard />
          </div>
        </div>

        {/* Meal Wizard */}
        <div>
          <MealWizard />
        </div>

        {/* Food Log List */}
        <div>
          <FoodLogList />
        </div>
      </div>
    </main>
  )
}
