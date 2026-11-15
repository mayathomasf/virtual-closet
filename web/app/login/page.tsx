import { redirect } from 'next/navigation'
import AuthForm from '@/components/AuthForm'
import { createClient } from '@/lib/supabase/server'

export default async function LoginPage() {
  // Already logged in? Skip straight to the home page.
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (data?.claims) redirect('/')

  return <AuthForm mode="login" />
}