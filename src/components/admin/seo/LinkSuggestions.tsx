import { useState, useEffect } from 'react';
import { Loader2, Search } from 'lucide-react';
import { useLinkSuggestions } from '@/hooks/useLinkSuggestions';
import { useSemanticLinkScan } from '@/hooks/useSemanticLinkScan';
import LinkStats from './links/LinkStats';
import LinkFilters from './links/LinkFilters';
import LinkActions from './links/LinkActions';
import LinkCard from './links/LinkCard';
import ScanProgress from './links/ScanProgress';
import SemanticScanPanel from './links/SemanticScanPanel';
import BrokenLinkScanner from './BrokenLinkScanner';
import QueuePagination from './queue/QueuePagination';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

const PAGE_SIZE = 50;

export default function LinkSuggestions() {
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  const { isScanJobRunning, activeApplyJob, cancelScanJob } = useSemanticLinkScan();

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [statusFilter, categoryFilter, targetTypeFilter]);

  const {
    suggestions,
    isLoading,
    refetch,
    totalCount,
    totalPages,
    scan,
    isScanning,
    updateStatus,
    updateAnchor,
    bulkUpdateStatus,
    applyLinks,
    isApplyingLinks,
    deleteSuggestions,
    getStats,
    getHighRelevanceIds,
    getApprovedIds,
    bulkUpdateAllByStatus,
    isBulkUpdatingAll,
    bulkDeleteByStatus,
    isBulkDeleting,
  } = useLinkSuggestions(
    statusFilter === 'all' ? undefined : statusFilter,
    categoryFilter !== 'all' ? categoryFilter : undefined,
    targetTypeFilter !== 'all' ? targetTypeFilter : undefined,
    currentPage,
    PAGE_SIZE,
    isScanJobRunning || !!activeApplyJob,
  );

  const stats = getStats();

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedIds(new Set());
  };

  const handleApprove = (id: string) => {
    updateStatus({ id, status: 'approved' });
  };

  const handleReject = (id: string) => {
    updateStatus({ id, status: 'rejected' });
  };

  const handleUpdateAnchor = (id: string, anchor: string) => {
    updateAnchor({ id, anchor_text: anchor });
  };

  const handleApproveHighRelevance = () => {
    const ids = getHighRelevanceIds(85);
    if (ids.length > 0) {
      bulkUpdateStatus({ ids, status: 'approved' });
    }
  };

  const handleApproveSelected = () => {
    if (selectedIds.size > 0) {
      bulkUpdateStatus({ ids: Array.from(selectedIds), status: 'approved' });
      setSelectedIds(new Set());
    }
  };

  const handleRejectSelected = () => {
    if (selectedIds.size > 0) {
      bulkUpdateStatus({ ids: Array.from(selectedIds), status: 'rejected' });
      setSelectedIds(new Set());
    }
  };

  const handleApplyApproved = () => {
    applyLinks();
  };

  const handleApproveAll = () => {
    bulkUpdateAllByStatus({
      currentStatus: statusFilter === 'all' ? 'pending' : statusFilter,
      newStatus: 'approved',
      categorySlug: categoryFilter !== 'all' ? categoryFilter : undefined,
    });
  };

  const handleRejectAll = () => {
    bulkUpdateAllByStatus({
      currentStatus: statusFilter === 'all' ? 'pending' : statusFilter,
      newStatus: 'rejected',
      categorySlug: categoryFilter !== 'all' ? categoryFilter : undefined,
    });
  };

  const handleClearAll = () => {
    bulkDeleteByStatus({
      status: statusFilter === 'all' ? undefined : statusFilter,
      categorySlug: categoryFilter !== 'all' ? categoryFilter : undefined,
    });
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size > 0) {
      deleteSuggestions(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Broken Link Scanner (collapsible) */}
      <Collapsible>
        <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full justify-between border rounded-lg px-4 py-2.5 bg-muted/30">
          <span>🔗 Broken Link Scanner</span>
          <ChevronDown className="h-4 w-4 transition-transform duration-200 [&[data-state=open]]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <BrokenLinkScanner />
        </CollapsibleContent>
      </Collapsible>

      {/* Semantic Scan Panel */}
      <SemanticScanPanel categoryFilter={categoryFilter} />

      {/* Stats */}
      <LinkStats stats={stats} />

      {/* Scan Progress */}
      {isScanning && <ScanProgress />}

      {/* Filters and Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <LinkFilters
          statusFilter={statusFilter}
          categoryFilter={categoryFilter}
          targetTypeFilter={targetTypeFilter}
          onStatusChange={setStatusFilter}
          onCategoryChange={setCategoryFilter}
          onTargetTypeChange={setTargetTypeFilter}
          onRefresh={refetch}
        />

        <LinkActions
          selectedCount={selectedIds.size}
          pendingCount={stats.pending}
          approvedCount={stats.approved}
          filteredCount={totalCount}
          statusFilter={statusFilter}
          totalForStatus={statusFilter === 'all' ? (stats.pending + stats.approved + stats.rejected + stats.applied) : (stats as any)[statusFilter] || 0}
          isApplying={isApplyingLinks}
          isBulkUpdating={isBulkUpdatingAll}
          isBulkDeleting={isBulkDeleting}
          activeApplyJob={activeApplyJob}
          onApproveHighRelevance={handleApproveHighRelevance}
          onApproveSelected={handleApproveSelected}
          onRejectSelected={handleRejectSelected}
          onApplyApproved={handleApplyApproved}
          onApproveAll={handleApproveAll}
          onRejectAll={handleRejectAll}
          onClearAll={handleClearAll}
          onDeleteSelected={handleDeleteSelected}
          onCancelApplyJob={() => activeApplyJob && cancelScanJob(activeApplyJob.id)}
        />
      </div>

      {/* Suggestions List */}
      <div className="space-y-3">
        {(!suggestions || suggestions.length === 0) ? (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No link suggestions found</p>
            <p className="text-sm mt-1">Scan articles to find linking opportunities</p>
          </div>
        ) : (
          suggestions.map(suggestion => (
            <LinkCard
              key={suggestion.id}
              suggestion={suggestion}
              isSelected={selectedIds.has(suggestion.id)}
              onToggleSelect={toggleSelection}
              onApprove={handleApprove}
              onReject={handleReject}
              onUpdateAnchor={handleUpdateAnchor}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      <QueuePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        totalItems={totalCount}
        itemsPerPage={PAGE_SIZE}
      />
    </div>
  );
}
