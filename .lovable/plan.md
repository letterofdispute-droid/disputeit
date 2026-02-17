

# Add "Items Per Page" Dropdown to Content Queue

## What This Does
Adds a dropdown selector next to the pagination that lets you choose how many articles to display per page (20, 50, 100, 200, 500). When you click "Select All", it only selects the items visible on the current page -- so you can control exactly how many articles get generated in one batch.

## Changes

### 1. ContentQueue.tsx
- Replace the hardcoded `ITEMS_PER_PAGE = 50` with a state variable `itemsPerPage` (default 50)
- Pass `itemsPerPage` and its setter to `QueuePagination`
- Update `toggleSelectAll` to only select items on the current **page** (`paginatedItems`) instead of all `filteredItems`
- Reset to page 1 when items-per-page changes

### 2. QueuePagination.tsx
- Add a `Select` dropdown showing options: 20, 50, 100, 200, 500
- Accept new props: `onItemsPerPageChange` callback
- Display the dropdown inline next to the "Showing X-Y of Z" text

### 3. QueueTable.tsx
- Update the header checkbox to reflect whether all **visible page items** are selected (it already receives `items` as the paginated subset, so the existing logic should work correctly once ContentQueue passes the right data)

## Technical Detail

The key behavioral fix: `toggleSelectAll` currently selects from `filteredItems` (all items across all pages). It will be changed to select from `paginatedItems` (only the current page), so "Generate (N)" always matches what you see on screen.

