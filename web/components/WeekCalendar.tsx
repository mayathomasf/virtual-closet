'use client'

// The "Upcoming week" calendar from Screen 2 of the proposal.
// Runs in the browser so it can use the user's own date and timezone,
// and loads plans from GET /api/plans.

import { useEffect, useState, useSyncExternalStore } from 'react'
import { addDays, defaultWeekStart, toISODate } from '@/lib/dates'
import type { Plan } from '@/lib/types'

// true in the browser, false while the server pre-renders the page.
// The server doesn't know the user's timezone, so the calendar only draws
// dates once it's in the browser (otherwise the two could disagree).
const noSubscribe = () => () => {}
function useIsBrowser() {
  return useSyncExternalStore(noSubscribe, () => true, () => false)
}

const dayName = new Intl.DateTimeFormat(undefined, { weekday: 'short' })
const monthDay = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })

const navButton =
  'rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm hover:bg-stone-50'

export default function WeekCalendar() {
  const isBrowser = useIsBrowser()
  const [weekOffset, setWeekOffset] = useState(0) // 0 = default week, 1 = the one after…
  const [plans, setPlans] = useState<Plan[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  const weekStart = isBrowser ? addDays(defaultWeekStart(), weekOffset * 7) : null
  const from = weekStart ? toISODate(weekStart) : null
  const to = weekStart ? toISODate(addDays(weekStart, 6)) : null

  // Load this week's plans whenever the week changes.
  useEffect(() => {
    if (!from || !to) return
    let ignore = false // stops a slow, older request from overwriting a newer one

    fetch(`/api/plans?from=${from}&to=${to}`)
      .then(async (res) => {
        if (res.status === 401) {
          window.location.href = '/login'
          return
        }
        if (!res.ok) throw new Error(`GET /api/plans failed: ${res.status}`)
        const body: { plans: Plan[] } = await res.json()
        if (!ignore) {
          setPlans(body.plans)
          setStatus('ready')
        }
      })
      .catch(() => {
        if (!ignore) setStatus('error')
      })

    return () => {
      ignore = true
    }
  }, [from, to])

  function goToWeek(offset: number) {
    setWeekOffset(offset)
    setStatus('loading')
  }

  if (!weekStart) {
    // Placeholder while the page loads in the browser
    return <div className="mx-auto mt-8 h-64 max-w-5xl animate-pulse rounded-2xl bg-stone-200" />
  }

  const todayISO = toISODate(new Date())
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <section className="mx-auto mt-8 max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">
          {weekOffset === 0 ? 'Upcoming week' : 'Week of'}{' '}
          <span className="font-normal text-stone-500">
            {monthDay.format(days[0])} – {monthDay.format(days[6])}
          </span>
        </h2>
        <div className="flex gap-2">
          <button type="button" onClick={() => goToWeek(weekOffset - 1)} aria-label="Previous week" className={navButton}>
            ←
          </button>
          {weekOffset !== 0 && (
            <button type="button" onClick={() => goToWeek(0)} className={navButton}>
              Back to upcoming
            </button>
          )}
          <button type="button" onClick={() => goToWeek(weekOffset + 1)} aria-label="Next week" className={navButton}>
            →
          </button>
        </div>
      </div>

      {status === 'error' && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          Couldn&apos;t load your plans. Try refreshing the page.
        </p>
      )}

      <ol className={`mt-4 grid gap-3 md:grid-cols-7 ${status === 'loading' ? 'opacity-60' : ''}`}>
        {days.map((day) => {
          const iso = toISODate(day)
          const dayPlans = plans.filter((plan) => plan.date === iso)
          const isToday = iso === todayISO
          const isPast = iso < todayISO

          return (
            <li
              key={iso}
              className={`rounded-xl border bg-white p-3 md:min-h-56 ${
                isToday ? 'border-stone-900' : 'border-stone-200'
              } ${isPast ? 'opacity-50' : ''}`}
            >
              <div className="flex items-baseline justify-between md:block">
                <p className="font-medium">{dayName.format(day)}</p>
                <p className="text-xs text-stone-500">
                  {monthDay.format(day)}
                  {isToday && ' · Today'}
                </p>
              </div>

              {dayPlans.length === 0 ? (
                <p className="mt-3 text-xs text-stone-400">No outfits yet</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {dayPlans.map((plan) => (
                    <li key={plan.id} className="rounded-lg bg-stone-100 px-2 py-1.5 text-xs">
                      <p className="font-medium">{plan.label ?? 'Outfit'}</p>
                      <p className="text-stone-500">
                        {plan.item_ids.length} {plan.item_ids.length === 1 ? 'item' : 'items'}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}