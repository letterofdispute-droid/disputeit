import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, TrendingUp, CheckCircle2, Clock, AlertCircle,
  DollarSign, FileText, ArrowRight, Trash2, Edit3, X,
  ChevronDown, ChevronUp, ListChecks
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { buildResolutionSteps } from '@/components/letter/ResolutionPlanPanel';

type DisputeStatus = 'in_progress' | 'resolved' | 'escalated' | 'abandoned';

interface ResolutionStepData {
  step: number;
  title: string;
  done: boolean;
  link?: string;
  linkLabel?: string;
  deadline?: string;
}

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
  resolution_steps: ResolutionStepData[] | null;
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

// Map internal category IDs to ResolutionPlanPanel's templateCategory format
const CATEGORY_TO_TEMPLATE: Record<string, string> = {
  financial: 'Financial & Banking',
  vehicle: 'Vehicle',
  housing: 'Housing & Tenant Rights',
  refunds: 'Refunds & Retail',
  travel: 'Travel & Hospitality',
  utilities: 'Utilities & Telecoms',
  employment: 'Employment',
  ecommerce: 'E-commerce & Online Shopping',
  insurance: 'Insurance',
  contractors: 'Contractors & Home Services',
  'damaged-goods': 'Damaged Goods & Products',
  hoa: 'HOA & Neighbors',
  healthcare: 'Healthcare',
};

const DEFAULT_FORM = {
  title: '', category: '', status: 'in_progress' as DisputeStatus,
  amount_disputed: '', amount_recovered: '', notes: '',
};

function buildDefaultSteps(category: string): ResolutionStepData[] {
  const templateCategory = CATEGORY_TO_TEMPLATE[category] || '';
  if (!templateCategory) return getGenericSteps();
  const steps = buildResolutionSteps(templateCategory);
  return steps.map(s => ({
    step: s.step,
    title: s.title,
    done: false,
    link: s.link,
    linkLabel: s.linkLabel,
    deadline: s.deadline,
  }));
}

function getGenericSteps(): ResolutionStepData[] {
  return [
    { step: 1, title: 'Send demand letter', done: false },
    { step: 2, title: 'File agency complaint', done: false },
    { step: 3, title: 'Escalate to small claims court', done: false },
  ];
}

// Step checklist shown inside each dispute card
function StepChecklist({ dispute }: { dispute: DisputeOutcome }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const steps = dispute.resolution_steps || [];
  const completedCount = steps.filter(s => s.done).length;

  const toggleStep = async (stepNum: number, done: boolean) => {
    const updated = steps.map(s => s.step === stepNum ? { ...s, done } : s);
    const { error } = await supabase
      .from('dispute_outcomes')
      .update({ resolution_steps: updated as unknown as import('@/integrations/supabase/types').Json })
      .eq('id', dispute.id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      queryClient.invalidateQueries({ queryKey: ['dispute-outcomes'] });
    }
  };

  if (steps.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-border/50 space-y-1.5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <ListChecks className="h-3.5 w-3.5" />
          Resolution Steps
        </span>
        <span className="text-xs text-muted-foreground">{completedCount}/{steps.length} done</span>
      </div>
      {/* Progress bar */}
      <div className="h-1 bg-muted rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${steps.length > 0 ? (completedCount / steps.length) * 100 : 0}%` }}
        />
      </div>
      {steps.map((s) => (
        <div key={s.step} className="flex items-start gap-2.5 group">
          <Checkbox
            id={`${dispute.id}-step-${s.step}`}
            checked={s.done}
            onCheckedChange={(checked) => toggleStep(s.step, !!checked)}
            className="mt-0.5 flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <label
              htmlFor={`${dispute.id}-step-${s.step}`}
              className={cn(
                'text-xs cursor-pointer leading-tight',
                s.done ? 'line-through text-muted-foreground' : 'text-foreground'
              )}
            >
              {s.title}
            </label>
            {s.deadline && !s.done && (
              <p className="text-xs text-warning mt-0.5">{s.deadline}</p>
            )}
          </div>
          {s.link && !s.done && (
            <a
              href={s.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline whitespace-nowrap flex-shrink-0"
            >
              {s.linkLabel || 'Open →'}
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

// Individual dispute card with expandable checklist
function DisputeCard({
  dispute,
  onEdit,
  onDelete,
}: {
  dispute: DisputeOutcome;
  onEdit: (d: DisputeOutcome) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const config = STATUS_CONFIG[dispute.status] || STATUS_CONFIG.in_progress;
  const StatusIcon = config.icon;
  const steps = dispute.resolution_steps || [];
  const completedCount = steps.filter(s => s.done).length;
  const hasSteps = steps.length > 0;

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="p-1.5 bg-primary/10 rounded-lg flex-shrink-0 mt-0.5">
              <StatusIcon className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h4 className="font-medium text-foreground truncate">{dispute.title}</h4>
                <Badge className={cn('text-xs', config.color)}>{config.label}</Badge>
                {dispute.category && (
                  <Badge variant="outline" className="text-xs">
                    {CATEGORY_LABELS[dispute.category] || dispute.category}
                  </Badge>
                )}
              </div>
              {(dispute.amount_disputed || dispute.amount_recovered) && (
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  {dispute.amount_disputed && (
                    <span>Disputed: <span className="font-medium text-foreground">${dispute.amount_disputed.toLocaleString()}</span></span>
                  )}
                  {dispute.amount_recovered && (
                    <span>Recovered: <span className="font-medium text-success">${dispute.amount_recovered.toLocaleString()}</span></span>
                  )}
                </div>
              )}
              {dispute.notes && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{dispute.notes}</p>
              )}
              <div className="flex items-center gap-3 mt-1">
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(dispute.created_at), { addSuffix: true })}
                </p>
                {hasSteps && (
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    {completedCount}/{steps.length} steps
                  </button>
                )}
              </div>
              {expanded && hasSteps && <StepChecklist dispute={dispute} />}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(dispute)}>
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(dispute.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

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
      return (data as unknown) as DisputeOutcome[];
    },
    enabled: !!user,
  });

  const upsertMutation = useMutation({
    mutationFn: async (payload: Partial<DisputeOutcome> & { _isNew?: boolean }) => {
      const { _isNew, ...rest } = payload;
      if (editingId) {
        const { error } = await supabase
          .from('dispute_outcomes')
          .update(rest as Record<string, unknown>)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        // Auto-populate steps from the category
        const steps = rest.category ? buildDefaultSteps(rest.category) : getGenericSteps();
        const { error } = await supabase
          .from('dispute_outcomes')
          .insert({
            title: rest.title!,
            category: rest.category ?? null,
            status: rest.status ?? 'in_progress',
            amount_disputed: rest.amount_disputed ?? null,
            amount_recovered: rest.amount_recovered ?? null,
            notes: rest.notes ?? null,
            resolution_steps: steps as unknown as import('@/integrations/supabase/types').Json,
            user_id: user!.id,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispute-outcomes'] });
      setDialogOpen(false);
      setEditingId(null);
      setForm(DEFAULT_FORM);
      toast({
        title: editingId ? 'Dispute updated' : 'Dispute added',
        description: editingId ? 'Your dispute has been updated.' : 'Your dispute is now being tracked with a resolution checklist.',
      });
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
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) { setEditingId(null); setForm(DEFAULT_FORM); }
          }}
        >
          <DialogTrigger asChild>
            <Button variant="accent" size="sm" onClick={openNew} className="gap-2">
              <Plus className="h-4 w-4" />
              Track New Dispute
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-serif">
                {editingId ? 'Edit Dispute' : 'Track a New Dispute'}
              </DialogTitle>
            </DialogHeader>
            {!editingId && (
              <p className="text-xs text-muted-foreground -mt-1">
                A resolution checklist will be auto-generated based on your category.
              </p>
            )}
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Dispute Title *</Label>
                <Input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g., Refund for defective laptop from BestBuy"
                />
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
                  <Input
                    type="number"
                    value={form.amount_disputed}
                    onChange={e => setForm(f => ({ ...f, amount_disputed: e.target.value }))}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Amount Recovered ($)</Label>
                  <Input
                    type="number"
                    value={form.amount_recovered}
                    onChange={e => setForm(f => ({ ...f, amount_recovered: e.target.value }))}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Track what happened, responses received, next steps..."
                  className="min-h-[80px]"
                />
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
            Track your disputes to log what happened, monitor deadlines, and check off resolution steps.
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
          {disputes.map((d) => (
            <DisputeCard
              key={d.id}
              dispute={d}
              onEdit={openEdit}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
