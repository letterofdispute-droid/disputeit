

# Photo Evidence Upload & Styling Fixes Plan

## Overview
This plan addresses two main areas:
1. **Photo/Evidence Upload System** - Allow users to upload up to 10 photos as evidence, which will be embedded in the generated PDF with optional descriptions
2. **SEO Content Styling Fixes** - Remove double bullet points and fix title alignment issues

---

## Part 1: Photo Evidence Upload Feature

### 1.1 System Architecture

```text
+--------------------+       +----------------------+       +------------------+
|  Evidence Uploader |  -->  |  Compress & Upload   |  -->  |  Supabase        |
|  (in form)         |       |  to Storage          |       |  evidence-photos |
+--------------------+       +----------------------+       |  bucket          |
                                                            +------------------+
                                      |
                                      v
                            +----------------------+
                            |  PDF Generator       |
                            |  (embed images)      |
                            +----------------------+
```

### 1.2 Storage Setup

Create a new storage bucket for evidence photos:
- Bucket name: `evidence-photos`
- Access: Private (RLS protected)
- Max file size: 2MB per image (after compression)
- Max images per letter: 10
- Allowed formats: JPEG, PNG, WebP

### 1.3 New Components

**EvidenceUploader Component** (`src/components/letter/EvidenceUploader.tsx`)
- Drag-and-drop upload area
- Photo preview grid
- Image compression before upload (client-side)
- Description field for each photo
- Delete/reorder functionality
- Progress indicators

```text
+----------------------------------------+
|  Evidence Photos                        |
|  +-----------+  +-----------+          |
|  |  [Photo]  |  |  [Photo]  |  [+ Add] |
|  |   X       |  |   X       |          |
|  +-----------+  +-----------+          |
|  Description... Description...          |
+----------------------------------------+
```

### 1.4 Database Schema

New table for evidence metadata:
```sql
CREATE TABLE evidence_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID REFERENCES letter_purchases(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  storage_path TEXT NOT NULL,
  description TEXT,
  position INT NOT NULL DEFAULT 0,
  original_filename TEXT,
  file_size_bytes INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies for user ownership
```

### 1.5 Image Compression

Client-side compression before upload:
- Use browser Canvas API for compression
- Target max dimensions: 1200px wide (maintain aspect ratio)
- Target quality: 80% JPEG
- Max file size after compression: 2MB

### 1.6 PDF Integration

Update `pdfHelpers.ts` to include a new function:
- `drawEvidenceSection()` - Creates "Attached Evidence" section
- Embeds compressed images inline
- Adds numbered captions with user descriptions
- Handles page breaks for multiple images

PDF layout for evidence:
```text
Page N:
+----------------------------------+
|  ATTACHED EVIDENCE               |
+----------------------------------+
|  [Image 1]                       |
|  Figure 1: Water damage photo    |
|                                  |
|  [Image 2]                       |
|  Figure 2: Repair invoice        |
+----------------------------------+
```

### 1.7 Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/letter/EvidenceUploader.tsx` | Create | Upload component with compression |
| `src/hooks/useEvidenceUpload.ts` | Create | Handle upload logic |
| `src/lib/imageCompression.ts` | Create | Client-side image compression |
| `supabase/functions/_shared/pdfHelpers.ts` | Modify | Add evidence embedding functions |
| `supabase/functions/generate-letter-documents/index.ts` | Modify | Fetch and embed evidence images |
| `src/components/letter/LetterGenerator.tsx` | Modify | Integrate evidence uploader |
| SQL Migration | Create | New bucket + evidence_photos table |

---

## Part 2: SEO Content Styling Fixes

### 2.1 Root Cause Analysis

The double bullet issue occurs because:
1. The parent `<article className="prose">` applies prose styles
2. The `.prose ul > li::before` in `index.css` adds a bullet pseudo-element
3. Even with `not-prose` wrapper, nested `ul` elements may inherit styles
4. The component also renders custom icons (CheckCircle2)

### 2.2 Styling Fixes

**Fix 1: Remove inherited list bullets**

In `SEOContent.tsx`, add explicit styling to override:
```tsx
// Change from:
<ul className="list-none space-y-2 m-0 p-0">

// To:
<ul className="space-y-2 m-0 p-0" style={{ listStyle: 'none' }}>
  {/* Each li should also have no before/after styling */}
</ul>
```

Better approach - add CSS class to index.css:
```css
/* Override prose list styling for not-prose sections */
.not-prose ul,
.not-prose ol {
  list-style: none !important;
  padding-left: 0 !important;
}

.not-prose ul > li::before,
.not-prose ol > li::before {
  content: none !important;
  display: none !important;
}
```

**Fix 2: Card header alignment**

Current:
```text
+------------------------+
|   [icon centered]      |
|   When to Use (centered)|
+------------------------+
```

Requested:
```text
+------------------------+
| [icon] When to Use     |  <-- Left aligned, no icon above
+------------------------+
```

Wait - looking at the screenshot again, the user wants the headers LEFT aligned. Let me re-read...

"I want titles to be aligned left without this gray line"

So the fix is:
- Remove the flex-col layout that centers icon above title
- Change to inline left-aligned: `[icon] Title`
- Remove any gray separator lines

**Fix 3: "How to Create Your Letter" section**

Current shows gray lines between cards. User wants:
- Remove gray divider lines
- Center-align the title

### 2.3 Files to Modify

| File | Changes |
|------|---------|
| `src/index.css` | Add `.not-prose` overrides for list styling |
| `src/components/letter/SEOContent.tsx` | Fix card header layout (left-align with inline icon) |

---

## Technical Details

### Image Compression Implementation

```typescript
// src/lib/imageCompression.ts
export async function compressImage(
  file: File,
  maxWidth: number = 1200,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    img.onload = () => {
      // Calculate new dimensions
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('Compression failed')),
        'image/jpeg',
        quality
      );
    };
    
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
```

### PDF Evidence Embedding

The pdf-lib library supports embedding images. New helper functions:
```typescript
export async function drawEvidenceSection(
  pdfDoc: PDFDocument,
  page: PDFPage,
  fonts: PDFFonts,
  yPosition: number,
  evidencePhotos: { imageBytes: Uint8Array; description?: string }[]
): Promise<{ pages: PDFPage[]; finalY: number }>
```

### Storage Policy

```sql
-- Create bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('evidence-photos', 'evidence-photos', false, 2097152); -- 2MB limit

-- Policy: Users can upload to their own folder
CREATE POLICY "Users can upload evidence photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'evidence-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can read their own evidence
CREATE POLICY "Users can view own evidence photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'evidence-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## Implementation Order

1. **Phase 1: Styling Fixes (Quick Win)**
   - Update `index.css` with not-prose overrides
   - Fix SEOContent.tsx card layouts
   - Test and verify visual improvements

2. **Phase 2: Evidence Storage Setup**
   - Create SQL migration for bucket and table
   - Set up RLS policies
   - Test storage access

3. **Phase 3: Upload Components**
   - Create imageCompression utility
   - Build EvidenceUploader component
   - Integrate into LetterGenerator form

4. **Phase 4: PDF Embedding**
   - Add image embedding to pdfHelpers
   - Update generate-letter-documents function
   - Test end-to-end PDF generation with photos

---

## Summary

| Feature | Complexity | Files Impacted |
|---------|------------|----------------|
| Styling fixes | Low | 2 files |
| Evidence storage | Medium | 1 migration |
| Upload component | Medium | 3 new files |
| PDF embedding | Medium-High | 2 files |

Total estimated new files: 4
Total estimated modified files: 5

