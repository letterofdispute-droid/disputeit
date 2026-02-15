

# Simplify Link Actions Toolbar

## Problem

The actions toolbar shows too many buttons at once, making the workflow confusing. Currently visible simultaneously: "Scan for Links", "Apply Approved (6344)", "Approve All", "Reject All", "Clear All (6344)". The purpose of "Apply Approved" (which actually inserts links into article HTML) is unclear.

## Explanation

The workflow has 3 steps:
1. **Scan** -- find link opportunities
2. **Review** -- approve or reject suggestions
3. **Apply** -- actually insert approved links into article content

"Apply Approved" is the final step that modifies your articles. You probably do NOT want to click it on 6,344 low-quality suggestions.

## Solution

Simplify the toolbar by showing only contextually relevant buttons based on the current status filter, and group them more logically.

## Changes

### File: `src/components/admin/seo/links/LinkActions.tsx`

**Reduce button clutter with these rules:**

1. Move "Scan for Links" out of the actions bar (it already exists in SemanticScanPanel)
2. Show "Approve All" / "Reject All" only when viewing **pending** suggestions
3. Show "Apply Approved" only when viewing **approved** suggestions  
4. Always show "Clear All" as a subtle destructive option
5. Hide selection-based buttons (Approve/Reject/Delete selected) when nothing is selected
6. Add a small tooltip or subtitle to "Apply Approved" so it's clear what it does

**Resulting toolbar by status filter:**

| Viewing | Buttons Shown |
|---------|--------------|
| Pending | Approve All, Reject All, Clear All |
| Approved | Apply Approved (inserts links into articles), Clear All |
| Rejected | Approve All (to recover), Clear All |
| Applied | Clear All |
| All Statuses | Apply Approved, Clear All |

When items are selected, selection-specific buttons (Approve, Reject, Delete) appear inline.

### File: `src/components/admin/seo/LinkSuggestions.tsx`

- Remove the `onScan` prop passed to LinkActions (scan lives in SemanticScanPanel already)
- Pass `statusFilter` so LinkActions can conditionally render

## Result

- Toolbar goes from 5-7 buttons down to 2-3 at most
- Each button is relevant to the current view
- "Apply Approved" only appears when you're looking at approved items, with clear labeling that it modifies articles
