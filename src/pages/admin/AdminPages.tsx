import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye, FileText, ChevronRight } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
}

interface PageWithChildren extends Page {
  children?: PageWithChildren[];
  depth?: number;
}

const AdminPages = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingPageId, setDeletingPageId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPages(data || []);
    } catch (error) {
      console.error('Error fetching pages:', error);
      toast({ title: 'Error', description: 'Failed to load pages.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const deletePage = async (id: string) => {
    try {
      const { error } = await supabase.from('pages').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Page deleted', description: 'The page has been deleted.' });
      fetchPages();
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

  const filteredPages = buildHierarchy(pages).filter(page => {
    const matchesSearch = page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         page.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || page.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pages</h1>
          <p className="text-muted-foreground">Manage your website pages</p>
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
        <div className="flex gap-2">
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
        </div>
      </div>

      {/* Table */}
      {filteredPages.length > 0 ? (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPages.map((page) => (
                <TableRow key={page.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {(page.depth || 0) > 0 && (
                        <span className="text-muted-foreground" style={{ marginLeft: `${(page.depth || 0) * 20}px` }}>
                          <ChevronRight className="h-4 w-4 inline" />
                        </span>
                      )}
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{page.title}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">/{page.slug}</TableCell>
                  <TableCell>
                    <Badge variant={page.status === 'published' ? 'default' : 'secondary'}>
                      {page.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {getParentTitle(page.parent_id) || '—'}
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
                        <DropdownMenuItem onClick={() => window.open(`/${page.slug}`, '_blank')}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/admin/pages/edit/${page.id}`)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeletingPageId(page.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
