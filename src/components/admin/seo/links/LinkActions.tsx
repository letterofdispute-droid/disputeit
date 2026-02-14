import { Loader2, Search, Zap, CheckCheck, X, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LinkActionsProps {
  selectedCount: number;
  pendingCount: number;
  approvedCount: number;
  filteredCount: number;
  isScanning: boolean;
  isApplying: boolean;
  isBulkUpdating?: boolean;
  onScan: () => void;
  onApproveHighRelevance: () => void;
  onApproveSelected: () => void;
  onRejectSelected: () => void;
  onApplyApproved: () => void;
  onApproveAll: () => void;
  onRejectAll: () => void;
}

export default function LinkActions({
  selectedCount,
  pendingCount,
  approvedCount,
  filteredCount,
  isScanning,
  isApplying,
  isBulkUpdating = false,
  onScan,
  onApproveHighRelevance,
  onApproveSelected,
  onRejectSelected,
  onApplyApproved,
  onApproveAll,
  onRejectAll,
}: LinkActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
      <Button
        variant="outline"
        size="sm"
        onClick={onScan}
        disabled={isScanning}
      >
        {isScanning ? (
          <><Loader2 className="h-4 w-4 sm:mr-1 animate-spin" /><span className="hidden sm:inline">Scanning...</span></>
        ) : (
          <><Search className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Scan for Links</span><span className="sm:hidden">Scan</span></>
        )}
      </Button>

      {pendingCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={onApproveHighRelevance}
        >
          <Zap className="h-4 w-4 sm:mr-1" />
          <span className="hidden sm:inline">Approve All ≥85%</span>
          <span className="sm:hidden">≥85%</span>
        </Button>
      )}

      {selectedCount > 0 && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={onApproveSelected}
          >
            <CheckCheck className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Approve ({selectedCount})</span>
            <span className="sm:hidden">{selectedCount}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRejectSelected}
          >
            <X className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Reject ({selectedCount})</span>
            <span className="sm:hidden">{selectedCount}</span>
          </Button>
        </>
      )}

      {approvedCount > 0 && (
        <Button
          size="sm"
          onClick={onApplyApproved}
          disabled={isApplying}
        >
          {isApplying ? (
            <><Loader2 className="h-4 w-4 sm:mr-1 animate-spin" /><span className="hidden sm:inline">Applying...</span></>
          ) : (
            <><span className="hidden sm:inline">Apply Approved ({approvedCount})</span><span className="sm:hidden">Apply ({approvedCount})</span></>
          )}
        </Button>
      )}

      {filteredCount > 0 && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={onApproveAll}
            disabled={isBulkUpdating}
            className="border-green-600/30 text-green-700 hover:bg-green-50"
          >
            {isBulkUpdating ? <Loader2 className="h-4 w-4 sm:mr-1 animate-spin" /> : <CheckCircle2 className="h-4 w-4 sm:mr-1" />}
            <span className="hidden sm:inline">Approve All</span>
            <span className="sm:hidden">All ✓</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRejectAll}
            disabled={isBulkUpdating}
            className="border-red-600/30 text-red-700 hover:bg-red-50"
          >
            {isBulkUpdating ? <Loader2 className="h-4 w-4 sm:mr-1 animate-spin" /> : <XCircle className="h-4 w-4 sm:mr-1" />}
            <span className="hidden sm:inline">Reject All</span>
            <span className="sm:hidden">All ✗</span>
          </Button>
        </>
      )}
    </div>
  );
}
