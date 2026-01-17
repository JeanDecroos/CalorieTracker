'use client'

import { useState } from 'react'
import { Plus, X, Loader2, Save, UtensilsCrossed, ChevronUp, ChevronDown, Bookmark, RotateCcw } from 'lucide-react'
import { useAddFoodLog } from '@/lib/queries/foodLogs'
import { useMealTemplates, useAddMealTemplate, useUpdateMealTemplate, MealTemplate } from '@/lib/queries/mealTemplates'
import { formatDateForDB } from '@/utils/dateUtils'

interface NutritionItem {
  name: string
  quantity: string
  calories: number
  protein: number
  carbs?: number
  fat?: number
  grams: number
}

interface MealAnalysis {
  items: NutritionItem[]
  totals: {
    calories: number
    protein: number
    grams: number
  }
  mealType: string
}

interface MealWizardProps {
  date?: Date
  onClose?: () => void
}

interface ManualEntry {
  name: string
  calories: string
  protein: string
  grams: string
}

export function MealWizard({ date, onClose }: MealWizardProps) {
  // If date is provided, we're in a modal - always show the form
  const [isOpen, setIsOpen] = useState(!date)
  const [entryMode, setEntryMode] = useState<'analyze' | 'manual'>('analyze')
  const [mealType, setMealType] = useState('Lunch')
  const [items, setItems] = useState<string[]>([''])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<MealAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [adjustedCalories, setAdjustedCalories] = useState<{ [index: number]: number }>({})
  
  // Manual entry state
  const [manualEntries, setManualEntries] = useState<ManualEntry[]>([
    { name: '', calories: '', protein: '', grams: '' }
  ])

  const addFoodLog = useAddFoodLog()
  const { data: mealTemplates } = useMealTemplates()
  const addMealTemplate = useAddMealTemplate()
  const updateMealTemplate = useUpdateMealTemplate()
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false)
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<MealTemplate | null>(null)
  
  // If date is provided, always show the form (modal mode)
  const showForm = date ? true : isOpen

  const addItemLine = () => {
    setItems([...items, ''])
  }

  const removeItemLine = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, value: string) => {
    const newItems = [...items]
    newItems[index] = value
    setItems(newItems)
  }

  // Manual entry handlers
  const addManualEntry = () => {
    setManualEntries([...manualEntries, { name: '', calories: '', protein: '', grams: '' }])
  }

  const removeManualEntry = (index: number) => {
    setManualEntries(manualEntries.filter((_, i) => i !== index))
  }

  const updateManualEntry = (index: number, field: keyof ManualEntry, value: string) => {
    const newEntries = [...manualEntries]
    newEntries[index] = { ...newEntries[index], [field]: value }
    setManualEntries(newEntries)
  }

  // Calculate totals for manual entries
  const manualTotals = manualEntries.reduce(
    (acc, entry) => {
      const calories = parseInt(entry.calories, 10) || 0
      const protein = parseInt(entry.protein, 10) || 0
      const grams = parseInt(entry.grams, 10) || 0
      return {
        calories: acc.calories + calories,
        protein: acc.protein + protein,
        grams: acc.grams + grams,
      }
    },
    { calories: 0, protein: 0, grams: 0 }
  )

  // Validate manual entries
  const hasValidManualEntries = manualEntries.some(
    (entry) => entry.name.trim() && entry.calories && !isNaN(parseInt(entry.calories, 10)) && parseInt(entry.calories, 10) > 0
  )

  // Handle template selection
  const handleTemplateSelect = (template: MealTemplate) => {
    setEntryMode('manual')
    setManualEntries([
      {
        name: template.name,
        calories: template.calories.toString(),
        protein: template.protein.toString(),
        grams: template.grams.toString(),
      }
    ])
    setSelectedTemplate(template)
    setSelectedTemplateIndex(null)
  }

  // Handle save as template
  const handleSaveAsTemplate = async (templateName: string, category?: string) => {
    const firstValidEntry = manualEntries.find(
      (entry) => entry.name.trim() && entry.calories && !isNaN(parseInt(entry.calories, 10))
    )

    if (!firstValidEntry) {
      alert('Please enter valid meal details before saving as template')
      return
    }

    try {
      await addMealTemplate.mutateAsync({
        name: templateName.trim() || firstValidEntry.name.trim(),
        calories: parseInt(firstValidEntry.calories, 10),
        protein: parseInt(firstValidEntry.protein, 10) || 0,
        grams: parseInt(firstValidEntry.grams, 10) || 100,
        category: category || null,
        notes: null,
      })
      setShowSaveTemplateModal(false)
      // Show success message
      alert('Meal template saved successfully!')
    } catch (error: any) {
      alert(error.message || 'Failed to save template')
    }
  }

  const handleAnalyze = async () => {
    const validItems = items.filter((item) => item.trim().length > 0)
    if (validItems.length === 0) {
      setError('Please add at least one food item')
      return
    }

    setIsAnalyzing(true)
    setError(null)
    setAnalysis(null)

    try {
      const response = await fetch('/api/analyze-meal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mealType,
          items: validItems,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        // Handle quota errors specially with clear messaging
        if (response.status === 429 || errorData.code === 'QUOTA_EXCEEDED') {
          const retryAfter = errorData.retryAfter
          const retryMessage = retryAfter 
            ? ` Please wait ${Math.ceil(retryAfter)} seconds and try again.`
            : ' Please check your Google AI Studio quota or try again later.'
          throw new Error(
            `🚫 API Credits/Quota Exceeded: You've used up your free tier quota for Google Gemini API.${retryMessage}`
          )
        }
        
        const errorMessage = errorData.error || errorData.message || `Server returned ${response.status}`
        const errorDetails = errorData.details ? `\n\nDetails: ${errorData.details}` : ''
        throw new Error(`${errorMessage}${errorDetails}`)
      }

      const data = await response.json()
      setAnalysis(data)
      setAdjustedCalories({}) // Reset adjusted calories when new analysis is received
    } catch (err: any) {
      console.error('Meal analysis error:', err)
      setError(err.message || 'Failed to analyze meal. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSave = async () => {
    if (!analysis && entryMode === 'analyze') return

    try {
      // Use formatDateForDB to avoid timezone issues (toISOString converts to UTC which can shift dates)
      const dateStr = date ? formatDateForDB(date) : undefined
      
      if (entryMode === 'analyze' && analysis) {
        // Save each analyzed item as a separate food log entry
        for (let i = 0; i < analysis.items.length; i++) {
          const item = analysis.items[i]
          // Use adjusted calories if available, otherwise use original
          const calories = adjustedCalories[i] !== undefined 
            ? adjustedCalories[i] 
            : Math.round(item.calories)
          
          await addFoodLog.mutateAsync({
            product_name: `${item.name} (${item.quantity})`,
            calories: Math.round(calories),
            protein: Math.round(item.protein),
            grams: Math.round(item.grams),
            date: dateStr,
            meal_type: mealType,
          })
        }
      } else if (entryMode === 'manual') {
        // Save each manual entry as a separate food log entry
        for (const entry of manualEntries) {
          const calories = parseInt(entry.calories, 10)
          const protein = entry.protein ? parseInt(entry.protein, 10) : 0
          const grams = entry.grams ? parseInt(entry.grams, 10) : 100

          if (!entry.name.trim() || isNaN(calories) || calories <= 0) {
            continue // Skip invalid entries
          }

          await addFoodLog.mutateAsync({
            product_name: entry.name.trim(),
            calories: Math.round(calories),
            protein: Math.round(protein),
            grams: Math.round(grams),
            date: dateStr,
            meal_type: mealType,
          })
        }

        // Decrease stock if using a saved template
        if (selectedTemplate && selectedTemplate.stock !== null && selectedTemplate.stock !== undefined && selectedTemplate.stock > 0) {
          await updateMealTemplate.mutateAsync({
            id: selectedTemplate.id,
            input: {
              stock: Math.max(0, selectedTemplate.stock - 1),
            },
          })
        }
      }

      // Reset form
      setIsOpen(false)
      setItems([''])
      setMealType('Lunch')
      setAnalysis(null)
      setError(null)
      setAdjustedCalories({})
      setManualEntries([{ name: '', calories: '', protein: '', grams: '' }])
      setEntryMode('analyze')
      setSelectedTemplate(null)
      setSelectedTemplateIndex(null)
      
      if (onClose) {
        onClose()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save meal')
    }
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Add Meal
      </button>
    )
  }

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
          Add Meal
        </h3>
        <button
          onClick={() => {
            setIsOpen(false)
            setItems([''])
            setAnalysis(null)
            setError(null)
            if (onClose) onClose()
          }}
          className="text-slate-400 hover:text-slate-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Meal Type Selection */}
      <div className="mb-4">
        <label className="text-sm font-semibold text-slate-600 mb-2 block">
          Meal Type
        </label>
        <div className="flex gap-2">
          {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((type) => (
            <button
              key={type}
              onClick={() => setMealType(type)}
              className={`flex-1 py-2 px-4 rounded-xl font-medium transition-all ${
                mealType === type
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Entry Mode Toggle */}
      <div className="mb-4">
        <label className="text-sm font-semibold text-slate-600 mb-2 block">
          Entry Method
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEntryMode('analyze')
              setError(null)
              setAnalysis(null)
            }}
            className={`flex-1 py-2 px-4 rounded-xl font-medium transition-all ${
              entryMode === 'analyze'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4 inline mr-2" />
            Analyze Meal
          </button>
          <button
            onClick={() => {
              setEntryMode('manual')
              setError(null)
              setAnalysis(null)
            }}
            className={`flex-1 py-2 px-4 rounded-xl font-medium transition-all ${
              entryMode === 'manual'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Manual Entry
          </button>
        </div>
      </div>

      {/* Saved Meals Selector - Show in manual mode */}
      {entryMode === 'manual' && mealTemplates && mealTemplates.length > 0 && (
        <div className="mb-4">
          <label className="text-sm font-semibold text-slate-600 mb-2 block">
            Use Meal Prep
          </label>
          <select
            value={selectedTemplateIndex ?? ''}
            onChange={(e) => {
              const index = e.target.value === '' ? null : parseInt(e.target.value, 10)
              setSelectedTemplateIndex(index)
              if (index !== null && mealTemplates[index]) {
                handleTemplateSelect(mealTemplates[index])
              }
            }}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          >
            <option value="">Select a saved meal...</option>
            {mealTemplates.map((template, index) => {
              const stockInfo = template.stock !== null && template.stock !== undefined 
                ? ` - Stock: ${template.stock}${template.stock === 0 ? ' (empty)' : ''}`
                : ''
              return (
                <option key={template.id} value={index}>
                  {template.name} ({template.calories} kcal{template.protein > 0 ? `, ${template.protein}g protein` : ''}){stockInfo}
                </option>
              )
            })}
          </select>
        </div>
      )}

      {/* Food Items Input - Analyze Mode */}
      {entryMode === 'analyze' && (
        <div className="mb-4">
          <label className="text-sm font-semibold text-slate-600 mb-2 block">
            What did you eat?
          </label>
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => updateItem(index, e.target.value)}
                  placeholder="e.g., 100gr holies granola protein"
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
                {items.length > 1 && (
                  <button
                    onClick={() => removeItemLine(index)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={addItemLine}
            className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add another item
          </button>
        </div>
      )}

      {/* Manual Entry Form */}
      {entryMode === 'manual' && (
        <div className="mb-4">
          <label className="text-sm font-semibold text-slate-600 mb-2 block">
            Meal Details
          </label>
          <div className="space-y-3">
            {manualEntries.map((entry, index) => (
              <div key={index} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Item {index + 1}
                  </span>
                  {manualEntries.length > 1 && (
                    <button
                      onClick={() => removeManualEntry(index)}
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      type="button"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                    Meal Name *
                  </label>
                  <input
                    type="text"
                    value={entry.name}
                    onChange={(e) => updateManualEntry(index, 'name', e.target.value)}
                    placeholder="e.g., Meal Prep #1"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                      Calories *
                    </label>
                    <input
                      type="number"
                      value={entry.calories}
                      onChange={(e) => updateManualEntry(index, 'calories', e.target.value)}
                      placeholder="850"
                      min="0"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                      Protein (g)
                    </label>
                    <input
                      type="number"
                      value={entry.protein}
                      onChange={(e) => updateManualEntry(index, 'protein', e.target.value)}
                      placeholder="50"
                      min="0"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                      Grams
                    </label>
                    <input
                      type="number"
                      value={entry.grams}
                      onChange={(e) => updateManualEntry(index, 'grams', e.target.value)}
                      placeholder="300"
                      min="1"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all tabular-nums"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={addManualEntry}
            className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
            type="button"
          >
            <Plus className="w-4 h-4" />
            Add another item
          </button>
        </div>
      )}

      {error && (
        <div className={`mb-4 px-4 py-4 rounded-xl text-sm ${
          error.includes('quota') || error.includes('Quota') || error.includes('credits')
            ? 'bg-amber-50 border-2 border-amber-400 text-amber-900'
            : 'bg-rose-50 border border-rose-200 text-rose-700'
        }`}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {error.includes('quota') || error.includes('Quota') || error.includes('credits') ? (
                <span className="text-amber-600 text-lg">⚠️</span>
              ) : (
                <span className="text-rose-600 text-lg">❌</span>
              )}
            </div>
            <div className="flex-1">
              <div className="font-semibold mb-1">
                {error.includes('quota') || error.includes('Quota') || error.includes('credits')
                  ? 'API Credits Exhausted'
                  : 'Error'}
              </div>
              <div>{error}</div>
              {(error.includes('quota') || error.includes('Quota') || error.includes('credits')) && (
                <div className="mt-3 pt-3 border-t border-amber-300">
                  <div className="text-xs text-amber-800">
                    <strong>What to do:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Check your Google AI Studio quota: <a href="https://ai.dev/rate-limit" target="_blank" rel="noopener noreferrer" className="underline">ai.dev/rate-limit</a></li>
                      <li>Wait for the quota to reset (usually daily)</li>
                      <li>Consider upgrading your plan for more requests</li>
                      <li>Or use a different API key if you have one</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Analyze Button - Only show in analyze mode */}
      {entryMode === 'analyze' && !analysis && (
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || items.every((item) => !item.trim())}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing with AI...
            </>
          ) : (
            <>
              <UtensilsCrossed className="w-5 h-5" />
              Analyze Meal
            </>
          )}
        </button>
      )}

      {/* Manual Entry Preview Table */}
      {entryMode === 'manual' && hasValidManualEntries && (
        <div className="mt-6 space-y-4">
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Meal Name
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Calories
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Protein
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Grams
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {manualEntries
                  .filter((entry) => entry.name.trim() && entry.calories && !isNaN(parseInt(entry.calories, 10)))
                  .map((entry, index) => {
                    const calories = parseInt(entry.calories, 10) || 0
                    const protein = parseInt(entry.protein, 10) || 0
                    const grams = parseInt(entry.grams, 10) || 100

                    return (
                      <tr key={index} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{entry.name.trim()}</div>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-700 tabular-nums font-semibold">
                          {calories}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-700 tabular-nums">
                          {protein}g
                        </td>
                        <td className="px-4 py-3 text-right text-slate-500 text-sm tabular-nums">
                          {grams}g
                        </td>
                      </tr>
                    )
                  })}
                <tr className="bg-indigo-50 font-bold">
                  <td className="px-4 py-3 text-slate-900">Total</td>
                  <td className="px-4 py-3 text-right text-indigo-700 tabular-nums">
                    {manualTotals.calories}
                  </td>
                  <td className="px-4 py-3 text-right text-indigo-700 tabular-nums">
                    {manualTotals.protein}g
                  </td>
                  <td className="px-4 py-3 text-right text-indigo-700 tabular-nums">
                    {manualTotals.grams}g
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setManualEntries([{ name: '', calories: '', protein: '', grams: '' }])
              }}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-xl transition-all"
              type="button"
            >
              Clear
            </button>
            <button
              onClick={() => setShowSaveTemplateModal(true)}
              disabled={!hasValidManualEntries || addMealTemplate.isPending}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              type="button"
            >
              <Bookmark className="w-5 h-5" />
              Save as Template
            </button>
            <button
              onClick={handleSave}
              disabled={addFoodLog.isPending || !hasValidManualEntries}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {addFoodLog.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Meal
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Save Template Modal */}
      {showSaveTemplateModal && (
        <SaveTemplateModal
          defaultName={manualEntries.find((e) => e.name.trim())?.name || ''}
          onSave={handleSaveAsTemplate}
          onClose={() => setShowSaveTemplateModal(false)}
        />
      )}

      {/* Nutrition Table - Analyze Mode */}
      {entryMode === 'analyze' && analysis && (
        <div className="mt-6 space-y-4">
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Calories
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Protein
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Grams
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analysis.items.map((item, index) => {
                  const adjustedCal = adjustedCalories[index]
                  const displayCalories = adjustedCal !== undefined ? adjustedCal : Math.round(item.calories)
                  
                  return (
                    <tr key={index} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          {item.name}
                        </div>
                        <div className="text-xs text-slate-500">{item.quantity}</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="relative flex items-center">
                            <input
                              type="number"
                              value={adjustedCal !== undefined ? adjustedCal : ''}
                              onChange={(e) => {
                                const value = e.target.value
                                setAdjustedCalories(prev => {
                                  const newCal = { ...prev }
                                  if (value === '') {
                                    delete newCal[index]
                                  } else {
                                    newCal[index] = parseInt(value, 10)
                                  }
                                  return newCal
                                })
                              }}
                              placeholder={Math.round(item.calories).toString()}
                              min="0"
                              className="w-20 text-right font-semibold text-slate-900 tabular-nums bg-white border border-slate-200 rounded-lg px-2 py-1 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <div className="absolute right-1 flex flex-col">
                              <button
                                type="button"
                                onClick={() => {
                                  const current = adjustedCal !== undefined ? adjustedCal : Math.round(item.calories)
                                  setAdjustedCalories(prev => ({
                                    ...prev,
                                    [index]: Math.max(0, current + 1)
                                  }))
                                }}
                                className="p-0.5 hover:bg-indigo-50 rounded-t text-slate-400 hover:text-indigo-600 transition-colors active:bg-indigo-100"
                                aria-label="Increase calories"
                              >
                                <ChevronUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const current = adjustedCal !== undefined ? adjustedCal : Math.round(item.calories)
                                  setAdjustedCalories(prev => ({
                                    ...prev,
                                    [index]: Math.max(0, current - 1)
                                  }))
                                }}
                                className="p-0.5 hover:bg-indigo-50 rounded-b text-slate-400 hover:text-indigo-600 transition-colors active:bg-indigo-100"
                                aria-label="Decrease calories"
                              >
                                <ChevronDown className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          {adjustedCal !== undefined && adjustedCal !== Math.round(item.calories) && (
                            <span className="text-xs text-slate-400 line-through">
                              {Math.round(item.calories)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700 tabular-nums">
                        {Math.round(item.protein)}g
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 text-sm tabular-nums">
                        {Math.round(item.grams)}g
                      </td>
                    </tr>
                  )
                })}
                <tr className="bg-indigo-50 font-bold">
                  <td className="px-4 py-3 text-slate-900">Total</td>
                  <td className="px-4 py-3 text-right text-indigo-700 tabular-nums">
                    {analysis.items.reduce((sum, item, index) => {
                      const adjustedCal = adjustedCalories[index]
                      return sum + (adjustedCal !== undefined ? adjustedCal : Math.round(item.calories))
                    }, 0)}
                  </td>
                  <td className="px-4 py-3 text-right text-indigo-700 tabular-nums">
                    {Math.round(analysis.totals.protein)}g
                  </td>
                  <td className="px-4 py-3 text-right text-indigo-700 tabular-nums">
                    {Math.round(analysis.totals.grams)}g
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {Object.keys(adjustedCalories).length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-amber-600 text-sm">⚠️</span>
                <div className="text-xs text-amber-800">
                  <strong>Remember:</strong> Be honest with your calorie tracking. Adjusting calories incorrectly can undermine your health goals and progress.
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => {
                // Retry: re-analyze with the same items
                setAnalysis(null)
                setAdjustedCalories({})
                handleAnalyze()
              }}
              disabled={isAnalyzing || items.every((item) => !item.trim())}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              type="button"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <RotateCcw className="w-5 h-5" />
                  Retry Analysis
                </>
              )}
            </button>
            <button
              onClick={handleSave}
              disabled={addFoodLog.isPending}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {addFoodLog.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Meal
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function SaveTemplateModal({
  defaultName,
  onSave,
  onClose,
}: {
  defaultName: string
  onSave: (name: string, category?: string) => void
  onClose: () => void
}) {
  const [templateName, setTemplateName] = useState(defaultName)
  const [category, setCategory] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!templateName.trim()) {
      alert('Please enter a meal name')
      return
    }
    onSave(templateName.trim(), category.trim() || undefined)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-3xl p-6 max-w-md w-full shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900">Save as Template</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="template-name" className="text-sm font-semibold text-slate-600 mb-1.5 block">
              Template Name *
            </label>
            <input
              id="template-name"
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g., Meal Prep #1"
              required
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          <div>
            <label htmlFor="template-category" className="text-sm font-semibold text-slate-600 mb-1.5 block">
              Category (Optional)
            </label>
            <input
              id="template-category"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Meal Prep, Breakfast, Snack"
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              Save Template
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
