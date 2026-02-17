import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check if auto-publish is enabled
    const { data: enabledSetting } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'auto_publish_enabled')
      .single();

    if (!enabledSetting || enabledSetting.value !== 'true') {
      console.log('[AUTO-PUBLISH] Disabled, skipping');
      return new Response(JSON.stringify({ success: true, message: 'Auto-publish disabled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get count setting
    const { data: countSetting } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'auto_publish_count')
      .single();

    const targetCount = parseInt(countSetting?.value || '5', 10);

    // Create job record
    const { data: job, error: jobError } = await supabase
      .from('daily_publish_jobs')
      .insert({ target_count: targetCount })
      .select()
      .single();

    if (jobError) throw new Error(`Failed to create publish job: ${jobError.message}`);

    // Get oldest generated articles with blog_post_id
    const { data: queueItems, error: queueError } = await supabase
      .from('content_queue')
      .select('id, blog_post_id, plan_id, article_type, primary_keyword, secondary_keywords')
      .eq('status', 'generated')
      .not('blog_post_id', 'is', null)
      .order('created_at', { ascending: true })
      .limit(targetCount);

    if (queueError) throw new Error(`Failed to fetch queue items: ${queueError.message}`);

    if (!queueItems || queueItems.length === 0) {
      await supabase
        .from('daily_publish_jobs')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', job.id);
      
      return new Response(JSON.stringify({ success: true, message: 'No articles to publish', published: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let publishedCount = 0;
    let failedCount = 0;
    const errorLog: any[] = [];
    const publishedAt = new Date().toISOString();

    // Separate pillars from clusters for backdating
    const pillarItems = queueItems.filter(i => i.article_type === 'pillar');
    const clusterItems = queueItems.filter(i => i.article_type !== 'pillar');

    // Publish clusters first with current timestamp
    for (const item of clusterItems) {
      try {
        const { error: publishError } = await supabase
          .from('blog_posts')
          .update({ status: 'published', published_at: publishedAt })
          .eq('id', item.blog_post_id!);

        if (publishError) throw publishError;

        await supabase
          .from('content_queue')
          .update({ status: 'published', published_at: publishedAt })
          .eq('id', item.id);

        // Queue embedding
        await supabase
          .from('embedding_queue')
          .upsert({
            content_type: 'blog_post',
            content_id: item.blog_post_id!,
            trigger_source: 'auto-publish',
            priority: 100,
          }, { onConflict: 'content_type,content_id' });

        publishedCount++;
      } catch (error) {
        failedCount++;
        errorLog.push({ itemId: item.id, error: error instanceof Error ? error.message : 'Unknown' });
      }
    }

    // Publish pillars with backdated timestamp (1 hour before clusters)
    const pillarPublishedAt = new Date(new Date(publishedAt).getTime() - 60 * 60 * 1000).toISOString();
    
    for (const item of pillarItems) {
      try {
        const { error: publishError } = await supabase
          .from('blog_posts')
          .update({ status: 'published', published_at: pillarPublishedAt })
          .eq('id', item.blog_post_id!);

        if (publishError) throw publishError;

        await supabase
          .from('content_queue')
          .update({ status: 'published', published_at: pillarPublishedAt })
          .eq('id', item.id);

        await supabase
          .from('embedding_queue')
          .upsert({
            content_type: 'blog_post',
            content_id: item.blog_post_id!,
            trigger_source: 'auto-publish',
            priority: 100,
          }, { onConflict: 'content_type,content_id' });

        publishedCount++;
      } catch (error) {
        failedCount++;
        errorLog.push({ itemId: item.id, error: error instanceof Error ? error.message : 'Unknown' });
      }
    }

    // Update job
    await supabase
      .from('daily_publish_jobs')
      .update({
        published_count: publishedCount,
        failed_count: failedCount,
        status: 'completed',
        completed_at: new Date().toISOString(),
        error_log: errorLog,
      })
      .eq('id', job.id);

    console.log(`[AUTO-PUBLISH] Published ${publishedCount}, failed ${failedCount}`);

    return new Response(JSON.stringify({
      success: true,
      published: publishedCount,
      failed: failedCount,
      jobId: job.id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in daily-auto-publish:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
