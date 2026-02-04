import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { templateCategories } from '@/data/templateCategories';

interface QueueFiltersProps {
  statusFilter: string;
  categoryFilter: string;
  onStatusChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onRefresh: () => void;
}

export default function QueueFilters({
  statusFilter,
  categoryFilter,
  onStatusChange,
  onCategoryChange,
  onRefresh,
}: QueueFiltersProps) {
  return (
    <div className="flex items-center gap-2">
      <Select value={statusFilter} onValueChange={onStatusChange}>
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

      <Select value={categoryFilter} onValueChange={onCategoryChange}>
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

      <Button variant="outline" size="icon" onClick={onRefresh}>
        <RefreshCw className="h-4 w-4" />
      </Button>
    </div>
  );
}
