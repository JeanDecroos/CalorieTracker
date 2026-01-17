import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { formatDateForDB } from '@/utils/dateUtils'

const GEMINI_API_KEY = 'AIzaSyDnQrQaAT12xPG4zdT_rOcZqq1j7nasmuY'
// Using gemini-2.5-flash (stable model with web search capability)
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

export const maxDuration = 30

/**
 * Create a nutritional estimate for an item when exact data isn't available
 */
function createEstimateForItem(inputItem: string): NutritionItem {
  const inputLower = inputItem.toLowerCase()
  
  // Extract quantity (e.g., "2x", "100gr", "1")
  const quantityMatch = inputLower.match(/(\d+)x?\s*(\d+)?\s*(gr|g|gram|grams)?/i)
  let quantity = inputItem.match(/\d+x?.*gr?/i)?.[0] || inputItem.match(/\d+/)?.[0] || '1'
  let multiplier = 1
  let grams = 100
  
  if (quantityMatch) {
    const firstNum = parseInt(quantityMatch[1], 10) || 1
    const secondNum = parseInt(quantityMatch[2], 10)
    
    if (inputLower.includes('x')) {
      multiplier = firstNum
      grams = secondNum || (firstNum * 100)
    } else {
      grams = firstNum
    }
  }
  
  // Common food estimates (per 100g unless specified)
  const estimates: Record<string, { calories: number; protein: number; grams: number }> = {
    apple: { calories: 52, protein: 0.3, grams: 180 },
    appel: { calories: 52, protein: 0.3, grams: 180 }, // Dutch spelling
    banana: { calories: 89, protein: 1.1, grams: 120 },
    bread: { calories: 265, protein: 9, grams: 100 },
    chicken: { calories: 165, protein: 31, grams: 100 },
    rice: { calories: 130, protein: 2.7, grams: 100 },
    pasta: { calories: 131, protein: 5, grams: 100 },
    egg: { calories: 155, protein: 13, grams: 50 },
    yogurt: { calories: 59, protein: 10, grams: 100 },
    milk: { calories: 42, protein: 3.4, grams: 100 },
    cheese: { calories: 113, protein: 25, grams: 100 },
    salmon: { calories: 208, protein: 20, grams: 100 },
    tuna: { calories: 144, protein: 30, grams: 100 },
  }
  
  // Try to match input to common foods
  let baseEstimate = null
  for (const [key, value] of Object.entries(estimates)) {
    if (inputLower.includes(key)) {
      baseEstimate = value
      break
    }
  }
  
  // Default estimate if no match found
  if (!baseEstimate) {
    baseEstimate = { calories: 100, protein: 5, grams: 100 }
  }
  
  // Calculate total based on quantity
  const totalGrams = grams * (baseEstimate.grams === grams ? 1 : multiplier)
  const caloriesPerGram = baseEstimate.calories / baseEstimate.grams
  const proteinPerGram = baseEstimate.protein / baseEstimate.grams
  
  // Extract clean name (remove quantity info)
  let cleanName = inputItem
    .replace(/\d+x?\s*/gi, '')
    .replace(/\d+\s*(gr?|gram|grams?)\s*/gi, '')
    .replace(/\d+\s*/g, '')
    .trim()
  
  if (!cleanName) {
    cleanName = inputItem.trim()
  }
  
  return {
    name: cleanName,
    quantity: quantity,
    calories: Math.round(caloriesPerGram * totalGrams),
    protein: Math.round(proteinPerGram * totalGrams * 10) / 10,
    grams: totalGrams,
  }
}

interface NutritionItem {
  name: string
  quantity: string
  calories: number
  protein: number
  carbs?: number
  fat?: number
  grams: number
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { mealType, items } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items array is required' },
        { status: 400 }
      )
    }

    // Create prompt for Gemini
    const itemsText = items.map((item, index) => `${index + 1}. ${item}`).join('\n')
    const prompt = `You are a nutrition analysis assistant. Analyze ALL ${items.length} meal items below and return a JSON array with nutritional information for EACH item.

CRITICAL REQUIREMENTS:
1. You MUST search the web for accurate, up-to-date nutritional information for each food item.
2. Use web search to find specific product information, brand-specific nutrition facts, and official food databases.
3. You MUST return exactly ${items.length} items in the array, one for each input item.
4. After searching the web, if you cannot find exact nutritional data, you MUST make a reasonable estimate based on similar foods or general knowledge.
5. NEVER skip an item - always provide your best estimate if exact data is unavailable after web search.
6. Prioritize finding accurate data through web search rather than relying solely on general knowledge.

PROTEIN CALCULATION ACCURACY (CRITICAL):
- For Greek yogurt (Oikos, Chobani, Fage, etc.): Typically 8-10g protein per 100g. For "2x 115gr" (230g total), calculate: (protein per 100g / 100) × 230. Example: Oikos typically has ~9g per 100g, so 230g = ~21g protein.
- For dairy products: Always calculate protein per 100g first, then multiply by total grams.
- For multiple servings (e.g., "2x", "3x"): Calculate protein for ONE serving, then multiply by the number of servings.
- Greek yogurt is HIGH in protein - never underestimate it. Standard Greek yogurt has 8-10g protein per 100g.
- If you find nutrition per serving, convert to per 100g first, then calculate for the total quantity.

For each item, provide:
- name: the food item name (clean, without quantity)
- quantity: the original quantity description exactly as provided (e.g., "100gr", "2x 115gr", "1 apple")
- calories: total calories for the entire quantity (number) - calculate accurately based on quantity
- protein: protein in grams for the entire quantity (number) - CRITICAL: calculate accurately, especially for dairy/Greek yogurt
- carbs: carbohydrates in grams (number, optional) - calculate accurately
- fat: fat in grams (number, optional) - calculate accurately
- grams: total weight in grams (number, calculate based on quantity)

Meal type: ${mealType}

Items to analyze (${items.length} items):
${itemsText}

Return ONLY a valid JSON array with exactly ${items.length} objects. No markdown, no code blocks, no explanations - just the JSON array. Use accurate calculations based on web search results:
[
  {
    "name": "Holies Granola Protein",
    "quantity": "100gr",
    "calories": 450,
    "protein": 20,
    "carbs": 60,
    "fat": 15,
    "grams": 100
  },
  {
    "name": "Oikos Framboos",
    "quantity": "2x 115gr",
    "calories": 200,
    "protein": 21,
    "carbs": 20,
    "fat": 2,
    "grams": 230
  },
  {
    "name": "Apple",
    "quantity": "1 apple",
    "calories": 95,
    "protein": 0.5,
    "carbs": 25,
    "fat": 0.3,
    "grams": 182
  }
]`

    // Call Gemini API
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 25000)

    try {
      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': GEMINI_API_KEY,
        },
        signal: controller.signal,
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              topK: 1,
              topP: 1,
              maxOutputTokens: 4096, // Increased to handle multiple items
            },
            tools: [
              {
                googleSearch: {}, // Enable web search for accurate nutrition data
              },
            ],
          }),
        }
      )

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Gemini API error response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        })
        
        // Try to parse error JSON
        let errorMessage = `Gemini API returned status ${response.status}`
        let retryAfter: number | null = null
        
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error?.message || errorData.message || errorMessage
          
          // Extract retry time from quota error
          const retryMatch = errorMessage.match(/Please retry in ([\d.]+)s/)
          if (retryMatch) {
            retryAfter = Math.ceil(parseFloat(retryMatch[1]))
          }
          
          // Check if it's a quota error
          if (errorData.error?.code === 429 || errorMessage.includes('quota') || errorMessage.includes('Quota exceeded')) {
            const quotaError: any = new Error(
              retryAfter 
                ? `API quota exceeded. Please wait ${retryAfter} seconds and try again.`
                : 'API quota exceeded. Please check your Google AI Studio quota or try again later.'
            )
            quotaError.code = 'QUOTA_EXCEEDED'
            quotaError.retryAfter = retryAfter
            throw quotaError
          }
        } catch (parseError) {
          // If parsing failed, check if it's a quota error from text
          if (errorText.includes('quota') || errorText.includes('Quota exceeded')) {
            const quotaError: any = new Error('API quota exceeded. Please check your Google AI Studio quota.')
            quotaError.code = 'QUOTA_EXCEEDED'
            throw quotaError
          }
        }
        
        throw new Error(errorMessage)
      }

      const data = await response.json()

      // Extract text from Gemini response
      const responseText =
        data.candidates?.[0]?.content?.parts?.[0]?.text || ''

      if (!responseText) {
        console.error('Gemini API response structure:', JSON.stringify(data, null, 2))
        throw new Error('No response text from Gemini API. Check console for response structure.')
      }

      // Log the raw response for debugging
      console.log('Gemini raw response length:', responseText.length)
      console.log('Gemini raw response (first 500 chars):', responseText.substring(0, 500))

      // Parse JSON from response (remove markdown code blocks if present)
      let jsonText = responseText.trim()
      
      // Remove markdown code blocks
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      
      // Try to find the JSON array in the response
      let jsonMatch = jsonText.match(/\[[\s\S]*\]/)
      
      if (!jsonMatch) {
        // If no complete array found, try to extract and fix incomplete JSON
        const arrayStart = jsonText.indexOf('[')
        if (arrayStart !== -1) {
          let partialJson = jsonText.substring(arrayStart)
          
          // Extract all complete JSON objects from the partial response
          const items: any[] = []
          let currentObject = ''
          let depth = 0
          let inString = false
          let escapeNext = false
          
          for (let i = 0; i < partialJson.length; i++) {
            const char = partialJson[i]
            
            if (escapeNext) {
              currentObject += char
              escapeNext = false
              continue
            }
            
            if (char === '\\') {
              currentObject += char
              escapeNext = true
              continue
            }
            
            if (char === '"') {
              inString = !inString
              currentObject += char
              continue
            }
            
            if (!inString) {
              if (char === '{') {
                if (depth === 0) {
                  currentObject = '{'
                } else {
                  currentObject += char
                }
                depth++
              } else if (char === '}') {
                currentObject += char
                depth--
                if (depth === 0) {
                  // Complete object found
                  try {
                    const item = JSON.parse(currentObject)
                    items.push(item)
                    currentObject = ''
                  } catch {
                    // Skip invalid object
                  }
                }
              } else if (depth > 0) {
                currentObject += char
              }
            } else {
              currentObject += char
            }
          }
          
          if (items.length > 0) {
            jsonText = JSON.stringify(items)
          } else {
            throw new Error('No complete JSON objects found in response')
          }
        } else {
          throw new Error('No JSON array found in Gemini response')
        }
      } else {
        jsonText = jsonMatch[0]
      }

      let nutritionItems: NutritionItem[]
      try {
        nutritionItems = JSON.parse(jsonText)
      } catch (parseError: any) {
        console.error('Failed to parse JSON from Gemini:', jsonText)
        console.error('Parse error:', parseError.message)
        console.error('Full response text:', responseText)
        
        // Last resort: try to extract individual items using regex
        const itemPattern = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g
        const matches = jsonText.match(itemPattern)
        if (matches && matches.length > 0) {
          nutritionItems = []
          for (const match of matches) {
            try {
              const item = JSON.parse(match)
              if (item.name && item.calories !== undefined) {
                nutritionItems.push(item)
              }
            } catch {
              // Skip invalid items
            }
          }
          
          if (nutritionItems.length === 0) {
            throw new Error(
              `Failed to parse nutrition data. Response: ${jsonText.substring(0, 500)}`
            )
          }
        } else {
          throw new Error(
            `Failed to parse nutrition data. Gemini returned: ${jsonText.substring(0, 500)}`
          )
        }
      }

      if (!Array.isArray(nutritionItems) || nutritionItems.length === 0) {
        throw new Error('Gemini did not return a valid array of nutrition items')
      }

      // Validate that we got the expected number of items
      console.log(`Parsed ${nutritionItems.length} items from ${items.length} input items`)
      console.log('Parsed items:', nutritionItems.map((i) => ({ name: i.name, calories: i.calories, protein: i.protein })))
      
      // Always ensure we have exactly the expected number of items
      if (nutritionItems.length < items.length) {
        console.warn(
          `⚠️ Expected ${items.length} items but got ${nutritionItems.length}. Creating estimates for missing items.`
        )
        
        const parsedItemNames = nutritionItems.map((i) => i.name.toLowerCase())
        const usedIndices = new Set<number>()
        
        // Try to match parsed items to input items (in order if possible)
        const matchedIndices: number[] = []
        parsedItemNames.forEach((parsedName) => {
          for (let i = 0; i < items.length; i++) {
            if (usedIndices.has(i)) continue
            
            const inputLower = items[i].toLowerCase()
            // Check if parsed name matches input item
            const keyWords = parsedName.split(' ').filter(w => w.length > 3)
            const inputWords = inputLower.split(/\s+/).filter(w => w.length > 2)
            
            const hasMatch = keyWords.some(kw => 
              inputWords.some(iw => iw.includes(kw) || kw.includes(iw))
            ) || inputLower.includes(parsedName) || parsedName.includes(inputLower.split(' ')[0])
            
            if (hasMatch) {
              matchedIndices.push(i)
              usedIndices.add(i)
              break
            }
          }
        })
        
        // Create estimates for unmatched input items (in order)
        for (let i = 0; i < items.length; i++) {
          if (!usedIndices.has(i)) {
            const inputItem = items[i]
            const estimatedItem = createEstimateForItem(inputItem)
            // Insert at the position matching the input order
            const insertIndex = matchedIndices.filter(idx => idx < i).length
            nutritionItems.splice(insertIndex, 0, estimatedItem)
            console.log(`Created estimate for missing item #${i + 1}: ${inputItem}`, estimatedItem)
          }
        }
      } else if (nutritionItems.length > items.length) {
        // If we got more items than expected, take only the first N
        console.warn(`⚠️ Got ${nutritionItems.length} items but expected ${items.length}. Using first ${items.length} items.`)
        nutritionItems = nutritionItems.slice(0, items.length)
      }
      
      // Final validation - ensure exact count match
      if (nutritionItems.length !== items.length) {
        console.error(`⚠️ Item count mismatch: ${nutritionItems.length} vs ${items.length}. Adjusting...`)
        // Last resort: pad with estimates or truncate
        while (nutritionItems.length < items.length) {
          const missingIndex = nutritionItems.length
          const inputItem = items[missingIndex]
          const estimatedItem = createEstimateForItem(inputItem)
          nutritionItems.push(estimatedItem)
        }
        if (nutritionItems.length > items.length) {
          nutritionItems = nutritionItems.slice(0, items.length)
        }
      }

      // Validate and calculate totals
      const totalCalories = nutritionItems.reduce(
        (sum, item) => sum + (item.calories || 0),
        0
      )
      const totalProtein = nutritionItems.reduce(
        (sum, item) => sum + (item.protein || 0),
        0
      )
      const totalGrams = nutritionItems.reduce(
        (sum, item) => sum + (item.grams || 0),
        0
      )

      const totals = {
        calories: totalCalories,
        protein: totalProtein,
        grams: totalGrams,
      }

      // Save meal analysis to Supabase
      try {
        const supabase = await createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          const { error: dbError } = await supabase.from('meals').insert({
            user_id: user.id,
            meal_type: mealType,
            date: formatDateForDB(new Date()),
            items: items,
            analysis: nutritionItems,
            request_prompt: prompt,
            totals: totals,
          })

          if (dbError) {
            console.error('Error saving meal to database:', dbError)
            // Don't fail the request if DB save fails, just log it
          } else {
            console.log('Meal analysis saved to database successfully')
          }
        } else {
          console.warn('No authenticated user, skipping meal save to database')
        }
      } catch (dbSaveError) {
        console.error('Error saving meal to database:', dbSaveError)
        // Don't fail the request if DB save fails, just log it
      }

      return NextResponse.json({
        items: nutritionItems,
        totals: totals,
        mealType,
      })
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        throw new Error('Request to Gemini API timed out')
      }
      throw fetchError
    }
  } catch (error: any) {
    console.error('Meal analysis error:', error)
    
    // Handle quota errors with appropriate status code
    if (error.code === 'QUOTA_EXCEEDED') {
      return NextResponse.json(
        {
          error: error.message,
          code: 'QUOTA_EXCEEDED',
          retryAfter: error.retryAfter,
        },
        { status: 429 }
      )
    }
    
    return NextResponse.json(
      {
        error:
          error.message ||
          'Failed to analyze meal. Please check your input and try again.',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
