import AddItemForm from '@/components/AddItemForm'
import AppHeader from '@/components/AppHeader'
import { requireUser } from '@/lib/auth'

// Add Item page (Screen 5).
export default async function AddItemPage() {
  const user = await requireUser()

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-8 text-stone-900">
      <AppHeader email={user.email} />
      <AddItemForm />
    </main>
  )
}