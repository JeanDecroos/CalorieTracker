import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30 // 30 seconds for Vercel, adjust for your hosting

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 })
  }

  try {
    const encodedQuery = encodeURIComponent(query.trim())
    // Use a simpler, faster endpoint
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodedQuery}&search_simple=1&action=process&json=1&page_size=10&fields=product_name,energy-kcal_100g,proteins_100g,code`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 25000) // 25 second timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'NutritionTracker/1.0 (https://github.com/openfoodfacts)',
        'Accept': 'application/json',
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`OpenFoodFacts API returned status ${response.status}`)
    }

    const data = await response.json()

    // Filter products that have calorie information
    const products = (data.products || []).filter(
      (p: any) =>
        p.product_name &&
        p['energy-kcal_100g'] !== undefined &&
        p['energy-kcal_100g'] !== null &&
        p['energy-kcal_100g'] > 0
    )

    return NextResponse.json({
      products,
      count: products.length,
      total: data.count || 0,
    })
  } catch (error: any) {
    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      console.error('Food search timeout:', query)
      return NextResponse.json(
        { error: 'Request timed out. The OpenFoodFacts API may be slow. Please try again.' },
        { status: 504 }
      )
    }

    console.error('Food search API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to search products. Please try again.' },
      { status: 500 }
    )
  }
}
