import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertTriangle, TrendingUp, Lightbulb, ExternalLink, Plus, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface PageRow {
  path: string;
  views: number;
  sessions: number;
  trend: number;
  lastSeen: string;
  signal: 'Hot' | 'Normal' | 'Cold' | 'Invisible';
}

interface Recommendation {
  title: string;
  description: string;
  actionType: 'create_content' | 'add_keywords' | 'fix_seo' | 'build_links' | 'other';
  impact: 'High' | 'Medium' | 'Low';
  suggestedKeyword?: string;
}

interface Diagnosis {
  trafficSignal: 'Red' | 'Amber' | 'Green';
  rootCause: string;
  recommendations: Recommendation[];
  suggestedVertical?: string;
}

interface PageDiagnosisPanelProps {
  page: PageRow | null;
  period: string;
  onClose: () => void;
}

const signalColors: Record<string, string> = {
  Red: 'text-destructive',
  Amber: 'text-yellow-500',
  Green: 'text-green-500',
};

const impactColors: Record<string, string> = {
  High: 'bg-destructive/10 text-destructive border-destructive/20',
  Medium: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  Low: 'bg-muted text-muted-foreground border-border',
};

const actionIcons: Record<string, React.ReactNode> = {
  create_content: <Lightbulb className="h-4 w-4" />,
  add_keywords: <Plus className="h-4 w-4" />,
  fix_seo: <CheckCircle2 className="h-4 w-4" />,
  build_links: <TrendingUp className="h-4 w-4" />,
  other: <AlertTriangle className="h-4 w-4" />,
};

export const PageDiagnosisPanel = ({ page, period, onClose }: PageDiagnosisPanelProps) => {
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [addedKeywords, setAddedKeywords] = useState<Set<number>>(new Set());
  const navigate = useNavigate();

  const runDiagnosis = async () => {
    if (!page) return;
    setIsLoading(true);
    setDiagnosis(null);
    try {
      const { data, error } = await supabase.functions.invoke('diagnose-page-performance', {
        body: {
          pagePath: page.path,
          viewCount: page.views,
          uniqueSessions: page.sessions,
          trend: page.trend,
          period,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setDiagnosis(data.diagnosis);
    } catch (err: any) {
      toast.error(err.message || 'Failed to run diagnosis');
    } finally {
      setIsLoading(false);
    }
  };

  const addKeywordToPipeline = async (keyword: string, recIndex: number, vertical?: string) => {
    try {
      const { error } = await supabase.from('keyword_targets').insert({
        keyword,
        vertical: vertical || diagnosis?.suggestedVertical || 'general',
        is_seed: true,
        column_group: 'AI Suggested',
        priority: 80,
      });

      if (error) throw error;

      setAddedKeywords(prev => new Set([...prev, recIndex]));
      toast.success(`"${keyword}" added to keyword pipeline`);
    } catch (err: any) {
      toast.error('Failed to add keyword: ' + err.message);
    }
  };

  const goToSEODashboard = () => {
    onClose();
    navigate('/admin/seo');
  };

  // Auto-run when panel opens
  const handleOpen = (open: boolean) => {
    if (open && page && !diagnosis && !isLoading) {
      runDiagnosis();
    }
    if (!open) onClose();
  };

  return (
    <Sheet open={!!page} onOpenChange={handleOpen}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="font-serif text-xl">Page Diagnosis</SheetTitle>
          <SheetDescription className="break-all font-mono text-xs bg-muted px-2 py-1 rounded">
            {page?.path}
          </SheetDescription>
        </SheetHeader>

        {/* Quick stats */}
        {page && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-foreground">{page.views}</div>
              <div className="text-xs text-muted-foreground">Views</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-foreground">{page.sessions}</div>
              <div className="text-xs text-muted-foreground">Sessions</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className={`text-lg font-bold ${page.trend >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                {page.trend > 0 ? '+' : ''}{page.trend}%
              </div>
              <div className="text-xs text-muted-foreground">Trend</div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Analyzing page context...</p>
            <p className="text-xs text-muted-foreground">Checking content coverage, links & keywords</p>
          </div>
        )}

        {/* Diagnosis result */}
        {diagnosis && !isLoading && (
          <div className="space-y-5">
            {/* Traffic signal + root cause */}
            <Card className={`border-2 ${diagnosis.trafficSignal === 'Red' ? 'border-destructive/30 bg-destructive/5' : diagnosis.trafficSignal === 'Amber' ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-green-500/30 bg-green-500/5'}`}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`h-5 w-5 mt-0.5 shrink-0 ${signalColors[diagnosis.trafficSignal]}`} />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                      Root Cause
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">{diagnosis.rootCause}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-3">Recommendations</p>
              <div className="space-y-3">
                {diagnosis.recommendations.map((rec, index) => (
                  <Card key={index} className="border">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{actionIcons[rec.actionType]}</span>
                          <span className="text-sm font-medium text-foreground">{rec.title}</span>
                        </div>
                        <Badge variant="outline" className={`text-xs shrink-0 ${impactColors[rec.impact]}`}>
                          {rec.impact} Impact
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-3">{rec.description}</p>

                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-2">
                        {rec.suggestedKeyword && !addedKeywords.has(index) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7"
                            onClick={() => addKeywordToPipeline(rec.suggestedKeyword!, index, diagnosis.suggestedVertical)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add "{rec.suggestedKeyword}" to Pipeline
                          </Button>
                        )}
                        {rec.suggestedKeyword && addedKeywords.has(index) && (
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle2 className="h-3 w-3" />
                            Added to pipeline
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Bridge actions */}
            <div className="border-t pt-4 flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={goToSEODashboard}
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                View in SEO Dashboard
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={runDiagnosis}
                disabled={isLoading}
              >
                Re-analyse
              </Button>
            </div>
          </div>
        )}

        {/* Empty state — before first run (shouldn't normally show since we auto-run) */}
        {!diagnosis && !isLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Lightbulb className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Ready to analyse this page</p>
            <Button onClick={runDiagnosis} size="sm">Run Diagnosis</Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
