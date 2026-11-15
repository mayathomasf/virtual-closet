import { createClient } from '@/lib/supabase/server'

// TEMPORARY page for Step 2: checks that the app can reach your Supabase
// project and that the schema ran. Open http://localhost:3000/setup-check
// Delete the app/setup-check folder once everything is green.

type Check = { label: string; ok: boolean; detail: string }
type Supabase = Awaited<ReturnType<typeof createClient>>

async function checkTable(supabase: Supabase, table: string): Promise<Check> {
  const label = `The "${table}" table exists and is private`
  // Nobody is logged in on this page, so the database SHOULD refuse.
  const { error } = await supabase.from(table).select('id').limit(1)

  if (error?.code === '42501') {
    return { label, ok: true, detail: 'Found it, and logged-out visitors are blocked.' }
  }
  if (error?.code === 'PGRST205' || error?.code === '42P01') {
    return { label, ok: false, detail: 'Table not found. Run supabase/schema.sql in the Supabase SQL Editor.' }
  }
  if (error) {
    return { label, ok: false, detail: `Supabase said: "${error.message}". Check the URL and key in web/.env.local.` }
  }
  return { label, ok: false, detail: 'Logged-out visitors can read this table. Run supabase/schema.sql again.' }
}

export default async function SetupCheckPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  const checks: Check[] = []

  checks.push({
    label: 'web/.env.local is loaded',
    ok: Boolean(url && key),
    detail: url && key
      ? `Project URL: ${url}`
      : 'A variable is missing. Check web/.env.local, then stop and restart npm run dev.',
  })

  if (key?.startsWith('sb_secret_')) {
    checks.push({
      label: 'Using the publishable key',
      ok: false,
      detail: 'That is your SECRET key. Swap in the publishable key (sb_publishable_...).',
    })
  }

  if (url && key) {
    const supabase = await createClient()
    checks.push(await checkTable(supabase, 'items'))
    checks.push(await checkTable(supabase, 'plans'))
  }

  const allGood = checks.every((c) => c.ok)

  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="text-2xl font-semibold">Setup check</h1>
      <ul className="mt-6 space-y-4">
        {checks.map((c) => (
          <li key={c.label} className="flex gap-3">
            <span aria-hidden="true">{c.ok ? '✅' : '❌'}</span>
            <div>
              <p className="font-medium">{c.label}</p>
              <p className="text-sm opacity-70">{c.detail}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-8 font-medium">
        {allGood ? 'All set. On to Step 3!' : 'Fix the ❌ items, then refresh this page.'}
      </p>
    </main>
  )
}