import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const BATCH_SIZE = 2;
const INTER_BATCH_DELAY = 1500;

interface BackfillState {
  isRunning: boolean;
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  currentGroup: string | null;
  lastError: string | null;
  errorCounts: Record<string, number>;
}

export function usePageSeoBackfill(onComplete?: () => void) {
  const { toast } = useToast();
  const [state, setState] = useState<BackfillState>({
    isRunning: false,
    total: 0,
    processed: 0,
    succeeded: 0,
    failed: 0,
    currentGroup: null,
    lastError: null,
    errorCounts: {},
  });
  const cancelRef = useRef(false);

  const cancel = useCallback(() => {
    cancelRef.current = true;
  }, []);

  const run = useCallback(async (pageGroup: string) => {
    cancelRef.current = false;

    // Fetch all page IDs missing any SEO asset
    const allIds: string[] = [];
    let offset = 0;
    const PAGE_SIZE = 500;

    while (true) {
      let query = supabase
        .from('pages')
        .select('id')
        .or('meta_title.is.null,meta_description.is.null,featured_image_url.is.null')
        .range(offset, offset + PAGE_SIZE - 1);

      if (pageGroup !== 'all') {
        query = query.eq('page_group', pageGroup);
      }

      const { data, error } = await query;
      if (error) {
        toast({ title: 'Error', description: `Failed to fetch pages: ${error.message}`, variant: 'destructive' });
        return;
      }
      if (!data || data.length === 0) break;
      allIds.push(...data.map((p) => p.id));
      if (data.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
    }

    if (allIds.length === 0) {
      toast({ title: 'Nothing to do', description: 'All pages in this group already have SEO metadata and images.' });
      return;
    }

    setState({
      isRunning: true,
      total: allIds.length,
      processed: 0,
      succeeded: 0,
      failed: 0,
      currentGroup: pageGroup,
      lastError: null,
      errorCounts: {},
    });

    let totalSucceeded = 0;
    let totalFailed = 0;
    const errorCounts: Record<string, number> = {};

    for (let i = 0; i < allIds.length; i += BATCH_SIZE) {
      if (cancelRef.current) break;

      const batch = allIds.slice(i, i + BATCH_SIZE);

      try {
        const { data, error } = await supabase.functions.invoke('backfill-page-seo', {
          body: { page_ids: batch },
        });

        if (error) {
          totalFailed += batch.length;
          const reason = error.message || 'invoke_error';
          const key = reason.includes('timeout') || reason.includes('Failed to fetch') ? 'timeout' : 'invoke_error';
          errorCounts[key] = (errorCounts[key] || 0) + batch.length;
          setState((prev) => ({
            ...prev,
            processed: Math.min(i + BATCH_SIZE, allIds.length),
            succeeded: totalSucceeded,
            failed: totalFailed,
            lastError: key,
            errorCounts: { ...errorCounts },
          }));
        } else {
          totalSucceeded += data?.succeeded || 0;
          totalFailed += data?.failed || 0;

          // Track error types from response
          if (data?.errors?.length) {
            for (const err of data.errors) {
              const key = err.reason?.split(':')[0] || 'unknown';
              errorCounts[key] = (errorCounts[key] || 0) + 1;
            }
          }

          // Bail if backend says rate limited or credits exhausted
          if (data?.bailReason) {
            errorCounts[data.bailReason] = (errorCounts[data.bailReason] || 0) + 1;
            cancelRef.current = true;
          }

          setState((prev) => ({
            ...prev,
            processed: Math.min(i + BATCH_SIZE, allIds.length),
            succeeded: totalSucceeded,
            failed: totalFailed,
            lastError: data?.errors?.[data.errors.length - 1]?.reason?.slice(0, 80) || prev.lastError,
            errorCounts: { ...errorCounts },
          }));
        }
      } catch {
        totalFailed += batch.length;
        errorCounts['network_error'] = (errorCounts['network_error'] || 0) + batch.length;
        setState((prev) => ({
          ...prev,
          processed: Math.min(i + BATCH_SIZE, allIds.length),
          succeeded: totalSucceeded,
          failed: totalFailed,
          lastError: 'network_error',
          errorCounts: { ...errorCounts },
        }));
      }

      // Delay between batches
      if (i + BATCH_SIZE < allIds.length && !cancelRef.current) {
        await new Promise((r) => setTimeout(r, INTER_BATCH_DELAY));
      }
    }

    setState((prev) => ({ ...prev, isRunning: false }));

    const errorSummary = Object.entries(errorCounts)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');

    toast({
      title: cancelRef.current ? 'Backfill stopped' : 'Backfill complete',
      description: `${totalSucceeded} succeeded, ${totalFailed} failed out of ${allIds.length}.${errorSummary ? ` (${errorSummary})` : ''}`,
    });

    onComplete?.();
  }, [toast, onComplete]);

  return { state, run, cancel };
}
