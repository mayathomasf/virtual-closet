import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// For pages: returns the logged-in user, or sends them to /login.
// (proxy.ts already redirects logged-out visitors; this is a second lock.)
export async function requireUser() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (!data?.claims) redirect('/login')
  return data.claims
}