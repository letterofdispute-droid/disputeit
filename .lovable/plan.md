

# Move Close Button to Its Own Row in Global Search

## Problem
The Dialog's built-in X close button overlaps with the search input in the CommandDialog, creating an ugly visual conflict (visible in the screenshot).

## Solution
Update the `CommandDialog` component in `src/components/ui/command.tsx` to render a dedicated close-button row at the top, above the search input.

## Technical Details

### File: `src/components/ui/command.tsx`

**Change the `CommandDialog` component:**
- Import `DialogClose` from the dialog component
- Remove the default close button that comes from `DialogContent` by adding a `hideCloseButton` approach -- or override the layout
- Add a top row with a right-aligned X button above the `Command` children
- The `DialogContent` currently renders a close button absolutely positioned at `right-4 top-4`. We'll override this by:
  1. Adding a custom class to `DialogContent` to hide its built-in close button (`[&>button.absolute]:hidden` or similar)
  2. Rendering our own close button in a flex row at the top of the dialog

The resulting layout will be:
```
[ ----------------------------------------- X ]   <-- close button row
[ (magnifying glass) Search input...            ]   <-- search input
[ Results list...                               ]   <-- results
[ Footer                                        ]   <-- keyboard hints
```

### Specific changes:
- In `CommandDialog`, add a `div` with `flex justify-end` containing a `DialogClose` button before the `Command` component
- Add a class to `DialogContent` to suppress its default absolute-positioned close button (e.g., `[&>button:last-child]:hidden`)
- Style the new close button to match the existing design (same icon size, opacity, hover state)

No changes needed to `GlobalSearch.tsx` -- this is purely a UI component fix.
