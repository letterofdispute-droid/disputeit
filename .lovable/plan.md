

# Full Automation for Content Generation Pipeline

## Overview

This plan enhances the existing bulk article generation system to be fully autonomous - automatically selecting featured images, middle images, and assigning proper categories - so you can generate 7-10 articles for a template with a single click and have them ready for bulk publishing.

## Current State

The system already has:
- Content queue with bulk generation capability
- `bulk-generate-articles` edge function that creates articles
- `suggest-images` function for finding Pixabay images
- `fetch-category-images` function that downloads and self-hosts images
- 6 blog categories: Consumer Rights, Complaint Guides, Contractors, Industry News, Legal Tips, Success Stories

What's missing:
- Automatic image selection during generation (articles are created without images)
- Automatic category mapping (uses template category_id, not blog categories)
- Bulk publish capability for drafts

---

## Implementation Plan

### Phase 1: Enhance `bulk-generate-articles` Edge Function

Modify the edge function to:

1. **Auto-select featured image** - After generating content, call Pixabay API with the article title to get an image, download it, and upload to storage
2. **Auto-select middle images** - Based on the `{{MIDDLE_IMAGE_1}}` and `{{MIDDLE_IMAGE_2}}` placeholders in content
3. **Smart category mapping** - Map template categories to existing blog categories using AI or rules

```text
┌─────────────────────────────────────────────────────────────────┐
│                   Enhanced Generation Flow                       │
├─────────────────────────────────────────────────────────────────┤
│  1. Fetch queue item                                            │
│  2. Generate article content (existing)                         │
│  3. NEW: Use AI to map to blog category                         │
│  4. NEW: Search Pixabay for featured image                      │
│  5. NEW: Download and upload to storage                         │
│  6. NEW: Search for middle image(s) with different keywords     │
│  7. NEW: Download and upload middle images                      │
│  8. Create blog post with all images populated                  │
│  9. Update queue item status                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 2: Category Mapping Logic

Map the 13 template categories to 6 blog categories:

| Template Category | Blog Category |
|-------------------|---------------|
| refunds, damaged-goods, ecommerce | Consumer Rights |
| housing, hoa | Complaint Guides or Consumer Rights |
| contractors | Contractors |
| financial, insurance | Legal Tips |
| employment | Consumer Rights |
| travel, vehicle, utilities | Complaint Guides |
| healthcare | Consumer Rights |

The AI will also suggest the best category based on article content.

### Phase 3: Add Bulk Publish Functionality

Enhance `AdminBlog.tsx` to support:

1. **Checkbox selection** for bulk operations
2. **Bulk status filter** - Filter by "All Drafts" 
3. **Bulk publish button** - Publish all selected drafts at once
4. **Category filter** - Filter by blog category

```text
┌────────────────────────────────────────────────────────────────────────┐
│  Blog Posts                                    [☐ Select All] [Publish]│
├────────────────────────────────────────────────────────────────────────┤
│  Filters: [All ▼] [Drafts ▼] [Consumer Rights ▼]    [🔍 Search...]    │
├────────────────────────────────────────────────────────────────────────┤
│  ☐ Title                          Category          Status    Actions  │
│  ☑ How to dispute a parking...   Consumer Rights   draft     ...      │
│  ☑ Your rights when...           Complaint Guides  draft     ...      │
│  ☑ 5 common mistakes...          Legal Tips        draft     ...      │
└────────────────────────────────────────────────────────────────────────┘
│                            Selected: 3 │ [Delete] [Publish Selected]   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Technical Details

### 1. Edge Function Changes (`bulk-generate-articles/index.ts`)

Add image fetching logic:

```typescript
// After generating article content...

// 1. Fetch featured image from Pixabay
const featuredImageUrl = await fetchAndUploadImage(
  supabaseAdmin,
  parsedContent.title,
  `articles/${slug}-featured`
);

// 2. Detect and fetch middle images
const hasMiddleImage1 = parsedContent.content.includes('{{MIDDLE_IMAGE_1}}');
const hasMiddleImage2 = parsedContent.content.includes('{{MIDDLE_IMAGE_2}}');

let middleImage1Url = null;
let middleImage2Url = null;

if (hasMiddleImage1) {
  // Use different search terms for variety
  middleImage1Url = await fetchAndUploadImage(
    supabaseAdmin,
    `${plan.category_id} ${item.suggested_keywords?.[0] || ''}`,
    `articles/${slug}-middle1`
  );
}

if (hasMiddleImage2) {
  middleImage2Url = await fetchAndUploadImage(
    supabaseAdmin,
    `${item.suggested_keywords?.[1] || plan.template_name}`,
    `articles/${slug}-middle2`
  );
}

// 3. Map category using simple rules
const blogCategory = mapToBlogCategory(plan.category_id);

// 4. Create blog post with images
const { data: blogPost } = await supabaseAdmin
  .from('blog_posts')
  .insert({
    // ... existing fields ...
    featured_image_url: featuredImageUrl,
    middle_image_1_url: middleImage1Url,
    middle_image_2_url: middleImage2Url,
    category: blogCategory.name,
    category_slug: blogCategory.slug,
  });
```

### 2. New Helper Function: `fetchAndUploadImage`

```typescript
async function fetchAndUploadImage(
  supabase: SupabaseClient,
  searchQuery: string,
  storagePath: string
): Promise<string | null> {
  const pixabayKey = Deno.env.get('PIXABAY_API_KEY');
  
  // Search Pixabay with random offset for variety
  const randomOffset = Math.floor(Math.random() * 20);
  const url = `https://pixabay.com/api/?key=${pixabayKey}&q=${encodeURIComponent(searchQuery)}&image_type=photo&orientation=horizontal&per_page=30&safesearch=true`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (!data.hits?.length) return null;
  
  // Pick random image from results for variety
  const randomIndex = Math.min(randomOffset, data.hits.length - 1);
  const hit = data.hits[randomIndex];
  
  // Download and upload
  const imageResponse = await fetch(hit.largeImageURL);
  const imageBuffer = await imageResponse.arrayBuffer();
  
  await supabase.storage
    .from('blog-images')
    .upload(`${storagePath}.jpg`, imageBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });
  
  const { data: { publicUrl } } = supabase.storage
    .from('blog-images')
    .getPublicUrl(`${storagePath}.jpg`);
  
  return publicUrl;
}
```

### 3. Category Mapping Function

```typescript
const CATEGORY_MAP: Record<string, { slug: string; name: string }> = {
  'refunds': { slug: 'consumer-rights', name: 'Consumer Rights' },
  'damaged-goods': { slug: 'consumer-rights', name: 'Consumer Rights' },
  'ecommerce': { slug: 'consumer-rights', name: 'Consumer Rights' },
  'housing': { slug: 'complaint-guides', name: 'Complaint Guides' },
  'hoa': { slug: 'complaint-guides', name: 'Complaint Guides' },
  'contractors': { slug: 'contractors', name: 'Contractors' },
  'financial': { slug: 'legal-tips', name: 'Legal Tips' },
  'insurance': { slug: 'legal-tips', name: 'Legal Tips' },
  'employment': { slug: 'consumer-rights', name: 'Consumer Rights' },
  'travel': { slug: 'complaint-guides', name: 'Complaint Guides' },
  'vehicle': { slug: 'complaint-guides', name: 'Complaint Guides' },
  'utilities': { slug: 'complaint-guides', name: 'Complaint Guides' },
  'healthcare': { slug: 'consumer-rights', name: 'Consumer Rights' },
};

function mapToBlogCategory(templateCategory: string) {
  return CATEGORY_MAP[templateCategory] || { slug: 'consumer-rights', name: 'Consumer Rights' };
}
```

### 4. AdminBlog.tsx Bulk Actions

Add selection state and bulk operations:

```typescript
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

const handleBulkPublish = async () => {
  const { error } = await supabase
    .from('blog_posts')
    .update({ 
      status: 'published', 
      published_at: new Date().toISOString() 
    })
    .in('id', Array.from(selectedIds));
    
  if (!error) {
    toast({ title: `Published ${selectedIds.size} posts` });
    setSelectedIds(new Set());
    fetchPosts();
  }
};
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/bulk-generate-articles/index.ts` | Add image fetching, category mapping |
| `src/pages/admin/AdminBlog.tsx` | Add checkbox selection, bulk actions bar, category filter |

## New Files (if needed)

None - all functionality can be added to existing files.

---

## Expected Workflow After Implementation

1. Go to SEO Dashboard
2. Click "Plan Cluster" for a template
3. Select article types (8-10 articles)
4. Click "Generate All"
5. Wait for generation (articles now include images and correct categories)
6. Go to Blog Posts
7. Filter by "Draft" status
8. Select all (or filter by category first)
9. Click "Publish Selected"
10. Done - 10 articles live with images

---

## Time Estimate

- Phase 1 (Image automation): ~30 minutes
- Phase 2 (Category mapping): ~10 minutes  
- Phase 3 (Bulk publish UI): ~20 minutes
- Testing: ~15 minutes

**Total: ~1.5 hours**

