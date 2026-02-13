import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import OrderStats from '@/components/admin/orders/OrderStats';
import OrderFilters from '@/components/admin/orders/OrderFilters';
import OrdersTable from '@/components/admin/orders/OrdersTable';
import OrderDetailModal from '@/components/admin/orders/OrderDetailModal';
import RefundDialog from '@/components/admin/orders/RefundDialog';
import ExportButton from '@/components/admin/export/ExportButton';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Lean Order type for list view (no letter_content)
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

const LEAN_ORDER_SELECT = 'id, email, template_name, template_slug, purchase_type, amount_cents, status, created_at, stripe_payment_intent_id, pdf_url, refunded_at, refund_reason, user_id';
const ORDERS_PER_PAGE = 50;

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
  const [currentPage, setCurrentPage] = useState(1);

  const offset = (currentPage - 1) * ORDERS_PER_PAGE;

  // Lean list query - no letter_content, with pagination
  const { data: ordersData, isLoading, refetch } = useQuery({
    queryKey: ['admin-orders', search, statusFilter, dateRange, currentPage],
    queryFn: async () => {
      let query = supabase
        .from('letter_purchases')
        .select(LEAN_ORDER_SELECT, { count: 'exact' })
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

      query = query.range(offset, offset + ORDERS_PER_PAGE - 1);

      const { data, error, count } = await query;
      if (error) throw error;
      return { orders: (data || []) as Order[], totalCount: count || 0 };
    },
  });

  const orders = ordersData?.orders || [];
  const totalCount = ordersData?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / ORDERS_PER_PAGE);

  // Reset to page 1 when filters change
  const handleSearchChange = (val: string) => { setSearch(val); setCurrentPage(1); };
  const handleStatusChange = (val: string) => { setStatusFilter(val); setCurrentPage(1); };
  const handleDateRangeChange = (val: { from: Date | undefined; to: Date | undefined }) => { setDateRange(val); setCurrentPage(1); };

  // Server-side stats using count queries (no 1000-row limit)
  const { data: stats } = useQuery({
    queryKey: ['admin-order-stats'],
    queryFn: async () => {
      const [completed, pending, refunded, creditRedemptions] = await Promise.all([
        supabase.from('letter_purchases').select('amount_cents').eq('status', 'completed').gt('amount_cents', 0),
        supabase.from('letter_purchases').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('letter_purchases').select('amount_cents').eq('status', 'refunded'),
        supabase.from('letter_purchases').select('*', { count: 'exact', head: true }).eq('status', 'completed').eq('amount_cents', 0),
      ]);

      return {
        totalRevenue: (completed.data || []).reduce((sum, o) => sum + o.amount_cents, 0),
        paidOrders: completed.data?.length || 0,
        creditRedemptions: creditRedemptions.count || 0,
        pendingOrders: pending.count || 0,
        refundedAmount: (refunded.data || []).reduce((sum, o) => sum + o.amount_cents, 0),
      };
    },
    staleTime: 30000,
  });

  // Fetch full order detail (including letter_content) on-demand for the modal
  const handleViewDetails = async (order: Order) => {
    if (order.letter_content) {
      setSelectedOrder(order);
      return;
    }
    const { data } = await supabase
      .from('letter_purchases')
      .select('letter_content, docx_url, stripe_session_id')
      .eq('id', order.id)
      .single();
    
    setSelectedOrder({
      ...order,
      letter_content: data?.letter_content || '',
      docx_url: data?.docx_url || null,
      stripe_session_id: data?.stripe_session_id || null,
    });
  };

  const handleRefundComplete = () => {
    setRefundOrder(null);
    refetch();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 overflow-x-hidden max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold text-foreground">
            Orders & Payments
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage all purchases, view order details, and process refunds
          </p>
        </div>
        <ExportButton 
          exportType="orders" 
          showDatePicker 
          label="Export Orders"
        />
      </div>

      <OrderStats stats={stats || { totalRevenue: 0, paidOrders: 0, creditRedemptions: 0, pendingOrders: 0, refundedAmount: 0 }} />

      <OrderFilters
        search={search}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        onStatusChange={handleStatusChange}
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
      />

      <OrdersTable
        orders={orders}
        isLoading={isLoading}
        onViewDetails={handleViewDetails}
        onRefund={setRefundOrder}
        isMobile={isMobile}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {offset + 1}–{Math.min(offset + ORDERS_PER_PAGE, totalCount)} of {totalCount}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="flex items-center text-sm px-2">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

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
