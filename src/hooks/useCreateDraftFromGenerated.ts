import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import type { GeneratedContent } from './useGenerateBlogContent';
import type { SuggestedImage } from './useImageSuggestions';

interface CreateDraftParams {
  content: GeneratedContent;
  featuredImage?: SuggestedImage | null;
  publish?: boolean;
}

export function useCreateDraftFromGenerated() {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const createDraft = async ({ content, featuredImage, publish = false }: CreateDraftParams) => {
    if (!user) {
      toast({
        title: 'Not authenticated',
        description: 'Please log in to create posts',
        variant: 'destructive',
      });
      return null;
    }

    setIsCreating(true);

    try {
      // Generate slug from title
      const slug = content.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 100);

      // Check if slug exists and make unique if needed
      const { data: existing } = await supabase
        .from('blog_posts')
        .select('slug')
        .eq('slug', slug)
        .single();

      const finalSlug = existing 
        ? `${slug}-${Date.now().toString(36)}`
        : slug;

      // Find or use suggested category
      let categorySlug = content.suggested_category || 'consumer-rights';
      let categoryName = categorySlug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      // Check if category exists
      const { data: categoryData } = await supabase
        .from('blog_categories')
        .select('slug, name')
        .eq('slug', categorySlug)
        .single();

      if (categoryData) {
        categorySlug = categoryData.slug;
        categoryName = categoryData.name;
      } else {
        // Create the category if it doesn't exist
        await supabase
          .from('blog_categories')
          .insert({
            name: categoryName,
            slug: categorySlug,
          });
      }

      // Upload featured image if selected
      let featuredImageUrl = null;
      if (featuredImage) {
        try {
          // Download image and upload to Supabase storage
          const imageResponse = await fetch(featuredImage.url);
          const imageBlob = await imageResponse.blob();
          
          const fileName = `${finalSlug}-${Date.now()}.jpg`;
          
          const { error: uploadError } = await supabase.storage
            .from('blog-images')
            .upload(fileName, imageBlob, {
              contentType: 'image/jpeg',
              upsert: true,
            });

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('blog-images')
              .getPublicUrl(fileName);
            featuredImageUrl = publicUrl;
          }
        } catch (e) {
          console.error('Failed to upload featured image:', e);
          // Continue without featured image
        }
      }

      // Clean content - ensure middle image placeholder is on its own line
      let cleanedContent = content.content
        .replace(/{{MIDDLE_IMAGE}}/g, '<p class="middle-image-placeholder">{{MIDDLE_IMAGE}}</p>');

      // Strip legacy /blog/* links
      cleanedContent = cleanedContent.replace(
        /<a\s+[^>]*href=["']\/blog\/[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi,
        '$1'
      );

      // Normalize trailing slashes and query strings on internal hrefs
      cleanedContent = cleanedContent.replace(
        /href="(\/[^"]*?)(\?[^"]*)?"/gi,
        (_full: string, path: string, _query: string) => {
          const clean = path.replace(/\/$/, '') || '/';
          return `href="${clean}"`;
        }
      );

      // Sanitize template links with invalid categories
      const VALID_TEMPLATE_CATS = new Set([
        'refunds','housing','travel','damaged-goods','utilities','financial',
        'insurance','vehicle','healthcare','employment','ecommerce','hoa',
        'contractors','mortgage',
      ]);
      cleanedContent = cleanedContent.replace(
        /<a\s+([^>]*?)href="\/templates\/([^/"]+)(\/[^"]*?)"([^>]*?)>([\s\S]*?)<\/a>/gi,
        (full: string, pre: string, catId: string, rest: string, post: string, inner: string) => {
          if (VALID_TEMPLATE_CATS.has(catId)) return full;
          const normalized = catId.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
          if (VALID_TEMPLATE_CATS.has(normalized)) {
            return `<a ${pre}href="/templates/${normalized}${rest}"${post}>${inner}</a>`;
          }
          return inner; // Strip broken link
        }
      );

      // Create the blog post
      const { data: post, error: postError } = await supabase
        .from('blog_posts')
        .insert({
          title: content.title,
          slug: finalSlug,
          excerpt: content.excerpt,
          content: cleanedContent,
          featured_image_url: featuredImageUrl,
          category: categoryName,
          category_slug: categorySlug,
          tags: content.suggested_tags.slice(0, 3),
          meta_title: content.seo_title,
          meta_description: content.seo_description,
          status: publish ? 'published' : 'draft',
          published_at: publish ? new Date().toISOString() : null,
          author: 'Admin',
          author_id: user.id,
          read_time: `${Math.ceil(content.word_count / 200)} min read`,
        })
        .select()
        .single();

      if (postError) {
        throw postError;
      }

      // Sync content_queue status if this post came from the pipeline
      if (post.id && publish) {
        await supabase
          .from('content_queue')
          .update({ status: 'published', published_at: new Date().toISOString() })
          .eq('blog_post_id', post.id);
      }

      toast({
        title: publish ? 'Post published!' : 'Draft created!',
        description: `"${content.title}" has been ${publish ? 'published' : 'saved as draft'}`,
      });

      return {
        postId: post.id,
        slug: finalSlug,
        title: content.title,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create post';
      toast({
        title: 'Failed to create post',
        description: message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createDraft,
    isCreating,
  };
}
