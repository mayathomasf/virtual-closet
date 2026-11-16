// Runs in the browser. Shrinks a photo so its longest side is at most
// `maxSize` pixels, then re-saves it. Phone photos are often 4000px+ and
// several MB; Vercel only accepts uploads up to 4.5 MB, and the "closet"
// bucket allows 5 MB. 1200px is plenty for a closet thumbnail or collage.
export async function shrinkImage(
  file: Blob,
  maxSize = 1200,
  type: 'image/jpeg' | 'image/png' = 'image/jpeg',
  quality = 0.85
): Promise<Blob> {
  // Throws if the browser can't read the format (e.g. iPhone HEIC on Windows)
  const bitmap = await createImageBitmap(file)

  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('This browser cannot process images')

  if (type === 'image/jpeg') {
    // JPEG has no transparency, so fill with white instead of black
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
  }
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not save the image'))),
      type,
      quality
    )
  })
}