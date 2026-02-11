import { useState } from 'react';
import { Loader2 } from 'lucide-react';
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

  const { activeJob, lastCompletedJob, isRunning, stopJob, isStopping } = useGenerationJob();

  // Use separate hook for accurate global stats
  const { data: globalStats, isLoading: statsLoading } = useQueueStats();
  
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
      <QueueStats stats={stats} />

      {/* Job-based progress indicator */}
      {jobToShow && (
        <GenerationProgress
          job={jobToShow}
          onStop={stopJob}
          isStopping={isStopping}
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
