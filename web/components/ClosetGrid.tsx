'use client'

// The Closet from Screen 4: category tabs and a grid of your clothes.
// Loads items from GET /api/items.

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { CATEGORIES, categoryLabel, type Category, type ItemWithUrl } from '@/lib/types'

export type Tab = Category | 'all'
const TABS: Tab[] = ['all', ...CATEGORIES]

export default function ClosetGrid({ initialCategory }: { initialCategory: Tab }) {
  const [category, setCategory] = useState<Tab>(initialCategory)
  const [items, setItems] = useState<ItemWithUrl[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  // Load the items whenever the tab changes.
  useEffect(() => {
    let ignore = false // stops a slow, older request from overwriting a newer one
    const query = category === 'all' ? '' : `?category=${category}`

    fetch(`/api/items${query}`)
      .then(async (res) => {
        if (res.status === 401) {
          window.location.href = '/login'
          return
        }
        if (!res.ok) throw new Error(`GET /api/items failed: ${res.status}`)
        const body: { items: ItemWithUrl[] } = await res.json()
        if (!ignore) {
          setItems(body.items)
          setStatus('ready')
        }
      })
      .catch(() => {
        if (!ignore) setStatus('error')
      })

    return () => {
      ignore = true
    }
  }, [category])

  function chooseTab(tab: Tab) {
    if (tab === category) return
    setCategory(tab)
    setStatus('loading')
    // Keep the address bar in sync, so refreshing the page stays on this tab
    window.history.replaceState(null, '', tab === 'all' ? '/closet' : `/closet?category=${tab}`)
  }

  return (
    <section className="mx-auto mt-8 max-w-5xl">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">My closet</h2>
        <Link
          href="/closet/add"
          className="rounded-lg bg-stone-900 px-3 py-1.5 text-sm font-medium text-white"
        >
          + Add item
        </Link>
      </div>

      <div role="tablist" aria-label="Categories" className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={tab === category}
            onClick={() => chooseTab(tab)}
            className={`shrink-0 rounded-full px-3 py-1 text-sm ${
              tab === category
                ? 'bg-stone-900 text-white'
                : 'border border-stone-300 bg-white hover:bg-stone-50'
            }`}
          >
            {tab === 'all' ? 'All' : categoryLabel(tab)}
          </button>
        ))}
      </div>

      {status === 'error' && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          Couldn&apos;t load your closet. Try refreshing the page.
        </p>
      )}

      {status === 'ready' && items.length === 0 && (
        <p className="mt-10 text-center text-sm text-stone-500">
          Nothing here yet.{' '}
          <Link href="/closet/add" className="font-medium text-stone-900 underline">
            Add an item
          </Link>
        </p>
      )}

      <ul
        className={`mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 ${
          status === 'loading' ? 'opacity-60' : ''
        }`}
      >
        {items.map((item) => {
          const label = item.name ?? categoryLabel(item.category)
          return (
            <li key={item.id} className="overflow-hidden rounded-xl border border-stone-200 bg-white">
              <div className="aspect-square bg-stone-50">
                {item.url && (
                  // A plain <img> is fine here: the photos are already small
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt={label} loading="lazy" className="h-full w-full object-contain" />
                )}
              </div>
              <p className="truncate px-2 py-1.5 text-xs text-stone-600">{label}</p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}