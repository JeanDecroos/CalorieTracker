'use client'

import { useState } from 'react'
import { Search, Loader2, Check } from 'lucide-react'
import { useAddFoodLog } from '@/lib/queries/foodLogs'

interface OpenFoodFactsProduct {
  product_name: string
  'energy-kcal_100g'?: number
  'proteins_100g'?: number
  code?: string
}

interface FoodSearchResponse {
  products: OpenFoodFactsProduct[]
  count: number
  total: number
}

export function FoodSearch() {
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<OpenFoodFactsProduct[]>([])
  const [selectedProduct, setSelectedProduct] = useState<OpenFoodFactsProduct | null>(null)
  const [grams, setGrams] = useState('100')
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [adjustedCalories, setAdjustedCalories] = useState<number | null>(null)

  const addFoodLog = useAddFoodLog()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsSearching(true)
    setSearchError(null)
    setSelectedProduct(null)
    setSearchResults([])

    try {
      const apiUrl = `/api/food-search?q=${encodeURIComponent(query.trim())}`
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout for client
      
      const response = await fetch(apiUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      })
      
      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `API returned status ${response.status}`)
      }

      const data = await response.json()

      if (!data.products || data.products.length === 0) {
        setSearchError('No products with calorie information found. Try a different search term.')
      } else {
        setSearchResults(data.products)
      }
    } catch (error: any) {
      console.error('Food search error:', error)
      
      if (error.name === 'AbortError' || error.message?.includes('timeout') || error.message?.includes('timed out')) {
        setSearchError('Search timed out. Please try again or use a different search term.')
      } else if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        setSearchError('Network error. Please check your internet connection and try again.')
      } else {
        setSearchError(error.message || 'Failed to search products. Please try again.')
      }
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectProduct = (product: OpenFoodFactsProduct) => {
    setSelectedProduct(product)
    setSearchResults([])
    setAdjustedCalories(null) // Reset adjusted calories when selecting a new product
  }

  const handleSave = async () => {
    if (!selectedProduct || !grams) return

    const gramsNum = parseInt(grams, 10)
    if (isNaN(gramsNum) || gramsNum <= 0) {
      alert('Please enter a valid number of grams')
      return
    }

    const energyPer100g = selectedProduct['energy-kcal_100g'] || 0
    const proteinPer100g = selectedProduct['proteins_100g'] || 0

    // Use adjusted calories if provided, otherwise calculate from API data
    const calories = adjustedCalories !== null 
      ? adjustedCalories 
      : Math.round((energyPer100g / 100) * gramsNum)
    const protein = Math.round((proteinPer100g / 100) * gramsNum)

    try {
      await addFoodLog.mutateAsync({
        product_name: selectedProduct.product_name,
        calories,
        protein,
        grams: gramsNum,
      })

      // Reset form
      setSelectedProduct(null)
      setQuery('')
      setGrams('100')
      setSearchError(null)
      setAdjustedCalories(null)
    } catch (error: any) {
      alert(error.message || 'Failed to save food entry')
    }
  }

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
      <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-3">Add Food Entry</h3>

      {!selectedProduct ? (
        <>
          <form onSubmit={handleSearch} className="mb-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for food (e.g., Oikos Framboos)"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pl-12 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching || !query.trim()}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center gap-2"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span className="hidden sm:inline">Search</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {searchError && (
            <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">
              {searchError}
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="max-h-64 overflow-y-auto space-y-2">
              {searchResults.map((product, index) => {
                const energyPer100g = product['energy-kcal_100g'] || 0
                const proteinPer100g = product['proteins_100g'] || 0

                return (
                  <button
                    key={product.code || index}
                    onClick={() => handleSelectProduct(product)}
                    className="w-full flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors cursor-pointer text-left"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-slate-700">{product.product_name}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        <span className="font-semibold tabular-nums">{energyPer100g}</span> kcal/100g
                        {proteinPer100g > 0 && (
                          <> · <span className="font-semibold tabular-nums">{proteinPer100g}</span>g protein/100g</>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-medium text-slate-700">{selectedProduct.product_name}</div>
                <div className="text-sm text-slate-500 mt-1">
                  <span className="font-semibold tabular-nums">{selectedProduct['energy-kcal_100g'] || 0}</span> kcal/100g
                  {selectedProduct['proteins_100g'] && selectedProduct['proteins_100g'] > 0 && (
                    <> · <span className="font-semibold tabular-nums">{selectedProduct['proteins_100g']}</span>g protein/100g</>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedProduct(null)
                  setSearchResults([])
                }}
                className="text-slate-400 hover:text-slate-600 ml-4 p-1 rounded-lg hover:bg-white transition-colors"
              >
                ×
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="grams" className="text-sm font-semibold text-slate-600 mb-1.5 block">
              Amount (grams)
            </label>
            <input
              id="grams"
              type="number"
              value={grams}
              onChange={(e) => setGrams(e.target.value)}
              min="1"
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all tabular-nums"
              placeholder="100"
            />
          </div>

          {grams && !isNaN(parseInt(grams, 10)) && parseInt(grams, 10) > 0 && (
            <div className="space-y-3">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-sm text-slate-600 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Calculated calories:</span>
                    <strong className="text-slate-900 text-lg font-extrabold tabular-nums">
                      {Math.round(((selectedProduct['energy-kcal_100g'] || 0) / 100) * parseInt(grams, 10)).toLocaleString()}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-slate-500">Protein:</span>
                    <strong className="text-slate-900 text-lg font-extrabold tabular-nums">
                      {Math.round(((selectedProduct['proteins_100g'] || 0) / 100) * parseInt(grams, 10))}
                    </strong>
                    <span className="text-slate-500">g</span>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="calories" className="text-sm font-semibold text-slate-600 mb-1.5 block">
                  Adjust Calories (optional)
                </label>
                <input
                  id="calories"
                  type="number"
                  value={adjustedCalories !== null ? adjustedCalories : ''}
                  onChange={(e) => {
                    const value = e.target.value
                    setAdjustedCalories(value === '' ? null : parseInt(value, 10))
                  }}
                  placeholder={Math.round(((selectedProduct['energy-kcal_100g'] || 0) / 100) * parseInt(grams, 10)).toString()}
                  min="0"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all tabular-nums"
                />
                {adjustedCalories !== null && (
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <span className="text-amber-600 text-sm">⚠️</span>
                      <div className="text-xs text-amber-800">
                        <strong>Remember:</strong> Be honest with your calorie tracking. Adjusting calories incorrectly can undermine your health goals and progress.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={addFoodLog.isPending || !grams || isNaN(parseInt(grams, 10)) || parseInt(grams, 10) <= 0}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2"
          >
            {addFoodLog.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Save Entry
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
