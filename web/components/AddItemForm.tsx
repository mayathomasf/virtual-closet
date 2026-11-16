'use client'

// The Add Item screen (Screen 5). Step 7 adds background removal here,
// with the Before/After toggle from the sketch.

import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'
import { shrinkImage } from '@/lib/images'
import { CATEGORIES, categoryLabel, type Category } from '@/lib/types'

const inputClass =
  'mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none focus:border-stone-900'

export default function AddItemForm() {
  const router = useRouter()
  const [photo, setPhoto] = useState<Blob | null>(null) // the shrunk photo that gets uploaded
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [category, setCategory] = useState<Category | ''>('')
  const [name, setName] = useState('')
  const [status, setStatus] = useState<'idle' | 'processing' | 'saving'>('idle')
  const [error, setError] = useState<string | null>(null)

  // Free the preview's memory when it's replaced or you leave the page.
  useEffect(() => {
    if (!previewUrl) return
    return () => URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  async function handleFile(file: File | undefined) {
    if (!file) return
    setError(null)
    setStatus('processing')
    try {
      const small = await shrinkImage(file)
      setPhoto(small)
      setPreviewUrl(URL.createObjectURL(small))
    } catch {
      setPhoto(null)
      setPreviewUrl(null)
      setError("Couldn't open that photo. Try a JPG or PNG (iPhone HEIC photos may not open on a computer).")
    } finally {
      setStatus('idle')
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!photo) return setError('Choose a photo first.')
    if (!category) return setError('Pick a category.')

    setError(null)
    setStatus('saving')

    const body = new FormData()
    body.append('image', photo, 'item.jpg')
    body.append('category', category)
    if (name.trim()) body.append('name', name.trim())

    try {
      const res = await fetch('/api/items', { method: 'POST', body })
      if (res.status === 401) {
        window.location.href = '/login'
        return
      }
      const result: { error?: string } = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(result.error ?? `Saving failed (${res.status})`)

      // Back to the closet, on the tab for what you just added
      router.push(`/closet?category=${category}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Saving failed.')
      setStatus('idle')
    }
  }

  const busy = status !== 'idle'

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto mt-8 max-w-md space-y-5 rounded-2xl bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-semibold">Add item</h2>

      <label className="block">
        <span className="text-sm font-medium">Photo</span>
        <input
          type="file"
          accept="image/*"
          disabled={busy}
          onChange={(e) => handleFile(e.target.files?.[0])}
          className="mt-1 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-stone-900 file:px-3 file:py-2 file:text-white"
        />
      </label>

      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-stone-100">
        {status === 'processing' ? (
          <p className="text-sm text-stone-500">Preparing photo…</p>
        ) : previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="Preview of the item" className="h-full w-full object-contain" />
        ) : (
          <p className="text-sm text-stone-400">Your photo will show here</p>
        )}
      </div>

      <label className="block">
        <span className="text-sm font-medium">Category</span>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Category | '')}
          required
          className={inputClass}
        >
          <option value="" disabled>
            Choose one…
          </option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {categoryLabel(c)}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-medium">
          Name <span className="font-normal text-stone-400">(optional)</span>
        </span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          placeholder="e.g. White linen shirt"
          className={inputClass}
        />
      </label>

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || !photo}
        className="w-full rounded-lg bg-stone-900 py-2 font-medium text-white disabled:opacity-50"
      >
        {status === 'saving' ? 'Saving…' : 'Save to closet'}
      </button>
    </form>
  )
}