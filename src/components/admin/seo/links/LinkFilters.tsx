import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { templateCategories } from '@/data/templateCategories';

interface LinkFiltersProps {
  statusFilter: string;
  categoryFilter: string;
  targetTypeFilter: string;
  onStatusChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onTargetTypeChange: (value: string) => void;
  onRefresh: () => void;
}

export default function LinkFilters({
  statusFilter,
  categoryFilter,
  targetTypeFilter,
  onStatusChange,
  onCategoryChange,
  onTargetTypeChange,
  onRefresh,
}: LinkFiltersProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-32">
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

      <Select value={categoryFilter} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {templateCategories.map(c => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={targetTypeFilter} onValueChange={onTargetTypeChange}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Target" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Targets</SelectItem>
          <SelectItem value="template">Templates</SelectItem>
          <SelectItem value="article">Articles</SelectItem>
          <SelectItem value="guide">Guides</SelectItem>
        </SelectContent>
      </Select>

      <Button variant="outline" size="icon" onClick={onRefresh}>
        <RefreshCw className="h-4 w-4" />
      </Button>
    </div>
  );
}
