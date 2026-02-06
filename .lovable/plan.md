

# Plan: Streamlined Bulk Content Planning with Category Defaults

## Problem Statement
Currently, creating content plans for 500+ templates requires:
1. Opening ClusterPlanner dialog for each template
2. Selecting a value tier
3. Reviewing 8 article types (already pre-selected by tier)
4. Clicking "Create Plan"

Since the article types are automatically determined by the value tier selection, steps 2-4 are redundant when processing templates in bulk. This creates unnecessary friction for scaling the SEO content strategy.

---

## Solution: Category SEO Settings + One-Click Bulk Planning

### Approach Overview
1. Create a **Category SEO Settings** configuration (stored in `site_settings` table)
2. Each category gets a default value tier assignment (high/medium/longtail)
3. **"Plan All" button bypasses the dialog entirely** - uses the category's default tier
4. Keep the dialog available for individual template overrides when needed

---

## Implementation Details

### 1. Add Category Tier Defaults Configuration

Create a new component `CategoryTierSettings` that manages default tiers per category:

```text
+--------------------------------------------+
| Category SEO Settings                      |
+--------------------------------------------+
| Category          | Default Tier | Actions |
|-------------------|--------------|---------|
| Travel            | High (10)    | [Edit]  |
| Insurance         | High (10)    | [Edit]  |
| Financial         | High (10)    | [Edit]  |
| Housing           | Medium (7)   | [Edit]  |
| Vehicle           | Medium (7)   | [Edit]  |
| HOA & Property    | Long-tail (5)| [Edit]  |
| Contractors       | Long-tail (5)| [Edit]  |
+--------------------------------------------+
```

**Storage:** Use existing `site_settings` table with key `category_seo_tiers`:
```json
{
  "travel": "high",
  "insurance": "high",
  "financial": "high",
  "housing": "medium",
  "vehicle": "medium",
  "hoa": "longtail",
  "contractors": "longtail"
}
```

### 2. Modify "Plan All" Button Behavior

**Current behavior:**
- "Plan All" creates plans with hardcoded `'medium'` tier
- Limited to 5 templates at a time
- Still requires manual intervention

**New behavior:**
- "Plan All" uses category's configured default tier
- Remove artificial 5-template limit (process all unplanned templates)
- Show confirmation with count before executing
- Progress indicator during batch creation

### 3. Keep Individual Override Capability

The ClusterPlanner dialog remains accessible via:
- "Create Plan" button on individual templates (for custom tier selection)
- "View" button on existing plans (for status monitoring)

---

## UI Changes

### A. Add Settings Tab to SEO Dashboard

Add a new "Settings" tab to the SEO Dashboard tabs:

```tsx
<TabsTrigger value="settings">
  <Settings className="h-4 w-4" />
  <span>Settings</span>
</TabsTrigger>
```

This tab contains the CategoryTierSettings component.

### B. Enhanced "Plan All" Button

Replace current button with confirmation dialog:

```text
Current: [Plan All] (silently creates 5 plans)

New: [Plan All Uncovered] → Opens confirmation:
  "Create plans for 47 templates in Travel using High tier?"
  [Cancel] [Create All]
```

### C. Quick Stats Update

Show tier distribution in category header:
```text
Travel (20 templates)
├── 15 have plans (8 high, 5 medium, 2 longtail)  
└── 5 uncovered
```

---

## Files to Create/Modify

| File | Action | Changes |
|------|--------|---------|
| `src/components/admin/seo/CategoryTierSettings.tsx` | Create | New component for managing category tier defaults |
| `src/hooks/useCategoryTierSettings.ts` | Create | Hook for fetching/updating tier settings from site_settings |
| `src/pages/admin/SEODashboard.tsx` | Modify | Add Settings tab |
| `src/components/admin/seo/TemplateCoverageMap.tsx` | Modify | Update "Plan All" to use category defaults, add confirmation dialog |
| `src/components/admin/seo/CoverageStats.tsx` | Modify | Add tier distribution stats |

---

## Workflow Comparison

### Before (500+ dialogs)
```text
For each template:
1. Click "Create Plan"
2. Dialog opens
3. Select tier (defaults already applied)
4. Review article types (already selected)
5. Click "Create Plan"
6. Wait for AI generation
7. Repeat...
```

### After (category-level bulk)
```text
One-time setup:
1. Go to Settings tab
2. Assign default tiers to each category
3. Save

Ongoing:
1. Click "Plan All" on category
2. Confirm: "Create 47 plans using High tier?"
3. Done - all plans created
```

---

## Default Tier Recommendations

Based on typical traffic and conversion patterns:

| Tier | Categories | Articles/Template |
|------|------------|-------------------|
| **High** | Travel, Insurance, Financial | 10 |
| **Medium** | Housing, Vehicle, Healthcare, Refunds, Utilities, E-commerce, Employment, Damaged Goods | 7 |
| **Long-tail** | HOA, Contractors | 5 |

These defaults will be pre-populated but fully editable.

---

## Benefits

1. **Eliminates 500+ redundant dialogs** - one-time category setup
2. **Consistent tier assignment** - no accidental medium when high was intended
3. **Faster onboarding** - bulk plan entire categories in seconds
4. **Flexibility preserved** - individual overrides still possible
5. **Visibility** - clear view of tier distribution across site

