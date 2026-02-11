import { useState, useEffect } from 'react';
import { Brain, Loader2, Sparkles, Database, RefreshCw, ChevronDown, ChevronUp, X, Play, RotateCcw, AlertTriangle, Trash2, Zap, Wrench, Link2Off, Clock, ArrowRightLeft, Search, CheckCircle2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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

  const embeddingProgress = embeddingStats
    ? Math.round((embeddingStats.completed / Math.max(embeddingStats.total, 1)) * 100)
    : 0;

  const isJobProcessing = activeJob?.status === 'processing';
  const jobProgress = getJobProgress(activeJob);
  const hasOrphans = orphanArticles.length > 0;
  const hasPendingQueue = queueStats.pending > 0;
  const hasEnoughEmbeddings = (embeddingStats?.completed ?? 0) >= 2;

  return (
    <TooltipProvider>
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Semantic Link Intelligence</CardTitle>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleRefreshStats}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
          <CardDescription>
            3-step process to automatically interlink your articles using AI vector analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* ===== STEP 1: Generate Embeddings ===== */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={`flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${
                embeddingProgress === 100 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>1</div>
              <h4 className="font-semibold text-sm">Generate Embeddings</h4>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline" className="text-xs cursor-help">?</Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Creates a vector profile for each article using OpenAI. This captures the article's meaning so we can find related content. Takes ~20 mins for 2,000 articles.</p>
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 space-y-2 ml-8">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span>Articles with embeddings</span>
                </span>
                <span className="font-medium">
                  {embeddingStats?.completed ?? 0} / {embeddingStats?.total ?? 0}
                </span>
              </div>
              <Progress value={embeddingProgress} className="h-2" />
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span className="text-primary">✓ {embeddingStats?.completed ?? 0} ready</span>
                <span>◷ {embeddingStats?.pending ?? 0} pending</span>
                {(embeddingStats?.failed ?? 0) > 0 && (
                  <span className="text-destructive">✗ {embeddingStats?.failed} failed</span>
                )}
              </div>

              {/* Active Job Progress */}
              {isJobProcessing && activeJob && (
                <div className="bg-primary/5 rounded-md p-2 border border-primary/20 space-y-1.5 mt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      <span className="text-xs font-medium">Processing embeddings...</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => cancelJob(activeJob.id)} disabled={isCancelling}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <Progress value={jobProgress} className="h-1.5" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{activeJob.processed_items} / {activeJob.total_items}</span>
                    <span>{jobProgress}%</span>
                  </div>
                </div>
              )}

              {/* Completed Job */}
              {activeJob?.status === 'completed' && (
                <div className="flex items-center justify-between text-xs mt-2 p-2 bg-primary/5 rounded-md">
                  <span className="text-primary">✓ Last job: {activeJob.processed_items} processed{activeJob.failed_items > 0 ? `, ${activeJob.failed_items} failed` : ''}</span>
                  {activeJob.failed_items > 0 && (
                    <Button variant="outline" size="sm" className="h-6 text-xs" onClick={handleRetryFailed} disabled={isRetrying}>
                      {isRetrying ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3 mr-1" />}
                      Retry
                    </Button>
                  )}
                </div>
              )}

              {/* Failed Job */}
              {activeJob?.status === 'failed' && (
                <div className="flex items-center justify-between text-xs mt-2 p-2 bg-destructive/10 rounded-md">
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-destructive" />
                    Job failed: {activeJob.processed_items} done, {activeJob.failed_items} failed
                  </span>
                  <Button variant="outline" size="sm" className="h-6 text-xs" onClick={handleRetryFailed} disabled={isRetrying}>
                    {isRetrying ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3 mr-1" />}
                    Retry
                  </Button>
                </div>
              )}

              {/* Embedding Queue Alert */}
              {hasPendingQueue && (
                <div className="flex items-center justify-between text-xs mt-2 p-2 bg-blue-500/10 rounded-md">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-blue-600" />
                    {queueStats.pending} auto-queued from new articles
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => processQueue()} disabled={isProcessingQueue}>
                        {isProcessingQueue ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3 mr-1" />}
                        Process
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Process queued items with self-chaining (will process all automatically)</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}

              <div className="flex gap-2 mt-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => handleStartBulkEmbedding(false)}
                      disabled={isStartingBulk || isJobProcessing}
                      size="sm"
                      className="flex-1"
                    >
                      {isStartingBulk ? (
                        <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Starting...</>
                      ) : (
                        <><Database className="h-3.5 w-3.5 mr-1.5" /> Generate All</>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Create vector embeddings for all articles that don't have one yet</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => handleStartBulkEmbedding(true)}
                      disabled={isStartingBulk || isJobProcessing}
                      size="sm"
                      variant="outline"
                    >
                      <Zap className="h-3.5 w-3.5 mr-1.5" />
                      Force Re-embed
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Re-create embeddings for ALL articles, even if they haven't changed</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>

          {/* ===== STEP 2: Discover Links ===== */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={`flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${
                hasEnoughEmbeddings ? 'bg-muted text-muted-foreground' : 'bg-muted/50 text-muted-foreground/50'
              }`}>2</div>
              <h4 className={`font-semibold text-sm ${!hasEnoughEmbeddings ? 'text-muted-foreground/50' : ''}`}>Discover Links</h4>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline" className="text-xs cursor-help">?</Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Compares article embeddings to find semantically related content, then generates linking suggestions with anchor text. Uses bidirectional scanning - finds both outbound and inbound links.</p>
                </TooltipContent>
              </Tooltip>
            </div>

            <div className={`ml-8 space-y-2 ${!hasEnoughEmbeddings ? 'opacity-50 pointer-events-none' : ''}`}>
              {!hasEnoughEmbeddings && (
                <p className="text-xs text-muted-foreground">
                  Complete Step 1 first - need at least 2 embedded articles.
                </p>
              )}

              <Button
                onClick={handleSemanticScan}
                disabled={isSemanticScanning || !hasEnoughEmbeddings || isJobProcessing}
                size="sm"
              >
                {isSemanticScanning ? (
                  <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Scanning...</>
                ) : (
                  <><Search className="h-3.5 w-3.5 mr-1.5" /> Scan for Links</>
                )}
              </Button>

              {isSemanticScanning && (
                <div className="bg-primary/5 rounded-md p-2 border border-primary/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    <span className="text-xs font-medium">Finding bidirectional connections...</span>
                  </div>
                  <Progress value={undefined} className="h-1.5" />
                </div>
              )}

              {/* Scan Results */}
              {lastScanResults.length > 0 && (
                <Collapsible open={showResults} onOpenChange={setShowResults}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-between text-xs h-7">
                      Last scan: {lastScanResults.reduce((sum, r) => sum + r.suggestionsFound, 0)} suggestions from {lastScanResults.length} articles
                      {showResults ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="max-h-32 overflow-y-auto space-y-0.5 mt-1">
                      {lastScanResults.map((result: ScanResult) => (
                        <div key={result.articleId} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-muted/30">
                          <span className="truncate flex-1 mr-2">{result.title}</span>
                          <Badge variant={result.suggestionsFound > 0 ? 'default' : 'secondary'} className="text-xs shrink-0">
                            {result.suggestionsFound}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          </div>

          {/* ===== STEP 3: Review & Apply ===== */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold bg-muted text-muted-foreground">3</div>
              <h4 className="font-semibold text-sm">Review & Apply</h4>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline" className="text-xs cursor-help">?</Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Review the link suggestions in the "Link Review" tab. Approve or reject each one, then click "Apply Approved" to insert the links into your article HTML.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="ml-8">
              <p className="text-xs text-muted-foreground">
                Switch to the <strong>Link Review</strong> tab to approve suggestions, then apply them to your articles.
              </p>
            </div>
          </div>

          {/* ===== Orphan Alert ===== */}
          {hasOrphans && (
            <Collapsible open={showOrphans} onOpenChange={setShowOrphans}>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Link2Off className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-700">
                        {orphanArticles.length} orphan article{orphanArticles.length !== 1 ? 's' : ''} (no inbound links)
                      </span>
                    </div>
                    {showOrphans ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 max-h-32 overflow-y-auto space-y-0.5">
                    {orphanArticles.slice(0, 10).map((article) => (
                      <div key={article.id} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-background/50">
                        <span className="truncate flex-1 mr-2">{article.title}</span>
                        <Badge variant="outline" className="text-xs shrink-0">{article.category_slug}</Badge>
                      </div>
                    ))}
                    {orphanArticles.length > 10 && (
                      <p className="text-xs text-muted-foreground text-center pt-1">
                        +{orphanArticles.length - 10} more
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Run a scan in Step 2 to generate inbound link suggestions.
                  </p>
                </CollapsibleContent>
              </div>
            </Collapsible>
          )}

          {/* ===== Advanced Settings ===== */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between text-xs">
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
                />
                <p className="text-xs text-muted-foreground">Higher = more relevant but fewer matches</p>
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
                />
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={() => runMaintenance(['process_queue', 'rescan_stale', 'detect_orphans'])} disabled={isRunningMaintenance || isJobProcessing} variant="outline" size="sm">
                      {isRunningMaintenance ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Wrench className="h-3.5 w-3.5 mr-1.5" />}
                      Maintenance
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Process queue, re-scan stale articles, and detect orphan pages</p>
                  </TooltipContent>
                </Tooltip>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive border-destructive/30">
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      Reset All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset All Embeddings?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This deletes all stored embeddings{categoryFilter && categoryFilter !== 'all' ? ` for "${categoryFilter}"` : ''}.
                        You'll need to regenerate them from Step 1.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleResetEmbeddings}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isResetting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Reset
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CollapsibleContent>
          </Collapsible>

        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
