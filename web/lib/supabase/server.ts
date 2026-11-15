import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Supabase client for code that runs on the server: pages, and the API routes
// in app/api/. It reads the logged-in user's session from their cookies, so
// every query runs as that user and Row Level Security applies.
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a page (Server Component), which can't set cookies.
            // Safe to ignore: proxy.ts refreshes sessions instead.
          }
        },
      },
    }
  )
}