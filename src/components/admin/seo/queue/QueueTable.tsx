import { Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
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
import { ARTICLE_TYPES } from '@/config/articleTypes';
import { ContentQueueItem } from '@/hooks/useContentQueue';
import { Link2 } from 'lucide-react';

interface QueueTableProps {
  items: ContentQueueItem[];
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onToggleSelectAll: () => void;
}

export default function QueueTable({
  items,
  selectedIds,
  onToggleSelection,
  onToggleSelectAll,
}: QueueTableProps) {
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

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={selectedIds.size === items.length && items.length > 0}
                onCheckedChange={onToggleSelectAll}
              />
            </TableHead>
            <TableHead>Title</TableHead>
            <TableHead className="w-28">Type</TableHead>
            <TableHead className="w-28">Category</TableHead>
            <TableHead className="w-36">Template</TableHead>
            <TableHead className="w-24">Status</TableHead>
            <TableHead className="w-16">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No items in queue
              </TableCell>
            </TableRow>
          ) : (
            items.map(item => {
              const articleType = ARTICLE_TYPES.find(t => t.id === item.article_type);
              
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(item.id)}
                      onCheckedChange={() => onToggleSelection(item.id)}
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
                    <div className="flex items-center gap-1">
                      <Badge variant="outline">{articleType?.name || item.article_type}</Badge>
                      {!item.parent_queue_id && item.content_plans?.template_slug?.includes('-kw-') && (
                        <Badge variant="default" className="text-[10px] px-1">Pillar</Badge>
                      )}
                      {item.parent_queue_id && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Link2 className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>Cluster → linked to pillar</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {item.content_plans?.category_id?.replace(/-/g, ' ') || '-'}
                    </Badge>
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
  );
}
