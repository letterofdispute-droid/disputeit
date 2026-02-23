import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

const ARTICLE_TYPES = [
  { value: 'how-to', label: 'How-To' },
  { value: 'mistakes', label: 'Mistakes' },
  { value: 'rights', label: 'Rights' },
  { value: 'sample', label: 'Sample' },
  { value: 'faq', label: 'FAQ' },
  { value: 'case-study', label: 'Case Study' },
  { value: 'comparison', label: 'Comparison' },
  { value: 'checklist', label: 'Checklist' },
];

const KNOWN_VERTICALS = [
  'housing', 'insurance', 'financial', 'employment', 'vehicle',
  'ecommerce', 'utilities', 'contractors', 'hoa', 'refunds',
  'damaged-goods', 'healthcare', 'travel',
];

interface ClusterRow {
  title: string;
  articleType: string;
  keyword: string;
}

const emptyRow = (): ClusterRow => ({ title: '', articleType: 'how-to', keyword: '' });

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CustomCampaignDialog({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const [campaignName, setCampaignName] = useState('');
  const [vertical, setVertical] = useState('');
  const [customVertical, setCustomVertical] = useState('');
  const [pillarTitle, setPillarTitle] = useState('');
  const [clusters, setClusters] = useState<ClusterRow[]>([emptyRow(), emptyRow(), emptyRow()]);
  const [submitting, setSubmitting] = useState(false);

  const effectiveVertical = vertical === '__custom' ? customVertical.trim().toLowerCase() : vertical;

  const addRow = () => {
    if (clusters.length < 10) setClusters([...clusters, emptyRow()]);
  };

  const removeRow = (i: number) => {
    setClusters(clusters.filter((_, idx) => idx !== i));
  };

  const updateRow = (i: number, field: keyof ClusterRow, value: string) => {
    const updated = [...clusters];
    updated[i] = { ...updated[i], [field]: value };
    setClusters(updated);
  };

  const validClusters = clusters.filter(c => c.title.trim());
  const canSubmit = campaignName.trim() && effectiveVertical && pillarTitle.trim() && validClusters.length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);

    try {
      // Create content_plan
      const slug = campaignName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const { data: plan, error: planError } = await supabase
        .from('content_plans')
        .insert({
          template_slug: `campaign-${slug}-${Date.now()}`,
          template_name: campaignName.trim(),
          category_id: effectiveVertical,
          value_tier: 'high',
          target_article_count: validClusters.length + 1,
        })
        .select('id')
        .single();

      if (planError) throw planError;

      // Insert pillar + cluster queue items
      const queueItems = [
        {
          plan_id: plan.id,
          article_type: 'pillar' as const,
          suggested_title: pillarTitle.trim(),
          priority: 1,
          status: 'queued' as const,
          primary_keyword: validClusters[0]?.keyword || null,
        },
        ...validClusters.map((c, i) => ({
          plan_id: plan.id,
          article_type: c.articleType,
          suggested_title: c.title.trim(),
          primary_keyword: c.keyword.trim() || null,
          priority: i + 10,
          status: 'queued' as const,
        })),
      ];

      const { error: queueError } = await supabase.from('content_queue').insert(queueItems);
      if (queueError) throw queueError;

      toast({ title: 'Campaign created', description: `${queueItems.length} articles queued for "${campaignName}"` });
      queryClient.invalidateQueries({ queryKey: ['content-plans'] });
      queryClient.invalidateQueries({ queryKey: ['template-progress'] });
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
      queryClient.invalidateQueries({ queryKey: ['seo-metrics'] });

      // Reset form
      setCampaignName('');
      setVertical('');
      setCustomVertical('');
      setPillarTitle('');
      setClusters([emptyRow(), emptyRow(), emptyRow()]);
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: 'Failed to create campaign', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Custom Campaign</DialogTitle>
          <DialogDescription>Create a pillar + cluster content campaign from scratch.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Campaign Name & Vertical */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Campaign Name</Label>
              <Input value={campaignName} onChange={e => setCampaignName(e.target.value)} placeholder="e.g. Home Warranty Disputes" />
            </div>
            <div className="space-y-2">
              <Label>Vertical</Label>
              <Select value={vertical} onValueChange={setVertical}>
                <SelectTrigger><SelectValue placeholder="Select vertical" /></SelectTrigger>
                <SelectContent>
                  {KNOWN_VERTICALS.map(v => (
                    <SelectItem key={v} value={v} className="capitalize">{v}</SelectItem>
                  ))}
                  <SelectItem value="__custom">Custom...</SelectItem>
                </SelectContent>
              </Select>
              {vertical === '__custom' && (
                <Input value={customVertical} onChange={e => setCustomVertical(e.target.value)} placeholder="Enter custom vertical" className="mt-1" />
              )}
            </div>
          </div>

          {/* Pillar Title */}
          <div className="space-y-2">
            <Label>Pillar Article Title</Label>
            <Input value={pillarTitle} onChange={e => setPillarTitle(e.target.value)} placeholder="e.g. The Complete Guide to Home Warranty Disputes" />
          </div>

          {/* Cluster Articles */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Cluster Articles ({validClusters.length})</Label>
              <Button type="button" size="sm" variant="outline" onClick={addRow} disabled={clusters.length >= 10}>
                <Plus className="h-3 w-3 mr-1" /> Add
              </Button>
            </div>
            <div className="space-y-2">
              {clusters.map((row, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={row.title}
                    onChange={e => updateRow(i, 'title', e.target.value)}
                    placeholder="Article title"
                    className="flex-1"
                  />
                  <Select value={row.articleType} onValueChange={v => updateRow(i, 'articleType', v)}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ARTICLE_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={row.keyword}
                    onChange={e => updateRow(i, 'keyword', e.target.value)}
                    placeholder="Target keyword"
                    className="w-40"
                  />
                  {clusters.length > 1 && (
                    <Button type="button" size="icon" variant="ghost" onClick={() => removeRow(i)} className="shrink-0">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</> : `Create Campaign (${validClusters.length + 1} articles)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
