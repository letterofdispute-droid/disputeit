
# Logo Integration Plan

## Overview
Integrate the new brand logos across the entire DisputeLetters website, replacing the current placeholder `FileText` icon with the proper brand assets.

## Assets to be Added

| File | Destination | Purpose |
|------|-------------|---------|
| `ld-logo.svg` | `public/ld-logo.svg` | Main horizontal logo for Header & Footer |
| `ld-logo-icon.svg` | `src/assets/ld-logo-icon.svg` | Square icon for Login/Signup pages, decorative use |
| `ld-logo-icon.ico` | `public/favicon.ico` | Browser favicon (replacing existing) |

## Files to Modify

### 1. Favicon & SEO Meta Tags
**File:** `index.html`
- Update favicon reference to use the new `.ico` file
- Add Apple Touch Icon reference for mobile bookmarks
- Update Open Graph image references
- Enhance Schema.org JSON-LD with organization logo

### 2. Header Component
**File:** `src/components/layout/Header.tsx`
- Replace `FileText` icon with `<img>` tag using `/ld-logo.svg`
- Maintain responsive sizing (adjusting height for the header)
- Keep link to homepage functionality

### 3. Footer Component  
**File:** `src/components/layout/Footer.tsx`
- Replace `FileText` icon with `<img>` tag using `/ld-logo.svg`
- Consistent styling with header

### 4. Login Page
**File:** `src/pages/LoginPage.tsx`
- Replace `FileText` icon with the square icon logo (`ld-logo-icon.svg`)
- Import as ES6 module from `@/assets/`

### 5. Signup Page
**File:** `src/pages/SignupPage.tsx`
- Replace `FileText` icon with the square icon logo (`ld-logo-icon.svg`)
- Import as ES6 module from `@/assets/`

### 6. SEO Head Component
**File:** `src/components/SEOHead.tsx`
- Add organization logo URL to Schema.org structured data
- This improves Google Knowledge Panel appearance

### 7. Mobile Menu (Sheet)
**File:** `src/components/layout/Header.tsx` (already included above)
- The mobile menu title can include the icon logo for brand consistency

---

## Technical Details

### Logo Sizing Strategy
```text
Header Logo:  height: 32-40px (maintains aspect ratio)
Footer Logo:  height: 32-40px (matches header)
Auth Pages:   48x48px square icon
Favicon:      Standard .ico format (multi-resolution)
```

### Import Pattern for Square Icon
```typescript
// In React components using the icon
import ldLogoIcon from '@/assets/ld-logo-icon.svg';

// Usage
<img src={ldLogoIcon} alt="DisputeLetters" className="h-12 w-12" />
```

### Public Asset Pattern for Main Logo
```html
<!-- In Header/Footer -->
<img src="/ld-logo.svg" alt="DisputeLetters" className="h-8" />
```

### SEO Schema Enhancement
```json
{
  "@type": "Organization",
  "name": "Dispute Letters",
  "url": "https://disputeletters.com",
  "logo": "https://disputeletters.com/ld-logo.svg"
}
```

---

## Implementation Order
1. Copy logo files to project directories
2. Update `index.html` (favicon + SEO)
3. Update Header component
4. Update Footer component
5. Update Login page
6. Update Signup page
7. Update SEOHead component

---

## Expected Outcome
- Professional brand presence across all pages
- Improved SEO with proper logo in structured data
- Consistent visual identity in browser tabs (favicon)
- Mobile-friendly touch icons for bookmarks
