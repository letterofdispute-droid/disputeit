import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, ExternalLink, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { allTemplates, getCategoryIdFromName } from '@/data/allTemplates';
import { templateCategories } from '@/data/templateCategories';
import { inferSubcategory } from '@/data/subcategoryMappings';
import QueuePagination from '@/components/admin/seo/queue/QueuePagination';

const TEMPLATES_PER_PAGE = 100;

const AdminTemplates = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, categoryFilter]);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    let result = [...allTemplates];

    // Apply category filter
    if (categoryFilter !== 'all') {
      result = result.filter(t => getCategoryIdFromName(t.category) === categoryFilter);
    }

    // Apply search filter
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(searchLower) ||
        t.slug.toLowerCase().includes(searchLower) ||
        t.seoTitle?.toLowerCase().includes(searchLower) ||
        t.seoDescription?.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [debouncedSearch, categoryFilter]);

  // Paginate
  const totalCount = filteredTemplates.length;
  const totalPages = Math.ceil(totalCount / TEMPLATES_PER_PAGE);
  const paginatedTemplates = useMemo(() => {
    const start = (currentPage - 1) * TEMPLATES_PER_PAGE;
    return filteredTemplates.slice(start, start + TEMPLATES_PER_PAGE);
  }, [filteredTemplates, currentPage]);

  // Stats
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allTemplates.forEach(t => {
      const catId = getCategoryIdFromName(t.category);
      counts[catId] = (counts[catId] || 0) + 1;
    });
    return counts;
  }, []);

  const getTemplateUrl = (template: typeof allTemplates[0]) => {
    const categoryId = getCategoryIdFromName(template.category);
    const subcategoryInfo = inferSubcategory(template.id, template.category);
    const subcategorySlug = subcategoryInfo?.slug || 'general';
    return `/templates/${categoryId}/${subcategorySlug}/${template.slug}`;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 overflow-x-hidden max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Templates SEO</h1>
          <p className="text-muted-foreground">
            {allTemplates.length} total templates • {templateCategories.length} categories
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories ({allTemplates.length})</SelectItem>
            {templateCategories.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name} ({categoryCounts[cat.id] || 0})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {paginatedTemplates.length > 0 ? (
        <div className="space-y-4">
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[350px]">Template</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Subcategory</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTemplates.map((template) => {
                  const subcategoryInfo = inferSubcategory(template.id, template.category);
                  return (
                    <TableRow key={template.id}>
                      <TableCell>
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="font-medium">{template.title}</span>
                          </div>
                          <p className="text-xs text-muted-foreground/70 truncate max-w-lg">
                            <span className="font-medium">SEO Title:</span> {template.seoTitle || '—'}
                          </p>
                          <p className="text-xs text-muted-foreground/60 truncate max-w-lg">
                            {template.seoDescription || '—'}
                          </p>
                          <p className="text-xs text-muted-foreground/50">
                            /{template.slug}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{template.category}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {subcategoryInfo?.name || template.subcategory || '—'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(getTemplateUrl(template), '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <QueuePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalCount}
            itemsPerPage={TEMPLATES_PER_PAGE}
          />
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg bg-card">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No templates found</h3>
          <p className="text-muted-foreground">
            {searchQuery ? 'Try a different search term' : 'No templates match your filters'}
          </p>
        </div>
      )}

      {/* Info Note */}
      <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4">
        <p>
          <strong>Note:</strong> Templates are defined in code files. To edit SEO fields, 
          modify the template files in <code className="bg-muted px-1 rounded">src/data/templates/</code>.
        </p>
      </div>
    </div>
  );
};

export default AdminTemplates;
