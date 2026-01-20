import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const WHOOP_CLIENT_ID = process.env.WHOOP_CLIENT_ID
const WHOOP_CLIENT_SECRET = process.env.WHOOP_CLIENT_SECRET

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const state = requestUrl.searchParams.get('state') // User ID from auth flow
    const error = requestUrl.searchParams.get('error')
    const origin = requestUrl.origin

    // Check for errors from WHOOP
    if (error) {
      console.error('WHOOP OAuth error:', error)
      return NextResponse.redirect(`${origin}/dashboard/settings?whoop_error=${error}`)
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${origin}/dashboard/settings?whoop_error=missing_code_or_state`
      )
    }

    // Verify user is authenticated and matches state
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.id !== state) {
      return NextResponse.redirect(
        `${origin}/dashboard/settings?whoop_error=unauthorized`
      )
    }

    if (!WHOOP_CLIENT_ID || !WHOOP_CLIENT_SECRET) {
      return NextResponse.redirect(
        `${origin}/dashboard/settings?whoop_error=not_configured`
      )
    }

    // Exchange authorization code for access token
    const redirectUri = `${origin}/api/whoop/callback`
    
    // WHOOP token endpoint
    // Update this URL based on WHOOP's actual API endpoint
    const tokenResponse = await fetch('https://api.prod.whoop.com/oauth/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${WHOOP_CLIENT_ID}:${WHOOP_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}))
      console.error('WHOOP token exchange error:', errorData)
      return NextResponse.redirect(
        `${origin}/dashboard/settings?whoop_error=token_exchange_failed`
      )
    }

    const tokenData = await tokenResponse.json()

    // WHOOP token response format may differ - adjust based on actual response
    // Assuming similar structure to Strava: { access_token, refresh_token, expires_in }
    const expiresIn = tokenData.expires_in || 3600 // Default to 1 hour if not provided
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()

    // Store connection in database
    const { error: upsertError } = await supabase
      .from('whoop_connections')
      .upsert(
        {
          user_id: user.id,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || null,
          expires_at: expiresAt,
          token_type: tokenData.token_type || 'Bearer',
        },
        {
          onConflict: 'user_id',
        }
      )

    if (upsertError) {
      console.error('Error saving WHOOP connection:', upsertError)
      return NextResponse.redirect(
        `${origin}/dashboard/settings?whoop_error=database_error`
      )
    }

    // Redirect back to settings with success message
    return NextResponse.redirect(
      `${origin}/dashboard/settings?whoop_connected=true`
    )
  } catch (error: any) {
    console.error('WHOOP callback error:', error)
    const requestUrl = new URL(request.url)
    const origin = requestUrl.origin
    return NextResponse.redirect(
      `${origin}/dashboard/settings?whoop_error=${error.message || 'unknown_error'}`
    )
  }
}
