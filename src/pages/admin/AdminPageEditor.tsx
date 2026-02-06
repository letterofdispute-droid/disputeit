import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import RichTextEditor from '@/components/admin/blog/RichTextEditor';
import SEOPanel from '@/components/admin/blog/SEOPanel';
import FeaturedImageUploader from '@/components/admin/blog/FeaturedImageUploader';

interface Page {
  id: string;
  title: string;
  slug: string;
}

const AdminPageEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const isEditing = !!id;

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [allPages, setAllPages] = useState<Page[]>([]);

  // Page data
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [sortOrder, setSortOrder] = useState(0);
  const [status, setStatus] = useState('draft');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');

  useEffect(() => {
    fetchAllPages();
    if (isEditing) {
      fetchPage();
    }
  }, [id]);

  useEffect(() => {
    if (!isEditing && title) {
      setSlug(title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
    }
  }, [title, isEditing]);

  const fetchAllPages = async () => {
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('id, title, slug')
        .order('title');

      if (error) throw error;
      // Filter out current page if editing
      setAllPages((data || []).filter(p => p.id !== id));
    } catch (error) {
      console.error('Error fetching pages:', error);
    }
  };

  const fetchPage = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setTitle(data.title);
        setSlug(data.slug);
        setContent(data.content || '');
        setExcerpt(data.excerpt || '');
        setParentId(data.parent_id || '');
        setSortOrder(data.sort_order || 0);
        setStatus(data.status);
        setMetaTitle(data.meta_title || '');
        setMetaDescription(data.meta_description || '');
        setFeaturedImageUrl(data.featured_image_url || '');
      }
    } catch (error) {
      console.error('Error fetching page:', error);
      toast({ title: 'Error', description: 'Failed to load page.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (publishStatus?: string) => {
    if (!title.trim()) {
      toast({ title: 'Title required', description: 'Please enter a title.', variant: 'destructive' });
      return;
    }

    if (!slug.trim()) {
      toast({ title: 'Slug required', description: 'Please enter a URL slug.', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const pageData = {
        title,
        slug,
        content,
        excerpt,
        parent_id: parentId || null,
        sort_order: sortOrder,
        status: publishStatus || status,
        meta_title: metaTitle,
        meta_description: metaDescription,
        featured_image_url: featuredImageUrl,
        author_id: user?.id,
        author: user?.email?.split('@')[0] || 'Admin',
      };

      if (isEditing) {
        const { error } = await supabase.from('pages').update(pageData).eq('id', id);
        if (error) throw error;
        toast({ title: 'Page updated', description: 'Your changes have been saved.' });
      } else {
        const { error } = await supabase.from('pages').insert(pageData);
        if (error) throw error;
        toast({ title: 'Page created', description: 'Your page has been created.' });
        navigate('/admin/pages');
      }
    } catch (error: any) {
      console.error('Error saving page:', error);
      if (error.code === '23505') {
        toast({ title: 'Error', description: 'A page with this slug already exists.', variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: 'Failed to save page.', variant: 'destructive' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden max-w-full">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/pages')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Pages
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleSave('draft')} disabled={isSaving}>
              Save Draft
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.open(`/${slug}`, '_blank')}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button size="sm" onClick={() => handleSave('published')} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Publish
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex flex-col lg:flex-row gap-6 p-6">
        {/* Main Editor */}
        <div className="flex-1 space-y-6">
          <div className="space-y-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Page title..."
              className="text-2xl font-bold border-0 border-b rounded-none px-0 focus-visible:ring-0"
            />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Label>Slug:</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className="h-7 text-sm max-w-xs"
              />
            </div>
          </div>

          <RichTextEditor content={content} onChange={setContent} placeholder="Write your page content here..." />

          <div className="space-y-2">
            <Label>Excerpt</Label>
            <Textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="A short summary of your page..."
              rows={3}
            />
          </div>

          <SEOPanel
            metaTitle={metaTitle}
            metaDescription={metaDescription}
            onMetaTitleChange={setMetaTitle}
            onMetaDescriptionChange={setMetaDescription}
            onTagsSuggested={() => {}}
            onExcerptSuggested={setExcerpt}
            title={title}
            content={content}
            excerpt={excerpt}
          />
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-72 space-y-4">
          {/* Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="published">Published</Label>
                <Switch
                  id="published"
                  checked={status === 'published'}
                  onCheckedChange={(checked) => setStatus(checked ? 'published' : 'draft')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Hierarchy */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Page Hierarchy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Parent Page</Label>
                <Select value={parentId} onValueChange={setParentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="No parent (root level)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No parent (root level)</SelectItem>
                    {allPages.map((page) => (
                      <SelectItem key={page.id} value={page.id}>
                        {page.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                  min={0}
                />
                <p className="text-xs text-muted-foreground">Lower numbers appear first</p>
              </div>
            </CardContent>
          </Card>

          {/* Featured Image */}
          <FeaturedImageUploader
            imageUrl={featuredImageUrl}
            onImageChange={setFeaturedImageUrl}
            title={title}
            excerpt={excerpt}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminPageEditor;
