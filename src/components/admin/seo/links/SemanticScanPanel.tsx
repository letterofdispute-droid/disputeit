import { useState, useEffect } from 'react';
import { Brain, Loader2, Sparkles, Database, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useSemanticLinkScan, EmbeddingStats, ScanResult } from '@/hooks/useSemanticLinkScan';

interface SemanticScanPanelProps {
  categoryFilter?: string;
}

export default function SemanticScanPanel({ categoryFilter }: SemanticScanPanelProps) {
  const [embeddingStats, setEmbeddingStats] = useState<EmbeddingStats | null>(null);
  const [similarityThreshold, setSimilarityThreshold] = useState(75);
  const [batchSize, setBatchSize] = useState(10);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const {
    semanticScan,
    isSemanticScanning,
    lastScanResults,
    generateEmbeddings,
    isGeneratingEmbeddings,
    fetchEmbeddingStats,
  } = useSemanticLinkScan();

  // Fetch embedding stats on mount
  useEffect(() => {
    fetchEmbeddingStats().then(setEmbeddingStats);
  }, [fetchEmbeddingStats]);

  const handleSemanticScan = () => {
    semanticScan({
      categorySlug: categoryFilter !== 'all' ? categoryFilter : undefined,
      batchSize,
      similarityThreshold: similarityThreshold / 100,
    });
  };

  const handleGenerateEmbeddings = () => {
    generateEmbeddings({
      categorySlug: categoryFilter !== 'all' ? categoryFilter : undefined,
      batchSize: 5,
      contentType: 'blog_post',
    });
  };

  const handleRefreshStats = async () => {
    const stats = await fetchEmbeddingStats();
    setEmbeddingStats(stats);
  };

  const embeddingProgress = embeddingStats 
    ? Math.round((embeddingStats.completed / Math.max(embeddingStats.total, 1)) * 100)
    : 0;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Semantic Link Scanner</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            AI-Powered
          </Badge>
        </div>
        <CardDescription>
          Uses vector embeddings to find semantically related content for internal linking
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Embedding Stats */}
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span>Embedded Articles</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {embeddingStats?.completed ?? 0} / {embeddingStats?.total ?? 0}
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={handleRefreshStats}
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <Progress value={embeddingProgress} className="h-2" />
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span className="text-primary">✓ {embeddingStats?.completed ?? 0} ready</span>
            <span className="text-accent-foreground">◷ {embeddingStats?.pending ?? 0} pending</span>
            {(embeddingStats?.failed ?? 0) > 0 && (
              <span className="text-destructive">✗ {embeddingStats?.failed} failed</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleGenerateEmbeddings}
            disabled={isGeneratingEmbeddings}
            variant="outline"
            size="sm"
          >
            {isGeneratingEmbeddings ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Generate Embeddings
              </>
            )}
          </Button>

          <Button
            onClick={handleSemanticScan}
            disabled={isSemanticScanning || (embeddingStats?.completed ?? 0) < 2}
            size="sm"
          >
            {isSemanticScanning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Semantic Scan
              </>
            )}
          </Button>
        </div>

        {(embeddingStats?.completed ?? 0) < 2 && (
          <p className="text-xs text-muted-foreground">
            Need at least 2 embedded articles to perform semantic scanning
          </p>
        )}

        {/* Advanced Settings */}
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between">
              Advanced Settings
              {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Similarity Threshold</Label>
                <span className="text-sm font-medium">{similarityThreshold}%</span>
              </div>
              <Slider
                value={[similarityThreshold]}
                onValueChange={([v]) => setSimilarityThreshold(v)}
                min={50}
                max={95}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Higher = more relevant but fewer matches
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Batch Size</Label>
                <span className="text-sm font-medium">{batchSize} articles</span>
              </div>
              <Slider
                value={[batchSize]}
                onValueChange={([v]) => setBatchSize(v)}
                min={5}
                max={50}
                step={5}
                className="w-full"
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Scan Results */}
        {lastScanResults.length > 0 && (
          <Collapsible open={showResults} onOpenChange={setShowResults}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between">
                Last Scan Results ({lastScanResults.length} articles)
                {showResults ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="max-h-48 overflow-y-auto space-y-1 mt-2">
                {lastScanResults.map((result: ScanResult) => (
                  <div 
                    key={result.articleId}
                    className="flex items-center justify-between text-sm py-1.5 px-2 rounded bg-muted/30"
                  >
                    <span className="truncate flex-1 mr-2">{result.title}</span>
                    <Badge variant={result.suggestionsFound > 0 ? 'default' : 'secondary'} className="shrink-0">
                      {result.suggestionsFound} links
                    </Badge>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Scanning Progress */}
        {isSemanticScanning && (
          <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm font-medium">Finding semantic connections...</span>
            </div>
            <Progress value={undefined} className="h-1.5" />
            <p className="text-xs text-muted-foreground mt-2">
              Comparing article embeddings using vector similarity
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
