import { useState } from 'react';
import { 
  Loader2, 
  Check, 
  X, 
  ExternalLink,
  Search,
  RefreshCw,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useLinkSuggestions, LinkSuggestion } from '@/hooks/useLinkSuggestions';
import { templateCategories } from '@/data/templateCategories';

export default function LinkSuggestions() {
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const { 
    suggestions, 
    isLoading, 
    refetch,
    scan,
    isScanning,
    updateStatus,
    bulkUpdateStatus,
    applyLinks,
    isApplyingLinks,
    getStats 
  } = useLinkSuggestions(statusFilter === 'all' ? undefined : statusFilter);

  const stats = getStats();

  // Filter by category
  const filteredSuggestions = categoryFilter === 'all' 
    ? suggestions 
    : suggestions?.filter(s => s.blog_posts?.category_slug === categoryFilter);

  const handleApprove = (id: string) => {
    updateStatus({ id, status: 'approved' });
  };

  const handleReject = (id: string) => {
    updateStatus({ id, status: 'rejected' });
  };

  const handleApproveHighRelevance = () => {
    const highRelevance = suggestions?.filter(s => 
      s.status === 'pending' && (s.relevance_score || 0) >= 85
    ).map(s => s.id) || [];
    
    if (highRelevance.length > 0) {
      bulkUpdateStatus({ ids: highRelevance, status: 'approved' });
    }
  };

  const handleApplyApproved = () => {
    const approved = suggestions?.filter(s => s.status === 'approved').map(s => s.id) || [];
    if (approved.length > 0) {
      applyLinks({ suggestionIds: approved });
    }
  };

  const handleScanCategory = () => {
    if (categoryFilter !== 'all') {
      scan({ categorySlug: categoryFilter });
    } else {
      scan({});
    }
  };

  const getTargetUrl = (suggestion: LinkSuggestion) => {
    switch (suggestion.target_type) {
      case 'template':
        return `/templates/${suggestion.target_slug}`;
      case 'article':
        return `/articles/${suggestion.blog_posts?.category_slug || 'general'}/${suggestion.target_slug}`;
      case 'guide':
        return `/guides/${suggestion.target_slug}`;
      default:
        return `/${suggestion.target_slug}`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-muted-foreground">
          Pending: <strong>{stats.pending}</strong>
        </span>
        <span className="text-muted-foreground">
          Approved: <strong>{stats.approved}</strong>
        </span>
        <span className="text-muted-foreground">
          Applied: <strong>{stats.applied}</strong>
        </span>
        <span className="text-muted-foreground">
          Rejected: <strong>{stats.rejected}</strong>
        </span>
      </div>

      {/* Filters and Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="applied">Applied</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {templateCategories.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleScanCategory}
            disabled={isScanning}
          >
            {isScanning ? (
              <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Scanning...</>
            ) : (
              <><Search className="h-4 w-4 mr-1" /> Scan for Links</>
            )}
          </Button>
          {stats.pending > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleApproveHighRelevance}
            >
              <Zap className="h-4 w-4 mr-1" />
              Approve All &gt;85%
            </Button>
          )}
          {stats.approved > 0 && (
            <Button
              size="sm"
              onClick={handleApplyApproved}
              disabled={isApplyingLinks}
            >
              {isApplyingLinks ? (
                <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Applying...</>
              ) : (
                <>Apply Approved ({stats.approved})</>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Suggestions List */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
        {!filteredSuggestions || filteredSuggestions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No link suggestions found</p>
            <p className="text-sm">Scan articles to find linking opportunities</p>
          </div>
        ) : (
          filteredSuggestions.map(suggestion => (
            <Card key={suggestion.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Source Article */}
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="shrink-0">From</Badge>
                      <span className="text-sm font-medium truncate">
                        {suggestion.blog_posts?.title || 'Unknown article'}
                      </span>
                    </div>

                    {/* Link Target */}
                    <div className="flex items-center gap-2">
                      <Badge className="shrink-0">{suggestion.target_type}</Badge>
                      <span className="text-sm">→</span>
                      <a 
                        href={getTargetUrl(suggestion)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1 truncate"
                      >
                        {suggestion.target_title}
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    </div>

                    {/* Anchor Text */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Anchor:</span>
                      <code className="text-sm bg-muted px-2 py-0.5 rounded">
                        {suggestion.anchor_text}
                      </code>
                    </div>

                    {/* Context */}
                    {suggestion.context_snippet && (
                      <p className="text-sm text-muted-foreground italic">
                        "...{suggestion.context_snippet}..."
                      </p>
                    )}
                  </div>

                  {/* Relevance & Actions */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Relevance:</span>
                      <Badge 
                        variant={(suggestion.relevance_score || 0) >= 85 ? 'default' : 'secondary'}
                      >
                        {suggestion.relevance_score || 0}%
                      </Badge>
                    </div>

                    {suggestion.status === 'pending' && (
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-primary hover:text-primary hover:bg-primary/10"
                          onClick={() => handleApprove(suggestion.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleReject(suggestion.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {suggestion.status !== 'pending' && (
                      <Badge 
                        variant={
                          suggestion.status === 'applied' ? 'default' :
                          suggestion.status === 'approved' ? 'secondary' :
                          'outline'
                        }
                      >
                        {suggestion.status}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
