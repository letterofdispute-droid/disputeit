import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Loader2, Rocket } from 'lucide-react';
import type { SuggestedCluster } from './types';
import { useGscActions } from './useGscActions';

const ARTICLE_TYPES = ['how-to', 'mistakes', 'rights', 'sample', 'faq', 'case-study', 'comparison', 'checklist'];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  pillarTitle: string;
  pillarType: string;
  vertical: string;
  suggestedClusters?: SuggestedCluster[];
  actionKey: string;
}

export default function CampaignFromQueryDialog({
  open, onOpenChange, query, pillarTitle, pillarType, vertical,
  suggestedClusters, actionKey,
}: Props) {
  const { createCampaign, appliedActions } = useGscActions();
  const [editPillarTitle, setEditPillarTitle] = useState(pillarTitle);
  const [clusters, setClusters] = useState<SuggestedCluster[]>(
    suggestedClusters?.length ? [...suggestedClusters] : [
      { title: '', articleType: 'faq', keyword: '' },
      { title: '', articleType: 'how-to', keyword: '' },
      { title: '', articleType: 'checklist', keyword: '' },
    ]
  );

  const updateCluster = (i: number, field: keyof SuggestedCluster, value: string) => {
    setClusters(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c));
  };

  const addCluster = () => {
    if (clusters.length >= 10) return;
    setClusters(prev => [...prev, { title: '', articleType: 'how-to', keyword: '' }]);
  };

  const removeCluster = (i: number) => {
    setClusters(prev => prev.filter((_, idx) => idx !== i));
  };

  const validClusters = clusters.filter(c => c.title.trim());

  const handleSubmit = () => {
    createCampaign.mutate({
      pillarTitle: editPillarTitle,
      pillarType,
      pillarKeyword: query,
      vertical,
      clusters: validClusters,
      actionKey,
    });
  };

  const isApplied = appliedActions.has(actionKey);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" /> Create Campaign from Query
          </DialogTitle>
          <DialogDescription>
            Build a pillar + cluster content campaign targeting "{query}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Pillar */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Pillar Article</label>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Pillar</Badge>
              <Badge variant="outline">{vertical}</Badge>
            </div>
            <Input
              value={editPillarTitle}
              onChange={e => setEditPillarTitle(e.target.value)}
              placeholder="Pillar article title"
            />
          </div>

          {/* Clusters */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Cluster Articles ({clusters.length})</label>
              <Button size="sm" variant="outline" onClick={addCluster} disabled={clusters.length >= 10}>
                <Plus className="h-3 w-3 mr-1" /> Add
              </Button>
            </div>
            {clusters.map((c, i) => (
              <div key={i} className="flex gap-2 items-start border rounded-lg p-3">
                <div className="flex-1 space-y-2">
                  <Input
                    value={c.title}
                    onChange={e => updateCluster(i, 'title', e.target.value)}
                    placeholder="Cluster article title"
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Input
                      value={c.keyword}
                      onChange={e => updateCluster(i, 'keyword', e.target.value)}
                      placeholder="Target keyword"
                      className="text-sm flex-1"
                    />
                    <select
                      value={c.articleType}
                      onChange={e => updateCluster(i, 'articleType', e.target.value)}
                      className="text-sm border rounded-md px-2 bg-background"
                    >
                      {ARTICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => removeCluster(i)} className="shrink-0">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={!editPillarTitle.trim() || isApplied || createCampaign.isPending}
          >
            {createCampaign.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Rocket className="h-4 w-4 mr-1" />}
            {isApplied ? 'Created ✓' : `Create Campaign (1 + ${validClusters.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}