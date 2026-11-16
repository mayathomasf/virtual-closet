import AppHeader from '@/components/AppHeader'
import ClosetGrid from '@/components/ClosetGrid'
import { requireUser } from '@/lib/auth'
import { isCategory } from '@/lib/types'

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

// Closet page (Screen 4). /closet?category=tops opens on the Tops tab.
export default async function ClosetPage({ searchParams }: Props) {
  const user = await requireUser()
  const { category } = await searchParams
  const initialCategory = typeof category === 'string' && isCategory(category) ? category : 'all'

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-8 text-stone-900">
      <AppHeader email={user.email} />
      <ClosetGrid initialCategory={initialCategory} />
    </main>
  )
}