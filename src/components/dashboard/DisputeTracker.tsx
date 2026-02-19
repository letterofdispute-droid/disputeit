import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, TrendingUp, CheckCircle2, Clock, AlertCircle,
  DollarSign, FileText, ArrowRight, Trash2, Edit3, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

type DisputeStatus = 'in_progress' | 'resolved' | 'escalated' | 'abandoned';

interface DisputeOutcome {
  id: string;
  title: string;
  category: string | null;
  status: DisputeStatus;
  amount_disputed: number | null;
  amount_recovered: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_CONFIG: Record<DisputeStatus, { label: string; color: string; icon: React.ElementType }> = {
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', icon: Clock },
  resolved:    { label: 'Resolved ✓', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', icon: CheckCircle2 },
  escalated:   { label: 'Escalated', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300', icon: AlertCircle },
  abandoned:   { label: 'Abandoned', color: 'bg-muted text-muted-foreground', icon: X },
};

const CATEGORY_LABELS: Record<string, string> = {
  refunds: 'Refunds & Returns', housing: 'Housing', vehicle: 'Vehicle',
  financial: 'Financial', insurance: 'Insurance', employment: 'Employment',
  ecommerce: 'E-Commerce', utilities: 'Utilities', contractors: 'Contractors',
  'damaged-goods': 'Damaged Goods', travel: 'Travel', hoa: 'HOA', healthcare: 'Healthcare',
};

const DEFAULT_FORM = { title: '', category: '', status: 'in_progress' as DisputeStatus, amount_disputed: '', amount_recovered: '', notes: '' };

export default function DisputeTracker() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);

  const { data: disputes, isLoading } = useQuery({
    queryKey: ['dispute-outcomes', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dispute_outcomes')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as DisputeOutcome[];
    },
    enabled: !!user,
  });

  const upsertMutation = useMutation({
    mutationFn: async (payload: Partial<DisputeOutcome>) => {
      if (editingId) {
        const { error } = await supabase
          .from('dispute_outcomes')
          .update(payload as Record<string, unknown>)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('dispute_outcomes')
          .insert({ ...(payload as Record<string, unknown>), user_id: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispute-outcomes'] });
      setDialogOpen(false);
      setEditingId(null);
      setForm(DEFAULT_FORM);
      toast({ title: editingId ? 'Dispute updated' : 'Dispute added', description: editingId ? 'Your dispute has been updated.' : 'Your dispute is now being tracked.' });
    },
    onError: (e: Error) => {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('dispute_outcomes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispute-outcomes'] });
      toast({ title: 'Dispute removed' });
    },
  });

  const handleSubmit = () => {
    if (!form.title.trim()) {
      toast({ title: 'Title required', variant: 'destructive' });
      return;
    }
    upsertMutation.mutate({
      title: form.title,
      category: form.category || null,
      status: form.status,
      amount_disputed: form.amount_disputed ? parseFloat(form.amount_disputed) : null,
      amount_recovered: form.amount_recovered ? parseFloat(form.amount_recovered) : null,
      notes: form.notes || null,
    });
  };

  const openEdit = (d: DisputeOutcome) => {
    setEditingId(d.id);
    setForm({
      title: d.title,
      category: d.category || '',
      status: d.status,
      amount_disputed: d.amount_disputed?.toString() || '',
      amount_recovered: d.amount_recovered?.toString() || '',
      notes: d.notes || '',
    });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditingId(null);
    setForm(DEFAULT_FORM);
    setDialogOpen(true);
  };

  // Stats
  const resolved = disputes?.filter(d => d.status === 'resolved') || [];
  const totalDisputed = disputes?.reduce((sum, d) => sum + (d.amount_disputed || 0), 0) || 0;
  const totalRecovered = resolved.reduce((sum, d) => sum + (d.amount_recovered || 0), 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      {disputes && disputes.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Active Disputes', value: disputes.filter(d => d.status === 'in_progress').length, icon: Clock, color: 'text-blue-600' },
            { label: 'Resolved', value: resolved.length, icon: CheckCircle2, color: 'text-green-600' },
            { label: 'Amount Disputed', value: `$${totalDisputed.toLocaleString()}`, icon: DollarSign, color: 'text-muted-foreground' },
            { label: 'Amount Recovered', value: `$${totalRecovered.toLocaleString()}`, icon: TrendingUp, color: 'text-green-600' },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-4 bg-muted/30 rounded-lg">
              <stat.icon className={cn('h-5 w-5 mx-auto mb-1', stat.color)} />
              <p className="text-xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add Button */}
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingId(null); setForm(DEFAULT_FORM); } }}>
          <DialogTrigger asChild>
            <Button variant="accent" size="sm" onClick={openNew} className="gap-2">
              <Plus className="h-4 w-4" />
              Track New Dispute
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-serif">{editingId ? 'Edit Dispute' : 'Track a New Dispute'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Dispute Title *</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g., Refund for defective laptop from BestBuy" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">General</SelectItem>
                      {Object.entries(CATEGORY_LABELS).map(([id, label]) => (
                        <SelectItem key={id} value={id}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as DisputeStatus }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Amount Disputed ($)</Label>
                  <Input type="number" value={form.amount_disputed} onChange={e => setForm(f => ({ ...f, amount_disputed: e.target.value }))} placeholder="0.00" min="0" step="0.01" />
                </div>
                <div className="space-y-1.5">
                  <Label>Amount Recovered ($)</Label>
                  <Input type="number" value={form.amount_recovered} onChange={e => setForm(f => ({ ...f, amount_recovered: e.target.value }))} placeholder="0.00" min="0" step="0.01" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Track what happened, responses received, next steps..." className="min-h-[80px]" />
              </div>
              <Button onClick={handleSubmit} disabled={upsertMutation.isPending} className="w-full gap-2">
                {upsertMutation.isPending ? 'Saving...' : editingId ? 'Update Dispute' : 'Add Dispute'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
        </div>
      ) : !disputes || disputes.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-foreground mb-2">No disputes tracked yet</h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto text-sm">
            Track your disputes to log what happened, monitor deadlines, and record outcomes.
          </p>
          <Button variant="accent" size="sm" onClick={openNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Track Your First Dispute
          </Button>
          <div className="mt-6">
            <Link to="/templates" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
              Need to write a letter first? Browse templates <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {disputes.map((d) => {
            const config = STATUS_CONFIG[d.status] || STATUS_CONFIG.in_progress;
            const StatusIcon = config.icon;
            return (
              <Card key={d.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="p-1.5 bg-primary/10 rounded-lg flex-shrink-0 mt-0.5">
                        <StatusIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className="font-medium text-foreground truncate">{d.title}</h4>
                          <Badge className={cn('text-xs', config.color)}>{config.label}</Badge>
                          {d.category && <Badge variant="outline" className="text-xs">{CATEGORY_LABELS[d.category] || d.category}</Badge>}
                        </div>
                        {(d.amount_disputed || d.amount_recovered) && (
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            {d.amount_disputed && <span>Disputed: <span className="font-medium text-foreground">${d.amount_disputed.toLocaleString()}</span></span>}
                            {d.amount_recovered && <span>Recovered: <span className="font-medium text-green-600">${d.amount_recovered.toLocaleString()}</span></span>}
                          </div>
                        )}
                        {d.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{d.notes}</p>}
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(d.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(d)}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(d.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
