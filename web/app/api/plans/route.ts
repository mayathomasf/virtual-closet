import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const DATE = /^\d{4}-\d{2}-\d{2}$/

// GET /api/plans?from=2026-11-16&to=2026-11-22
// Returns the logged-in user's outfit plans between two dates (inclusive).
// (Step 9 adds item thumbnails to each plan; Step 8 adds POST for saving.)
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getClaims()
  if (!auth?.claims) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  const from = request.nextUrl.searchParams.get('from') ?? ''
  const to = request.nextUrl.searchParams.get('to') ?? ''
  if (!DATE.test(from) || !DATE.test(to) || from > to) {
    return NextResponse.json(
      { error: 'Use ?from=YYYY-MM-DD&to=YYYY-MM-DD' },
      { status: 400 }
    )
  }

  // Row Level Security already limits this to the user's own plans. The
  // user_id filter is extra: it lets Postgres use the (user_id, date) index.
  const { data, error } = await supabase
    .from('plans')
    .select('id, date, label, item_ids, layout, created_at')
    .eq('user_id', auth.claims.sub)
    .gte('date', from)
    .lte('date', to)
    .order('date')
    .order('created_at')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ plans: data })
}