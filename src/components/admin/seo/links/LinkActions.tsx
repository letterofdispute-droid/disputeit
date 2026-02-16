import { useState } from 'react';
import { Loader2, CheckCheck, X, CheckCircle2, XCircle, Trash2, Upload, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ApplyJob {
  id: string;
  status: string;
  total_items: number;
  processed_items: number;
  total_suggestions: number;
}

interface LinkActionsProps {
  selectedCount: number;
  pendingCount: number;
  approvedCount: number;
  filteredCount: number;
  statusFilter: string;
  totalForStatus: number;
  isApplying: boolean;
  isBulkUpdating?: boolean;
  isBulkDeleting?: boolean;
  activeApplyJob?: ApplyJob | null;
  onApproveHighRelevance: () => void;
  onApproveSelected: () => void;
  onRejectSelected: () => void;
  onApplyApproved: () => void;
  onApproveAll: () => void;
  onRejectAll: () => void;
  onClearAll: () => void;
  onDeleteSelected: () => void;
  onCancelApplyJob?: () => void;
}

export default function LinkActions({
  selectedCount,
  pendingCount,
  approvedCount,
  filteredCount,
  statusFilter,
  totalForStatus,
  isApplying,
  isBulkUpdating = false,
  isBulkDeleting = false,
  activeApplyJob,
  onApproveHighRelevance,
  onApproveSelected,
  onRejectSelected,
  onApplyApproved,
  onApproveAll,
  onRejectAll,
  onClearAll,
  onDeleteSelected,
  onCancelApplyJob,
}: LinkActionsProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isApplyJobRunning = activeApplyJob?.status === 'processing';
  const applyProgress = isApplyJobRunning && activeApplyJob.total_items > 0
    ? Math.min(100, Math.round((activeApplyJob.processed_items / activeApplyJob.total_items) * 100))
    : 0;

  return (
    <TooltipProvider>
      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
        {/* Apply job progress */}
        {isApplyJobRunning && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex-1 min-w-[160px]">
              <div className="text-xs text-muted-foreground mb-1">
                Applied {activeApplyJob.processed_items} / {activeApplyJob.total_items}
              </div>
              <Progress value={applyProgress} className="h-2" />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onCancelApplyJob}
              className="border-red-600/30 text-red-700 hover:bg-red-50"
            >
              <Square className="h-3 w-3 sm:mr-1" />
              <span className="hidden sm:inline">Cancel</span>
            </Button>
          </div>
        )}

        {/* Selection-specific actions */}
        {selectedCount > 0 && (
          <>
            <Button variant="outline" size="sm" onClick={onApproveSelected}>
              <CheckCheck className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Approve ({selectedCount})</span>
              <span className="sm:hidden">{selectedCount}</span>
            </Button>
            <Button variant="outline" size="sm" onClick={onRejectSelected}>
              <X className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Reject ({selectedCount})</span>
              <span className="sm:hidden">{selectedCount}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDeleteSelected}
              className="border-red-600/30 text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Delete ({selectedCount})</span>
              <span className="sm:hidden">{selectedCount}</span>
            </Button>
          </>
        )}

        {/* Pending view: Approve ≥85%, Approve All, Reject All */}
        {statusFilter === 'pending' && pendingCount > 0 && selectedCount === 0 && (
          <>
            <Button variant="outline" size="sm" onClick={onApproveHighRelevance}>
              <CheckCircle2 className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Approve ≥85%</span>
              <span className="sm:hidden">≥85%</span>
            </Button>
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

        {/* Approved view: Apply Approved (hide when apply job is running) */}
        {!isApplyJobRunning && (statusFilter === 'approved' || statusFilter === 'all') && approvedCount > 0 && selectedCount === 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                onClick={onApplyApproved}
                disabled={isApplying}
              >
                {isApplying ? (
                  <><Loader2 className="h-4 w-4 sm:mr-1 animate-spin" /><span className="hidden sm:inline">Starting...</span></>
                ) : (
                  <><Upload className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Apply to Articles ({approvedCount})</span><span className="sm:hidden">Apply ({approvedCount})</span></>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Inserts approved links into your article HTML (processes all in background)</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Rejected view: Approve All to recover */}
        {statusFilter === 'rejected' && filteredCount > 0 && selectedCount === 0 && (
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
        )}

        {/* Clear All - always available when there are items */}
        {totalForStatus > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isBulkDeleting}
            className="border-red-600/30 text-red-700 hover:bg-red-50"
          >
            {isBulkDeleting ? <Loader2 className="h-4 w-4 sm:mr-1 animate-spin" /> : <Trash2 className="h-4 w-4 sm:mr-1" />}
            <span className="hidden sm:inline">Clear All ({totalForStatus})</span>
            <span className="sm:hidden">Clear</span>
          </Button>
        )}

        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {totalForStatus} suggestions?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all {statusFilter === 'all' ? '' : statusFilter + ' '}
                link suggestions. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => { onClearAll(); setShowDeleteConfirm(false); }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
