import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Image } from 'https://deno.land/x/imagescript@1.3.0/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const BUCKET = 'blog-images'
const MAX_WIDTH = 1200
const JPEG_QUALITY = 80
const SIZE_THRESHOLD = 500 * 1024 // 500KB
const BATCH_SIZE = 10

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verify admin
    const authHeader = req.headers.get('Authorization')
    if (authHeader) {
      const anonClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } }
      )
      const token = authHeader.replace('Bearer ', '')
      const { data: claims, error: authErr } = await anonClient.auth.getClaims(token)
      if (authErr || !claims?.claims?.sub) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
      }
      const userId = claims.claims.sub as string
      const { data: isAdmin } = await supabase.rpc('is_admin', { check_user_id: userId })
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: 'Admin only' }), { status: 403, headers: corsHeaders })
      }
    }

    const { mode, offset = 0 } = await req.json()

    if (mode === 'scan') {
      return await handleScan(supabase)
    } else if (mode === 'optimize') {
      return await handleOptimize(supabase, offset)
    } else if (mode === 'cleanup') {
      return await handleCleanup(supabase)
    } else {
      return new Response(JSON.stringify({ error: 'Invalid mode' }), { status: 400, headers: corsHeaders })
    }
  } catch (err) {
    console.error('[OPTIMIZE] Error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders })
  }
})

async function listAllFiles(supabase: any): Promise<any[]> {
  const allFiles: any[] = []
  let offset = 0
  const limit = 1000

  // List top-level files and folders
  while (true) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list('', { limit, offset, sortBy: { column: 'name', order: 'asc' } })

    if (error) throw error
    if (!data || data.length === 0) break

    for (const item of data) {
      if (item.metadata) {
        // It's a file
        allFiles.push({ name: item.name, size: item.metadata.size || 0, path: item.name })
      } else {
        // It's a folder, list its contents
        const folderFiles = await listFolderFiles(supabase, item.name)
        allFiles.push(...folderFiles)
      }
    }

    if (data.length < limit) break
    offset += limit
  }

  return allFiles
}

async function listFolderFiles(supabase: any, folder: string): Promise<any[]> {
  const files: any[] = []
  let offset = 0
  const limit = 1000

  while (true) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(folder, { limit, offset, sortBy: { column: 'name', order: 'asc' } })

    if (error) break
    if (!data || data.length === 0) break

    for (const item of data) {
      if (item.metadata) {
        files.push({
          name: item.name,
          size: item.metadata.size || 0,
          path: `${folder}/${item.name}`,
        })
      }
    }

    if (data.length < limit) break
    offset += limit
  }

  return files
}

async function handleScan(supabase: any) {
  console.log('[SCAN] Starting storage scan...')
  const allFiles = await listAllFiles(supabase)

  const totalSize = allFiles.reduce((sum: number, f: any) => sum + f.size, 0)
  const oversized = allFiles.filter((f: any) => f.size > SIZE_THRESHOLD && !f.name.endsWith('-opt.jpg'))
  const oversizedSize = oversized.reduce((sum: number, f: any) => sum + f.size, 0)
  // Estimate ~85% savings on oversized files
  const estimatedSavings = Math.round(oversizedSize * 0.85)

  console.log(`[SCAN] Total: ${allFiles.length} files, ${(totalSize / 1024 / 1024).toFixed(1)}MB. Oversized: ${oversized.length}, est savings: ${(estimatedSavings / 1024 / 1024).toFixed(1)}MB`)

  return new Response(JSON.stringify({
    totalFiles: allFiles.length,
    totalSizeBytes: totalSize,
    oversizedFiles: oversized.length,
    oversizedSizeBytes: oversizedSize,
    estimatedSavingsBytes: estimatedSavings,
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

async function handleOptimize(supabase: any, offset: number) {
  console.log(`[OPTIMIZE] Starting batch at offset ${offset}...`)
  const allFiles = await listAllFiles(supabase)
  const oversized = allFiles.filter((f: any) => f.size > SIZE_THRESHOLD && !f.name.endsWith('-opt.jpg'))

  const batch = oversized.slice(offset, offset + BATCH_SIZE)
  let totalSaved = 0
  let processed = 0
  const errors: string[] = []

  for (const file of batch) {
    try {
      // Download original
      const { data: fileData, error: dlErr } = await supabase.storage
        .from(BUCKET)
        .download(file.path)
      if (dlErr) throw dlErr

      const arrayBuffer = await fileData.arrayBuffer()
      const originalSize = arrayBuffer.byteLength
      const buffer = new Uint8Array(arrayBuffer)

      // Decode and compress
      let img: any
      try {
        img = await Image.decode(buffer)
      } catch {
        console.log(`[OPTIMIZE] Skipping ${file.path} - cannot decode`)
        continue
      }

      if (img.width > MAX_WIDTH) {
        const ratio = MAX_WIDTH / img.width
        img = img.resize(MAX_WIDTH, Math.round(img.height * ratio))
      }

      const compressed = await img.encodeJPEG(JPEG_QUALITY)
      const newSize = compressed.byteLength

      if (newSize >= originalSize) {
        console.log(`[OPTIMIZE] Skipping ${file.path} - already optimal`)
        continue
      }

      // Generate optimized path
      const pathParts = file.path.split('.')
      pathParts.pop()
      const optPath = pathParts.join('.') + '-opt.jpg'

      // Upload compressed
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(optPath, compressed, {
          contentType: 'image/jpeg',
          upsert: true,
        })
      if (upErr) throw upErr

      // Get public URLs
      const { data: oldUrlData } = supabase.storage.from(BUCKET).getPublicUrl(file.path)
      const { data: newUrlData } = supabase.storage.from(BUCKET).getPublicUrl(optPath)
      const oldUrl = oldUrlData.publicUrl
      const newUrl = newUrlData.publicUrl

      // Update blog_posts references
      for (const col of ['featured_image_url', 'middle_image_1_url', 'middle_image_2_url']) {
        await supabase
          .from('blog_posts')
          .update({ [col]: newUrl })
          .eq(col, oldUrl)
      }

      // Update category_images references
      for (const col of ['image_url', 'thumbnail_url', 'large_url']) {
        await supabase
          .from('category_images')
          .update({ [col]: newUrl })
          .eq(col, oldUrl)
      }

      totalSaved += (originalSize - newSize)
      processed++
      console.log(`[OPTIMIZE] ${file.path}: ${(originalSize / 1024).toFixed(0)}KB -> ${(newSize / 1024).toFixed(0)}KB (saved ${((originalSize - newSize) / 1024).toFixed(0)}KB)`)
    } catch (err) {
      console.error(`[OPTIMIZE] Error processing ${file.path}:`, err)
      errors.push(`${file.path}: ${err.message}`)
    }
  }

  const hasMore = offset + BATCH_SIZE < oversized.length

  return new Response(JSON.stringify({
    processed,
    totalSavedBytes: totalSaved,
    hasMore,
    nextOffset: offset + BATCH_SIZE,
    totalOversized: oversized.length,
    errors,
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

async function handleCleanup(supabase: any) {
  console.log('[CLEANUP] Starting cleanup of original files...')
  const allFiles = await listAllFiles(supabase)

  // Find optimized files
  const optimizedFiles = allFiles.filter((f: any) => f.name.endsWith('-opt.jpg'))
  const optimizedPrefixes = new Set(optimizedFiles.map((f: any) => f.path.replace('-opt.jpg', '')))

  // Find originals that have an optimized version
  const toDelete: string[] = []
  for (const file of allFiles) {
    if (file.name.endsWith('-opt.jpg')) continue
    const pathWithoutExt = file.path.split('.').slice(0, -1).join('.')
    if (optimizedPrefixes.has(pathWithoutExt) && file.size > SIZE_THRESHOLD) {
      toDelete.push(file.path)
    }
  }

  let deleted = 0
  let freedBytes = 0
  const errors: string[] = []

  // Delete in batches
  for (let i = 0; i < toDelete.length; i += 20) {
    const batch = toDelete.slice(i, i + 20)
    const { error } = await supabase.storage.from(BUCKET).remove(batch)
    if (error) {
      errors.push(error.message)
    } else {
      const batchFiles = allFiles.filter((f: any) => batch.includes(f.path))
      freedBytes += batchFiles.reduce((sum: number, f: any) => sum + f.size, 0)
      deleted += batch.length
    }
  }

  console.log(`[CLEANUP] Deleted ${deleted} files, freed ${(freedBytes / 1024 / 1024).toFixed(1)}MB`)

  return new Response(JSON.stringify({
    deleted,
    freedBytes,
    errors,
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}
