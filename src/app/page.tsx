'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { WeeklyCalendar } from '@/components/WeeklyCalendar'
import { WeekAnalysis } from '@/components/WeekAnalysis'
import { LogOut, Settings } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const supabase = createClient()

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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-3xl font-extrabold text-slate-900 tracking-tight hover:text-indigo-600 transition-colors cursor-pointer">
              <h1>Nutrition Tracker</h1>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/settings"
                className="text-slate-500 hover:text-indigo-600 font-medium text-sm flex items-center gap-2"
              >
                <Settings className="w-5 h-5" />
                <span className="hidden sm:inline">Settings</span>
              </Link>
              <button
                onClick={handleLogout}
                className="text-slate-500 hover:text-indigo-600 font-medium text-sm flex items-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="space-y-6">
          <WeeklyCalendar />
          <WeekAnalysis />
        </div>
      </main>
    </div>
  )
}
