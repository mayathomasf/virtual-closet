import Link from 'next/link'
import { logOut } from '@/app/login/actions'

// The bar across the top of every logged-in page.
export default function AppHeader({ email }: { email?: string }) {
  return (
    <header className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-6">
        <Link href="/" className="text-2xl font-semibold">
          Virtual Closet
        </Link>
        <nav className="flex gap-4 text-sm">
          <Link href="/" className="hover:underline">
            Calendar
          </Link>
          <Link href="/closet" className="hover:underline">
            Closet
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {email && <span className="hidden text-sm text-stone-500 sm:inline">{email}</span>}
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
  )
}