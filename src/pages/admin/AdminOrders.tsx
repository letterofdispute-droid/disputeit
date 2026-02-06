import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import OrderStats from '@/components/admin/orders/OrderStats';
import OrderFilters from '@/components/admin/orders/OrderFilters';
import OrdersTable from '@/components/admin/orders/OrdersTable';
import OrderDetailModal from '@/components/admin/orders/OrderDetailModal';
import RefundDialog from '@/components/admin/orders/RefundDialog';
import { useIsMobile } from '@/hooks/use-mobile';

export interface Order {
  id: string;
  email: string;
  template_name: string;
  template_slug: string;
  purchase_type: string;
  amount_cents: number;
  status: string;
  created_at: string;
  stripe_payment_intent_id: string | null;
  stripe_session_id: string | null;
  letter_content: string;
  pdf_url: string | null;
  docx_url: string | null;
  refunded_at: string | null;
  refund_reason: string | null;
  user_id: string | null;
}

const AdminOrders = () => {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [refundOrder, setRefundOrder] = useState<Order | null>(null);

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-orders', search, statusFilter, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('letter_purchases')
        .select('*')
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`email.ilike.%${search}%,template_name.ilike.%${search}%`);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (dateRange.from) {
        query = query.gte('created_at', format(dateRange.from, 'yyyy-MM-dd'));
      }

      if (dateRange.to) {
        query = query.lte('created_at', format(dateRange.to, 'yyyy-MM-dd') + 'T23:59:59');
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Order[];
    },
  });

  const stats = {
    totalRevenue: orders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + o.amount_cents, 0),
    completedOrders: orders.filter(o => o.status === 'completed').length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    refundedAmount: orders
      .filter(o => o.status === 'refunded')
      .reduce((sum, o) => sum + o.amount_cents, 0),
  };

  const handleRefundComplete = () => {
    setRefundOrder(null);
    refetch();
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-serif font-bold text-foreground">
          Orders & Payments
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage all purchases, view order details, and process refunds
        </p>
      </div>

      <OrderStats stats={stats} />

      <OrderFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />

      <OrdersTable
        orders={orders}
        isLoading={isLoading}
        onViewDetails={setSelectedOrder}
        onRefund={setRefundOrder}
        isMobile={isMobile}
      />

      <OrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onRefund={(order) => {
          setSelectedOrder(null);
          setRefundOrder(order);
        }}
      />

      <RefundDialog
        order={refundOrder}
        onClose={() => setRefundOrder(null)}
        onComplete={handleRefundComplete}
      />
    </div>
  );
};

export default AdminOrders;
