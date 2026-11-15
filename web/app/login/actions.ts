'use server'

// Server Actions: these run on the server when a form is submitted.
// Next.js calls them for you; you never fetch them yourself.

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// What the login/sign-up form shows after a submit.
// email is sent back so the box stays filled in after an error.
export type AuthState = { error?: string; message?: string; email?: string }

function readForm(formData: FormData) {
  return {
    email: String(formData.get('email') ?? '').trim(),
    password: String(formData.get('password') ?? ''),
  }
}

export async function logIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const { email, password } = readForm(formData)
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message, email }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const { email, password } = readForm(formData)
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) return { error: error.message, email }

  // "Confirm email" is turned on in Supabase, so there's no login yet:
  // the user has to click the link in their email first.
  if (!data.session) {
    return { message: 'Check your email for a confirmation link, then log in.', email }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function logOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()

  revalidatePath('/', 'layout')
  redirect('/login')
}