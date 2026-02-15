import { useState, useEffect } from 'react';
import { Brain, Loader2, Sparkles, Database, RefreshCw, ChevronDown, ChevronUp, X, Play, RotateCcw, AlertTriangle, Trash2, Zap, Wrench, Link2Off, Search, CheckCircle2, Wand2, History, Clock, DollarSign } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSemanticLinkScan, EmbeddingStats, ScanResult, EmbeddingJob } from '@/hooks/useSemanticLinkScan';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

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
  const [showHistory, setShowHistory] = useState(false);
  const [maxOutboundLinks, setMaxOutboundLinks] = useState(8);
  const [blogCategories, setBlogCategories] = useState<{ id: string; label: string }[]>([]);
  const [scanCategory, setScanCategory] = useState<string>('all');
  const [forceRescan, setForceRescan] = useState(false);
  const [maxArticles, setMaxArticles] = useState(100);
  const [showSmartScanConfirm, setShowSmartScanConfirm] = useState(false);

  // Query actual published article count for selected category
  const { data: categoryArticleCount } = useQuery({
    queryKey: ['category-article-count', scanCategory],
    queryFn: async () => {
      let query = supabase
        .from('blog_posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published');
      if (scanCategory !== 'all') {
        query = query.eq('category_slug', scanCategory);
      }
      const { count } = await query;
      return count || 0;
    },
    staleTime: 60 * 1000,
  });

  // Auto-update maxArticles when category changes
  useEffect(() => {
    if (categoryArticleCount !== undefined && categoryArticleCount > 0) {
      setMaxArticles(categoryArticleCount);
    }
  }, [categoryArticleCount, scanCategory]);

  const {
    semanticScan,
    isSemanticScanning,
    lastScanResults,
    smartScan,
    isSmartScanning,
    activeScanJob,
    isScanJobRunning,
    scanJobProgress,
    cancelScanJob,
    isCancellingScan,
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
    resetScanTimestamps,
    isResettingScanTimestamps,
  } = useSemanticLinkScan();

  useEffect(() => {
    fetchEmbeddingStats().then(setEmbeddingStats);
  }, [fetchEmbeddingStats, activeJob?.status]);

  // Fetch blog categories from dedicated table
  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('blog_categories')
        .select('slug, name')
        .order('name');
      if (data) {
        setBlogCategories(data.map(c => ({ id: c.slug, label: c.name })));
      }
    };
    fetchCategories();
  }, []);

  // Fetch scan history (last 10 completed jobs)
  const { data: scanHistory } = useQuery({
    queryKey: ['scan-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('semantic_scan_jobs')
        .select('id, status, total_items, processed_items, total_suggestions, similarity_threshold, category_filter, created_at, completed_at')
        .in('status', ['completed', 'failed', 'cancelled'])
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    staleTime: 30 * 1000,
  });

  const handleSemanticScan = async () => {
    const cat = scanCategory !== 'all' ? scanCategory : undefined;
    if (forceRescan) {
      await resetScanTimestamps(cat);
    }
    semanticScan({
      categorySlug: cat,
      batchSize,
      similarityThreshold: similarityThreshold / 100,
      maxLinksPerArticle: maxOutboundLinks,
    });
  };

  const handleSmartScan = async () => {
    const cat = scanCategory !== 'all' ? scanCategory : undefined;
    if (forceRescan) {
      await resetScanTimestamps(cat);
    }
    smartScan({
      categorySlug: cat,
      maxLinksPerArticle: maxOutboundLinks,
      maxArticles: maxArticles > 0 ? maxArticles : undefined,
    });
    setShowSmartScanConfirm(false);
  };

  const estimatedCost = (maxArticles || 0) * 0.002; // ~$0.002 per article with Gemini 2.5 Flash

  const handleStartBulkEmbedding = (forceReembed = false) => {
    startBulkEmbedding({
      category_filter: scanCategory !== 'all' ? scanCategory : undefined,
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
      category_filter: scanCategory !== 'all' ? scanCategory : undefined,
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
  const isFullyComplete = embeddingProgress === 100 && !hasPendingQueue && !isJobProcessing;
  const hasFailures = (activeJob?.status === 'completed' || activeJob?.status === 'failed') && (activeJob?.failed_items ?? 0) > 0;

  // Scan job states
  const scanJobRecentlyCompleted = activeScanJob?.status === 'completed' && 
    activeScanJob.completed_at && 
    (Date.now() - new Date(activeScanJob.completed_at).getTime()) < 60 * 60 * 1000; // within 1 hour

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
              <Popover>
                <PopoverTrigger>
                  <Badge variant="outline" className="text-xs cursor-help">?</Badge>
                </PopoverTrigger>
                <PopoverContent className="max-w-xs text-sm">
                  <p>Creates a vector profile for each article using OpenAI. This captures the article's meaning so we can find related content. Takes ~20 mins for 2,000 articles.</p>
                </PopoverContent>
              </Popover>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 space-y-2 ml-8">
              {/* Progress bar - always visible */}
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

              {/* === STATE: Fully Complete === */}
              {isFullyComplete && !hasFailures && (
                <div className="flex items-center justify-between text-xs p-2 bg-primary/10 rounded-md mt-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <span className="font-medium text-primary">All {embeddingStats?.completed?.toLocaleString()} articles embedded</span>
                      <p className="text-muted-foreground mt-0.5">New articles are automatically queued when published.</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs shrink-0"
                    onClick={() => handleStartBulkEmbedding(true)}
                    disabled={isStartingBulk || isJobProcessing}
                  >
                    {isStartingBulk ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3 mr-1" />}
                    Force Re-embed All
                  </Button>
                </div>
              )}

              {/* === STATE: Has Failures === */}
              {hasFailures && !isJobProcessing && (
                <div className="flex items-center justify-between text-xs mt-2 p-2 bg-destructive/10 rounded-md">
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                    <span>{embeddingStats?.completed?.toLocaleString()} embedded, {activeJob?.failed_items} failed</span>
                  </span>
                  <Button variant="outline" size="sm" className="h-6 text-xs" onClick={handleRetryFailed} disabled={isRetrying}>
                    {isRetrying ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3 mr-1" />}
                    Retry Failed
                  </Button>
                </div>
              )}

              {/* === STATE: Job In Progress === */}
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

              {/* === STATE: New Articles Pending === */}
              {hasPendingQueue && !isJobProcessing && embeddingProgress < 100 && (
                <div className="mt-2 p-2 bg-accent/50 border border-accent rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-medium">{queueStats.pending} new article{queueStats.pending !== 1 ? 's' : ''} ready to process</span>
                    </div>
                    <Button variant="default" size="sm" className="h-6 text-xs" onClick={() => processQueue()} disabled={isProcessingQueue}>
                      {isProcessingQueue ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3 mr-1" />}
                      Process Now
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 ml-5">Auto-queued when you published new content.</p>
                </div>
              )}

              {/* === Primary actions: only when embeddings are incomplete === */}
              {!isFullyComplete && !isJobProcessing && !hasFailures && !hasPendingQueue && embeddingProgress < 100 && (
                <div className="flex gap-2 mt-2">
                  <Button
                    onClick={() => handleStartBulkEmbedding(false)}
                    disabled={isStartingBulk || isJobProcessing}
                    size="sm"
                    className="flex-1"
                  >
                    {isStartingBulk ? (
                      <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Starting...</>
                    ) : (
                      <><Database className="h-3.5 w-3.5 mr-1.5" /> Generate Missing</>
                    )}
                  </Button>
                </div>
              )}

              <p className="text-xs text-muted-foreground mt-2 border-t pt-2">
                💡 New articles are automatically queued when published — just come back and tap <strong>Process Now</strong>.
              </p>
            </div>
          </div>

          {/* ===== STEP 2: Discover Links ===== */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={`flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${
                hasEnoughEmbeddings ? 'bg-muted text-muted-foreground' : 'bg-muted/50 text-muted-foreground/50'
              }`}>2</div>
              <h4 className={`font-semibold text-sm ${!hasEnoughEmbeddings ? 'text-muted-foreground/50' : ''}`}>Discover Links</h4>
              <Popover>
                <PopoverTrigger>
                  <Badge variant="outline" className="text-xs cursor-help">?</Badge>
                </PopoverTrigger>
                <PopoverContent className="max-w-xs text-sm">
                  <p>Uses AI (Gemini Flash) to read each article and find natural anchor phrases in the body text. <strong>Smart Scan</strong> is more accurate but slower (~3 articles/batch). <strong>Vector Scan</strong> uses pre-generated anchors and is faster but less precise.</p>
                </PopoverContent>
              </Popover>
            </div>

            <div className={`ml-8 space-y-2 ${!hasEnoughEmbeddings ? 'opacity-50 pointer-events-none' : ''}`}>
              {!hasEnoughEmbeddings && (
                <p className="text-xs text-muted-foreground">
                  Complete Step 1 first - need at least 2 embedded articles.
                </p>
              )}

              {/* === Scan Job In Progress === */}
              {isScanJobRunning && activeScanJob && (
                <div className="bg-primary/5 rounded-md p-3 border border-primary/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      <span className="text-xs font-medium">Discovering links...</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => cancelScanJob(activeScanJob.id)} disabled={isCancellingScan}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <Progress value={scanJobProgress} className="h-1.5" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{Math.min(activeScanJob.processed_items, activeScanJob.total_items).toLocaleString()} / {activeScanJob.total_items.toLocaleString()} articles</span>
                    <span>{activeScanJob.total_suggestions.toLocaleString()} suggestions found</span>
                  </div>
                </div>
              )}

              {/* === Scan Job Recently Completed === */}
              {scanJobRecentlyCompleted && !isScanJobRunning && activeScanJob && (
                <div className="flex items-center gap-2 text-xs p-2 bg-primary/10 rounded-md">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <span className="font-medium text-primary">
                      Scan complete — {activeScanJob.total_suggestions.toLocaleString()} new suggestions from this scan
                    </span>
                    <p className="text-muted-foreground mt-0.5">
                      Scanned {Math.min(activeScanJob.processed_items, activeScanJob.total_items).toLocaleString()} articles. Review them in the Link Review tab.
                    </p>
                  </div>
                </div>
              )}

              {/* Category selector for scans */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Scan Category</Label>
                <Select value={scanCategory} onValueChange={setScanCategory}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {blogCategories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Force re-scan checkbox */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="force-rescan"
                  checked={forceRescan}
                  onCheckedChange={(checked) => setForceRescan(checked === true)}
                />
                <label htmlFor="force-rescan" className="text-xs text-muted-foreground cursor-pointer">
                  Force re-scan (ignore 7-day cooldown)
                </label>
              </div>

              {/* Max articles limit */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Max articles to process
                  {categoryArticleCount !== undefined && (
                    <span className="ml-1 text-muted-foreground/70">({categoryArticleCount.toLocaleString()} available)</span>
                  )}
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={10000}
                    value={maxArticles}
                    onChange={(e) => setMaxArticles(parseInt(e.target.value) || 100)}
                    className="h-8 text-xs w-24"
                  />
                  <span className="text-xs text-muted-foreground">
                    ~${(maxArticles * 0.002).toFixed(2)} estimated AI cost
                  </span>
                </div>
              </div>

              {/* === Scan Buttons (not running) === */}
              {!isScanJobRunning && (
                <div className="flex gap-2">
                  <AlertDialog open={showSmartScanConfirm} onOpenChange={setShowSmartScanConfirm}>
                    <AlertDialogTrigger asChild>
                      <Button
                        disabled={isSmartScanning || isSemanticScanning || !hasEnoughEmbeddings || isJobProcessing}
                        size="sm"
                      >
                        <Wand2 className="h-3.5 w-3.5 mr-1.5" /> Smart Scan (AI)
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-amber-500" />
                          Confirm AI Smart Scan
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                          <p>This will use AI to analyze up to <strong>{maxArticles.toLocaleString()} articles</strong>{scanCategory !== 'all' ? ` in the "${blogCategories.find(c => c.id === scanCategory)?.label}" category` : ' across all categories'}.</p>
                          <p className="text-amber-600 font-medium">Estimated cost: ~${estimatedCost.toFixed(2)} (using Gemini 2.5 Flash)</p>
                          <p className="text-xs">Each article makes one AI call. You can adjust the limit above to control costs.</p>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSmartScan}>
                          {isSmartScanning ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5 mr-1.5" />}
                          Start Scan (~${estimatedCost.toFixed(2)})
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button
                    onClick={handleSemanticScan}
                    disabled={isSemanticScanning || isSmartScanning || !hasEnoughEmbeddings || isJobProcessing}
                    size="sm"
                    variant="outline"
                  >
                    {isSemanticScanning ? (
                      <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Starting...</>
                    ) : (
                      <><Search className="h-3.5 w-3.5 mr-1.5" /> Vector Scan</>
                    )}
                  </Button>
                </div>
              )}

              {/* Legacy scan results (kept for single-post scans) */}
              {lastScanResults.length > 0 && !isScanJobRunning && (
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
              <Popover>
                <PopoverTrigger>
                  <Badge variant="outline" className="text-xs cursor-help">?</Badge>
                </PopoverTrigger>
                <PopoverContent className="max-w-xs text-sm">
                  <p>Review the link suggestions in the "Link Review" tab. Approve or reject each one, then click "Apply Approved" to insert the links into your article HTML.</p>
                </PopoverContent>
              </Popover>
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

          {/* ===== Scan History ===== */}
          {scanHistory && scanHistory.length > 0 && (
            <Collapsible open={showHistory} onOpenChange={setShowHistory}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <History className="h-3.5 w-3.5" />
                    Scan History ({scanHistory.length})
                  </span>
                  {showHistory ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-1 mt-1">
                  {scanHistory.map((job) => {
                    const duration = job.completed_at && job.created_at
                      ? Math.round((new Date(job.completed_at).getTime() - new Date(job.created_at).getTime()) / 1000)
                      : null;
                    const formatDuration = (secs: number) => {
                      if (secs < 60) return `${secs}s`;
                      const mins = Math.floor(secs / 60);
                      const rem = secs % 60;
                      return rem > 0 ? `${mins}m ${rem}s` : `${mins}m`;
                    };
                    const catLabel = job.category_filter
                      ? blogCategories.find(c => c.id === job.category_filter)?.label || job.category_filter
                      : 'All';
                    const dateStr = new Date(job.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

                    return (
                      <div key={job.id} className="flex items-center gap-2 text-xs py-1.5 px-2 rounded bg-muted/30">
                        <Badge
                          variant={job.status === 'completed' ? 'default' : job.status === 'cancelled' ? 'secondary' : 'destructive'}
                          className="text-[10px] h-4 px-1 shrink-0"
                        >
                          {job.status === 'completed' ? '✓' : job.status === 'cancelled' ? '—' : '✗'}
                        </Badge>
                        <span className="text-muted-foreground shrink-0">{dateStr}</span>
                        <span className="truncate flex-1" title={catLabel}>{catLabel}</span>
                        <span className="shrink-0 text-muted-foreground">{job.processed_items} articles</span>
                        <Badge variant="outline" className="text-[10px] h-4 px-1 shrink-0">
                          {job.total_suggestions} links
                        </Badge>
                        {duration !== null && (
                          <span className="flex items-center gap-0.5 text-muted-foreground shrink-0">
                            <Clock className="h-3 w-3" />
                            {formatDuration(duration)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CollapsibleContent>
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

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Max Outbound Links Per Article</Label>
                  <span className="text-sm font-medium">{maxOutboundLinks} links</span>
                </div>
                <Slider
                  value={[maxOutboundLinks]}
                  onValueChange={([v]) => setMaxOutboundLinks(v)}
                  min={3}
                  max={15}
                  step={1}
                />
                <p className="text-xs text-muted-foreground">Cumulative cap — articles at this limit are skipped during scans</p>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => handleStartBulkEmbedding(false)}
                      disabled={isStartingBulk || isJobProcessing}
                      variant="outline"
                      size="sm"
                    >
                      {isStartingBulk ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Database className="h-3.5 w-3.5 mr-1.5" />}
                      Generate Missing
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Create embeddings for articles that don't have one yet</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => handleStartBulkEmbedding(true)}
                      disabled={isStartingBulk || isJobProcessing}
                      variant="outline"
                      size="sm"
                    >
                      <Zap className="h-3.5 w-3.5 mr-1.5" />
                      Force Re-embed
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Re-create embeddings for ALL articles, even if unchanged</p>
                  </TooltipContent>
                </Tooltip>

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
