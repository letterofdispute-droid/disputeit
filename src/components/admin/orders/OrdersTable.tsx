import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye, RotateCcw, Loader2 } from 'lucide-react';
import type { Order } from '@/pages/admin/AdminOrders';

interface OrdersTableProps {
  orders: Order[];
  isLoading: boolean;
  onViewDetails: (order: Order) => void;
  onRefund: (order: Order) => void;
  isMobile: boolean;
}

const OrdersTable = ({ orders, isLoading, onViewDetails, onRefund, isMobile }: OrdersTableProps) => {
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

  const getPurchaseTypeBadge = (type: string) => {
    return type === 'pdf_edit' ? (
      <Badge variant="outline" className="text-xs">PDF + Edit</Badge>
    ) : (
      <Badge variant="outline" className="text-xs">PDF Only</Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No orders found</p>
        </CardContent>
      </Card>
    );
  }

  // Mobile: Card-based layout
  if (isMobile) {
    return (
      <div className="space-y-3">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-foreground truncate max-w-[200px]">
                    {order.email}
                  </p>
                  <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                    {order.template_name}
                  </p>
                </div>
                {getStatusBadge(order.status)}
              </div>

              <div className="flex flex-wrap gap-2 items-center text-sm">
                {getPurchaseTypeBadge(order.purchase_type)}
                <span className="font-semibold">{formatCurrency(order.amount_cents)}</span>
                <span className="text-muted-foreground">
                  {format(new Date(order.created_at), 'MMM d, yyyy')}
                </span>
              </div>

              {/* Stacked buttons */}
              <div className="flex flex-col gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewDetails(order)}
                  className="w-full"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
                {order.status === 'completed' && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onRefund(order)}
                    className="w-full"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Refund
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Desktop: Table layout
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Template</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium max-w-[200px] truncate">
                {order.email}
              </TableCell>
              <TableCell className="max-w-[200px] truncate">
                {order.template_name}
              </TableCell>
              <TableCell>{getPurchaseTypeBadge(order.purchase_type)}</TableCell>
              <TableCell className="font-semibold">
                {formatCurrency(order.amount_cents)}
              </TableCell>
              <TableCell>{getStatusBadge(order.status)}</TableCell>
              <TableCell className="text-muted-foreground">
                {format(new Date(order.created_at), 'MMM d, yyyy')}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails(order)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {order.status === 'completed' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRefund(order)}
                      className="text-destructive hover:text-destructive"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};

export default OrdersTable;
