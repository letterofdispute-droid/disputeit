
# AI Blog Generator Implementation Plan

## Current State Analysis

Your project already has a solid foundation:

**Existing Infrastructure:**
- Blog database tables (`blog_posts`, `blog_categories`, `blog_tags`) - already exists
- `blog-images` storage bucket - already exists  
- `generate-blog-image` edge function - generates AI images with Gemini
- `generate-seo` edge function - generates SEO metadata
- Rich text editor with TipTap - works well
- Admin blog editor (`AdminBlogEditor.tsx`) - manual editing flow
- Required secrets configured: `LOVABLE_API_KEY`, `PIXABAY_API_KEY`

**What We're Building:**
A new **AI Blog Generator** that creates complete articles from a simple topic, with:
- AI-generated SEO-optimized content (HTML)
- Stock image search (Unsplash + Pixabay)
- AI image generation option
- One-click draft creation

---

## Architecture Overview

```text
┌────────────────────────────────────────────────────────────────┐
│                    AI BLOG GENERATOR                           │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌──────────────────────────────────┐   │
│  │  Input Panel    │    │  Generated Content Preview       │   │
│  │  - Topic        │    │  - Title                        │   │
│  │  - Keywords     │    │  - HTML Content                 │   │
│  │  - Word Count   │    │  - Excerpt                      │   │
│  │  - Tone         │    │  - SEO Metrics                  │   │
│  │  - Category     │    │  - LSI Keywords                 │   │
│  └────────┬────────┘    └──────────────────────────────────┘   │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Featured Image Selection                    │   │
│  │  [ Stock Search (Unsplash + Pixabay) ] [ AI Generate ]  │   │
│  │  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐            │   │
│  │  │ 📷 │ │ 📷 │ │ 📷 │ │ 📷 │ │ 📷 │ │ 📷 │            │   │
│  │  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [✓ Create Draft]  [🚀 Create & Publish]                       │
└────────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Edge Functions

#### 1.1 `generate-blog-content` (NEW)
Main AI content generation function.

**Input:**
```typescript
{
  topic: string;
  keywords: string;      // comma-separated
  wordCount: number;     // 500-3000
  tone: string;          // 'expert_professional', 'casual_honest', etc.
  categorySlug?: string; // pre-selected category
}
```

**Output:**
```typescript
{
  success: boolean;
  data: {
    title: string;
    seo_title: string;           // 50-60 chars
    seo_description: string;     // 150-160 chars
    excerpt: string;             // 150-200 chars
    content: string;             // Semantic HTML
    suggested_category: string;
    suggested_tags: string[];
    lsi_keywords: string[];
    word_count: number;
  };
}
```

**AI Prompt Requirements:**
- Output semantic HTML (`<h2>`, `<h3>`, `<p>`, `<ul>`, `<strong>`)
- NO `<h1>` tags (title displayed separately)
- NO "Conclusion", "FAQ", "TL;DR" sections
- Include `{{MIDDLE_IMAGE}}` placeholder 40-50% through content
- Use primary keywords 2-3+ times
- Generate 10-15 LSI keywords naturally

---

#### 1.2 `suggest-images-multi-source` (NEW)
Searches both Unsplash and Pixabay for relevant stock photos.

**Input:**
```typescript
{
  topic: string;
  keywords?: string;
}
```

**Output:**
```typescript
{
  success: boolean;
  images: Array<{
    url: string;
    thumbnail_url: string;
    alt_text: string;           // AI-generated SEO alt text
    photographer: string;
    photographer_url: string;
    source: 'unsplash' | 'pixabay';
    relevance_score: number;    // 0-100
  }>;
}
```

**Logic:**
1. AI extracts 3-5 visual keywords from topic
2. Query Unsplash API (6 images)
3. Query Pixabay API (6 images) - truncate to 100 chars
4. AI scores relevance for each image
5. Return top 6 sorted by score

---

#### 1.3 Update `generate-blog-image` (ENHANCE)
Add alt text generation to existing function.

**Changes:**
- Generate SEO-optimized alt text alongside image
- Return `altText` field in response

---

### Phase 2: Frontend Hooks

#### 2.1 `useGenerateBlogContent.ts`
```typescript
// Manages content generation state
// Returns: { generate, isLoading, content, error }
```

#### 2.2 `useImageSuggestions.ts`
```typescript
// Manages image search
// Returns: { search, isLoading, images, clearImages }
```

#### 2.3 `useCreateDraftFromGenerated.ts`
```typescript
// Creates blog post from AI content
// - Finds or creates category
// - Sanitizes HTML
// - Creates tags (max 3)
// - Uploads selected image
// Returns: { createDraft, isCreating }
```

---

### Phase 3: Tone Configuration

**File: `src/config/blogTones.ts`**

```typescript
export const TONE_OPTIONS = [
  {
    value: 'expert_professional',
    label: 'Expert & Professional',
    description: 'Authoritative and knowledgeable with professional polish'
  },
  {
    value: 'informative_engaging',
    label: 'Informative & Engaging',
    description: 'Clear explanations that make complex topics accessible'
  },
  {
    value: 'casual_honest',
    label: 'Casual & Honest',
    description: 'Relaxed and straightforward, like advice from a friend'
  },
  {
    value: 'empathetic_supportive',
    label: 'Empathetic & Supportive',
    description: 'Understanding tone for people dealing with disputes'
  },
  {
    value: 'action_oriented',
    label: 'Action-Oriented',
    description: 'Direct and practical with clear next steps'
  }
] as const;
```

---

### Phase 4: Frontend Components

#### 4.1 `AIBlogGenerator.tsx` (Main Component)
Full-page AI generation interface accessible from admin.

**Layout:**
- Left: Input controls (topic, keywords, word count slider, tone, category)
- Right: Generated content preview with SEO metrics
- Bottom: Featured image picker grid
- Footer: Action buttons (Create Draft, Create & Publish)

**Key Features:**
- Topic input with keyword suggestions
- Word count slider (500-3000, default 1500)
- Tone selector dropdown
- Category pre-selection
- Content preview with HTML rendering
- SEO score panel
- LSI keyword verification
- Image search + AI generation tabs

---

#### 4.2 `FeaturedImagePicker.tsx` (Enhanced)
Grid of suggested images with selection.

**Features:**
- 6 images in 3x2 grid
- Source badges (Unsplash/Pixabay)
- Photographer attribution
- Selection highlight
- "Generate AI Image" tab/button

---

#### 4.3 `ContentPreview.tsx`
Renders generated HTML content safely.

**Features:**
- DOMPurify sanitization
- Prose styling
- SEO metrics sidebar (title length, description length, keyword density)

---

### Phase 5: Admin Integration

#### 5.1 Add Route
```typescript
// In App.tsx routes
<Route path="/admin/blog/generate" element={<AIBlogGenerator />} />
```

#### 5.2 Update Admin Navigation
Add "AI Generate" button to AdminBlog page:
```tsx
<Button onClick={() => navigate('/admin/blog/generate')}>
  <Sparkles className="h-4 w-4 mr-2" />
  AI Generate
</Button>
```

---

### Phase 6: Secrets Setup

**Already Configured:**
- `LOVABLE_API_KEY` ✓
- `PIXABAY_API_KEY` ✓

**Needs Configuration:**
- `UNSPLASH_ACCESS_KEY` - Required for stock image search

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/generate-blog-content/index.ts` | AI content generation |
| `supabase/functions/suggest-images-multi-source/index.ts` | Stock image search |
| `src/config/blogTones.ts` | Tone configuration |
| `src/hooks/useGenerateBlogContent.ts` | Content generation hook |
| `src/hooks/useImageSuggestions.ts` | Image search hook |
| `src/hooks/useCreateDraftFromGenerated.ts` | Draft creation hook |
| `src/components/admin/blog/AIBlogGenerator.tsx` | Main generator UI |
| `src/components/admin/blog/FeaturedImagePicker.tsx` | Image selection grid |
| `src/components/admin/blog/ContentPreview.tsx` | Content preview |
| `src/components/admin/blog/SEOScorePanel.tsx` | SEO metrics display |

## Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add `/admin/blog/generate` route |
| `src/pages/admin/AdminBlog.tsx` | Add "AI Generate" button |
| `supabase/functions/generate-blog-image/index.ts` | Add alt text generation |
| `supabase/config.toml` | Register new edge functions |

---

## Database Changes

**No schema changes required** - existing `blog_posts` table has all needed fields:
- `title`, `slug`, `content`, `excerpt`
- `featured_image_url`, `meta_title`, `meta_description`
- `category`, `category_slug`, `tags`
- `status`, `author_id`, `author`

---

## User Flow

1. Admin clicks "AI Generate" on Blog Posts page
2. Enters topic (e.g., "How to dispute unfair parking tickets")
3. Adds keywords (optional): "parking dispute, appeal, ticket cancellation"
4. Selects word count (1500 default)
5. Chooses tone (Expert Professional default)
6. Clicks "Generate Content"
7. Reviews generated article with SEO metrics
8. Searches for featured image OR generates AI image
9. Clicks "Create Draft" or "Create & Publish"
10. Redirected to blog post list (or editor for refinement)

---

## Error Handling

- Rate limit (429): Show toast with retry suggestion
- Credit exhaustion (402): Prompt to add credits
- API failures: Fallback messaging with retry option
- Image search failures: Try other source, show manual upload option

---

## Estimated Implementation

| Component | Estimate |
|-----------|----------|
| Edge functions (2 new + 1 update) | 3-4 hours |
| Frontend hooks (3 hooks) | 1-2 hours |
| UI components (4 components) | 3-4 hours |
| Integration & testing | 1-2 hours |
| **Total** | **8-12 hours** |
