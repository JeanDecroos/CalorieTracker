interface WeeklyProgressBarProps {
  totalConsumed: number
  weeklyGoal: number
  expectedConsumption: number
  variance: number
}

export function WeeklyProgressBar({ totalConsumed, weeklyGoal, expectedConsumption, variance }: WeeklyProgressBarProps) {
  const percentage = Math.min((totalConsumed / weeklyGoal) * 100, 100)
  const isOverBudget = variance < 0 // Over budget when variance is negative (consumed more than expected)
  const isUnderBudget = variance > 0 // Under budget when variance is positive (consumed less than expected)

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">Weekly Progress</span>
        <span className="text-3xl font-extrabold text-slate-900 tabular-nums tracking-tight">
          {totalConsumed.toLocaleString()} <span className="text-slate-400 text-xl">/ {weeklyGoal.toLocaleString()}</span>
        </span>
      </div>
      <div className="w-full h-4 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            isOverBudget 
              ? 'bg-rose-500' 
              : isUnderBudget 
              ? 'bg-emerald-500' 
              : 'bg-blue-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-slate-400">
          {percentage.toFixed(1)}% of weekly goal
        </span>
        {isOverBudget && (
          <span className="text-xs font-semibold text-rose-600">
            Over by {Math.round(Math.abs(variance)).toLocaleString()} kcal
          </span>
        )}
        {isUnderBudget && (
          <span className="text-xs font-semibold text-emerald-600">
            Under by {Math.round(variance).toLocaleString()} kcal
          </span>
        )}
      </div>
    </div>
  )
}
