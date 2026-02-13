import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useContentQueue, ContentQueueItem } from '@/hooks/useContentQueue';
import { useQueueStats } from '@/hooks/useQueueStats';
import { useGenerationJob } from '@/hooks/useGenerationJob';
import QueueStats from './queue/QueueStats';
import QueueFilters from './queue/QueueFilters';
import QueueActions from './queue/QueueActions';
import QueueTable from './queue/QueueTable';
import GenerationProgress from './queue/GenerationProgress';
import QueuePagination from './queue/QueuePagination';
import FailureSummary from './queue/FailureSummary';

const ITEMS_PER_PAGE = 50;

export default function ContentQueue() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [batchSize, setBatchSize] = useState<number>(5);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const { 
    queueItems, 
    isLoading, 
    refetch,
    bulkGenerate, 
    isBulkGenerating,
    retryFailed,
    isRetrying,
    deleteItems,
    getFailedIds,
    fetchAllFailedIds,
  } = useContentQueue(undefined, undefined, statusFilter);

  const { activeJob, lastCompletedJob, isRunning, stopJob, isStopping, resumeJob, isResuming } = useGenerationJob();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Use separate hook for accurate global stats
  const { data: globalStats, isLoading: statsLoading } = useQueueStats();

  // Reset orphaned generating items
  const resetStuckMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('reset_orphaned_generating_items');
      if (error) throw error;
      return data as number;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
      queryClient.invalidateQueries({ queryKey: ['content-queue'] });
      toast({ title: `Reset ${count} stuck item(s) back to queued` });
    },
    onError: (error) => {
      toast({ title: 'Failed to reset', description: error.message, variant: 'destructive' });
    },
  });
  const stats = globalStats || { queued: 0, generating: 0, generated: 0, published: 0, failed: 0, total: 0 };

  // Filter items
  const filteredItems = queueItems?.filter(item => {
    if (categoryFilter !== 'all' && item.content_plans?.category_id !== categoryFilter) return false;
    return true;
  }) || [];

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleCategoryChange = (category: string) => {
    setCategoryFilter(category);
    setCurrentPage(1);
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map(i => i.id)));
    }
  };

  const handleGenerateSelected = () => {
    const queuedIds = Array.from(selectedIds).filter(id => {
      const item = queueItems?.find(q => q.id === id);
      return item?.status === 'queued';
    });
    
    if (queuedIds.length > 0) {
      bulkGenerate({ queueItemIds: queuedIds });
      setSelectedIds(new Set());
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size > 0) {
      deleteItems(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const handleClearFailed = async () => {
    try {
      const failedIds = await fetchAllFailedIds();
      if (failedIds.length > 0) {
        deleteItems(failedIds);
      }
    } catch (e) {
      console.error('Failed to fetch failed IDs:', e);
    }
  };

  const handleRetryFailed = async () => {
    try {
      const failedIds = await fetchAllFailedIds();
      if (failedIds.length > 0) {
        retryFailed(failedIds);
      }
    } catch (e) {
      console.error('Failed to fetch failed IDs:', e);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show active job or last completed job
  const jobToShow = activeJob || lastCompletedJob;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <QueueStats
        stats={stats}
        isRunning={isRunning}
        onResetStuck={() => resetStuckMutation.mutate()}
        isResetting={resetStuckMutation.isPending}
      />

      {/* Job-based progress indicator */}
      {jobToShow && (
        <GenerationProgress
          job={jobToShow}
          onStop={stopJob}
          isStopping={isStopping}
          onResume={resumeJob}
          isResuming={isResuming}
        />
      )}

      {/* Failure Summary Banner */}
      {stats.failed > 0 && (
        <FailureSummary failedItems={queueItems?.filter(i => i.status === 'failed') || []} />
      )}

      {/* Filters and Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <QueueFilters
          statusFilter={statusFilter}
          categoryFilter={categoryFilter}
          onStatusChange={handleStatusChange}
          onCategoryChange={handleCategoryChange}
          onRefresh={refetch}
        />

        <QueueActions
          selectedCount={selectedIds.size}
          failedCount={stats.failed}
          isBulkGenerating={isBulkGenerating || isRetrying || isRunning}
          batchSize={batchSize}
          onBatchSizeChange={setBatchSize}
          onGenerateSelected={handleGenerateSelected}
          onDeleteSelected={handleDeleteSelected}
          onClearFailed={handleClearFailed}
          onRetryFailed={handleRetryFailed}
        />
      </div>

      {/* Queue Table */}
      <QueueTable
        items={paginatedItems}
        selectedIds={selectedIds}
        onToggleSelection={toggleSelection}
        onToggleSelectAll={toggleSelectAll}
      />

      {/* Pagination */}
      <QueuePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredItems.length}
        itemsPerPage={ITEMS_PER_PAGE}
      />
    </div>
  );
}
