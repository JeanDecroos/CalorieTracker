'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navigation } from '@/components/Navigation'
import { IncompleteProfileBanner } from '@/components/IncompleteProfileBanner'
import { Target, UtensilsCrossed, Activity, TrendingUp, Calendar } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const supabase = createClient()

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

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  const quickLinks = [
    {
      title: 'Challenge',
      description: 'View your weekly challenge progress',
      icon: Target,
      href: '/dashboard/challenge/week',
      color: 'bg-indigo-500',
    },
    {
      title: 'Meals',
      description: 'Track your meals and nutrition',
      icon: UtensilsCrossed,
      href: '/dashboard/meals',
      color: 'bg-emerald-500',
    },
    {
      title: 'Activities',
      description: 'Log and view your activities',
      icon: Activity,
      href: '/dashboard/activities',
      color: 'bg-amber-500',
    },
    {
      title: 'Goals',
      description: 'Set and manage your goals',
      icon: TrendingUp,
      href: '/dashboard/goal',
      color: 'bg-purple-500',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      <main className="max-w-7xl mx-auto p-6">
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Welcome to Your Nutrition Tracker
            </h1>
            <p className="text-slate-600">
              Track your meals, activities, and progress toward your nutrition goals.
            </p>
          </div>

          {/* Incomplete Profile Banner */}
          <IncompleteProfileBanner />

          {/* Quick Links */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Quick Access</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickLinks.map((link) => {
                const Icon = link.icon
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-lg transition-all hover:border-indigo-200 group"
                  >
                    <div className={`w-12 h-12 ${link.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                      {link.title}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {link.description}
                    </p>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Getting Started Section */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl border border-indigo-100 p-8">
            <div className="flex items-start gap-4">
              <Calendar className="w-8 h-8 text-indigo-600 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Getting Started
                </h3>
                <p className="text-slate-700 mb-4">
                  Start tracking your nutrition journey by logging meals, recording activities, and setting goals.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/dashboard/meals"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors"
                  >
                    Log Your First Meal
                  </Link>
                  <Link
                    href="/dashboard/activities"
                    className="px-4 py-2 bg-white hover:bg-slate-50 text-indigo-600 font-semibold rounded-xl border border-indigo-200 transition-colors"
                  >
                    Add an Activity
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
