import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { addImageUrls, BUCKET } from '@/lib/storage'
import { CATEGORIES, isCategory } from '@/lib/types'

const MAX_BYTES = 5 * 1024 * 1024 // matches the bucket's limit in schema.sql
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}
const ITEM_COLUMNS = 'id, category, name, image_path, created_at'

// GET /api/items              -> all of the user's items, newest first
// GET /api/items?category=tops -> just one category
// Each item comes with a `url` for its photo.
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getClaims()
  if (!auth?.claims) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  const category = request.nextUrl.searchParams.get('category')
  if (category !== null && !isCategory(category)) {
    return NextResponse.json(
      { error: `Unknown category. Use one of: ${CATEGORIES.join(', ')}` },
      { status: 400 }
    )
  }

  let query = supabase
    .from('items')
    .select(ITEM_COLUMNS)
    .eq('user_id', auth.claims.sub)
    .order('created_at', { ascending: false })
  if (category) query = query.eq('category', category)

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const items = await addImageUrls(supabase, data ?? [])
  return NextResponse.json({ items })
}

// POST /api/items  (form data: image, category, optional name)
// Saves the photo to the "closet" bucket, then adds a row to the items table.
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getClaims()
  if (!auth?.claims) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }
  const userId = auth.claims.sub

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Send the item as form data' }, { status: 400 })
  }

  const image = form.get('image')
  const category = String(form.get('category') ?? '')
  const name = String(form.get('name') ?? '').trim() || null

  if (image === null || typeof image === 'string') {
    return NextResponse.json({ error: 'Missing the photo' }, { status: 400 })
  }
  const extension = EXTENSIONS[image.type]
  if (!extension) {
    return NextResponse.json({ error: 'The photo must be a JPG, PNG or WebP' }, { status: 400 })
  }
  if (image.size > MAX_BYTES) {
    return NextResponse.json({ error: 'The photo is over 5 MB' }, { status: 413 })
  }
  if (!isCategory(category)) {
    return NextResponse.json({ error: 'Pick a category' }, { status: 400 })
  }
  if (name && name.length > 100) {
    return NextResponse.json({ error: 'Keep the name under 100 characters' }, { status: 400 })
  }

  // The photo goes in a folder named after the user: closet/<user id>/<item id>.jpg
  // (The storage rules in schema.sql only allow uploads into your own folder.)
  const id = crypto.randomUUID()
  const imagePath = `${userId}/${id}.${extension}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(imagePath, image, { contentType: image.type })
  if (uploadError) {
    return NextResponse.json({ error: `Photo upload failed: ${uploadError.message}` }, { status: 500 })
  }

  const { data: item, error } = await supabase
    .from('items')
    .insert({ id, category, name, image_path: imagePath })
    .select(ITEM_COLUMNS)
    .single()

  if (error) {
    // Don't leave an orphaned photo behind if the row couldn't be saved
    await supabase.storage.from(BUCKET).remove([imagePath])
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ item }, { status: 201 })
}