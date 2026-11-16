import { redirect } from 'next/navigation'
import { logOut } from '@/app/login/actions'
import WeekCalendar from '@/components/WeekCalendar'
import { createClient } from '@/lib/supabase/server'

// Home page (Screen 2): the week calendar.
export default async function HomePage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (!data?.claims) redirect('/login')

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-8 text-stone-900">
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Virtual Closet</h1>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-stone-500 sm:inline">{data.claims.email}</span>
          <form action={logOut}>
            <button
              type="submit"
              className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm"
            >
              Log out
            </button>
          </form>
        </div>
      </header>

      <WeekCalendar />
    </main>
  )
}