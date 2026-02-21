import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Lightbulb,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BookOpen,
  Target,
  Download,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface ClusterIdea {
  articleType: string;
  title: string;
  keyword: string;
}

interface PillarIdea {
  title: string;
  primaryKeyword: string;
}

interface TopicSuggestion {
  vertical: string;
  categoryName: string;
  opportunityScore: number;
  rationale: string;
  pillar: PillarIdea;
  clusters: ClusterIdea[];
  seedKeywords: string[];
}

const ARTICLE_TYPE_LABELS: Record<string, string> = {
  'how-to': 'How-To Guide',
  'mistakes': 'Mistakes to Avoid',
  'rights': 'Rights Explainer',
  'sample': 'Sample / Example',
  'faq': 'FAQ / Q&A',
  'case-study': 'Case Study',
  'comparison': 'Comparison',
  'checklist': 'Checklist',
};

const ARTICLE_TYPE_COLORS: Record<string, string> = {
  'how-to': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  'mistakes': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  'rights': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  'sample': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  'faq': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  'case-study': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  'comparison': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  'checklist': 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
};

function OpportunityBar({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-muted-foreground';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-semibold text-muted-foreground tabular-nums w-8 text-right">{score}</span>
    </div>
  );
}

function SuggestionCard({
  suggestion,
  index,
  onLoadDirectly,
  loading,
}: {
  suggestion: TopicSuggestion;
  index: number;
  onLoadDirectly: (suggestion: TopicSuggestion) => Promise<void>;
  loading: boolean;
}) {
  const [expanded, setExpanded] = useState(index === 0);
  const [loaded, setLoaded] = useState(false);

  const handleLoad = async () => {
    await onLoadDirectly(suggestion);
    setLoaded(true);
  };

  return (
    <Card className="border border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="outline" className="capitalize text-xs font-medium">
                {suggestion.vertical}
              </Badge>
              <span className="text-xs text-muted-foreground">{suggestion.categoryName}</span>
            </div>
            <CardTitle className="text-base leading-tight">{suggestion.pillar.title}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">{suggestion.pillar.primaryKeyword}</p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0 min-w-[120px]">
            <div className="text-xs text-muted-foreground font-medium mb-0.5">Opportunity</div>
            <OpportunityBar score={suggestion.opportunityScore} />
          </div>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed mt-2">{suggestion.rationale}</p>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Cluster ideas */}
        <div>
          <button
            className="flex items-center gap-1.5 text-xs font-semibold text-foreground/70 hover:text-foreground transition-colors mb-2"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {suggestion.clusters.length} Cluster Articles
          </button>

          {expanded && (
            <div className="space-y-1.5">
              {suggestion.clusters.map((cluster, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-md bg-muted/40">
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${ARTICLE_TYPE_COLORS[cluster.articleType] ?? 'bg-muted text-muted-foreground'}`}
                  >
                    {ARTICLE_TYPE_LABELS[cluster.articleType] ?? cluster.articleType}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm leading-snug">{cluster.title}</p>
                    <p className="text-[11px] text-muted-foreground font-mono truncate">{cluster.keyword}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Seed keywords */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground/70 mb-2">
            <Target className="h-3 w-3" />
            Seed Keywords ({suggestion.seedKeywords.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestion.seedKeywords.map((kw, i) => (
              <span
                key={i}
                className="text-[11px] px-2 py-0.5 rounded-full border border-border bg-muted/50 text-muted-foreground font-mono"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-1 border-t border-border/50">
          <Button
            size="sm"
            variant="default"
            className="gap-1.5"
            onClick={handleLoad}
            disabled={loading || loaded}
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : loaded ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            {loaded ? 'Loaded!' : 'Load Directly'}
          </Button>
          <span className="text-[11px] text-muted-foreground">
            Inserts {suggestion.seedKeywords.length} seeds into keyword pipeline for <strong>{suggestion.vertical}</strong>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TopicDiscovery() {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<TopicSuggestion[]>([]);
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
  const [analyzed, setAnalyzed] = useState(false);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setSuggestions([]);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-content-topics', {});
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error ?? 'Analysis failed');
      setSuggestions(data.suggestions ?? []);
      setAnalyzed(true);
      toast({
        title: `${data.suggestions?.length ?? 0} topic suggestions generated`,
        description: 'Review and load the ones you want into the keyword pipeline.',
      });
    } catch (err: any) {
      toast({ title: 'Analysis failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLoadDirectly = async (suggestion: TopicSuggestion) => {
    const idx = suggestions.indexOf(suggestion);
    setLoadingIndex(idx);
    try {
      // Insert seeds into keyword_targets
      const rows = suggestion.seedKeywords.map((kw, i) => ({
        vertical: suggestion.vertical,
        keyword: kw,
        is_seed: true,
        column_group: suggestion.pillar.primaryKeyword,
        priority: 80 - i, // Higher priority for earlier seeds
      }));

      const { error } = await supabase
        .from('keyword_targets' as any)
        .upsert(rows, { onConflict: 'vertical,keyword', ignoreDuplicates: true });

      if (error) throw error;

      toast({
        title: `${rows.length} seed keywords loaded`,
        description: `Added to "${suggestion.vertical}" in the keyword pipeline. Go to Keywords tab → Plan All Keywords to proceed.`,
      });
    } catch (err: any) {
      toast({ title: 'Load failed', description: err.message, variant: 'destructive' });
    } finally {
      setLoadingIndex(null);
    }
  };

  const handleLoadAll = async () => {
    for (const suggestion of suggestions) {
      await handleLoadDirectly(suggestion);
    }
    toast({
      title: 'All topics loaded',
      description: 'All seed keywords have been added to the keyword pipeline.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header panel */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">AI Topic Discovery</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Analyzes your live article counts, keyword saturation, and template coverage gaps to surface the highest-opportunity content topics. Results feed directly into your keyword pipeline — no XLSX roundtrip needed.
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                size="lg"
                className="gap-2"
              >
                {isAnalyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Lightbulb className="h-4 w-4" />
                )}
                {isAnalyzing ? 'Analyzing site…' : analyzed ? 'Re-Analyze' : 'Analyze & Suggest Topics'}
              </Button>
              {suggestions.length > 1 && (
                <Button variant="outline" size="lg" onClick={handleLoadAll} className="gap-2">
                  <Download className="h-4 w-4" />
                  Load All
                </Button>
              )}
            </div>
          </div>

          {isAnalyzing && (
            <div className="mt-4 p-3 rounded-lg bg-background/60 border border-border/50 flex items-center gap-3">
              <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium">Analyzing site data…</p>
                <p className="text-xs text-muted-foreground">
                  Reading article counts, keyword saturation, content plan coverage. This takes ~20 seconds.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Empty state */}
      {!analyzed && !isAnalyzing && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No suggestions yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Click <strong>"Analyze & Suggest Topics"</strong> and the AI will read your live site data to find the best content opportunities.
          </p>
        </div>
      )}

      {/* Workflow hint */}
      {suggestions.length > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border/50 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
          <span>
            After loading topics, go to the <strong>Keywords</strong> tab and click <strong>"Plan All Keywords"</strong> to automatically generate content plans from the new seeds.
          </span>
        </div>
      )}

      {/* Suggestion cards */}
      {suggestions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {suggestions.length} Topic Suggestions
            </h3>
          </div>
          {suggestions.map((suggestion, i) => (
            <SuggestionCard
              key={i}
              suggestion={suggestion}
              index={i}
              onLoadDirectly={handleLoadDirectly}
              loading={loadingIndex === i}
            />
          ))}
        </div>
      )}
    </div>
  );
}
