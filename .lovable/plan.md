

# Fix Logo Clipping on Mobile (Header and Footer)

## Problem
The logo SVG (`/ld-logo.svg`) includes the tagline "Precision Letters. Proven Results" beneath the main "Letter of Dispute" text. On mobile, the fixed `h-9` height constraint clips the bottom of the SVG, cutting off the tagline text. This affects both the header and footer logos.

## Root Cause
The `<img>` element uses `className="h-9"` which sets a fixed height of 2.25rem (36px). The SVG's aspect ratio means the tagline at the bottom gets clipped when the image is constrained to this height on smaller screens.

## Fix

### 1. `src/components/layout/Header.tsx`
- Change the logo from `h-9` to `h-8 sm:h-9` so it scales slightly smaller on the tiniest screens, but more importantly add `w-auto` to ensure the full width renders
- Alternatively, increase to `h-10` on mobile to give the tagline room, or use `object-contain` to ensure nothing is clipped
- Add `overflow-visible` to the parent Link if needed

### 2. `src/components/layout/Footer.tsx`
- Apply the same fix to the footer logo `<img>` tag

### 3. Investigate the SVG itself
- If the SVG's `viewBox` is cropping the tagline, the viewBox dimensions may need adjusting. This would be the most robust fix -- ensuring the SVG file itself includes proper dimensions for all its content including the "Proven Results" text.

## Specific Changes

**Header.tsx (line 46):** Change `className="h-9"` to `className="h-10 w-auto"` to give the tagline more vertical space.

**Footer.tsx (line 15):** Same change -- `className="h-9"` to `className="h-10 w-auto"`.

If the SVG viewBox itself is the issue, we will also need to adjust the SVG file's viewBox to fully encompass the tagline text.

## Files to Modify
1. `src/components/layout/Header.tsx` - Logo img height
2. `src/components/layout/Footer.tsx` - Logo img height  
3. `public/ld-logo.svg` - Potentially adjust viewBox if content is cropped at the SVG level
