import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye, FileText, ChevronRight, Loader2, Settings, EyeOff } from 'lucide-react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import QueuePagination from '@/components/admin/seo/queue/QueuePagination';

const PAGES_PER_PAGE = 100;

interface Page {
  id: string;
  title: string;
  slug: string;
  status: string;
  parent_id: string | null;
  sort_order: number;
  author: string | null;
  created_at: string;
  updated_at: string;
  meta_title: string | null;
  meta_description: string | null;
  page_type: string;
  no_index: boolean;
  page_group: string | null;
}

const PAGE_GROUPS = [
  { value: 'all', label: 'All Groups' },
  { value: 'static', label: 'Static' },
  { value: 'legal', label: 'Legal' },
  { value: 'tool', label: 'Tools' },
  { value: 'template', label: 'Templates' },
  { value: 'guide', label: 'Guides' },
  { value: 'state-rights', label: 'State Rights' },
  { value: 'small-claims', label: 'Small Claims' },
];

interface PageWithChildren extends Page {
  children?: PageWithChildren[];
  depth?: number;
}

const AdminPages = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingPageId, setDeletingPageId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'system' | 'cms'>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [draftCount, setDraftCount] = useState(0);

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
  }, [debouncedSearch, statusFilter, typeFilter, groupFilter]);

  // Fetch pages with pagination and filtering
  useEffect(() => {
    fetchPages();
  }, [currentPage, debouncedSearch, statusFilter, typeFilter, groupFilter]);

  // Fetch draft count separately
  useEffect(() => {
    fetchDraftCount();
  }, []);

  const fetchPages = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('pages')
        .select('id, title, slug, status, parent_id, sort_order, author, created_at, updated_at, meta_title, meta_description, page_type, no_index, page_group', { count: 'exact' })
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      // Apply type filter
      if (typeFilter !== 'all') {
        query = query.eq('page_type', typeFilter);
      }

      // Apply group filter
      if (groupFilter !== 'all') {
        query = query.eq('page_group', groupFilter);
      }

      // Apply search filter
      if (debouncedSearch) {
        query = query.or(`title.ilike.%${debouncedSearch}%,slug.ilike.%${debouncedSearch}%`);
      }

      // Apply pagination
      const from = (currentPage - 1) * PAGES_PER_PAGE;
      const to = from + PAGES_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;
      setPages(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching pages:', error);
      toast({ title: 'Error', description: 'Failed to load pages.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDraftCount = async () => {
    try {
      const { count, error } = await supabase
        .from('pages')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'draft');

      if (error) throw error;
      setDraftCount(count || 0);
    } catch (error) {
      console.error('Error fetching draft count:', error);
    }
  };

  const deletePage = async (id: string) => {
    try {
      const { error } = await supabase.from('pages').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Page deleted', description: 'The page has been deleted.' });
      fetchPages();
      fetchDraftCount();
    } catch (error) {
      console.error('Error deleting page:', error);
      toast({ title: 'Error', description: 'Failed to delete page.', variant: 'destructive' });
    } finally {
      setDeletingPageId(null);
    }
  };

  // Build hierarchical structure for display
  const buildHierarchy = (pages: Page[]): PageWithChildren[] => {
    const pageMap = new Map<string, PageWithChildren>();
    const roots: PageWithChildren[] = [];

    // First pass: create map
    pages.forEach(page => {
      pageMap.set(page.id, { ...page, children: [], depth: 0 });
    });

    // Second pass: build hierarchy
    pages.forEach(page => {
      const currentPage = pageMap.get(page.id)!;
      if (page.parent_id && pageMap.has(page.parent_id)) {
        const parent = pageMap.get(page.parent_id)!;
        currentPage.depth = (parent.depth || 0) + 1;
        parent.children!.push(currentPage);
      } else {
        roots.push(currentPage);
      }
    });

    // Flatten for table display
    const flatten = (pages: PageWithChildren[]): PageWithChildren[] => {
      const result: PageWithChildren[] = [];
      pages.forEach(page => {
        result.push(page);
        if (page.children && page.children.length > 0) {
          result.push(...flatten(page.children));
        }
      });
      return result;
    };

    return flatten(roots);
  };

  const getParentTitle = (parentId: string | null): string | null => {
    if (!parentId) return null;
    const parent = pages.find(p => p.id === parentId);
    return parent?.title || null;
  };

  const hierarchicalPages = buildHierarchy(pages);
  const totalPages = Math.ceil(totalCount / PAGES_PER_PAGE);

  if (isLoading && pages.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 overflow-x-hidden max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pages</h1>
          <p className="text-muted-foreground">
            {totalCount} total pages • {draftCount} drafts
          </p>
        </div>
        <Button onClick={() => navigate('/admin/pages/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Page
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search pages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
          >
            All
          </Button>
          <Button
            variant={statusFilter === 'published' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('published')}
          >
            Published
          </Button>
          <Button
            variant={statusFilter === 'draft' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('draft')}
          >
            Draft
          </Button>
          <div className="w-px bg-border mx-1" />
          <Button
            variant={typeFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter('all')}
          >
            All Types
          </Button>
          <Button
            variant={typeFilter === 'system' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter('system')}
          >
            System
          </Button>
          <Button
            variant={typeFilter === 'cms' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter('cms')}
          >
            CMS
          </Button>
          <div className="w-px bg-border mx-1" />
          <Select value={groupFilter} onValueChange={setGroupFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="Group" />
            </SelectTrigger>
            <SelectContent>
              {PAGE_GROUPS.map(g => (
                <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      {hierarchicalPages.length > 0 ? (
        <div className="space-y-4">
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                 <TableRow>
                    <TableHead className="min-w-[300px]">Title</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                 </TableRow>
              </TableHeader>
              <TableBody>
                {hierarchicalPages.map((page) => (
                  <TableRow key={page.id}>
                    <TableCell>
                      <div className="flex items-start gap-2">
                        {(page.depth || 0) > 0 && (
                          <span className="text-muted-foreground mt-1" style={{ marginLeft: `${(page.depth || 0) * 20}px` }}>
                            <ChevronRight className="h-4 w-4 inline" />
                          </span>
                        )}
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="font-medium">{page.title}</span>
                          </div>
                          {page.meta_title && (
                            <p className="text-xs text-muted-foreground/70 truncate max-w-md">
                              <span className="font-medium">Meta:</span> {page.meta_title}
                            </p>
                          )}
                          {page.meta_description && (
                            <p className="text-xs text-muted-foreground/60 truncate max-w-md">
                              {page.meta_description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">/{page.slug}</TableCell>
                    <TableCell>
                      {page.page_group && (
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {page.page_group}
                        </span>
                      )}
                    </TableCell>
                     <TableCell>
                       <div className="flex items-center gap-1.5">
                         <Badge variant={page.page_type === 'system' ? 'outline' : 'secondary'} className="text-[10px] px-1.5">
                           {page.page_type}
                         </Badge>
                         {page.no_index && (
                           <span title="noindex"><EyeOff className="h-3.5 w-3.5 text-muted-foreground" /></span>
                         )}
                       </div>
                     </TableCell>
                     <TableCell>
                       <Badge variant={page.status === 'published' ? 'default' : 'secondary'}>
                         {page.status}
                       </Badge>
                     </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(page.updated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                         <DropdownMenuContent align="end">
                           <DropdownMenuItem onClick={() => window.open(`/${page.slug === '/' ? '' : page.slug}`, '_blank')}>
                             <Eye className="h-4 w-4 mr-2" />
                             View
                           </DropdownMenuItem>
                           {page.page_type === 'system' ? (
                             <DropdownMenuItem onClick={() => navigate(`/admin/pages/edit/${page.id}`)}>
                               <Settings className="h-4 w-4 mr-2" />
                               Edit SEO Meta
                             </DropdownMenuItem>
                           ) : (
                             <DropdownMenuItem onClick={() => navigate(`/admin/pages/edit/${page.id}`)}>
                               <Edit className="h-4 w-4 mr-2" />
                               Edit
                             </DropdownMenuItem>
                           )}
                           {page.page_type !== 'system' && (
                             <DropdownMenuItem
                               onClick={() => setDeletingPageId(page.id)}
                               className="text-destructive"
                             >
                               <Trash2 className="h-4 w-4 mr-2" />
                               Delete
                             </DropdownMenuItem>
                           )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <QueuePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalCount}
            itemsPerPage={PAGES_PER_PAGE}
          />
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg bg-card">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No pages found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery ? 'Try a different search term' : 'Get started by creating your first page'}
          </p>
          {!searchQuery && (
            <Button onClick={() => navigate('/admin/pages/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Page
            </Button>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingPageId} onOpenChange={() => setDeletingPageId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Page</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this page? This action cannot be undone.
              Child pages will become root-level pages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingPageId && deletePage(deletingPageId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPages;
