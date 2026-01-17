import { createClient } from '@/lib/supabase/server'

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET

export interface StravaTokenData {
  access_token: string
  refresh_token: string
  expires_at: string
  athlete_id: number
}

export interface StravaActivity {
  id: number
  name: string
  distance: number // meters
  moving_time: number // seconds
  elapsed_time: number // seconds
  total_elevation_gain: number // meters
  type: string // Activity type (Run, Ride, etc.)
  start_date: string // ISO 8601 date string
  start_date_local: string // ISO 8601 date string (local time)
  calories?: number
  has_heartrate: boolean
  average_heartrate?: number
  max_heartrate?: number
}

/**
 * Get valid access token for a user, refreshing if necessary
 */
export async function getValidAccessToken(userId: string): Promise<string | null> {
  const supabase = await createClient()

  // Get current connection
  const { data: connection, error } = await supabase
    .from('strava_connections')
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
    const refreshedToken = await refreshAccessToken(connection.refresh_token, userId)
    if (!refreshedToken) {
      return null
    }
    return refreshedToken
  }

  return connection.access_token
}

/**
 * Refresh Strava access token
 */
async function refreshAccessToken(
  refreshToken: string,
  userId: string
): Promise<string | null> {
  if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET) {
    return null
  }

  try {
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: STRAVA_CLIENT_ID,
        client_secret: STRAVA_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    if (!response.ok) {
      console.error('Failed to refresh Strava token')
      return null
    }

    const tokenData = await response.json()

    // Update connection in database
    const supabase = await createClient()
    const expiresAt = new Date(tokenData.expires_at * 1000).toISOString()

    const { error } = await supabase
      .from('strava_connections')
      .update({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt,
      })
      .eq('user_id', userId)

    if (error) {
      console.error('Error updating refreshed token:', error)
      return null
    }

    return tokenData.access_token
  } catch (error) {
    console.error('Error refreshing Strava token:', error)
    return null
  }
}

/**
 * Fetch activities from Strava API
 */
export async function fetchStravaActivities(
  userId: string,
  before?: number, // Unix timestamp
  after?: number // Unix timestamp
): Promise<StravaActivity[]> {
  const accessToken = await getValidAccessToken(userId)

  if (!accessToken) {
    throw new Error('No valid Strava access token')
  }

  try {
    const params = new URLSearchParams()
    if (before) params.append('before', before.toString())
    if (after) params.append('after', after.toString())
    params.append('per_page', '100') // Max 100 activities per request

    const response = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        `Strava API error: ${response.status} - ${JSON.stringify(errorData)}`
      )
    }

    const activities: StravaActivity[] = await response.json()
    return activities
  } catch (error: any) {
    console.error('Error fetching Strava activities:', error)
    throw error
  }
}

/**
 * Check if user has Strava connected
 */
export async function hasStravaConnection(userId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('strava_connections')
    .select('id')
    .eq('user_id', userId)
    .single()

  return !error && !!data
}
