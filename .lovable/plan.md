
# Improve Global Search Layout and Spacing

## Problem
The search dialog feels cramped -- items are edge-to-edge with minimal padding, and the overall layout lacks breathing room, especially on mobile.

## Changes

### 1. `src/components/ui/command.tsx` -- Better spacing throughout
- **DialogContent**: Add horizontal padding (`p-2`) and rounded corners
- **CommandInput**: Increase padding (`px-4` instead of `px-3`), make the input taller (`h-14`)
- **CommandList**: Increase max height to `400px` for more visible results
- **CommandGroup**: Increase internal padding (`p-2`) and group heading padding (`px-3`)
- **CommandItem**: More generous padding (`px-3 py-2.5`) and larger rounded corners (`rounded-md`)

### 2. `src/components/search/GlobalSearch.tsx` -- Refined result layout
- Add more gap between icon, text, and badge in each result row
- Increase the footer padding (`px-4 py-3`)
- Slightly larger text for result titles

These are purely CSS/className changes -- no logic modifications.
