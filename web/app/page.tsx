import AppHeader from '@/components/AppHeader'
import WeekCalendar from '@/components/WeekCalendar'
import { requireUser } from '@/lib/auth'

// Home page (Screen 2): the week calendar.
export default async function HomePage() {
  const user = await requireUser()

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-8 text-stone-900">
      <AppHeader email={user.email} />
      <WeekCalendar />
    </main>
  )
}