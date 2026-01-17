import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET

if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET) {
  console.error('Missing Strava environment variables')
}

export async function GET(request: Request) {
  try {
    // Verify user is authenticated
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET) {
      return NextResponse.json(
        { error: 'Strava integration not configured' },
        { status: 500 }
      )
    }

    // Build OAuth authorization URL
    const requestUrl = new URL(request.url)
    const origin = requestUrl.origin
    const redirectUri = `${origin}/api/strava/callback`

    // Strava OAuth parameters
    const params = new URLSearchParams({
      client_id: STRAVA_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'activity:read',
      approval_prompt: 'force',
      state: user.id, // Pass user ID as state for verification
    })

    const authUrl = `https://www.strava.com/oauth/authorize?${params.toString()}`

    // Redirect to Strava authorization page
    return NextResponse.redirect(authUrl)
  } catch (error: any) {
    console.error('Strava auth error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to initiate Strava authorization' },
      { status: 500 }
    )
  }
}
