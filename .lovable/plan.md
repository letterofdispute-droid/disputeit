
# Comprehensive Image Integration with Pixabay API

## Overview
Transform the DisputeLetters website from icon-only visuals to a polished, image-rich experience using the Pixabay API to automatically fetch contextually-relevant professional stock photography.

## What We'll Build

### 1. Backend: Pixabay Edge Function
Create a serverless function that:
- Searches Pixabay for relevant images based on category/context keywords
- Caches results in Supabase to avoid repeated API calls
- Returns optimized image URLs with proper sizing

### 2. Image Locations Across the Website

| Location | Current State | New Design |
|----------|--------------|------------|
| Homepage Hero | SVG pattern background | Full-width professional hero image with overlay |
| Category Cards | Icon + solid color | Image thumbnail with gradient overlay + icon |
| Category Page Hero | Solid color + icon | Full-width category image with text overlay |
| Template Landing Page | No image | Contextual hero image matching template topic |
| About Page | No images | Team/mission imagery |
| "How It Works" | Icon circles | Step illustration images |
| "Real World Scenarios" | Icon circles | Contextual scenario images |
| Articles/Blog | Already supports images | No change needed |

### 3. Image Mapping Strategy
Each category will have curated Pixabay search terms:

| Category | Search Terms |
|----------|-------------|
| Healthcare | "medical billing", "doctor office", "healthcare professional" |
| Housing | "apartment keys", "landlord tenant", "rental property" |
| Insurance | "insurance claim", "home insurance", "car insurance" |
| Vehicle | "car dealership", "auto repair", "mechanic" |
| Financial | "credit card statement", "bank dispute", "financial documents" |
| Travel | "airport delay", "flight cancellation", "luggage carousel" |
| Employment | "office workplace", "employment contract", "HR meeting" |
| Contractors | "home renovation", "construction site", "contractor tools" |
| E-commerce | "online shopping", "delivery package", "customer service" |
| Utilities | "utility bills", "power lines", "telecommunications" |
| Refunds | "shopping receipt", "customer service desk", "refund" |
| Damaged Goods | "broken package", "damaged delivery", "defective product" |
| HOA | "suburban neighborhood", "community meeting", "homeowners" |

---

## Technical Architecture

```text
┌──────────────────┐     ┌─────────────────────┐     ┌────────────────┐
│  React Frontend  │────▶│  Edge Function      │────▶│  Pixabay API   │
│  (Category Page) │     │  (fetch-category-   │     │                │
│                  │◀────│   images)           │◀────│                │
└──────────────────┘     └─────────────────────┘     └────────────────┘
                                   │
                                   ▼
                         ┌─────────────────────┐
                         │  Supabase Table     │
                         │  (category_images)  │
                         │  - Caches results   │
                         │  - 24hr expiry      │
                         └─────────────────────┘
```

---

## Implementation Steps

### Phase 1: Setup (Backend)
1. **Add Pixabay API Key** - Request user to add `PIXABAY_API_KEY` secret
2. **Create Database Table** - `category_images` table to cache fetched images
3. **Create Edge Function** - `fetch-category-images` to query Pixabay and cache results

### Phase 2: Data Layer
4. **Update `templateCategories.ts`** - Add `imageKeywords` array to each category
5. **Create React Hook** - `useCategoryImage(categoryId)` hook for fetching/displaying images

### Phase 3: Component Updates
6. **Homepage Hero** - Add background image with dark overlay
7. **LetterCategories Component** - Redesign cards with image thumbnails
8. **CategoryPage Hero** - Add category-specific background image
9. **LetterPage Hero** - Add template-relevant background image
10. **RealWorldScenarios** - Add scenario-specific images
11. **AboutPage** - Add professional mission/team imagery

### Phase 4: Optimization
12. **Lazy Loading** - All images use `loading="lazy"`
13. **Responsive Images** - Use Pixabay's size parameters for optimal loading
14. **Fallback Handling** - Graceful degradation if image fails to load

---

## Database Schema

```sql
CREATE TABLE category_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  large_url TEXT NOT NULL,
  pixabay_id TEXT NOT NULL,
  search_query TEXT NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  UNIQUE(category_id, pixabay_id)
);
```

---

## Component Design Examples

### Category Card (New Design)
```text
┌─────────────────────────────────────────┐
│ ┌─────────────────────────────────────┐ │
│ │    [Background Image]               │ │
│ │    with gradient overlay            │ │
│ │                                     │ │
│ │  🏥 Healthcare & Medical Billing    │ │
│ │                                     │ │
│ │  Dispute medical bills, insurance...│ │
│ │                                     │ │
│ │  Start Building →                   │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Category Page Hero (New Design)
```text
┌────────────────────────────────────────────────────────────┐
│  [Full-width category image with dark gradient overlay]   │
│                                                            │
│  Home > Templates > Healthcare                             │
│                                                            │
│  🏥 Healthcare & Medical Billing Letter Templates          │
│                                                            │
│  Dispute medical bills, insurance denials, coding errors...│
└────────────────────────────────────────────────────────────┘
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/fetch-category-images/index.ts` | Edge function to query Pixabay |
| `src/hooks/useCategoryImage.ts` | React hook for fetching/caching images |

## Files to Modify

| File | Changes |
|------|---------|
| `src/data/templateCategories.ts` | Add `imageKeywords` to each category |
| `src/components/home/LetterCategories.tsx` | Redesign with image backgrounds |
| `src/components/home/Hero.tsx` | Add hero background image |
| `src/components/home/RealWorldScenarios.tsx` | Add scenario images |
| `src/components/home/HowItWorks.tsx` | Add step images (optional) |
| `src/pages/CategoryPage.tsx` | Add hero background image |
| `src/pages/LetterPage.tsx` | Add hero background image |
| `src/pages/AboutPage.tsx` | Add mission/team imagery |

---

## API Key Required
Before implementation, you'll need to provide a **Pixabay API Key**:
- Free at [pixabay.com/api/docs/](https://pixabay.com/api/docs/)
- Generous free tier (5,000 requests/day)
- No attribution required for images

---

## Expected Visual Outcome
- Professional, polished appearance matching premium SaaS products
- Each category instantly recognizable by its contextual imagery
- Improved user engagement and trust through visual storytelling
- Consistent image quality across all pages
- Fast loading with proper caching and lazy loading
