import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      // Missing env vars - just pass through
      return supabaseResponse
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    })

    // Get user - fail silently if there's an error
    let user = null
    try {
      const { data, error } = await supabase.auth.getUser()
      if (!error && data?.user) {
        user = data.user
      }
    } catch {
      // Silently fail - let client handle auth
    }

    // Protect home page (main app)
    if (!user && request.nextUrl.pathname === '/') {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Redirect authenticated users from home to Dashboard Home
    if (user && request.nextUrl.pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard/home', request.url))
    }

    // Redirect authenticated users from login to Dashboard Home
    if (user && request.nextUrl.pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard/home', request.url))
    }

    // Protect dashboard routes (if still used)
    if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    return supabaseResponse
  } catch (error) {
    // On any error, just pass through
    console.error('Middleware error:', error)
    return supabaseResponse
  }
}
