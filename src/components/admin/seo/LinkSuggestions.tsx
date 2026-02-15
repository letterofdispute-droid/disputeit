import { useState, useMemo } from 'react';
import { Loader2, Search } from 'lucide-react';
import { useLinkSuggestions } from '@/hooks/useLinkSuggestions';
import { useSemanticLinkScan } from '@/hooks/useSemanticLinkScan';
import LinkStats from './links/LinkStats';
import LinkFilters from './links/LinkFilters';
import LinkActions from './links/LinkActions';
import LinkCard from './links/LinkCard';
import ScanProgress from './links/ScanProgress';
import SemanticScanPanel from './links/SemanticScanPanel';

export default function LinkSuggestions() {
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { isScanJobRunning } = useSemanticLinkScan();

  const { 
    suggestions, 
    isLoading, 
    refetch,
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
  } = useLinkSuggestions(statusFilter === 'all' ? undefined : statusFilter, undefined, isScanJobRunning);

  const stats = getStats();

  // Filter suggestions
  const filteredSuggestions = useMemo(() => {
    if (!suggestions) return [];
    
    return suggestions.filter(s => {
      if (categoryFilter !== 'all' && s.blog_posts?.category_slug !== categoryFilter) {
        return false;
      }
      if (targetTypeFilter !== 'all' && s.target_type !== targetTypeFilter) {
        return false;
      }
      return true;
    });
  }, [suggestions, categoryFilter, targetTypeFilter]);

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
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
    const ids = getApprovedIds();
    if (ids.length > 0) {
      applyLinks({ suggestionIds: ids });
    }
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

  const handleScan = () => {
    const params: { categorySlug?: string } = {};
    if (categoryFilter !== 'all') {
      params.categorySlug = categoryFilter;
    }
    scan(params);
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
          filteredCount={filteredSuggestions.length}
          statusFilter={statusFilter}
          totalForStatus={statusFilter === 'all' ? (stats.pending + stats.approved + stats.rejected + stats.applied) : (stats as any)[statusFilter] || 0}
          isApplying={isApplyingLinks}
          isBulkUpdating={isBulkUpdatingAll}
          isBulkDeleting={isBulkDeleting}
          onApproveHighRelevance={handleApproveHighRelevance}
          onApproveSelected={handleApproveSelected}
          onRejectSelected={handleRejectSelected}
          onApplyApproved={handleApplyApproved}
          onApproveAll={handleApproveAll}
          onRejectAll={handleRejectAll}
          onClearAll={handleClearAll}
          onDeleteSelected={handleDeleteSelected}
        />
      </div>

      {/* Suggestions List */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
        {filteredSuggestions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No link suggestions found</p>
            <p className="text-sm mt-1">Scan articles to find linking opportunities</p>
          </div>
        ) : (
          filteredSuggestions.map(suggestion => (
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
    </div>
  );
}
