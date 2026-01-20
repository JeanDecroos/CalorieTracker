import { createClient } from '@/lib/supabase/server'

export interface WhoopWorkout {
  id: number
  sport?: {
    id: number
    name: string
  }
  score?: {
    strain?: number
    kilojoule?: number
    average_heart_rate?: number
    max_heart_rate?: number
  }
  start: string // ISO 8601 date string
  end: string // ISO 8601 date string
  calories?: number
}

/**
 * Get valid access token for a user, refreshing if necessary
 */
export async function getValidAccessToken(userId: string): Promise<string | null> {
  const supabase = await createClient()

  // Get current connection
  const { data: connection, error } = await supabase
    .from('whoop_connections')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !connection) {
    return null
  }

  // Check if token is expired (with 5 minute buffer)
  const expiresAt = new Date(connection.expires_at)
  const now = new Date()
  const bufferMs = 5 * 60 * 1000 // 5 minutes

  if (now.getTime() >= expiresAt.getTime() - bufferMs) {
    // Token is expired or about to expire, refresh it
    // Note: Whoop token refresh implementation may differ
    // For now, return null if expired - actual refresh logic needs to be implemented
    console.warn('Whoop token expired and refresh not implemented yet')
    return null
  }

  return connection.access_token
}

/**
 * Fetch workouts from Whoop API
 */
export async function fetchWhoopWorkouts(
  userId: string,
  start?: string, // ISO 8601 date string
  end?: string // ISO 8601 date string
): Promise<WhoopWorkout[]> {
  const accessToken = await getValidAccessToken(userId)

  if (!accessToken) {
    throw new Error('No valid Whoop access token')
  }

  try {
    const params = new URLSearchParams()
    if (start) params.append('start', start)
    if (end) params.append('end', end)

    // Whoop API endpoint for workouts
    // Note: This endpoint structure may need to be adjusted based on actual Whoop API
    const url = params.toString()
      ? `https://api.prod.whoop.com/developer/v1/workout?${params.toString()}`
      : `https://api.prod.whoop.com/developer/v1/workout`

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        `Whoop API error: ${response.status} - ${JSON.stringify(errorData)}`
      )
    }

    const data = await response.json()
    // Whoop API may return workouts in a records array or directly
    // Adjust based on actual response structure
    return data.records || data || []
  } catch (error: any) {
    console.error('Error fetching Whoop workouts:', error)
    throw error
  }
}

/**
 * Check if user has Whoop connected
 */
export async function hasWhoopConnection(userId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('whoop_connections')
    .select('id')
    .eq('user_id', userId)
    .single()

  return !error && !!data
}
