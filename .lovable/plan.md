

# Fix `related_templates` on Indiana Lemon Law Articles

This is a simple data UPDATE on the `blog_posts` table. Since I'm in read-only mode, I need to switch to implementation mode to execute this.

### What will be done
Run a single SQL UPDATE to fix the `related_templates` field on all articles currently pointing to the incorrect GSC campaign slug:

```sql
UPDATE blog_posts 
SET related_templates = ARRAY['lemon-law-rejection'] 
WHERE related_templates @> ARRAY['gsc-campaign-vehicle-1772403274272'];
```

This will update all 6 Indiana lemon law articles so their "Related Templates" CTA correctly links to the Lemon Law Rejection Letter template.

### No code changes needed
This is a database data fix only.

