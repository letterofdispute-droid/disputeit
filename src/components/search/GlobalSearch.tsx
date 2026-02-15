import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Newspaper, FolderOpen, ArrowRight } from 'lucide-react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { allTemplates, getCategoryIdFromName } from '@/data/allTemplates';
import { templateCategories } from '@/data/templateCategories';
import { inferSubcategory } from '@/data/subcategoryMappings';
import { supabase } from '@/integrations/supabase/client';
import { trackSiteSearch } from '@/hooks/useGTM';

interface ArticleResult {
  slug: string;
  title: string;
  excerpt: string | null;
  category_slug: string;
}

function getTemplateUrl(template: { slug: string; category: string; id: string }) {
  const categoryId = getCategoryIdFromName(template.category);
  const subcategoryInfo = inferSubcategory(template.id, template.category);
  const subcategorySlug = subcategoryInfo?.slug || 'general';
  return `/templates/${categoryId}/${subcategorySlug}/${template.slug}`;
}

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GlobalSearch = ({ open, onOpenChange }: GlobalSearchProps) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [articles, setArticles] = useState<ArticleResult[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const lastTrackedQuery = useRef('');

  // Reset on close
  useEffect(() => {
    if (!open) {
      setQuery('');
      setArticles([]);
    }
  }, [open]);

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  // Debounced article search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 2) {
      setArticles([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoadingArticles(true);
      const { data } = await supabase
        .from('blog_posts')
        .select('slug, title, excerpt, category_slug')
        .eq('status', 'published')
        .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%`)
        .order('views', { ascending: false })
        .limit(5);

      setArticles(data || []);
      setLoadingArticles(false);

      // Track search
      if (query !== lastTrackedQuery.current && query.length >= 3) {
        lastTrackedQuery.current = query;
        const templateCount = getFilteredTemplates(query).length;
        const totalResults = templateCount + (data?.length || 0);
        trackSiteSearch(query, totalResults, 'global_search');
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const getFilteredTemplates = useCallback((q: string) => {
    if (q.length < 2) return [];
    const lower = q.toLowerCase();
    return allTemplates
      .filter(t =>
        t.title.toLowerCase().includes(lower) ||
        t.shortDescription.toLowerCase().includes(lower)
      )
      .sort((a, b) => {
        const aExact = a.title.toLowerCase().startsWith(lower) ? 0 : 1;
        const bExact = b.title.toLowerCase().startsWith(lower) ? 0 : 1;
        return aExact - bExact;
      })
      .slice(0, 5);
  }, []);

  const getFilteredCategories = useCallback((q: string) => {
    if (q.length < 2) return [];
    const lower = q.toLowerCase();
    return templateCategories
      .filter(c =>
        c.name.toLowerCase().includes(lower) ||
        c.description.toLowerCase().includes(lower)
      )
      .slice(0, 3);
  }, []);

  const handleSelect = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  const filteredTemplates = getFilteredTemplates(query);
  const filteredCategories = getFilteredCategories(query);
  const hasQuery = query.length >= 2;
  const hasResults = filteredTemplates.length > 0 || filteredCategories.length > 0 || articles.length > 0;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search templates, articles, categories..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {hasQuery && !hasResults && !loadingArticles && (
          <CommandEmpty>No results found for "{query}"</CommandEmpty>
        )}

        {/* Default: show categories when no query */}
        {!hasQuery && (
          <CommandGroup heading="Browse Categories">
            {templateCategories.map(category => (
              <CommandItem
                key={category.id}
                value={`cat-${category.id}`}
                onSelect={() => handleSelect(`/templates/${category.id}`)}
                className="flex items-center gap-3 cursor-pointer"
              >
                <FolderOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{category.name}</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Template results */}
        {filteredTemplates.length > 0 && (
          <CommandGroup heading="Letter Templates">
            {filteredTemplates.map(template => (
              <CommandItem
                key={template.slug}
                value={`tmpl-${template.slug}`}
                onSelect={() => handleSelect(getTemplateUrl(template))}
                className="flex items-center gap-3 cursor-pointer"
              >
                <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="block truncate font-medium">{template.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{template.shortDescription}</span>
                </div>
                <Badge variant="secondary" className="text-[10px] flex-shrink-0">
                  {template.category}
                </Badge>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Category results */}
        {filteredCategories.length > 0 && hasQuery && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Categories">
              {filteredCategories.map(category => (
                <CommandItem
                  key={category.id}
                  value={`cat-${category.id}`}
                  onSelect={() => handleSelect(`/templates/${category.id}`)}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <FolderOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="font-medium">{category.name}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Article results */}
        {articles.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Articles">
              {articles.map(article => (
                <CommandItem
                  key={article.slug}
                  value={`art-${article.slug}`}
                  onSelect={() => handleSelect(`/articles/${article.category_slug}/${article.slug}`)}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <Newspaper className="h-4 w-4 text-accent flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="block truncate font-medium">{article.title}</span>
                    {article.excerpt && (
                      <span className="block truncate text-xs text-muted-foreground">
                        {article.excerpt.slice(0, 80)}…
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {loadingArticles && hasQuery && (
          <div className="py-4 text-center text-sm text-muted-foreground">
            Searching articles…
          </div>
        )}
      </CommandList>
      <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground flex items-center justify-between">
        <span>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
          {' '}to toggle search
        </span>
        <span>↵ to select</span>
      </div>
    </CommandDialog>
  );
};

export default GlobalSearch;
