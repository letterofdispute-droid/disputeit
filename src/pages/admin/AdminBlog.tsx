import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, Search, Edit, Trash2, Eye, 
  MoreHorizontal, Calendar, Loader2, Sparkles, CheckSquare
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
}

// Blog categories available in the system
const BLOG_CATEGORIES = [
  { slug: 'consumer-rights', name: 'Consumer Rights' },
  { slug: 'complaint-guides', name: 'Complaint Guides' },
  { slug: 'contractors', name: 'Contractors' },
  { slug: 'legal-tips', name: 'Legal Tips' },
  { slug: 'industry-news', name: 'Industry News' },
  { slug: 'success-stories', name: 'Success Stories' },
];

const AdminBlog = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkPublishing, setIsBulkPublishing] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error fetching posts',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setPosts(data || []);
    }
    setIsLoading(false);
  };

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
    }
    setDeletingPostId(null);
  };

  const handleBulkPublish = async () => {
    if (selectedIds.size === 0) return;
    
    setIsBulkPublishing(true);
    const { error } = await supabase
      .from('blog_posts')
      .update({ 
        status: 'published', 
        published_at: new Date().toISOString() 
      })
      .in('id', Array.from(selectedIds));

    if (error) {
      toast({
        title: 'Error publishing posts',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Posts published',
        description: `Successfully published ${selectedIds.size} posts.`,
      });
      setSelectedIds(new Set());
      fetchPosts();
    }
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
    }
    setIsBulkDeleting(false);
    setShowBulkDeleteDialog(false);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredPosts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPosts.map(p => p.id)));
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

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || post.category_slug === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Count drafts for quick action
  const draftCount = posts.filter(p => p.status === 'draft').length;

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Blog Posts</h1>
          <p className="text-muted-foreground">
            Manage your blog content
            {draftCount > 0 && (
              <span className="ml-2 text-amber-600">• {draftCount} drafts</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
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

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <Card className="mb-4 border-primary/50 bg-primary/5">
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-primary" />
                <span className="font-medium">{selectedIds.size} selected</span>
              </div>
              <div className="flex gap-2">
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
                  {BLOG_CATEGORIES.map(cat => (
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
          {filteredPosts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={selectedIds.size === filteredPosts.length && filteredPosts.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="w-[40%]">Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPosts.map((post) => (
                  <TableRow key={post.id} data-selected={selectedIds.has(post.id) ? 'true' : undefined} className={selectedIds.has(post.id) ? 'bg-muted' : ''}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(post.id)}
                        onCheckedChange={() => toggleSelect(post.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{post.title}</p>
                        <p className="text-sm text-muted-foreground">{post.author}</p>
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
