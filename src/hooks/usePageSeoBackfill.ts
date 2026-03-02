import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const BATCH_SIZE = 5;

interface BackfillState {
  isRunning: boolean;
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  currentGroup: string | null;
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
  });
  const cancelRef = useRef(false);

  const cancel = useCallback(() => {
    cancelRef.current = true;
  }, []);

  const run = useCallback(async (pageGroup: string) => {
    cancelRef.current = false;

    // Fetch all page IDs missing meta_title in this group
    const allIds: string[] = [];
    let offset = 0;
    const PAGE_SIZE = 500;

    while (true) {
      let query = supabase
        .from('pages')
        .select('id')
        .is('meta_title', null)
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
      toast({ title: 'Nothing to do', description: 'All pages in this group already have SEO metadata.' });
      return;
    }

    setState({
      isRunning: true,
      total: allIds.length,
      processed: 0,
      succeeded: 0,
      failed: 0,
      currentGroup: pageGroup,
    });

    let totalSucceeded = 0;
    let totalFailed = 0;

    for (let i = 0; i < allIds.length; i += BATCH_SIZE) {
      if (cancelRef.current) break;

      const batch = allIds.slice(i, i + BATCH_SIZE);

      try {
        const { data, error } = await supabase.functions.invoke('backfill-page-seo', {
          body: { page_ids: batch },
        });

        if (error) {
          totalFailed += batch.length;
        } else {
          totalSucceeded += data?.succeeded || 0;
          totalFailed += data?.failed || 0;
        }
      } catch {
        totalFailed += batch.length;
      }

      setState((prev) => ({
        ...prev,
        processed: Math.min(i + BATCH_SIZE, allIds.length),
        succeeded: totalSucceeded,
        failed: totalFailed,
      }));

      // Small delay between batches to avoid rate limits
      if (i + BATCH_SIZE < allIds.length && !cancelRef.current) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    setState((prev) => ({ ...prev, isRunning: false }));

    toast({
      title: cancelRef.current ? 'Backfill cancelled' : 'Backfill complete',
      description: `${totalSucceeded} succeeded, ${totalFailed} failed out of ${allIds.length} pages.`,
    });

    onComplete?.();
  }, [toast, onComplete]);

  return { state, run, cancel };
}
