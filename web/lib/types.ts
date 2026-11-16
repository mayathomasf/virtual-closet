// Shapes of the rows in your Supabase tables, shared by pages and API routes.

// Same list as the check in supabase/schema.sql
export const CATEGORIES = [
  'tops',
  'bottoms',
  'dresses',
  'outerwear',
  'shoes',
  'accessories',
  'other',
] as const

export type Category = (typeof CATEGORIES)[number]

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value)
}

// 'tops' -> 'Tops'
export function categoryLabel(category: Category): string {
  return category.charAt(0).toUpperCase() + category.slice(1)
}

export type Item = {
  id: string
  category: Category
  name: string | null
  image_path: string
  created_at: string
}

// An item plus a temporary link to its photo (the bucket is private).
export type ItemWithUrl = Item & { url: string | null }

// Where one item sits in an outfit collage. Fractions of the canvas (0 to 1).
export type LayoutSpot = { x: number; y: number; w: number; z: number }

export type Plan = {
  id: string
  date: string // 'YYYY-MM-DD'
  label: string | null
  item_ids: string[]
  layout: Record<string, LayoutSpot> // keyed by item id
  created_at: string
}