import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Gift, AlertCircle } from 'lucide-react';
import { useUserCredits } from '@/hooks/useUserCredits';
import { useToast } from '@/hooks/use-toast';

interface GrantCreditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userEmail: string;
  currentActiveCredits: number;
  onSuccess: () => void;
}

const GrantCreditDialog = ({
  open,
  onOpenChange,
  userId,
  userEmail,
  currentActiveCredits,
  onSuccess,
}: GrantCreditDialogProps) => {
  const [reason, setReason] = useState('');
  const [isGranting, setIsGranting] = useState(false);
  const { grantCredit } = useUserCredits();
  const { toast } = useToast();

  const canGrant = currentActiveCredits < 2;

  const handleGrant = async () => {
    if (!canGrant) return;

    setIsGranting(true);
    try {
      await grantCredit(userId, reason.trim() || undefined, userEmail);
      toast({
        title: 'Credit granted',
        description: `1 credit has been added to ${userEmail}'s account. They'll receive an email notification.`,
      });
      setReason('');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Failed to grant credit',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsGranting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Grant Goodwill Credit
          </DialogTitle>
          <DialogDescription>
            Grant a free letter generation credit to {userEmail}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current status */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm">
              <span className="text-muted-foreground">Current credits:</span>{' '}
              <span className="font-medium text-foreground">
                {currentActiveCredits}/2
              </span>
            </p>
            {currentActiveCredits >= 2 && (
              <div className="flex items-center gap-2 mt-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                User already has maximum credits
              </div>
            )}
          </div>

          {/* Credit info */}
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Credit equals 1 free letter (PDF + Edit Access)</p>
            <p>• Expires in 30 days if unused</p>
            <p>• User can redeem at checkout</p>
          </div>

          {/* Reason field */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              placeholder="e.g., Compensation for service issue..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              disabled={!canGrant || isGranting}
            />
            <p className="text-xs text-muted-foreground">
              This is for internal documentation only
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleGrant}
            disabled={!canGrant || isGranting}
          >
            {isGranting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Granting...
              </>
            ) : (
              <>
                <Gift className="h-4 w-4 mr-2" />
                Grant 1 Credit
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GrantCreditDialog;
