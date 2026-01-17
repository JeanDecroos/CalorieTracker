'use client'

import { Calendar, Target, CalendarDays, Clock } from 'lucide-react'

export type ViewType = 'day' | 'week' | 'month' | 'goal'

interface ViewSwitcherProps {
  currentView: ViewType
  onViewChange: (view: ViewType) => void
}

const views: { id: ViewType; label: string; icon: typeof Calendar }[] = [
  { id: 'day', label: 'Day', icon: Clock },
  { id: 'week', label: 'Week', icon: Calendar },
  { id: 'month', label: 'Month', icon: CalendarDays },
  { id: 'goal', label: 'Goal', icon: Target },
]

export function ViewSwitcher({ currentView, onViewChange }: ViewSwitcherProps) {
  return (
    <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1.5 shadow-sm">
      {views.map((view) => {
        const Icon = view.icon
        const isActive = currentView === view.id
        
        return (
          <button
            key={view.id}
            onClick={() => onViewChange(view.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-sm transition-all min-w-[2.5rem] justify-center ${
              isActive
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
            title={view.label}
            aria-label={view.label}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="hidden md:inline whitespace-nowrap">{view.label}</span>
          </button>
        )
      })}
    </div>
  )
}