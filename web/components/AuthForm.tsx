'use client'

// The login / sign-up card from Screen 1 of the proposal.
// One component handles both pages; `mode` picks the wording and the action.

import Link from 'next/link'
import { useActionState } from 'react'
import { logIn, signUp, type AuthState } from '@/app/login/actions'

const inputClass =
  'mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none focus:border-stone-900'

export default function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const isLogin = mode === 'login'
  // state = what the action returned last time; pending = true while it runs
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    isLogin ? logIn : signUp,
    {}
  )

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-100 px-4 text-stone-900">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-center text-2xl font-semibold">Virtual Closet</h1>
        <p className="mt-1 text-center text-stone-500">
          {isLogin ? 'Log in' : 'Create an account'}
        </p>

        <form action={formAction} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium">Email</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              defaultValue={state.email}
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Password</span>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              className={inputClass}
            />
          </label>

          {state.error && (
            <p role="alert" className="text-sm text-red-700">{state.error}</p>
          )}
          {state.message && (
            <p className="text-sm text-green-800">{state.message}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-stone-900 py-2 font-medium text-white disabled:opacity-50"
          >
            {pending ? 'One moment…' : isLogin ? 'Log in' : 'Sign up'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-stone-500">
          {isLogin ? 'New here? ' : 'Already have an account? '}
          <Link
            href={isLogin ? '/signup' : '/login'}
            className="font-medium text-stone-900 underline"
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </Link>
        </p>
      </div>
    </main>
  )
}