import { useState } from 'react';
import { 
  Loader2, 
  Trash2, 
  Play, 
  RefreshCw,
  Eye,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useContentQueue, ContentQueueItem } from '@/hooks/useContentQueue';
import { ARTICLE_TYPES } from '@/config/articleTypes';
import { templateCategories } from '@/data/templateCategories';

export default function ContentQueue() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const { 
    queueItems, 
    isLoading, 
    refetch,
    bulkGenerate, 
    isBulkGenerating,
    deleteItems,
    getStats 
  } = useContentQueue();

  const stats = getStats();

  // Filter items
  const filteredItems = queueItems?.filter(item => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && item.content_plans?.category_id !== categoryFilter) return false;
    return true;
  }) || [];

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map(i => i.id)));
    }
  };

  const handleGenerateSelected = () => {
    const queuedIds = Array.from(selectedIds).filter(id => {
      const item = queueItems?.find(q => q.id === id);
      return item?.status === 'queued';
    });
    
    if (queuedIds.length > 0) {
      bulkGenerate({ queueItemIds: queuedIds, batchSize: queuedIds.length });
      setSelectedIds(new Set());
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size > 0) {
      deleteItems(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const handleClearFailed = () => {
    const failedIds = queueItems?.filter(q => q.status === 'failed').map(q => q.id) || [];
    if (failedIds.length > 0) {
      deleteItems(failedIds);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      queued: 'secondary',
      generating: 'outline',
      generated: 'default',
      published: 'default',
      failed: 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status === 'generating' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
        {status}
      </Badge>
    );
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
          Queued: <strong>{stats.queued}</strong>
        </span>
        <span className="text-muted-foreground">
          Generating: <strong>{stats.generating}</strong>
        </span>
        <span className="text-muted-foreground">
          Generated: <strong>{stats.generated}</strong>
        </span>
        <span className="text-muted-foreground">
          Published: <strong>{stats.published}</strong>
        </span>
        {stats.failed > 0 && (
          <span className="text-destructive">
            Failed: <strong>{stats.failed}</strong>
          </span>
        )}
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
              <SelectItem value="queued">Queued</SelectItem>
              <SelectItem value="generating">Generating</SelectItem>
              <SelectItem value="generated">Generated</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
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
          {stats.failed > 0 && (
            <Button variant="outline" size="sm" onClick={handleClearFailed}>
              Clear Failed
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteSelected}
            disabled={selectedIds.size === 0}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete ({selectedIds.size})
          </Button>
          <Button
            size="sm"
            onClick={handleGenerateSelected}
            disabled={selectedIds.size === 0 || isBulkGenerating}
          >
            {isBulkGenerating ? (
              <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Generating...</>
            ) : (
              <><Play className="h-4 w-4 mr-1" /> Generate ({selectedIds.size})</>
            )}
          </Button>
        </div>
      </div>

      {/* Queue Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={selectedIds.size === filteredItems.length && filteredItems.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="w-28">Type</TableHead>
              <TableHead className="w-36">Template</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="w-16">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No items in queue
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map(item => {
                const articleType = ARTICLE_TYPES.find(t => t.id === item.article_type);
                
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(item.id)}
                        onCheckedChange={() => toggleSelection(item.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-md">{item.suggested_title}</span>
                        {item.error_message && (
                          <Tooltip>
                            <TooltipTrigger>
                              <AlertCircle className="h-4 w-4 text-destructive" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-sm">
                              {item.error_message}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{articleType?.name || item.article_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="truncate block max-w-36 text-sm text-muted-foreground">
                        {item.content_plans?.template_name || '-'}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>
                      {item.blog_post_id && (
                        <Button variant="ghost" size="icon" asChild>
                          <a href={`/admin/blog/edit/${item.blog_post_id}`} target="_blank">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
