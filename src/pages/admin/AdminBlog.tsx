import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, Search, Edit, Trash2, Eye, 
  MoreHorizontal, Calendar, Loader2, Sparkles, CheckSquare,
  ArrowDownToLine, ArrowUpFromLine
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import QueuePagination from '@/components/admin/seo/queue/QueuePagination';
import ExportButton from '@/components/admin/export/ExportButton';
import ImageBackfillCard from '@/components/admin/blog/ImageBackfillCard';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  category: string;
  category_slug: string;
  status: string;
  author: string;
  created_at: string;
  views: number;
  meta_title: string | null;
  meta_description: string | null;
}

const POSTS_PER_PAGE = 100;

const AdminBlog = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkPublishing, setIsBulkPublishing] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [draftCount, setDraftCount] = useState(0);
  const [publishedCount, setPublishedCount] = useState(0);
  const [linkCounts, setLinkCounts] = useState<Record<string, { inbound: number; outbound: number }>>({});
  const { toast } = useToast();

  // Fetch blog categories from database
  const { data: blogCategories = [] } = useQuery({
    queryKey: ['admin-blog-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('slug, name')
        .order('name');
      if (error) throw error;
      return data as { slug: string; name: string }[];
    },
  });

  // Fetch link counts for current page posts
  const fetchLinkCounts = useCallback(async (postIds: string[]) => {
    if (postIds.length === 0) { setLinkCounts({}); return; }
    const { data } = await supabase
      .from('article_embeddings')
      .select('content_id, inbound_count, outbound_count')
      .in('content_id', postIds);
    const map: Record<string, { inbound: number; outbound: number }> = {};
    data?.forEach(row => {
      if (row.content_id) {
        map[row.content_id] = { inbound: row.inbound_count || 0, outbound: row.outbound_count || 0 };
      }
    });
    setLinkCounts(map);
  }, []);

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
  }, [statusFilter, categoryFilter, debouncedSearch]);

  // Fetch posts when dependencies change
  useEffect(() => {
    fetchPosts();
  }, [currentPage, statusFilter, categoryFilter, debouncedSearch]);

  // Fetch draft count separately (for header display)
  useEffect(() => {
    fetchDraftCount();
    fetchPublishedCount();
  }, []);

  const fetchDraftCount = async () => {
    const { count } = await supabase
      .from('blog_posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'draft');
    setDraftCount(count || 0);
  };

  const fetchPublishedCount = async () => {
    const { count } = await supabase
      .from('blog_posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');
    setPublishedCount(count || 0);
  };

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    
    let query = supabase
      .from('blog_posts')
      .select('id, title, slug, category, category_slug, status, author, created_at, views, meta_title, meta_description', { count: 'exact' });
    
    // Apply filters on backend
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }
    if (categoryFilter !== 'all') {
      query = query.eq('category_slug', categoryFilter);
    }
    if (debouncedSearch) {
      query = query.ilike('title', `%${debouncedSearch}%`);
    }
    
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE - 1);
    
    if (error) {
      toast({
        title: 'Error fetching posts',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setPosts(data || []);
      setTotalCount(count || 0);
      fetchLinkCounts((data || []).map(p => p.id));
    }
    setIsLoading(false);
  }, [currentPage, statusFilter, categoryFilter, debouncedSearch, toast]);

  const deletePost = async (id: string) => {
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error deleting post',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Post deleted',
        description: 'The blog post has been deleted.',
      });
      fetchPosts();
      fetchDraftCount();
    }
    setDeletingPostId(null);
  };

  const handleBulkPublish = async () => {
    if (selectedIds.size === 0) return;
    
    setIsBulkPublishing(true);
    const idsArray = Array.from(selectedIds);
    let successCount = 0;
    let errorOccurred = false;
    let pillarDateMap = new Map<string, string>();

    try {
      // Fetch selected posts to identify pillars
      const { data: selectedPosts } = await supabase
        .from('blog_posts')
        .select('id, article_type, content_plan_id')
        .in('id', idsArray);

      const pillarPosts = (selectedPosts || []).filter(
        p => p.article_type === 'pillar' && p.content_plan_id
      );
      const pillarIds = new Set(pillarPosts.map(p => p.id));
      const nonPillarIds = idsArray.filter(id => !pillarIds.has(id));

      // For pillars, compute backdated published_at per content_plan
      

      if (pillarPosts.length > 0) {
        const planIds = [...new Set(pillarPosts.map(p => p.content_plan_id!))];
        
        // For each plan, find the earliest published cluster's published_at
        for (const planId of planIds) {
          const { data: earliestCluster } = await supabase
            .from('blog_posts')
            .select('published_at')
            .eq('content_plan_id', planId)
            .eq('status', 'published')
            .not('published_at', 'is', null)
            .neq('article_type', 'pillar')
            .order('published_at', { ascending: true })
            .limit(1);

          const earliestDate = earliestCluster?.[0]?.published_at;
          const pillarDate = earliestDate
            ? new Date(new Date(earliestDate).getTime() - 60 * 60 * 1000).toISOString()
            : new Date().toISOString();

          // Assign this date to all pillars in this plan
          for (const p of pillarPosts.filter(pp => pp.content_plan_id === planId)) {
            pillarDateMap.set(p.id, pillarDate);
          }
        }
      }

      // Publish non-pillar posts in batches
      const BATCH_SIZE = 50;
      const now = new Date().toISOString();
      
      for (let i = 0; i < nonPillarIds.length; i += BATCH_SIZE) {
        const batch = nonPillarIds.slice(i, i + BATCH_SIZE);
        const { error } = await supabase
          .from('blog_posts')
          .update({ status: 'published', published_at: now })
          .in('id', batch);
        
        if (error) {
          errorOccurred = true;
          toast({ title: 'Error publishing posts', description: error.message, variant: 'destructive' });
          break;
        }
        await supabase.from('content_queue').update({ status: 'published', published_at: now }).in('blog_post_id', batch);
        successCount += batch.length;
      }

      // Publish pillar posts individually with their backdated timestamps
      if (!errorOccurred) {
        for (const [postId, pubDate] of pillarDateMap.entries()) {
          const { error } = await supabase
            .from('blog_posts')
            .update({ status: 'published', published_at: pubDate })
            .eq('id', postId);
          
          if (error) {
            errorOccurred = true;
            toast({ title: 'Error publishing pillar', description: error.message, variant: 'destructive' });
            break;
          }
          await supabase.from('content_queue').update({ status: 'published', published_at: pubDate }).in('blog_post_id', [postId]);
          successCount++;
        }
      }
    } catch (e: any) {
      errorOccurred = true;
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }

    if (!errorOccurred) {
      toast({
        title: 'Posts published',
        description: `Successfully published ${successCount} posts.${pillarDateMap.size > 0 ? ` ${pillarDateMap.size} pillar(s) backdated to sit before their clusters.` : ''}`,
      });
    } else if (successCount > 0) {
      toast({
        title: 'Partial publish',
        description: `Published ${successCount} of ${selectedIds.size} posts.`,
      });
    }
    
    setSelectedIds(new Set());
    fetchPosts();
    fetchDraftCount();
    fetchPublishedCount();
    setIsBulkPublishing(false);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    
    setIsBulkDeleting(true);
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .in('id', Array.from(selectedIds));

    if (error) {
      toast({
        title: 'Error deleting posts',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Posts deleted',
        description: `Successfully deleted ${selectedIds.size} posts.`,
      });
      setSelectedIds(new Set());
      fetchPosts();
      fetchDraftCount();
    }
    setIsBulkDeleting(false);
    setShowBulkDeleteDialog(false);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === posts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(posts.map(p => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE);

  if (isLoading && posts.length === 0) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 overflow-x-hidden max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Blog Posts</h1>
          <p className="text-muted-foreground">
            {totalCount.toLocaleString()} total posts
            {publishedCount > 0 && (
              <span className="ml-2 text-success">• {publishedCount.toLocaleString()} published</span>
            )}
            {draftCount > 0 && (
              <span className="ml-2 text-amber-600">• {draftCount} drafts</span>
            )}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <ExportButton exportType="blog_posts" label="Export" />
          <Button variant="outline" onClick={() => navigate('/admin/blog/generate')}>
            <Sparkles className="h-4 w-4 mr-2" />
            AI Generate
          </Button>
          <Button variant="accent" onClick={() => navigate('/admin/blog/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
        </div>
      </div>

      {/* Image Backfill Card */}
      <ImageBackfillCard />

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <Card className="mb-4 border-primary/50 bg-primary/5">
          <CardContent className="py-3 px-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-primary" />
                <span className="font-medium">{selectedIds.size} selected</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Clear
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowBulkDeleteDialog(true)}
                  disabled={isBulkDeleting}
                >
                  {isBulkDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-1" />
                  )}
                  Delete
                </Button>
                <Button
                  size="sm"
                  onClick={handleBulkPublish}
                  disabled={isBulkPublishing}
                >
                  {isBulkPublishing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : null}
                  Publish Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search posts..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {blogCategories.map(cat => (
                    <SelectItem key={cat.slug} value={cat.slug}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
                size="sm"
              >
                All
              </Button>
              <Button 
                variant={statusFilter === 'published' ? 'default' : 'ghost'}
                onClick={() => setStatusFilter('published')}
                size="sm"
              >
                Published
              </Button>
              <Button 
                variant={statusFilter === 'draft' ? 'default' : 'ghost'}
                onClick={() => setStatusFilter('draft')}
                size="sm"
              >
                Drafts ({draftCount})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts Table */}
      <Card>
        <CardContent className="p-0">
          {posts.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <Checkbox
                        checked={selectedIds.size === posts.length && posts.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="w-[45%]">Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Links</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post) => (
                    <TableRow key={post.id} data-selected={selectedIds.has(post.id) ? 'true' : undefined} className={selectedIds.has(post.id) ? 'bg-muted' : ''}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(post.id)}
                          onCheckedChange={() => toggleSelect(post.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{post.title}</p>
                          <p className="text-sm text-muted-foreground">{post.author}</p>
                          {post.meta_title && (
                            <p className="text-xs text-muted-foreground/70 truncate max-w-md">
                              <span className="font-medium">Meta:</span> {post.meta_title}
                            </p>
                          )}
                          {post.meta_description && (
                            <p className="text-xs text-muted-foreground/60 truncate max-w-md">
                              {post.meta_description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{post.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={post.status === 'published' ? 'default' : 'outline'}
                          className={post.status === 'published' ? 'bg-success' : ''}
                        >
                          {post.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-0.5 text-xs ${(linkCounts[post.id]?.inbound ?? 0) === 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                            <ArrowDownToLine className="h-3 w-3" />
                            {linkCounts[post.id]?.inbound ?? 0}
                          </span>
                          <span className={`inline-flex items-center gap-0.5 text-xs ${(linkCounts[post.id]?.outbound ?? 0) >= 8 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                            <ArrowUpFromLine className="h-3 w-3" />
                            {linkCounts[post.id]?.outbound ?? 0}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(post.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {post.views.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => window.open(`/articles/${post.category_slug}/${post.slug || post.id}`, '_blank')}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/admin/blog/edit/${post.id}`)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => setDeletingPostId(post.id)}
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
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 border-t">
                  <QueuePagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={totalCount}
                    itemsPerPage={POSTS_PER_PAGE}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? 'No posts match your filters' 
                  : 'No blog posts yet'}
              </p>
              {!searchQuery && statusFilter === 'all' && categoryFilter === 'all' && (
                <Button variant="accent" onClick={() => navigate('/admin/blog/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Post
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Single Post Dialog */}
      <AlertDialog open={!!deletingPostId} onOpenChange={() => setDeletingPostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Blog Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this blog post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingPostId && deletePost(deletingPostId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} Blog Posts</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedIds.size} blog posts? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete {selectedIds.size} Posts
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminBlog;
