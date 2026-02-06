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
import { Badge } from '@/components/ui/badge';
import { VALUE_TIERS, ValueTier } from '@/config/articleTypes';

interface BulkPlanConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryName: string;
  templateCount: number;
  valueTier: ValueTier;
  onConfirm: () => void;
  isLoading?: boolean;
}

export default function BulkPlanConfirmDialog({
  open,
  onOpenChange,
  categoryName,
  templateCount,
  valueTier,
  onConfirm,
  isLoading,
}: BulkPlanConfirmDialogProps) {
  const tierConfig = VALUE_TIERS[valueTier];
  const totalArticles = templateCount * tierConfig.articleCount;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Create Content Plans</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                This will create content plans for <strong>{templateCount} templates</strong> in{' '}
                <strong>{categoryName}</strong>.
              </p>
              
              <div className="p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Value Tier</span>
                  <Badge>{tierConfig.name}</Badge>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Articles per template</span>
                  <span className="font-medium">{tierConfig.articleCount}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm font-medium">Total articles to generate</span>
                  <span className="font-bold text-lg">{totalArticles}</span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                You can adjust the tier for this category in the Settings tab.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Creating Plans...' : `Create ${templateCount} Plans`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
