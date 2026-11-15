import { redirect } from 'next/navigation'
import { logOut } from '@/app/login/actions'
import { createClient } from '@/lib/supabase/server'

// Home page. For now it just proves you're logged in;
// Step 4 replaces the middle with the week calendar (Screen 2).
export default async function HomePage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (!data?.claims) redirect('/login')

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-8 text-stone-900">
      <header className="mx-auto flex max-w-4xl items-center justify-between">
        <h1 className="text-2xl font-semibold">Virtual Closet</h1>
        <form action={logOut}>
          <button
            type="submit"
            className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm"
          >
            Log out
          </button>
        </form>
      </header>

      <p className="mx-auto mt-8 max-w-4xl text-stone-600">
        Logged in as {data.claims.email}. Your week calendar goes here in Step 4.
      </p>
    </main>
  )
}