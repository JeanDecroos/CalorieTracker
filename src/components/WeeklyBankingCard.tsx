import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useWeeklyBanking } from '@/lib/queries/weeklyCalculations'

export function WeeklyBankingCard() {
  const { data: banking, isLoading } = useWeeklyBanking()

  if (isLoading || !banking) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
        <div className="h-8 bg-slate-200 rounded w-1/2"></div>
      </div>
    )
  }

  const { variance, statusText, expectedConsumption, totalConsumed } = banking

  const getIcon = () => {
    if (variance > 0) {
      return <TrendingDown className="w-6 h-6 text-emerald-600" />
    } else if (variance < 0) {
      return <TrendingUp className="w-6 h-6 text-rose-600" />
    } else {
      return <Minus className="w-6 h-6 text-blue-600" />
    }
  }

  const getStatusStyles = () => {
    if (variance > 0) {
      return {
        text: 'text-emerald-600',
        bg: 'bg-emerald-100',
        border: 'border-emerald-200',
      }
    } else if (variance < 0) {
      return {
        text: 'text-rose-600',
        bg: 'bg-rose-50',
        border: 'border-rose-200',
      }
    } else {
      return {
        text: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
      }
    }
  }

  const styles = getStatusStyles()

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-3">Weekly Banking</h3>
          <p className="text-sm text-slate-500">
            Expected: <span className="font-semibold tabular-nums">{Math.round(expectedConsumption).toLocaleString()}</span> kcal
          </p>
        </div>
        {getIcon()}
      </div>
      <div className={`text-4xl font-extrabold ${styles.text} tabular-nums tracking-tight mb-4`}>{statusText}</div>
      <div className={`mt-4 pt-4 border-t ${styles.border}`}>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-500">Consumed:</span>
          <span className="font-bold text-slate-900 tabular-nums">{totalConsumed.toLocaleString()} kcal</span>
        </div>
        <div className={`flex justify-between text-sm ${styles.bg} ${styles.border} border rounded-xl px-3 py-2`}>
          <span className={`${styles.text} font-semibold`}>Variance:</span>
          <span className={`font-bold tabular-nums ${styles.text}`}>
            {variance > 0 ? '+' : ''}
            {Math.round(variance).toLocaleString()} kcal
          </span>
        </div>
      </div>
    </div>
  )
}
