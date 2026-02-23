import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface KeywordEntry {
  keyword: string;
  isSeed: boolean;
  columnGroup: string;
}

interface SheetData {
  vertical: string;
  keywords: KeywordEntry[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { sheets, clearExisting, batchId } = await req.json() as { sheets: SheetData[]; clearExisting?: boolean; batchId?: string };
    const importBatchId = batchId || crypto.randomUUID();

    if (!sheets || !Array.isArray(sheets) || sheets.length === 0) {
      throw new Error('No sheet data provided');
    }

    const results: Record<string, { imported: number; skipped: number; seeds: number }> = {};

    for (const sheet of sheets) {
      const { vertical, keywords } = sheet;
      
      if (!vertical || !keywords || keywords.length === 0) continue;

      // Clear existing keywords for this vertical if requested
      if (clearExisting) {
        await supabase
          .from('keyword_targets')
          .delete()
          .eq('vertical', vertical)
          .is('used_in_queue_id', null);
      }

      let imported = 0;
      let skipped = 0;
      let seeds = 0;

      // Batch upsert in chunks of 200
      const CHUNK_SIZE = 200;
      for (let i = 0; i < keywords.length; i += CHUNK_SIZE) {
        const chunk = keywords.slice(i, i + CHUNK_SIZE);
        const rows = chunk.map((kw, idx) => ({
          vertical,
          keyword: kw.keyword.trim().toLowerCase(),
          is_seed: kw.isSeed,
          column_group: kw.columnGroup,
          priority: kw.isSeed ? 100 : Math.max(1, 50 - Math.floor(idx / 10)),
          batch_id: importBatchId,
          imported_at: new Date().toISOString(),
        }));

        const { data, error } = await supabase
          .from('keyword_targets')
          .upsert(rows, { onConflict: 'vertical,keyword', ignoreDuplicates: true })
          .select('id');

        if (error) {
          console.error(`Error upserting chunk for ${vertical}:`, error.message);
          skipped += chunk.length;
        } else {
          imported += data?.length || 0;
          skipped += chunk.length - (data?.length || 0);
          seeds += chunk.filter(kw => kw.isSeed).length;
        }
      }

      results[vertical] = { imported, skipped, seeds };
    }

    const totalImported = Object.values(results).reduce((sum, r) => sum + r.imported, 0);
    const totalSeeds = Object.values(results).reduce((sum, r) => sum + r.seeds, 0);

    return new Response(JSON.stringify({
      success: true,
      totalImported,
      totalSeeds,
      verticals: results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in import-keywords:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
