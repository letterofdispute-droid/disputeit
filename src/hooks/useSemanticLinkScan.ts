import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ScanResult {
  articleId: string;
  title: string;
  suggestionsFound: number;
}

export interface SemanticScanResponse {
  success: boolean;
  scanned: number;
  totalSuggestions: number;
  results: ScanResult[];
  error?: string;
  jobId?: string;
}

export interface EmbeddingStats {
  total: number;
  completed: number;
  pending: number;
  failed: number;
}

export interface EmbeddingJob {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  content_type: string;
  category_filter: string | null;
  total_items: number;
  processed_items: number;
  failed_items: number;
  skipped_items: number;
  error_messages: Record<string, string>;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface SemanticScanJob {
  id: string;
  status: string;
  total_items: number;
  processed_items: number;
  total_suggestions: number;
  similarity_threshold: number;
  category_filter: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface OrphanArticle {
  id: string;
  slug: string;
  title: string;
  category_slug: string;
  published_at: string;
  inbound_count: number;
}

export interface QueueStats {
  pending: number;
  processed: number;
}

function pickCurrentSemanticJob(jobs: SemanticScanJob[]): SemanticScanJob | null {
  if (!jobs.length) return null;
  return jobs.find((job) => job.status === 'processing') ?? jobs[0];
}

export function useSemanticLinkScan() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [lastScanResults, setLastScanResults] = useState<ScanResult[]>([]);

  // Fetch active embedding job (with polling while processing)
  const { data: activeJob, isLoading: jobLoading } = useQuery({
    queryKey: ['embedding-job-active'],
    queryFn: async (): Promise<EmbeddingJob | null> => {
      const { data, error } = await supabase
        .from('embedding_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as EmbeddingJob | null;
    },
    refetchInterval: (query) => {
      const job = query.state.data as EmbeddingJob | null;
      return job?.status === 'processing' ? 2000 : false;
    },
  });

  // Fetch active discovery scan job (exclude apply + rescue jobs, include null category scans)
  const { data: activeScanJob } = useQuery({
    queryKey: ['semantic-scan-job-active'],
    queryFn: async (): Promise<SemanticScanJob | null> => {
      const { data, error } = await supabase
        .from('semantic_scan_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;

      const jobs = ((data || []) as SemanticScanJob[]).filter(
        (job) => job.category_filter !== '__apply_links__' && job.category_filter !== '__rescue_orphans__'
      );
      return pickCurrentSemanticJob(jobs);
    },
    refetchInterval: (query) => {
      const job = query.state.data as SemanticScanJob | null;
      return job?.status === 'processing' ? 2000 : false;
    },
  });

  // Fetch active apply job separately
  const { data: activeApplyJob } = useQuery({
    queryKey: ['apply-job-active'],
    queryFn: async (): Promise<SemanticScanJob | null> => {
      const { data, error } = await supabase
        .from('semantic_scan_jobs')
        .select('*')
        .eq('category_filter', '__apply_links__')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const job = pickCurrentSemanticJob((data || []) as SemanticScanJob[]);
      if (job && job.status === 'processing' && job.processed_items > job.total_items) {
        return { ...job, status: 'completed' } as SemanticScanJob;
      }
      return job;
    },
    refetchInterval: (query) => {
      const job = query.state.data as SemanticScanJob | null;
      return job?.status === 'processing' ? 2000 : false;
    },
  });

  // Fetch orphan articles
  const { data: orphanArticles, refetch: refetchOrphans } = useQuery({
    queryKey: ['orphan-articles'],
    queryFn: async (): Promise<OrphanArticle[]> => {
      const { data, error } = await supabase.rpc('get_orphan_articles');
      if (error) throw error;
      return (data || []) as OrphanArticle[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch embedding queue stats (auto-polls every 5s when items are pending)
  const { data: queueStats, refetch: refetchQueueStats } = useQuery({
    queryKey: ['embedding-queue-stats'],
    queryFn: async (): Promise<QueueStats> => {
      const { count: pending } = await supabase
        .from('embedding_queue')
        .select('*', { count: 'exact', head: true })
        .is('processed_at', null);

      const { count: processed } = await supabase
        .from('embedding_queue')
        .select('*', { count: 'exact', head: true })
        .not('processed_at', 'is', null);

      return { pending: pending || 0, processed: processed || 0 };
    },
    staleTime: 5 * 1000,
    refetchInterval: (query) => {
      const stats = query.state.data as QueueStats | undefined;
      return stats && stats.pending > 0 ? 5000 : false;
    },
  });

  // Semantic scan mutation - now fires the background job
  const scanMutation = useMutation({
    mutationFn: async (params: { 
      postId?: string; 
      categorySlug?: string; 
      batchSize?: number;
      similarityThreshold?: number;
      maxLinksPerArticle?: number;
    }) => {
      const { data, error } = await supabase.functions.invoke('scan-for-semantic-links', {
        body: params,
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Semantic scan failed');
      return data as SemanticScanResponse;
    },
    onSuccess: (data) => {
      // Job is now running in the background - start polling
      queryClient.invalidateQueries({ queryKey: ['semantic-scan-job-active'] });
      queryClient.invalidateQueries({ queryKey: ['link-suggestions'] });
      toast({
        title: 'Link scan started',
        description: 'Scanning all articles in the background...',
      });
    },
    onError: (error) => {
      const isJobActive = activeScanJob?.status === 'processing';
      const msg = error instanceof Error ? error.message : 'Unknown error';
      if (isJobActive || msg.includes('Failed to send') || msg.includes('Failed to fetch')) {
        queryClient.invalidateQueries({ queryKey: ['semantic-scan-job-active'] });
        queryClient.invalidateQueries({ queryKey: ['link-suggestions'] });
        queryClient.invalidateQueries({ queryKey: ['link-suggestions-stats'] });
        toast({
          title: 'Scan continues in background',
          description: 'The link scan is still running. Suggestions will appear as they are found.',
        });
      } else {
        toast({
          title: 'Semantic scan failed',
          description: msg,
          variant: 'destructive',
        });
      }
    },
  });

  // Cancel scan job
  const cancelScanJobMutation = useMutation({
    mutationFn: async (scanJobId: string) => {
      const { error } = await supabase
        .from('semantic_scan_jobs')
        .update({ status: 'cancelled', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', scanJobId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['semantic-scan-job-active'] });
      toast({ title: 'Scan cancelled', description: 'The link scan will stop after the current batch.' });
    },
  });

  // Start bulk embedding job
  const bulkEmbeddingMutation = useMutation({
    mutationFn: async (params: {
      category_filter?: string;
      forceReembed?: boolean;
    }) => {
      const { data, error } = await supabase.functions.invoke('generate-embeddings', {
        body: {
          bulk: true,
          content_type: 'blog_post',
          ...params,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Bulk embedding failed');
      return data as { success: boolean; jobId: string; totalItems: number };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['embedding-job-active'] });
      queryClient.invalidateQueries({ queryKey: ['embedding-stats'] });
      toast({
        title: 'Bulk embedding started',
        description: `Processing ${data.totalItems} articles in background...`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Bulk embedding failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });

  // Retry failed embeddings from a job
  const retryFailedMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const { data, error } = await supabase.functions.invoke('generate-embeddings', {
        body: { retryJobId: jobId },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Retry failed');
      return data as { success: boolean; jobId: string; totalItems: number };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['embedding-job-active'] });
      queryClient.invalidateQueries({ queryKey: ['embedding-stats'] });
      toast({
        title: 'Retrying failed embeddings',
        description: `Processing ${data.totalItems} failed articles...`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Retry failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });

  // Reset all embeddings
  const resetEmbeddingsMutation = useMutation({
    mutationFn: async (params: { category_filter?: string }) => {
      let query = supabase.from('article_embeddings').delete();
      if (params.category_filter) {
        query = query.eq('category_id', params.category_filter);
      } else {
        query = query.eq('content_type', 'article');
      }
      const { error } = await query;
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['embedding-job-active'] });
      queryClient.invalidateQueries({ queryKey: ['embedding-stats'] });
      toast({
        title: 'Embeddings reset',
        description: 'All embeddings have been cleared. Run bulk generation to recreate.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Reset failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });

  // Generate single embedding
  const generateEmbeddingMutation = useMutation({
    mutationFn: async (params: {
      postId?: string;
      categorySlug?: string;
      batchSize?: number;
      contentType?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('generate-embeddings', {
        body: {
          content_type: params.contentType || 'blog_post',
          content_id: params.postId,
          batch_size: params.batchSize || 5,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Embedding generation failed');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['embedding-stats'] });
      toast({
        title: 'Embedding generated',
        description: 'Article embedding created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Embedding generation failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });

  // Fetch embedding stats
  const fetchEmbeddingStats = useCallback(async (): Promise<EmbeddingStats> => {
    try {
      const [totalRes, completedRes, failedRes] = await Promise.all([
        supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('article_embeddings').select('*', { count: 'exact', head: true }).eq('embedding_status', 'completed'),
        supabase.from('article_embeddings').select('*', { count: 'exact', head: true }).eq('embedding_status', 'failed'),
      ]);

      const completed = completedRes.count || 0;
      const failed = failedRes.count || 0;
      // Fall back to completed+failed if blog_posts count fails/times out
      let total = totalRes.count || 0;
      if (total === 0 && completed > 0) {
        total = completed + failed;
      }

      return { total, completed, pending: Math.max(total - completed - failed, 0), failed };
    } catch (error) {
      console.error('Failed to fetch embedding stats:', error);
      return { total: 0, completed: 0, pending: 0, failed: 0 };
    }
  }, []);

  // Get job progress percentage
  const getJobProgress = useCallback((job: EmbeddingJob | null): number => {
    if (!job || job.total_items === 0) return 0;
    return Math.round(((job.processed_items + job.failed_items) / job.total_items) * 100);
  }, []);

  // Cancel a stuck embedding job
  const cancelJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from('embedding_jobs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_messages: { _cancelled: 'Job cancelled by user' },
        })
        .eq('id', jobId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['embedding-job-active'] });
      toast({
        title: 'Job cancelled',
        description: 'The embedding job has been cancelled',
      });
    },
  });

  // Process embedding queue manually
  const processQueueMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('process-embedding-queue', {
        body: { limit: 10 },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Queue processing failed');
      return data as { success: boolean; processed: number; linksCreated: number; remaining?: number };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['embedding-queue-stats'] });
      queryClient.invalidateQueries({ queryKey: ['embedding-stats'] });
      queryClient.invalidateQueries({ queryKey: ['link-suggestions'] });
      const remaining = data.remaining ?? 0;
      if (remaining > 0) {
        toast({
          title: 'Embedding processing started',
          description: `${remaining} articles queued — progress bar will update automatically.`,
        });
      } else {
        toast({
          title: 'Queue processed',
          description: `Processed ${data.processed} items, created ${data.linksCreated} link suggestions`,
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Queue processing failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });

  // Run maintenance tasks
  const runMaintenanceMutation = useMutation({
    mutationFn: async (tasks?: ('process_queue' | 'rescan_stale' | 'detect_orphans')[]) => {
      const { data, error } = await supabase.functions.invoke('semantic-maintenance', {
        body: { tasks },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Maintenance failed');
      return data as { 
        success: boolean; 
        queueProcessed: number; 
        staleRescanned: number; 
        orphansDetected: number;
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['embedding-queue-stats'] });
      queryClient.invalidateQueries({ queryKey: ['orphan-articles'] });
      queryClient.invalidateQueries({ queryKey: ['embedding-stats'] });
      toast({
        title: 'Maintenance complete',
        description: `Queue: ${data.queueProcessed}, Rescanned: ${data.staleRescanned}, Orphans: ${data.orphansDetected}`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Maintenance failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });

  // Reset scan timestamps to force re-scan
  const resetScanTimestampsMutation = useMutation({
    mutationFn: async (categorySlug?: string) => {
      let query = supabase
        .from('article_embeddings')
        .update({ next_scan_due_at: null })
        .eq('embedding_status', 'completed');
      
      if (categorySlug) {
        query = query.eq('category_id', categorySlug);
      }
      
      const { error } = await query;
      if (error) throw error;
    },
  });

  // Scan job progress
  const scanJobProgress = activeScanJob && activeScanJob.total_items > 0
    ? Math.min(100, Math.round((activeScanJob.processed_items / activeScanJob.total_items) * 100))
    : 0;

  const isScanJobRunning = activeScanJob?.status === 'processing';

  // Reconcile link counts mutation
  const reconcileMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('reconcile_link_counts');
      if (error) throw error;
      return data as { inbound_updated: number; outbound_updated: number; ghosts_reset: number };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orphan-articles'] });
      queryClient.invalidateQueries({ queryKey: ['embedding-stats'] });
      queryClient.invalidateQueries({ queryKey: ['link-suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['link-suggestions-stats'] });
      const parts = [];
      if (data.inbound_updated > 0 || data.outbound_updated > 0) {
        parts.push(`Updated ${data.inbound_updated} inbound + ${data.outbound_updated} outbound counts`);
      }
      if (data.ghosts_reset > 0) {
        parts.push(`Reset ${data.ghosts_reset} ghost suggestions back to approved`);
      }
      toast({
        title: 'Counts reconciled',
        description: parts.length > 0 ? parts.join('. ') : 'All counts already accurate, no changes needed',
      });
    },
    onError: (error) => {
      toast({
        title: 'Reconciliation failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });

  // Rescue orphans mutation
  const rescueOrphansMutation = useMutation({
    mutationFn: async (params?: { maxLinksPerArticle?: number }) => {
      const { data, error } = await supabase.functions.invoke('rescue-orphans', {
        body: params || {},
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Rescue scan failed');
      return data as { success: boolean; jobId?: string; message?: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['semantic-scan-job-active'] });
      queryClient.invalidateQueries({ queryKey: ['rescue-job-active'] });
      queryClient.invalidateQueries({ queryKey: ['link-suggestions'] });
      
      // Check if the function found nothing to do
      if (data.message === 'No orphan articles found' || (!data.jobId && data.message)) {
        toast({
          title: 'No orphan articles to rescue',
          description: data.message || 'All articles already have inbound links.',
        });
        return;
      }
      
      toast({
        title: 'Orphan rescue started',
        description: 'Scanning orphan articles for inbound link opportunities. Links will auto-apply when complete.',
      });

      // Auto-trigger apply-links-bulk after a brief delay so rescue suggestions get applied immediately
      setTimeout(() => {
        supabase.functions.invoke('apply-links-bulk', { body: {} }).then(() => {
          queryClient.invalidateQueries({ queryKey: ['apply-job-active'] });
        }).catch(() => { /* fire-and-forget */ });
      }, 5000);
    },
    onError: (error) => {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      if (msg.includes('Failed to send') || msg.includes('Failed to fetch')) {
        queryClient.invalidateQueries({ queryKey: ['rescue-job-active'] });
        // Still attempt to trigger apply in case the rescue function ran
        setTimeout(() => {
          supabase.functions.invoke('apply-links-bulk', { body: {} }).then(() => {
            queryClient.invalidateQueries({ queryKey: ['apply-job-active'] });
          }).catch(() => { /* fire-and-forget */ });
        }, 5000);
        toast({
          title: 'Rescue scan continues in background',
          description: 'The scan is running. Suggestions will be auto-applied when ready.',
        });
      } else {
        toast({
          title: 'Rescue scan failed',
          description: msg,
          variant: 'destructive',
        });
      }
    },
  });

  // Fetch active rescue job
  const { data: activeRescueJob } = useQuery({
    queryKey: ['rescue-job-active'],
    queryFn: async (): Promise<SemanticScanJob | null> => {
      const { data, error } = await supabase
        .from('semantic_scan_jobs')
        .select('*')
        .eq('category_filter', '__rescue_orphans__')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return pickCurrentSemanticJob((data || []) as SemanticScanJob[]);
    },
    refetchInterval: (query) => {
      const job = query.state.data as SemanticScanJob | null;
      return job?.status === 'processing' ? 2000 : false;
    },
  });

  // Smart scan mutation (AI-powered)
  const smartScanMutation = useMutation({
    mutationFn: async (params: {
      categorySlug?: string;
      maxLinksPerArticle?: number;
    }) => {
      const { data, error } = await supabase.functions.invoke('scan-for-smart-links', {
        body: params,
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Smart scan failed');
      return data as SemanticScanResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['semantic-scan-job-active'] });
      queryClient.invalidateQueries({ queryKey: ['link-suggestions'] });
      toast({
        title: 'Smart scan started',
        description: 'AI is analyzing articles one-by-one in the background...',
      });
    },
    onError: (error) => {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      if (msg.includes('Failed to send') || msg.includes('Failed to fetch')) {
        queryClient.invalidateQueries({ queryKey: ['semantic-scan-job-active'] });
        toast({
          title: 'Smart scan continues in background',
          description: 'The AI scan is running. Suggestions will appear as they are found.',
        });
      } else {
        toast({
          title: 'Smart scan failed',
          description: msg,
          variant: 'destructive',
        });
      }
    },
  });

  return {
    // Semantic scan
    semanticScan: scanMutation.mutate,
    isSemanticScanning: scanMutation.isPending,
    lastScanResults,

    // Smart scan (AI)
    smartScan: smartScanMutation.mutate,
    isSmartScanning: smartScanMutation.isPending,
    
    // Scan job tracking
    activeScanJob,
    isScanJobRunning,
    scanJobProgress,
    cancelScanJob: cancelScanJobMutation.mutate,
    isCancellingScan: cancelScanJobMutation.isPending,

    // Apply job tracking
    activeApplyJob,
    isApplyJobRunning: activeApplyJob?.status === 'processing',
    
    // Bulk embedding
    startBulkEmbedding: bulkEmbeddingMutation.mutate,
    isStartingBulk: bulkEmbeddingMutation.isPending,
    
    // Single embedding
    generateEmbedding: generateEmbeddingMutation.mutate,
    isGeneratingEmbedding: generateEmbeddingMutation.isPending,
    
    // Retry failed
    retryFailed: retryFailedMutation.mutate,
    isRetrying: retryFailedMutation.isPending,
    
    // Reset embeddings
    resetEmbeddings: resetEmbeddingsMutation.mutate,
    isResetting: resetEmbeddingsMutation.isPending,
    
    // Job tracking
    activeJob,
    jobLoading,
    getJobProgress,
    cancelJob: cancelJobMutation.mutate,
    isCancelling: cancelJobMutation.isPending,
    
    // Stats
    fetchEmbeddingStats,
    
    // Orphan detection
    orphanArticles: orphanArticles || [],
    refetchOrphans,
    
    // Queue management
    queueStats: queueStats || { pending: 0, processed: 0 },
    refetchQueueStats,
    processQueue: processQueueMutation.mutate,
    isProcessingQueue: processQueueMutation.isPending,
    
    // Maintenance
    runMaintenance: runMaintenanceMutation.mutate,
    isRunningMaintenance: runMaintenanceMutation.isPending,
    
    // Reset scan timestamps
    resetScanTimestamps: resetScanTimestampsMutation.mutateAsync,
    isResettingScanTimestamps: resetScanTimestampsMutation.isPending,

    // Reconcile link counts
    reconcileCounts: reconcileMutation.mutate,
    isReconciling: reconcileMutation.isPending,

    // Rescue orphans
    rescueOrphans: rescueOrphansMutation.mutate,
    isRescuing: rescueOrphansMutation.isPending,
    activeRescueJob,
    isRescueRunning: activeRescueJob?.status === 'processing',
    rescueJobProgress: activeRescueJob && activeRescueJob.total_items > 0
      ? Math.min(100, Math.round((activeRescueJob.processed_items / activeRescueJob.total_items) * 100))
      : 0,
  };
}
