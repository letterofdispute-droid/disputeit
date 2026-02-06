import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Order } from '@/pages/admin/AdminOrders';

interface RefundDialogProps {
  order: Order | null;
  onClose: () => void;
  onComplete: () => void;
}

const REFUND_REASONS = [
  { value: 'customer_request', label: 'Customer Request' },
  { value: 'duplicate', label: 'Duplicate Purchase' },
  { value: 'fraudulent', label: 'Fraudulent' },
  { value: 'product_issue', label: 'Product/Template Issue' },
  { value: 'other', label: 'Other' },
];

const RefundDialog = ({ order, onClose, onComplete }: RefundDialogProps) => {
  const { toast } = useToast();
  const [reason, setReason] = useState('customer_request');
  const [notes, setNotes] = useState('');

  const refundMutation = useMutation({
    mutationFn: async () => {
      if (!order) throw new Error('No order selected');

      const { data, error } = await supabase.functions.invoke('process-refund', {
        body: {
          orderId: order.id,
          reason: reason,
          notes: notes,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Refund Processed',
        description: 'The refund has been successfully processed.',
      });
      setReason('customer_request');
      setNotes('');
      onComplete();
    },
    onError: (error: Error) => {
      toast({
        title: 'Refund Failed',
        description: error.message || 'Failed to process refund. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  if (!order) return null;

  return (
    <AlertDialog open={!!order} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Process Refund
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left space-y-2">
            <p>You are about to refund this order. This action cannot be undone.</p>
            <div className="bg-muted p-3 rounded-md mt-2">
              <p className="font-medium text-foreground">{order.email}</p>
              <p className="text-sm">{order.template_name}</p>
              <p className="text-lg font-bold text-foreground mt-1">
                {formatCurrency(order.amount_cents)}
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Refund Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REFUND_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional details about this refund..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            variant="destructive"
            onClick={() => refundMutation.mutate()}
            disabled={refundMutation.isPending}
            className="w-full"
          >
            {refundMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing Refund...
              </>
            ) : (
              <>
                Confirm Refund ({formatCurrency(order.amount_cents)})
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={refundMutation.isPending}
            className="w-full"
          >
            Cancel
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default RefundDialog;
