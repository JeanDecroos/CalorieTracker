import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const WHOOP_CLIENT_ID = process.env.WHOOP_CLIENT_ID
const WHOOP_CLIENT_SECRET = process.env.WHOOP_CLIENT_SECRET

if (!WHOOP_CLIENT_ID || !WHOOP_CLIENT_SECRET) {
  console.error('Missing WHOOP environment variables')
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

    if (!WHOOP_CLIENT_ID || !WHOOP_CLIENT_SECRET) {
      return NextResponse.json(
        { error: 'WHOOP integration not configured' },
        { status: 500 }
      )
    }

    // Build OAuth authorization URL
    const requestUrl = new URL(request.url)
    const origin = requestUrl.origin
    const redirectUri = `${origin}/api/whoop/callback`

    // WHOOP OAuth parameters
    // Note: WHOOP uses standard OAuth 2.0 flow
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: WHOOP_CLIENT_ID,
      redirect_uri: redirectUri,
      scope: 'read:recovery read:workout read:sleep read:profile', // Adjust scopes as needed
      state: user.id, // Pass user ID as state for verification
    })

    // WHOOP OAuth authorization endpoint
    // Update this URL based on WHOOP's actual API endpoint
    const authUrl = `https://api.prod.whoop.com/oauth/oauth2/auth?${params.toString()}`

    // Redirect to WHOOP authorization page
    return NextResponse.redirect(authUrl)
  } catch (error: any) {
    console.error('WHOOP auth error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to initiate WHOOP authorization' },
      { status: 500 }
    )
  }
}
