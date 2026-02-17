# Move Keywords Inline with Title (Remove Separate Column)

## Problem

The Keywords column takes up too much horizontal space and looks ugly with long keyword badges stacking vertically. The user wants keywords displayed inline under the meta description within the Title cell instead. In the SEO Command - Queue tab, also fix the list not to show them in column.

## Changes

### `src/pages/admin/AdminBlog.tsx`

1. **Remove the Keywords column header** (line 534) and the Keywords `<TableCell>` block (lines 570-594).
2. **Move keyword badges into the Title cell** (after the meta description lines, around line 564). Display them as small inline tags below the meta info:

```
{post.keyword_counts && (
  <div className="flex flex-wrap gap-1 mt-1">
    {Object.entries(post.keyword_counts)
      .sort(([a], [b]) => (a === post.primary_keyword ? -1 : b === post.primary_keyword ? 1 : 0))
      .slice(0, 3)
      .map(([kw, count]) => (
        <Badge key={kw} variant={kw === post.primary_keyword ? 'default' : 'outline'}
          className="text-[10px] px-1.5 py-0 font-normal">
          {kw} ({count})
        </Badge>
      ))}
    {Object.keys(post.keyword_counts).length > 3 && (
      <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal text-muted-foreground">
        +{Object.keys(post.keyword_counts).length - 3} more
      </Badge>
    )}
  </div>
)}
```

3. **Update colSpan** if used anywhere for empty states.
4. **Adjust Title column width** from `w-[35%]` to `w-[45%]` to accommodate the inline keywords.

### Result

- Title cell shows: Title, Author, Meta title, Meta description, then keyword badges
- One fewer column means the table is less cramped
- Keywords are visually grouped with the content they describe

## Files Changed

- `src/pages/admin/AdminBlog.tsx` -- remove Keywords column, move badges into Title cell