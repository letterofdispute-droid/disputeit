import { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { trackSiteSearch } from '@/hooks/useGTM';
import { useAnalytics } from '@/hooks/useAnalytics';

interface CategorySearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  resultCount: number;
  totalCount: number;
  searchLocation?: string;
}

const CategorySearch = ({ 
  value, 
  onChange, 
  placeholder = 'Search templates...', 
  resultCount,
  totalCount,
  searchLocation = 'category_page',
}: CategorySearchProps) => {
  const isFiltered = resultCount !== totalCount;
  const { trackEvent } = useAnalytics();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search tracking - fires 1s after user stops typing
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = value.trim();
    if (trimmed.length < 2) return; // Don't track single-char queries

    debounceRef.current = setTimeout(() => {
      // GA4 standard event
      trackSiteSearch(trimmed, resultCount, searchLocation);

      // Supabase custom analytics
      trackEvent({
        eventType: 'site_search',
        eventData: {
          search_term: trimmed,
          results_count: resultCount,
          search_location: searchLocation,
        },
      });
    }, 1000);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, resultCount, searchLocation, trackEvent]);

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
    </div>
  );
};

export default CategorySearch;
