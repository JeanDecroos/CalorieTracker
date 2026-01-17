'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useMealTemplates, useAddMealTemplate, useUpdateMealTemplate, useDeleteMealTemplate, MealTemplate } from '@/lib/queries/mealTemplates'
import { useAddFoodLog } from '@/lib/queries/foodLogs'
import { LogOut, ArrowLeft, Plus, Edit2, Trash2, Save, X, Loader2, Search, Minus } from 'lucide-react'

export default function SavedMealsPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const supabase = createClient()
  const { data: templates, isLoading } = useMealTemplates()
  const [searchQuery, setSearchQuery] = useState('')
  const [quantityFilter, setQuantityFilter] = useState<string>('all')
  const [editingTemplate, setEditingTemplate] = useState<MealTemplate | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const filteredTemplates = templates?.filter((template) => {
    // Search filter
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.category?.toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false

    // Quantity filter
    const stock = template.stock ?? null
    if (quantityFilter === 'all') return true
    if (quantityFilter === 'none' && stock === null) return true
    if (quantityFilter === 'zero' && stock === 0) return true
    if (quantityFilter === 'low' && stock !== null && stock > 0 && stock <= 5) return true
    if (quantityFilter === 'medium' && stock !== null && stock > 5 && stock <= 10) return true
    if (quantityFilter === 'high' && stock !== null && stock > 10) return true

    return false
  }) || []

  if (!mounted || isLoading) {
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
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-slate-500 hover:text-indigo-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Saved Meals
              </h1>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-500 hover:text-indigo-600 font-medium text-sm flex items-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
          {/* Header Actions */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1 w-full sm:max-w-md">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search meals..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pl-10 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create New
              </button>
            </div>
            
            {/* Quantity Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-slate-600 whitespace-nowrap">
                Filter by Quantity:
              </label>
              <select
                value={quantityFilter}
                onChange={(e) => setQuantityFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              >
                <option value="all">All</option>
                <option value="none">Not tracking (none)</option>
                <option value="zero">Out of stock (0)</option>
                <option value="low">Low stock (1-5)</option>
                <option value="medium">Medium stock (6-10)</option>
                <option value="high">High stock (11+)</option>
              </select>
            </div>
          </div>

          {/* Templates List */}
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-slate-400 mb-4">
                <Plus className="w-16 h-16 mx-auto opacity-50" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {searchQuery ? 'No meals found' : 'No saved meals yet'}
              </h3>
              <p className="text-sm text-slate-600 mb-6">
                {searchQuery
                  ? 'Try adjusting your search terms'
                  : 'Create your first meal template to get started'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Create Your First Meal
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <MealTemplateCard
                  key={template.id}
                  template={template}
                  onEdit={() => setEditingTemplate(template)}
                  onDelete={() => {
                    if (confirm(`Delete "${template.name}"?`)) {
                      // Delete will be handled by the card component
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingTemplate) && (
        <MealTemplateModal
          template={editingTemplate}
          onClose={() => {
            setShowCreateModal(false)
            setEditingTemplate(null)
          }}
        />
      )}
    </div>
  )
}

function MealTemplateCard({
  template,
  onEdit,
  onDelete,
}: {
  template: MealTemplate
  onEdit: () => void
  onDelete: () => void
}) {
  const deleteTemplate = useDeleteMealTemplate()
  const updateTemplate = useUpdateMealTemplate()
  const addFoodLog = useAddFoodLog()
  const [isQuickAdding, setIsQuickAdding] = useState(false)

  const handleQuickAdd = async () => {
    setIsQuickAdding(true)
    try {
      await addFoodLog.mutateAsync({
        product_name: template.name,
        calories: template.calories,
        protein: template.protein,
        grams: template.grams,
        date: new Date().toISOString().split('T')[0],
        meal_type: 'Lunch',
      })

      // Decrease stock if tracking stock
      if (template.stock !== null && template.stock !== undefined && template.stock > 0) {
        await updateTemplate.mutateAsync({
          id: template.id,
          input: {
            stock: Math.max(0, template.stock - 1),
          },
        })
      }
      // Show success feedback (could add toast notification here)
    } catch (error: any) {
      alert(error.message || 'Failed to add meal')
    } finally {
      setIsQuickAdding(false)
    }
  }

  const handleStockAdjust = async (delta: number) => {
    const newStock = Math.max(0, (template.stock || 0) + delta)
    try {
      await updateTemplate.mutateAsync({
        id: template.id,
        input: {
          stock: newStock,
        },
      })
    } catch (error: any) {
      alert(error.message || 'Failed to update stock')
    }
  }

  const handleDelete = async () => {
    if (confirm(`Delete "${template.name}"?`)) {
      try {
        await deleteTemplate.mutateAsync(template.id)
      } catch (error: any) {
        alert(error.message || 'Failed to delete template')
      }
    }
  }

  return (
    <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-bold text-slate-900">{template.name}</h3>
            {template.stock !== null && template.stock !== undefined && (
              <div className="flex items-center gap-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold ${
                  template.stock > 0 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  Stock: {template.stock}
                </span>
                <button
                  onClick={() => handleStockAdjust(-1)}
                  disabled={updateTemplate.isPending || template.stock <= 0}
                  className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Decrease stock"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleStockAdjust(1)}
                  disabled={updateTemplate.isPending}
                  className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors disabled:opacity-50"
                  title="Increase stock"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
          {template.category && (
            <span className="inline-block text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg mt-1">
              {template.category}
            </span>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteTemplate.isPending}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
        <div>
          <div className="text-slate-500 mb-1">Calories</div>
          <div className="font-bold text-slate-900 tabular-nums">{template.calories}</div>
        </div>
        <div>
          <div className="text-slate-500 mb-1">Protein</div>
          <div className="font-bold text-slate-900 tabular-nums">{template.protein}g</div>
        </div>
        <div>
          <div className="text-slate-500 mb-1">Grams</div>
          <div className="font-bold text-slate-900 tabular-nums">{template.grams}g</div>
        </div>
      </div>

      {template.notes && (
        <p className="text-xs text-slate-600 mb-4 line-clamp-2">{template.notes}</p>
      )}

      <button
        onClick={handleQuickAdd}
        disabled={isQuickAdding || addFoodLog.isPending || (template.stock !== null && template.stock !== undefined && template.stock <= 0)}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
        title={template.stock === 0 ? 'Stock is empty' : 'Add to today\'s food log'}
      >
        {isQuickAdding || addFoodLog.isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Adding...
          </>
        ) : (
          <>
            <Plus className="w-4 h-4" />
            Quick Add to Today
          </>
        )}
      </button>
    </div>
  )
}

function MealTemplateModal({
  template,
  onClose,
}: {
  template: MealTemplate | null
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [grams, setGrams] = useState('100')
  const [category, setCategory] = useState('')
  const [notes, setNotes] = useState('')
  const [stock, setStock] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Update form when template changes
  useEffect(() => {
    if (template) {
      setName(template.name)
      setCalories(template.calories.toString())
      setProtein(template.protein.toString())
      setGrams(template.grams.toString())
      setCategory(template.category || '')
      setNotes(template.notes || '')
      setStock(template.stock !== null && template.stock !== undefined ? template.stock.toString() : '')
    } else {
      setName('')
      setCalories('')
      setProtein('')
      setGrams('100')
      setCategory('')
      setNotes('')
      setStock('')
    }
  }, [template])

  const addTemplate = useAddMealTemplate()
  const updateTemplate = useUpdateMealTemplate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const caloriesNum = parseInt(calories, 10)
    const proteinNum = parseInt(protein, 10) || 0
    const gramsNum = parseInt(grams, 10) || 100
    const stockNum = stock.trim() === '' ? null : parseInt(stock, 10)

    if (!name.trim()) {
      alert('Please enter a meal name')
      setIsSubmitting(false)
      return
    }

    if (isNaN(caloriesNum) || caloriesNum <= 0) {
      alert('Please enter a valid calorie count')
      setIsSubmitting(false)
      return
    }

    if (stockNum !== null && (isNaN(stockNum) || stockNum < 0)) {
      alert('Please enter a valid stock count (0 or greater)')
      setIsSubmitting(false)
      return
    }

    try {
      if (template) {
        await updateTemplate.mutateAsync({
          id: template.id,
          input: {
            name: name.trim(),
            calories: caloriesNum,
            protein: proteinNum,
            grams: gramsNum,
            category: category.trim() || null,
            notes: notes.trim() || null,
            stock: stockNum,
          },
        })
      } else {
        await addTemplate.mutateAsync({
          name: name.trim(),
          calories: caloriesNum,
          protein: proteinNum,
          grams: gramsNum,
          category: category.trim() || null,
          notes: notes.trim() || null,
          stock: stockNum,
        })
      }
      onClose()
    } catch (error: any) {
      alert(error.message || 'Failed to save meal template')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-3xl p-6 max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">
            {template ? 'Edit Meal Template' : 'Create Meal Template'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="text-sm font-semibold text-slate-600 mb-1.5 block">
              Meal Name *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Meal Prep #1"
              required
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="calories" className="text-sm font-semibold text-slate-600 mb-1.5 block">
                Calories *
              </label>
              <input
                id="calories"
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="850"
                min="1"
                required
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all tabular-nums"
              />
            </div>
            <div>
              <label htmlFor="protein" className="text-sm font-semibold text-slate-600 mb-1.5 block">
                Protein (g)
              </label>
              <input
                id="protein"
                type="number"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                placeholder="50"
                min="0"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all tabular-nums"
              />
            </div>
            <div>
              <label htmlFor="grams" className="text-sm font-semibold text-slate-600 mb-1.5 block">
                Grams
              </label>
              <input
                id="grams"
                type="number"
                value={grams}
                onChange={(e) => setGrams(e.target.value)}
                placeholder="300"
                min="1"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="text-sm font-semibold text-slate-600 mb-1.5 block">
                Category (Optional)
              </label>
              <input
                id="category"
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Meal Prep, Breakfast, Snack"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            <div>
              <label htmlFor="stock" className="text-sm font-semibold text-slate-600 mb-1.5 block">
                Quantity (Optional)
              </label>
              <input
                id="stock"
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="e.g., 5"
                min="0"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all tabular-nums"
              />
              <p className="text-xs text-slate-500 mt-1">Leave empty if not tracking quantity</p>
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="text-sm font-semibold text-slate-600 mb-1.5 block">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about this meal..."
              rows={3}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
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
              disabled={isSubmitting || addTemplate.isPending || updateTemplate.isPending}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting || addTemplate.isPending || updateTemplate.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {template ? 'Update' : 'Create'} Template
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}