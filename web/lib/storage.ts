import type { createClient } from '@/lib/supabase/server'

type Supabase = Awaited<ReturnType<typeof createClient>>

export const BUCKET = 'closet'
const ONE_HOUR = 60 * 60

// The "closet" bucket is private, so photos can't be linked to directly.
// This adds a `url` to each row: a signed link that works for one hour.
export async function addImageUrls<T extends { image_path: string }>(
  supabase: Supabase,
  rows: T[]
): Promise<(T & { url: string | null })[]> {
  if (rows.length === 0) return []

  const { data } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(rows.map((row) => row.image_path), ONE_HOUR)

  const urls = new Map((data ?? []).map((s) => [s.path, s.error ? null : s.signedUrl]))
  return rows.map((row) => ({ ...row, url: urls.get(row.image_path) ?? null }))
}