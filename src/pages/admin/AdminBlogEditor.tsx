import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Eye, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import RichTextEditor from '@/components/admin/blog/RichTextEditor';
import SEOPanel from '@/components/admin/blog/SEOPanel';
import FeaturedImageUploader from '@/components/admin/blog/FeaturedImageUploader';
import MiddleImagePicker from '@/components/admin/blog/MiddleImagePicker';
import TagInput from '@/components/admin/blog/TagInput';
import CategorySelect from '@/components/admin/blog/CategorySelect';
import PostStatusPanel from '@/components/admin/blog/PostStatusPanel';

const AdminBlogEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const isEditing = !!id;

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoSuggesting, setIsAutoSuggesting] = useState(false);
  const hasAutoSuggested = useRef(false);
  const [availableCategories, setAvailableCategories] = useState<Array<{ slug: string; name: string }>>([]);

  // Post data
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [status, setStatus] = useState('draft');
  const [isFeatured, setIsFeatured] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');
  const [middleImage1Url, setMiddleImage1Url] = useState('');
  const [middleImage2Url, setMiddleImage2Url] = useState('');

  // Fetch categories for auto-suggest
  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from('blog_categories').select('slug, name');
      if (data) setAvailableCategories(data);
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (isEditing) {
      fetchPost();
    }
  }, [id]);

  useEffect(() => {
    if (!isEditing && title) {
      setSlug(title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
    }
  }, [title, isEditing]);

  // Auto-suggest category and tags when content is available
  useEffect(() => {
    if (hasAutoSuggested.current || isLoading) return;
    if (title.length < 10 || content.length < 50) return;
    if (category && tags.length > 0) return;
    if (availableCategories.length === 0) return;

    const timer = setTimeout(async () => {
      hasAutoSuggested.current = true;
      setIsAutoSuggesting(true);

      try {
        const { data, error } = await supabase.functions.invoke('suggest-category-tags', {
          body: { title, content, excerpt, availableCategories }
        });

        if (error) throw error;

        let filled = false;
        if (!category && data?.suggestedCategory) {
          setCategory(data.suggestedCategory);
          filled = true;
        }
        if (tags.length === 0 && data?.suggestedTags?.length > 0) {
          setTags(data.suggestedTags.slice(0, 2));
          filled = true;
        }

        if (filled) {
          toast({ title: '✨ AI filled in category & tags' });
        }
      } catch (e) {
        console.error('Auto-suggest failed:', e);
      } finally {
        setIsAutoSuggesting(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [title, content, excerpt, category, tags.length, isLoading, availableCategories]);

  const fetchPost = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setTitle(data.title);
        setSlug(data.slug);
        setContent(data.content || '');
        setExcerpt(data.excerpt || '');
        setCategory(data.category_slug || '');
        setTags(data.tags || []);
        setStatus(data.status);
        setIsFeatured(data.featured || false);
        setScheduledAt(data.scheduled_at ? new Date(data.scheduled_at) : null);
        setMetaTitle(data.meta_title || '');
        setMetaDescription(data.meta_description || '');
        setFeaturedImageUrl(data.featured_image_url || '');
        setMiddleImage1Url((data as any).middle_image_1_url || '');
        setMiddleImage2Url((data as any).middle_image_2_url || '');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      toast({ title: 'Error', description: 'Failed to load post.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (publishStatus?: string) => {
    if (!title.trim()) {
      toast({ title: 'Title required', description: 'Please enter a title.', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const categoryName = availableCategories.find(c => c.slug === category)?.name || category;
      const postData = {
        title,
        slug,
        content,
        excerpt,
        category: categoryName,
        category_slug: category,
        tags,
        status: publishStatus || status,
        featured: isFeatured,
        scheduled_at: scheduledAt?.toISOString() || null,
        meta_title: metaTitle,
        meta_description: metaDescription,
        featured_image_url: featuredImageUrl,
        middle_image_1_url: middleImage1Url || null,
        middle_image_2_url: middleImage2Url || null,
        author_id: user?.id,
        author: user?.email?.split('@')[0] || 'Admin',
      };

      if (isEditing) {
        const { error } = await supabase.from('blog_posts').update(postData).eq('id', id);
        if (error) throw error;
        toast({ title: 'Post updated', description: 'Your changes have been saved.' });
      } else {
        const { error } = await supabase.from('blog_posts').insert(postData);
        if (error) throw error;
        toast({ title: 'Post created', description: 'Your post has been created.' });
        navigate('/admin/blog');
      }
    } catch (error) {
      console.error('Error saving post:', error);
      toast({ title: 'Error', description: 'Failed to save post.', variant: 'destructive' });
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
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/blog')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Posts
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleSave('draft')} disabled={isSaving}>
              Save Draft
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.open(`/articles/${category}/${slug}`, '_blank')}>
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
              placeholder="Post title..."
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

          <RichTextEditor content={content} onChange={setContent} placeholder="Write your content here..." />

          <div className="space-y-2">
            <Label>Excerpt</Label>
            <Textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="A short summary of your post..."
              rows={3}
            />
          </div>

          <SEOPanel
            metaTitle={metaTitle}
            metaDescription={metaDescription}
            onMetaTitleChange={setMetaTitle}
            onMetaDescriptionChange={setMetaDescription}
            onTagsSuggested={setTags}
            onExcerptSuggested={setExcerpt}
            title={title}
            content={content}
            excerpt={excerpt}
          />
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-72 space-y-4">
          <PostStatusPanel
            status={status}
            onStatusChange={setStatus}
            isFeatured={isFeatured}
            onFeaturedChange={setIsFeatured}
            scheduledAt={scheduledAt}
            onScheduledAtChange={setScheduledAt}
          />
          {isAutoSuggesting && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded-md">
              <Sparkles className="h-4 w-4 animate-pulse text-primary" />
              AI analyzing content...
            </div>
          )}
          <CategorySelect value={category} onChange={setCategory} title={title} content={content} />
          <TagInput tags={tags} onChange={setTags} title={title} content={content} />
          <FeaturedImageUploader
            imageUrl={featuredImageUrl}
            onImageChange={setFeaturedImageUrl}
            title={title}
            excerpt={excerpt}
          />
          <MiddleImagePicker
            content={content}
            middleImage1Url={middleImage1Url}
            middleImage2Url={middleImage2Url}
            onMiddleImage1Change={setMiddleImage1Url}
            onMiddleImage2Change={setMiddleImage2Url}
            title={title}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminBlogEditor;
