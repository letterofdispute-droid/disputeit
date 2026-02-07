
# Fix Mobile Layout Overflow in Admin Dashboard

## Problem
Multiple admin dashboard components display items inline that overflow horizontally on mobile devices, causing horizontal scrolling issues. The user provided two screenshots showing the SEO Coverage Map with inline elements that don't fit on mobile screens.

## Solution
Apply a consistent mobile-first stacking pattern across all affected components. On mobile, elements should stack vertically and only display inline at larger breakpoints.

---

## Files to Modify

### 1. TemplateCoverageMap.tsx
**Issue**: Category header rows have progress bar, percentage, and "Plan X" button inline that overflow on mobile.

**Fix**:
- Stack category info (name, template count, tier badge) vertically on mobile
- Move progress bar + button to a new row on mobile
- Make template item rows stack on mobile instead of inline

### 2. CoverageStats.tsx  
**Issue**: 5-column grid is too wide for mobile.

**Fix**: Change from `grid-cols-1 md:grid-cols-2 lg:grid-cols-5` to a 2-column layout on small screens with the 5th card spanning full width.

### 3. QueueFilters.tsx
**Issue**: Inline dropdowns and refresh button overflow on mobile.

**Fix**: Stack vertically on mobile with `flex-col sm:flex-row` and make dropdowns full-width on mobile.

### 4. QueueActions.tsx
**Issue**: Multiple action buttons displayed inline overflow on mobile.

**Fix**: Wrap buttons with `flex-wrap` and use stacked layout on mobile.

### 5. QueueStats.tsx
**Issue**: Inline stats can wrap awkwardly on mobile.

**Fix**: Use a 2-column grid on mobile for consistent layout.

### 6. LinkFilters.tsx
**Issue**: Same as QueueFilters - inline elements overflow.

**Fix**: Stack vertically on mobile.

### 7. LinkActions.tsx
**Issue**: Multiple action buttons inline.

**Fix**: Apply mobile stacking pattern.

### 8. LinkStats.tsx
**Issue**: Same as QueueStats.

**Fix**: Use 2-column grid on mobile.

---

## Technical Approach

### Mobile Stacking Pattern
```tsx
// Before (causes overflow)
<div className="flex items-center gap-4">

// After (stacks on mobile)
<div className="flex flex-col sm:flex-row sm:items-center gap-4">
```

### Category Row Layout Fix
```tsx
// Category header - stack on mobile
<CollapsibleTrigger className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full p-4">
  {/* Category info */}
  <div className="flex items-center gap-3 mb-3 sm:mb-0">
    ...
  </div>
  {/* Progress + button - full width row on mobile */}
  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
    ...
  </div>
</CollapsibleTrigger>
```

### Template Row Layout Fix
```tsx
// Template item within category - stack on mobile
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 pl-11 gap-2">
  {/* Template name */}
  <div className="flex items-center gap-2 flex-1 min-w-0">
    ...
  </div>
  {/* Progress + badge + action - row on mobile */}
  <div className="flex items-center gap-4 justify-end sm:justify-start">
    ...
  </div>
</div>
```

### Stats Grid Pattern
```tsx
// Before
<div className="flex items-center gap-4 text-sm flex-wrap">

// After - 2-column grid on mobile
<div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-4 text-sm">
```

---

## Complete File List

| File | Change Type |
|------|-------------|
| `src/components/admin/seo/TemplateCoverageMap.tsx` | Stack category headers and template rows on mobile |
| `src/components/admin/seo/CoverageStats.tsx` | Improve mobile grid layout |
| `src/components/admin/seo/ContentQueue.tsx` | Stack filters/actions container on mobile |
| `src/components/admin/seo/LinkSuggestions.tsx` | Stack filters/actions container on mobile |
| `src/components/admin/seo/queue/QueueFilters.tsx` | Stack dropdowns on mobile |
| `src/components/admin/seo/queue/QueueActions.tsx` | Wrap and stack buttons on mobile |
| `src/components/admin/seo/queue/QueueStats.tsx` | Use 2-column grid on mobile |
| `src/components/admin/seo/links/LinkFilters.tsx` | Stack dropdowns on mobile |
| `src/components/admin/seo/links/LinkActions.tsx` | Wrap and stack buttons on mobile |
| `src/components/admin/seo/links/LinkStats.tsx` | Use 2-column grid on mobile |
| `src/components/admin/seo/links/LinkCard.tsx` | Stack card content on mobile |

---

## Expected Outcome
- No horizontal overflow on any admin page on mobile devices
- Clean stacked layout that adapts gracefully to screen size
- Consistent pattern applied across all admin components
