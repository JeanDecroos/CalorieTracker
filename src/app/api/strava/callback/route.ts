import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const state = requestUrl.searchParams.get('state') // User ID from auth flow
    const error = requestUrl.searchParams.get('error')
    const origin = requestUrl.origin

    // Check for errors from Strava
    if (error) {
      console.error('Strava OAuth error:', error)
      return NextResponse.redirect(`${origin}/dashboard/settings?strava_error=${error}`)
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${origin}/dashboard/settings?strava_error=missing_code_or_state`
      )
    }

    // Verify user is authenticated and matches state
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.id !== state) {
      return NextResponse.redirect(
        `${origin}/dashboard/settings?strava_error=unauthorized`
      )
    }

    if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET) {
      return NextResponse.redirect(
        `${origin}/dashboard/settings?strava_error=not_configured`
      )
    }

    // Exchange authorization code for access token
    const redirectUri = `${origin}/api/strava/callback`
    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: STRAVA_CLIENT_ID,
        client_secret: STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}))
      console.error('Strava token exchange error:', errorData)
      return NextResponse.redirect(
        `${origin}/dashboard/settings?strava_error=token_exchange_failed`
      )
    }

    const tokenData = await tokenResponse.json()

    // Store connection in database
    const expiresAt = new Date(tokenData.expires_at * 1000).toISOString()

    const { error: upsertError } = await supabase
      .from('strava_connections')
      .upsert(
        {
          user_id: user.id,
          athlete_id: tokenData.athlete.id,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: expiresAt,
          token_type: tokenData.token_type || 'Bearer',
        },
        {
          onConflict: 'user_id',
        }
      )

    if (upsertError) {
      console.error('Error saving Strava connection:', upsertError)
      return NextResponse.redirect(
        `${origin}/dashboard/settings?strava_error=database_error`
      )
    }

    // Redirect back to settings with success message
    return NextResponse.redirect(
      `${origin}/dashboard/settings?strava_connected=true`
    )
  } catch (error: any) {
    console.error('Strava callback error:', error)
    const requestUrl = new URL(request.url)
    const origin = requestUrl.origin
    return NextResponse.redirect(
      `${origin}/dashboard/settings?strava_error=${error.message || 'unknown_error'}`
    )
  }
}
