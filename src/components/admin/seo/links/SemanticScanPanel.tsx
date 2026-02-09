import { useState, useEffect } from 'react';
import { Brain, Loader2, Sparkles, Database, RefreshCw, ChevronDown, ChevronUp, X, Play, Pause, RotateCcw, AlertTriangle, Trash2, Zap, Wrench, Link2Off, Clock, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useSemanticLinkScan, EmbeddingStats, ScanResult, EmbeddingJob } from '@/hooks/useSemanticLinkScan';

interface SemanticScanPanelProps {
  categoryFilter?: string;
}

export default function SemanticScanPanel({ categoryFilter }: SemanticScanPanelProps) {
  const [embeddingStats, setEmbeddingStats] = useState<EmbeddingStats | null>(null);
  const [similarityThreshold, setSimilarityThreshold] = useState(75);
  const [batchSize, setBatchSize] = useState(10);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showOrphans, setShowOrphans] = useState(false);

  const {
    semanticScan,
    isSemanticScanning,
    lastScanResults,
    startBulkEmbedding,
    isStartingBulk,
    activeJob,
    getJobProgress,
    cancelJob,
    isCancelling,
    fetchEmbeddingStats,
    retryFailed,
    isRetrying,
    resetEmbeddings,
    isResetting,
    orphanArticles,
    refetchOrphans,
    queueStats,
    refetchQueueStats,
    processQueue,
    isProcessingQueue,
    runMaintenance,
    isRunningMaintenance,
  } = useSemanticLinkScan();

  // Fetch embedding stats on mount and when job changes
  useEffect(() => {
    fetchEmbeddingStats().then(setEmbeddingStats);
  }, [fetchEmbeddingStats, activeJob?.status]);

  const handleSemanticScan = () => {
    semanticScan({
      categorySlug: categoryFilter !== 'all' ? categoryFilter : undefined,
      batchSize,
      similarityThreshold: similarityThreshold / 100,
    });
  };

  const handleStartBulkEmbedding = (forceReembed = false) => {
    startBulkEmbedding({
      category_filter: categoryFilter !== 'all' ? categoryFilter : undefined,
      forceReembed,
    });
  };

  const handleRetryFailed = () => {
    if (activeJob?.id) {
      retryFailed(activeJob.id);
    }
  };

  const handleResetEmbeddings = () => {
    resetEmbeddings({
      category_filter: categoryFilter !== 'all' ? categoryFilter : undefined,
    });
  };

  const handleRefreshStats = async () => {
    const stats = await fetchEmbeddingStats();
    setEmbeddingStats(stats);
    refetchQueueStats();
    refetchOrphans();
  };

  const handleProcessQueue = () => {
    processQueue();
  };

  const handleRunMaintenance = () => {
    runMaintenance(['process_queue', 'rescan_stale', 'detect_orphans']);
  };

  const embeddingProgress = embeddingStats 
    ? Math.round((embeddingStats.completed / Math.max(embeddingStats.total, 1)) * 100)
    : 0;

  const isJobProcessing = activeJob?.status === 'processing';
  const jobProgress = getJobProgress(activeJob);
  const hasOrphans = orphanArticles.length > 0;
  const hasPendingQueue = queueStats.pending > 0;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Semantic Link Scanner</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {hasPendingQueue && (
              <Badge variant="secondary" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {queueStats.pending} queued
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              AI-Powered
            </Badge>
          </div>
        </div>
        <CardDescription>
          Uses vector embeddings with bidirectional discovery for intelligent internal linking
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Orphan Alert */}
        {hasOrphans && (
          <Collapsible open={showOrphans} onOpenChange={setShowOrphans}>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Link2Off className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-700">
                      {orphanArticles.length} orphan article{orphanArticles.length !== 1 ? 's' : ''} detected
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">No inbound links</span>
                    {showOrphans ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-3 max-h-32 overflow-y-auto space-y-1">
                  {orphanArticles.slice(0, 10).map((article) => (
                    <div key={article.id} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-background/50">
                      <span className="truncate flex-1 mr-2">{article.title}</span>
                      <Badge variant="outline" className="text-xs shrink-0">{article.category_slug}</Badge>
                    </div>
                  ))}
                  {orphanArticles.length > 10 && (
                    <p className="text-xs text-muted-foreground text-center pt-1">
                      +{orphanArticles.length - 10} more orphans
                    </p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Run a semantic scan to generate inbound link suggestions for these articles.
                </p>
              </CollapsibleContent>
            </div>
          </Collapsible>
        )}

        {/* Embedding Queue Alert */}
        {hasPendingQueue && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">
                  {queueStats.pending} article{queueStats.pending !== 1 ? 's' : ''} waiting for embedding
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleProcessQueue}
                disabled={isProcessingQueue}
              >
                {isProcessingQueue ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Play className="h-3 w-3 mr-1" />
                )}
                Process Now
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              New published articles are automatically queued for embedding and bidirectional linking.
            </p>
          </div>
        )}

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

        {/* Active Job Progress */}
        {isJobProcessing && activeJob && (
          <div className="bg-primary/5 rounded-lg p-3 border border-primary/20 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm font-medium">Generating embeddings...</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => cancelJob(activeJob.id)}
                disabled={isCancelling}
              >
                {isCancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
              </Button>
            </div>
            <Progress value={jobProgress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{activeJob.processed_items} / {activeJob.total_items} processed</span>
              <span>{jobProgress}%</span>
            </div>
            {activeJob.failed_items > 0 && (
              <span className="text-xs text-destructive">
                {activeJob.failed_items} failed
              </span>
            )}
          </div>
        )}

        {/* Completed Job Summary */}
        {activeJob?.status === 'completed' && (
          <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-primary">✓</span>
                <span>
                  Last job completed: {activeJob.processed_items} processed
                  {activeJob.failed_items > 0 && `, ${activeJob.failed_items} failed`}
                </span>
              </div>
              {activeJob.failed_items > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetryFailed}
                  disabled={isRetrying}
                >
                  {isRetrying ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <RotateCcw className="h-3 w-3 mr-1" />
                  )}
                  Retry Failed
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Failed Job with Retry */}
        {activeJob?.status === 'failed' && (
          <div className="bg-destructive/10 rounded-lg p-3 border border-destructive/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span>
                  Job failed: {activeJob.processed_items} processed, {activeJob.failed_items} failed
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetryFailed}
                disabled={isRetrying}
              >
                {isRetrying ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <RotateCcw className="h-3 w-3 mr-1" />
                )}
                Retry Failed
              </Button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                disabled={isStartingBulk || isJobProcessing || isResetting}
                variant="outline"
                size="sm"
              >
                {isStartingBulk ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : isJobProcessing ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Generate Embeddings
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => handleStartBulkEmbedding(false)}>
                <Database className="h-4 w-4 mr-2" />
                Generate New Only
                <span className="text-xs text-muted-foreground ml-2">Skip unchanged</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStartBulkEmbedding(true)}>
                <Zap className="h-4 w-4 mr-2" />
                Force Re-embed All
                <span className="text-xs text-muted-foreground ml-2">Ignore cache</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                    <span className="text-destructive">Reset All Embeddings</span>
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset All Embeddings?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will delete all stored embeddings{categoryFilter && categoryFilter !== 'all' ? ` for the "${categoryFilter}" category` : ''}. 
                      You'll need to run bulk generation again to recreate them.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleResetEmbeddings}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isResetting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Reset Embeddings
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={handleSemanticScan}
            disabled={isSemanticScanning || (embeddingStats?.completed ?? 0) < 2 || isJobProcessing}
            size="sm"
          >
            {isSemanticScanning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Bidirectional Scan
              </>
            )}
          </Button>

          <Button
            onClick={handleRunMaintenance}
            disabled={isRunningMaintenance || isJobProcessing}
            variant="outline"
            size="sm"
          >
            {isRunningMaintenance ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Wrench className="h-4 w-4 mr-2" />
                Maintenance
              </>
            )}
          </Button>
        </div>

        {(embeddingStats?.completed ?? 0) < 2 && !isJobProcessing && (
          <p className="text-xs text-muted-foreground">
            Need at least 2 embedded articles to perform semantic scanning. Click "Generate Embeddings" to start.
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
                <Label className="text-sm">Scan Batch Size</Label>
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

        {/* Semantic Scanning Progress */}
        {isSemanticScanning && (
          <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm font-medium">Finding bidirectional connections...</span>
            </div>
            <Progress value={undefined} className="h-1.5" />
            <p className="text-xs text-muted-foreground mt-2">
              Comparing embeddings for both outbound and inbound link opportunities
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
