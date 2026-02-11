import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Image } from 'https://deno.land/x/imagescript@1.3.0/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const BUCKET = 'blog-images'
const MAX_WIDTH = 1200
const JPEG_QUALITY = 80
const SIZE_THRESHOLD = 500 * 1024
const BATCH_SIZE = 5

function getSupabase() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
}

async function verifyAdmin(req: Request): Promise<boolean> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return false
  const anonClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )
  const token = authHeader.replace('Bearer ', '')
  const { data: claims, error } = await anonClient.auth.getClaims(token)
  if (error || !claims?.claims?.sub) return false
  const supabase = getSupabase()
  const { data: isAdmin } = await supabase.rpc('is_admin', { check_user_id: claims.claims.sub as string })
  return !!isAdmin
}

function selfInvoke(body: object) {
  const url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/optimize-storage-images`
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      'apikey': Deno.env.get('SUPABASE_ANON_KEY')!,
    },
    body: JSON.stringify(body),
  }).catch(err => console.error('[SELF-INVOKE] Error:', err))
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { mode, jobId } = await req.json()

    // Self-chained calls use service role key directly, so skip admin check for those
    const isSelfChain = req.headers.get('Authorization')?.includes(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    if (!isSelfChain) {
      const isAdmin = await verifyAdmin(req)
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: 'Admin only' }), { status: 403, headers: corsHeaders })
      }
    }

    const supabase = getSupabase()

    switch (mode) {
      case 'scan': return await handleScan(supabase)
      case 'optimize': return await handleOptimize(supabase, jobId)
      case 'cleanup': return await handleCleanup(supabase, jobId)
      case 'cancel': return await handleCancel(supabase, jobId)
      case 'status': return await handleStatus(supabase, jobId)
      default:
        return new Response(JSON.stringify({ error: 'Invalid mode' }), { status: 400, headers: corsHeaders })
    }
  } catch (err) {
    console.error('[OPTIMIZE] Error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders })
  }
})

// ── File listing helpers ──

async function listAllFiles(supabase: any): Promise<any[]> {
  const allFiles: any[] = []
  let offset = 0
  const limit = 1000

  while (true) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list('', { limit, offset, sortBy: { column: 'name', order: 'asc' } })
    if (error) throw error
    if (!data || data.length === 0) break

    for (const item of data) {
      if (item.metadata) {
        allFiles.push({ name: item.name, size: item.metadata.size || 0, path: item.name })
      } else {
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
        files.push({ name: item.name, size: item.metadata.size || 0, path: `${folder}/${item.name}` })
      }
    }
    if (data.length < limit) break
    offset += limit
  }
  return files
}

// ── Job helpers ──

async function getJob(supabase: any, jobId: string) {
  const { data, error } = await supabase
    .from('image_optimization_jobs')
    .select('*')
    .eq('id', jobId)
    .single()
  if (error) throw error
  return data
}

async function updateJob(supabase: any, jobId: string, updates: Record<string, any>) {
  const { error } = await supabase
    .from('image_optimization_jobs')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', jobId)
  if (error) throw error
}

function jsonRes(data: any) {
  return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

// ── Mode handlers ──

async function handleScan(supabase: any) {
  // Create job
  const { data: job, error: insertErr } = await supabase
    .from('image_optimization_jobs')
    .insert({ status: 'scanning' })
    .select('id')
    .single()
  if (insertErr) throw insertErr

  const jobId = job.id
  console.log(`[SCAN] Job ${jobId}: scanning...`)

  const allFiles = await listAllFiles(supabase)
  const totalSize = allFiles.reduce((s: number, f: any) => s + f.size, 0)
  const oversized = allFiles.filter((f: any) => f.size > SIZE_THRESHOLD && !f.name.endsWith('-opt.jpg'))
  const oversizedSize = oversized.reduce((s: number, f: any) => s + f.size, 0)

  await updateJob(supabase, jobId, {
    status: 'scanned',
    total_files: allFiles.length,
    total_size_bytes: totalSize,
    oversized_files: oversized.length,
    oversized_size_bytes: oversizedSize,
  })

  console.log(`[SCAN] Job ${jobId}: ${allFiles.length} files, ${oversized.length} oversized`)
  return jsonRes({ jobId })
}

async function handleOptimize(supabase: any, jobId: string) {
  const job = await getJob(supabase, jobId)
  if (job.status === 'cancelled') {
    console.log(`[OPTIMIZE] Job ${jobId}: cancelled, stopping`)
    return jsonRes({ stopped: true })
  }

  // Mark as optimizing on first call
  if (job.status === 'scanned') {
    await updateJob(supabase, jobId, { status: 'optimizing' })
  }

  const allFiles = await listAllFiles(supabase)
  const oversized = allFiles.filter((f: any) => f.size > SIZE_THRESHOLD && !f.name.endsWith('-opt.jpg'))
  const batch = oversized.slice(job.current_offset, job.current_offset + BATCH_SIZE)

  let batchProcessed = 0
  let batchSaved = 0
  const errors: string[] = []

  for (const file of batch) {
    try {
      const { data: fileData, error: dlErr } = await supabase.storage.from(BUCKET).download(file.path)
      if (dlErr) throw dlErr

      const arrayBuffer = await fileData.arrayBuffer()
      const originalSize = arrayBuffer.byteLength
      const buffer = new Uint8Array(arrayBuffer)

      let img: any
      try { img = await Image.decode(buffer) } catch {
        console.log(`[OPTIMIZE] Skipping ${file.path} - cannot decode`)
        continue
      }

      if (img.width > MAX_WIDTH) {
        const ratio = MAX_WIDTH / img.width
        img = img.resize(MAX_WIDTH, Math.round(img.height * ratio))
      }

      const compressed = await img.encodeJPEG(JPEG_QUALITY)
      const newSize = compressed.byteLength
      if (newSize >= originalSize) { continue }

      const pathParts = file.path.split('.')
      pathParts.pop()
      const optPath = pathParts.join('.') + '-opt.jpg'

      const { error: upErr } = await supabase.storage.from(BUCKET).upload(optPath, compressed, { contentType: 'image/jpeg', upsert: true })
      if (upErr) throw upErr

      // Update DB references
      const { data: oldUrlData } = supabase.storage.from(BUCKET).getPublicUrl(file.path)
      const { data: newUrlData } = supabase.storage.from(BUCKET).getPublicUrl(optPath)
      const oldUrl = oldUrlData.publicUrl
      const newUrl = newUrlData.publicUrl

      for (const col of ['featured_image_url', 'middle_image_1_url', 'middle_image_2_url']) {
        await supabase.from('blog_posts').update({ [col]: newUrl }).eq(col, oldUrl)
      }
      for (const col of ['image_url', 'thumbnail_url', 'large_url']) {
        await supabase.from('category_images').update({ [col]: newUrl }).eq(col, oldUrl)
      }

      batchSaved += (originalSize - newSize)
      batchProcessed++
      console.log(`[OPTIMIZE] ${file.path}: ${(originalSize / 1024).toFixed(0)}KB -> ${(newSize / 1024).toFixed(0)}KB`)
    } catch (err) {
      console.error(`[OPTIMIZE] Error: ${file.path}:`, err)
      errors.push(`${file.path}: ${err.message}`)
    }
  }

  const newOffset = job.current_offset + BATCH_SIZE
  const hasMore = newOffset < oversized.length
  const jobErrors = [...(job.errors || []), ...errors]

  if (hasMore) {
    await updateJob(supabase, jobId, {
      processed: job.processed + batchProcessed,
      saved_bytes: job.saved_bytes + batchSaved,
      current_offset: newOffset,
      errors: jobErrors,
    })
    // Self-chain
    selfInvoke({ mode: 'optimize', jobId })
  } else {
    await updateJob(supabase, jobId, {
      status: 'optimized',
      processed: job.processed + batchProcessed,
      saved_bytes: job.saved_bytes + batchSaved,
      current_offset: newOffset,
      errors: jobErrors,
      completed_at: new Date().toISOString(),
    })
    console.log(`[OPTIMIZE] Job ${jobId}: complete`)
  }

  return jsonRes({ ok: true })
}

async function handleCleanup(supabase: any, jobId: string) {
  const job = await getJob(supabase, jobId)
  if (job.status === 'cancelled') return jsonRes({ stopped: true })

  if (job.status === 'optimized') {
    await updateJob(supabase, jobId, { status: 'cleaning', current_offset: 0 })
  }

  const allFiles = await listAllFiles(supabase)
  const optimizedPrefixes = new Set(
    allFiles.filter((f: any) => f.name.endsWith('-opt.jpg')).map((f: any) => f.path.replace('-opt.jpg', ''))
  )

  const toDelete: any[] = []
  for (const file of allFiles) {
    if (file.name.endsWith('-opt.jpg')) continue
    const pathWithoutExt = file.path.split('.').slice(0, -1).join('.')
    if (optimizedPrefixes.has(pathWithoutExt) && file.size > SIZE_THRESHOLD) {
      toDelete.push(file)
    }
  }

  // Process a batch of 20 deletions
  const offset = job.status === 'cleaning' ? (job.current_offset || 0) : 0
  const batch = toDelete.slice(offset, offset + 20)

  let batchDeleted = 0
  let batchFreed = 0

  if (batch.length > 0) {
    const paths = batch.map((f: any) => f.path)
    const { error } = await supabase.storage.from(BUCKET).remove(paths)
    if (!error) {
      batchDeleted = batch.length
      batchFreed = batch.reduce((s: number, f: any) => s + f.size, 0)
    }
  }

  const newOffset = offset + 20
  const hasMore = newOffset < toDelete.length

  if (hasMore) {
    await updateJob(supabase, jobId, {
      deleted: (job.deleted || 0) + batchDeleted,
      freed_bytes: (job.freed_bytes || 0) + batchFreed,
      current_offset: newOffset,
    })
    selfInvoke({ mode: 'cleanup', jobId })
  } else {
    await updateJob(supabase, jobId, {
      status: 'completed',
      deleted: (job.deleted || 0) + batchDeleted,
      freed_bytes: (job.freed_bytes || 0) + batchFreed,
      completed_at: new Date().toISOString(),
    })
    console.log(`[CLEANUP] Job ${jobId}: complete, deleted ${(job.deleted || 0) + batchDeleted} files`)
  }

  return jsonRes({ ok: true })
}

async function handleCancel(supabase: any, jobId: string) {
  await updateJob(supabase, jobId, { status: 'cancelled', completed_at: new Date().toISOString() })
  console.log(`[CANCEL] Job ${jobId}: cancelled`)
  return jsonRes({ ok: true })
}

async function handleStatus(supabase: any, jobId: string) {
  const job = await getJob(supabase, jobId)
  return jsonRes(job)
}
