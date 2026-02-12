import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Image } from 'https://deno.land/x/imagescript@1.3.0/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const BUCKET = 'blog-images'
const MAX_WIDTH = 1200
const JPEG_QUALITY = 80
const SIZE_THRESHOLD = 300 * 1024 // 300KB
const BATCH_SIZE = 5
const IMAGE_TIMEOUT_MS = 20_000 // 20 seconds per image

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

// CRITICAL FIX: Await the self-chain fetch before returning the response.
// The old fire-and-forget pattern caused background fetches to be killed
// when the Edge Function runtime terminated after returning the response.
async function selfChainWithRetry(body: object): Promise<void> {
  const url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/optimize-storage-images`
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
    'apikey': Deno.env.get('SUPABASE_ANON_KEY')!,
  }

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
      console.log(`[SELF-CHAIN] Attempt ${attempt}: status ${res.status}`)
      // Read body to fully close the connection
      await res.text()
      // 504 = function IS running, just exceeded gateway timeout — treat as success
      if (res.ok || res.status === 504) return
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 2000))
      }
    } catch (err) {
      console.warn(`[SELF-CHAIN] Attempt ${attempt} failed:`, err)
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 2000))
      }
    }
  }
  console.error('[SELF-CHAIN] Both attempts failed — pg_cron recovery will pick up the job')
}

// Per-image timeout wrapper
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout after ${ms}ms: ${label}`)), ms)
    promise.then(
      (val) => { clearTimeout(timer); resolve(val) },
      (err) => { clearTimeout(timer); reject(err) },
    )
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { mode, jobId } = await req.json()

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
      case 'cancel': return await handleCancel(supabase, jobId)
      case 'status': return await handleStatus(supabase, jobId)
      default:
        return new Response(JSON.stringify({ error: 'Invalid mode' }), { status: 400, headers: corsHeaders })
    }
  } catch (err) {
    console.error('[OPTIMIZE] Top-level error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders })
  }
})

// ── File listing helpers (only used during scan) ──

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

async function getJobLite(supabase: any, jobId: string) {
  const { data, error } = await supabase
    .from('image_optimization_jobs')
    .select('id, status, total_files, total_size_bytes, oversized_files, oversized_size_bytes, processed, saved_bytes, deleted, freed_bytes, current_offset, errors, created_at, updated_at, completed_at')
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

function getOversizedFiles(allFiles: any[]): any[] {
  return allFiles.filter((f: any) => {
    if (f.name.endsWith('-opt.jpg')) return false
    if (f.size <= SIZE_THRESHOLD) return false
    return true
  })
}

// Fetch batch via RPC — only gets the slice needed
async function getBatch(supabase: any, jobId: string, offset: number): Promise<{ path: string; size: number }[]> {
  const { data, error } = await supabase.rpc('get_optimization_batch', {
    p_job_id: jobId,
    p_offset: offset,
    p_limit: BATCH_SIZE,
  })
  if (error) throw error
  return data || []
}

// Process a single image with timeout
async function processOneImage(supabase: any, file: { path: string; size: number }): Promise<{ saved: number; cleaned: number }> {
  const { data: fileData, error: dlErr } = await supabase.storage.from(BUCKET).download(file.path)
  if (dlErr) throw dlErr

  const arrayBuffer = await fileData.arrayBuffer()
  const originalSize = arrayBuffer.byteLength
  const buffer = new Uint8Array(arrayBuffer)

  let img: any
  try { img = await Image.decode(buffer) } catch {
    console.log(`[OPTIMIZE] Skipping ${file.path} - cannot decode`)
    return { saved: 0, cleaned: 0 }
  }

  if (img.width > MAX_WIDTH) {
    const ratio = MAX_WIDTH / img.width
    img = img.resize(MAX_WIDTH, Math.round(img.height * ratio))
  }

  const compressed = await img.encodeJPEG(JPEG_QUALITY)
  const newSize = compressed.byteLength
  if (newSize >= originalSize) return { saved: 0, cleaned: 0 }

  const { error: upErr } = await supabase.storage.from(BUCKET).upload(file.path, compressed, { contentType: 'image/jpeg', upsert: true })
  if (upErr) throw upErr

  console.log(`[OPTIMIZE] ${file.path}: ${(originalSize / 1024).toFixed(0)}KB -> ${(newSize / 1024).toFixed(0)}KB`)
  return { saved: originalSize - newSize, cleaned: 0 }
}

// ── Mode handlers ──

async function handleScan(supabase: any) {
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
  const oversized = getOversizedFiles(allFiles)
  const oversizedSize = oversized.reduce((s: number, f: any) => s + f.size, 0)
  const legacyOptFiles = allFiles.filter((f: any) => f.name.endsWith('-opt.jpg'))

  const fileList = oversized.map((f: any) => ({ path: f.path, size: f.size }))

  await updateJob(supabase, jobId, {
    status: 'scanned',
    total_files: allFiles.length,
    total_size_bytes: totalSize,
    oversized_files: oversized.length,
    oversized_size_bytes: oversizedSize,
    deleted: legacyOptFiles.length,
    file_list: fileList,
  })

  console.log(`[SCAN] Job ${jobId}: ${allFiles.length} files, ${oversized.length} oversized, stored ${fileList.length} paths.`)
  return jsonRes({ jobId })
}

async function handleOptimize(supabase: any, jobId: string) {
  const job = await getJobLite(supabase, jobId)

  if (job.status === 'cancelled') {
    console.log(`[OPTIMIZE] Job ${jobId}: cancelled, stopping`)
    return jsonRes({ stopped: true })
  }

  // Mark as optimizing on first call
  if (job.status === 'scanned') {
    await updateJob(supabase, jobId, { status: 'optimizing', deleted: 0 })
  }

  // Atomically claim a batch offset — no two instances can get the same range
  const { data: claimedOffset, error: claimErr } = await supabase.rpc('claim_optimization_batch', {
    p_job_id: jobId,
    p_batch_size: BATCH_SIZE,
  })
  if (claimErr) throw claimErr

  if (claimedOffset === -1) {
    // Nothing left to claim — mark complete
    await updateJob(supabase, jobId, {
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    console.log(`[OPTIMIZE] Job ${jobId}: complete (nothing to claim)`)
    return jsonRes({ ok: true })
  }

  // Fetch the batch using the claimed offset
  const batch = await getBatch(supabase, jobId, claimedOffset)

  if (batch.length === 0) {
    await updateJob(supabase, jobId, {
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    console.log(`[OPTIMIZE] Job ${jobId}: complete (empty batch)`)
    return jsonRes({ ok: true })
  }

  let batchProcessed = 0
  let batchSaved = 0
  let legacyCleaned = 0
  const errors: string[] = []

  try {
    for (const file of batch) {
      try {
        const result = await withTimeout(
          processOneImage(supabase, file),
          IMAGE_TIMEOUT_MS,
          file.path
        )
        if (result.saved > 0) {
          batchProcessed++
          batchSaved += result.saved
        }
        legacyCleaned += result.cleaned
      } catch (err) {
        console.error(`[OPTIMIZE] Image failed: ${file.path}:`, err.message || err)
        errors.push(`${file.path}: ${err.message || 'Unknown error'}`)
      }
    }

    // Atomic increment — no offset needed, claim already advanced it
    await supabase.rpc('increment_optimization_progress', {
      p_job_id: jobId,
      p_processed: batchProcessed,
      p_saved_bytes: batchSaved,
      p_deleted: legacyCleaned,
      p_errors: errors.length > 0 ? errors : [],
    })
  } catch (err) {
    console.error(`[OPTIMIZE] Batch crash at claimed offset ${claimedOffset}:`, err)
    try {
      await supabase.rpc('increment_optimization_progress', {
        p_job_id: jobId,
        p_processed: batchProcessed,
        p_saved_bytes: batchSaved,
        p_deleted: 0,
        p_errors: [`Batch crash at offset ${claimedOffset}: ${err.message}`],
      })
    } catch (updateErr) {
      console.error(`[OPTIMIZE] Failed to update job after crash:`, updateErr)
    }
  }

  // Always chain — the next invocation will claim its own batch.
  // If there's nothing left, claim returns -1 and it marks complete.
  try {
    const freshJob = await getJobLite(supabase, jobId)
    if (freshJob.status === 'cancelled') {
      console.log(`[OPTIMIZE] Job ${jobId}: cancelled during batch, stopping chain`)
    } else {
      await selfChainWithRetry({ mode: 'optimize', jobId })
    }
  } catch {
    await selfChainWithRetry({ mode: 'optimize', jobId })
  }

  return jsonRes({ ok: true })
}

async function handleCancel(supabase: any, jobId: string) {
  await updateJob(supabase, jobId, { status: 'cancelled', completed_at: new Date().toISOString() })
  console.log(`[CANCEL] Job ${jobId}: cancelled`)
  return jsonRes({ ok: true })
}

async function handleStatus(supabase: any, jobId: string) {
  const job = await getJobLite(supabase, jobId)
  return jsonRes(job)
}
