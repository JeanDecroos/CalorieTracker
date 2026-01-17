'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  LogOut, 
  ChevronDown, 
  Target, 
  UtensilsCrossed, 
  Activity, 
  Settings,
  Calendar,
  CalendarDays,
  Clock,
  Bookmark
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface NavigationItem {
  id: string
  label: string
  icon?: typeof Target
  href?: string
  dropdown?: { id: string; label: string; href: string; icon?: typeof Clock }[]
}

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const navigationItems: NavigationItem[] = [
    {
      id: 'challenge',
      label: 'Challenge',
      icon: Target,
      dropdown: [
        { id: 'day', label: 'Day', href: '/dashboard/challenge/day', icon: Clock },
        { id: 'week', label: 'Week', href: '/dashboard/challenge/week', icon: Calendar },
        { id: 'month', label: 'Month', href: '/dashboard/challenge/month', icon: CalendarDays },
        { id: 'goal', label: 'Goal', href: '/dashboard/challenge/goal', icon: Target },
      ],
    },
    {
      id: 'meals',
      label: 'Meals',
      icon: UtensilsCrossed,
      href: '/dashboard/meals',
      dropdown: [
        { id: 'overview', label: 'Overview', href: '/dashboard/meals', icon: UtensilsCrossed },
        { id: 'day', label: 'Day', href: '/dashboard/meals/day', icon: Clock },
        { id: 'week', label: 'Week', href: '/dashboard/meals/week', icon: Calendar },
        { id: 'month', label: 'Month', href: '/dashboard/meals/month', icon: CalendarDays },
        { id: 'goal', label: 'Goal', href: '/dashboard/meals/goal', icon: Target },
      ],
    },
    {
      id: 'activities',
      label: 'Activities',
      icon: Activity,
      href: '/dashboard/activities',
      dropdown: [
        { id: 'overview', label: 'Overview', href: '/dashboard/activities', icon: Activity },
        { id: 'day', label: 'Day', href: '/dashboard/activities/day', icon: Clock },
        { id: 'week', label: 'Week', href: '/dashboard/activities/week', icon: Calendar },
        { id: 'month', label: 'Month', href: '/dashboard/activities/month', icon: CalendarDays },
        { id: 'goal', label: 'Goal', href: '/dashboard/activities/goal', icon: Target },
      ],
    },
    {
      id: 'goal',
      label: 'Goal',
      icon: Target,
      href: '/dashboard/goal',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      href: '/dashboard/settings',
    },
  ]

  const isActive = (item: NavigationItem): boolean => {
    if (item.dropdown) {
      return item.dropdown.some(sub => pathname?.includes(sub.href)) || pathname === item.href || pathname?.startsWith(item.href + '/')
    }
    return pathname === item.href || pathname?.startsWith(item.href + '/')
  }

  const isSubActive = (item: NavigationItem, subId: string): boolean => {
    return pathname === item.dropdown?.find(sub => sub.id === subId)?.href
  }

  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Navigation Items */}
          <nav className="flex items-center gap-1 flex-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item)
              const hasDropdown = !!item.dropdown

              if (hasDropdown) {
                return (
                  <div key={item.id} className="relative">
                    <button
                      onClick={() => setOpenDropdown(openDropdown === item.id ? null : item.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                        active
                          ? 'bg-indigo-50 text-indigo-600'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      {Icon && <Icon className="w-4 h-4" />}
                      <span>{item.label}</span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          openDropdown === item.id ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {/* Dropdown Menu */}
                    {openDropdown === item.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setOpenDropdown(null)}
                        />
                        <div className="absolute top-full left-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-lg py-2 min-w-[160px] z-20">
                          {item.dropdown.map((subItem) => {
                            const SubIcon = subItem.icon
                            const subActive = isSubActive(item, subItem.id)

                            return (
                              <Link
                                key={subItem.id}
                                href={subItem.href}
                                onClick={() => setOpenDropdown(null)}
                                className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                                  subActive
                                    ? 'bg-indigo-50 text-indigo-600 font-medium'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                              >
                                {SubIcon && <SubIcon className="w-4 h-4" />}
                                <span>{subItem.label}</span>
                              </Link>
                            )
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )
              }

              return (
                <Link
                  key={item.id}
                  href={item.href!}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                    active
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="text-slate-500 hover:text-indigo-600 font-medium text-sm flex items-center gap-2 px-2 sm:px-0"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  )
}
