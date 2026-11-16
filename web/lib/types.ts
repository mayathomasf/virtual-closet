// Shapes of the rows in your Supabase tables, shared by pages and API routes.

export type Category =
  | 'tops'
  | 'bottoms'
  | 'dresses'
  | 'outerwear'
  | 'shoes'
  | 'accessories'
  | 'other'

export type Item = {
  id: string
  category: Category
  name: string | null
  image_path: string
  created_at: string
}

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