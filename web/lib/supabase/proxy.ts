import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Pages anyone can open without logging in. Everything else sends
// logged-out visitors to /login.
const PUBLIC_PATHS = ['/login', '/signup', '/auth']

// Shows a readable message instead of a bare "Internal Server Error".
function setupError(message: string) {
  console.error(`[proxy] ${message}`)
  return new NextResponse(`Virtual Closet setup problem:\n\n${message}`, {
    status: 500,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
}

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) {
    const missing = [
      !url && 'NEXT_PUBLIC_SUPABASE_URL',
      !key && 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    ].filter(Boolean)
    return setupError(
      `Missing: ${missing.join(' and ')}.\n` +
        'On Vercel: add it in Settings → Environment Variables, then Redeploy.\n' +
        'On your computer: check web/.env.local, then restart npm run dev.'
    )
  }

  try {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
          // Stops shared caches from storing one user's refreshed login.
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value)
          )
        },
      },
    })

    // From Supabase's guide: don't put any code between createServerClient and
    // getClaims(), or users can get randomly logged out. getClaims() also
    // refreshes the login when it's about to expire.
    const { data } = await supabase.auth.getClaims()
    const user = data?.claims

    const path = request.nextUrl.pathname
    const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + '/'))
    // API routes answer "401 not logged in" themselves instead of redirecting.
    const isApi = path.startsWith('/api/')

    if (!user && !isPublic && !isApi) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      return NextResponse.redirect(loginUrl)
    }

    // Return supabaseResponse as-is: it carries the refreshed login cookies.
    return supabaseResponse
  } catch (error) {
    // e.g. "Invalid supabaseUrl" when the URL has quotes or spaces in it
    return setupError(error instanceof Error ? error.message : String(error))
  }
}