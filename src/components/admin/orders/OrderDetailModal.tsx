import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExternalLink, RotateCcw, FileText, Download } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Order } from '@/pages/admin/AdminOrders';

interface OrderDetailModalProps {
  order: Order | null;
  onClose: () => void;
  onRefund: (order: Order) => void;
}

const OrderDetailModal = ({ order, onClose, onRefund }: OrderDetailModalProps) => {
  const isMobile = useIsMobile();

  if (!order) return null;

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case 'refunded':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Refunded</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const Content = () => (
    <div className="space-y-6">
      {/* Status and Amount */}
      <div className="flex items-center justify-between">
        {getStatusBadge(order.status)}
        <span className="text-2xl font-bold">{formatCurrency(order.amount_cents)}</span>
      </div>

      <Separator />

      {/* Order Details */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">Order Information</h3>
        
        <div className="grid gap-3 text-sm">
          <div className="flex flex-col">
            <span className="text-muted-foreground">Order ID</span>
            <span className="font-mono text-foreground">{order.id}</span>
          </div>
          
          <div className="flex flex-col">
            <span className="text-muted-foreground">Customer Email</span>
            <span className="text-foreground">{order.email}</span>
          </div>
          
          <div className="flex flex-col">
            <span className="text-muted-foreground">Template</span>
            <span className="text-foreground">{order.template_name}</span>
          </div>
          
          <div className="flex flex-col">
            <span className="text-muted-foreground">Purchase Type</span>
            <span className="text-foreground">
              {order.purchase_type === 'pdf_edit' ? 'PDF + Edit Access' : 'PDF Only'}
            </span>
          </div>
          
          <div className="flex flex-col">
            <span className="text-muted-foreground">Purchase Date</span>
            <span className="text-foreground">
              {format(new Date(order.created_at), 'MMMM d, yyyy h:mm a')}
            </span>
          </div>

          {order.stripe_payment_intent_id && (
            <div className="flex flex-col">
              <span className="text-muted-foreground">Stripe Payment Intent</span>
              <a
                href={`https://dashboard.stripe.com/payments/${order.stripe_payment_intent_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
              >
                {order.stripe_payment_intent_id}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          {order.refunded_at && (
            <>
              <div className="flex flex-col">
                <span className="text-muted-foreground">Refunded At</span>
                <span className="text-foreground">
                  {format(new Date(order.refunded_at), 'MMMM d, yyyy h:mm a')}
                </span>
              </div>
              {order.refund_reason && (
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Refund Reason</span>
                  <span className="text-foreground">{order.refund_reason}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Separator />

      {/* Documents */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">Documents</h3>
        <div className="flex flex-col gap-2">
          {order.pdf_url && (
            <Button variant="outline" asChild className="w-full justify-start">
              <a href={order.pdf_url} target="_blank" rel="noopener noreferrer">
                <FileText className="h-4 w-4 mr-2" />
                Download PDF
                <Download className="h-4 w-4 ml-auto" />
              </a>
            </Button>
          )}
          {order.docx_url && (
            <Button variant="outline" asChild className="w-full justify-start">
              <a href={order.docx_url} target="_blank" rel="noopener noreferrer">
                <FileText className="h-4 w-4 mr-2" />
                Download DOCX
                <Download className="h-4 w-4 ml-auto" />
              </a>
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {/* Letter Preview */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">Letter Content Preview</h3>
        <ScrollArea className="h-[200px] rounded-md border p-4">
          <pre className="text-sm whitespace-pre-wrap font-sans text-muted-foreground">
            {order.letter_content.slice(0, 1000)}
            {order.letter_content.length > 1000 && '...'}
          </pre>
        </ScrollArea>
      </div>

      {/* Actions - Stacked */}
      <div className="flex flex-col gap-2 pt-4">
        {order.status === 'completed' && (
          <Button
            variant="destructive"
            onClick={() => onRefund(order)}
            className="w-full"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Process Refund
          </Button>
        )}
        <Button variant="outline" onClick={onClose} className="w-full">
          Close
        </Button>
      </div>
    </div>
  );

  // Mobile: Drawer (bottom sheet)
  if (isMobile) {
    return (
      <Drawer open={!!order} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Order Details</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto">
            <Content />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Dialog
  return (
    <Dialog open={!!order} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order Details</DialogTitle>
        </DialogHeader>
        <Content />
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailModal;
