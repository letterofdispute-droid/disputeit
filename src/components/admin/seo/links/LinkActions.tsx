import { Loader2, Search, Zap, CheckCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LinkActionsProps {
  selectedCount: number;
  pendingCount: number;
  approvedCount: number;
  isScanning: boolean;
  isApplying: boolean;
  onScan: () => void;
  onApproveHighRelevance: () => void;
  onApproveSelected: () => void;
  onRejectSelected: () => void;
  onApplyApproved: () => void;
}

export default function LinkActions({
  selectedCount,
  pendingCount,
  approvedCount,
  isScanning,
  isApplying,
  onScan,
  onApproveHighRelevance,
  onApproveSelected,
  onRejectSelected,
  onApplyApproved,
}: LinkActionsProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button
        variant="outline"
        size="sm"
        onClick={onScan}
        disabled={isScanning}
      >
        {isScanning ? (
          <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Scanning...</>
        ) : (
          <><Search className="h-4 w-4 mr-1" /> Scan for Links</>
        )}
      </Button>

      {pendingCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={onApproveHighRelevance}
        >
          <Zap className="h-4 w-4 mr-1" />
          Approve All ≥85%
        </Button>
      )}

      {selectedCount > 0 && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={onApproveSelected}
          >
            <CheckCheck className="h-4 w-4 mr-1" />
            Approve ({selectedCount})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRejectSelected}
          >
            <X className="h-4 w-4 mr-1" />
            Reject ({selectedCount})
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
            <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Applying...</>
          ) : (
            <>Apply Approved ({approvedCount})</>
          )}
        </Button>
      )}
    </div>
  );
}
