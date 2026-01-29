import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CategorySearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  resultCount: number;
  totalCount: number;
}

const CategorySearch = ({ 
  value, 
  onChange, 
  placeholder = 'Search templates...', 
  resultCount,
  totalCount 
}: CategorySearchProps) => {
  const isFiltered = resultCount !== totalCount;

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {value && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={() => onChange('')}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
      </div>
      {isFiltered && (
        <p className="text-sm text-muted-foreground mt-2">
          Showing {resultCount} of {totalCount} templates
        </p>
      )}
    </div>
  );
};

export default CategorySearch;
