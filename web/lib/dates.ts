// Date helpers for the calendar. Dates are 'YYYY-MM-DD' strings in the
// user's OWN timezone. (Don't use date.toISOString() for this: it converts to
// UTC, so on a Sunday evening in New York it would already say Monday.)

export function toISODate(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function addDays(d: Date, days: number): Date {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + days)
  return copy
}

// Midnight on the Monday of the week that contains d.
export function mondayOf(d: Date): Date {
  const midnight = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const daysSinceMonday = (midnight.getDay() + 6) % 7 // getDay(): Sun=0, Mon=1 … Sat=6
  return addDays(midnight, -daysSinceMonday)
}

// The week the home page opens on: this week (Mon–Sun), except on Sundays,
// when you're planning ahead, it opens on next week.
export function defaultWeekStart(today: Date = new Date()): Date {
  const monday = mondayOf(today)
  return today.getDay() === 0 ? addDays(monday, 7) : monday
}