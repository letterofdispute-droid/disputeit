

# Fix: backfill-page-seo Edge Function Auth Failure

## Root Cause
The function uses `anonClient.auth.getClaims()` (line 32) which **does not exist** in the Supabase JS client. Every invocation returns a 401 before processing any pages. Other edge functions in this project correctly use `auth.getUser()`.

## Fix
Replace the `getClaims` auth block (lines 28-40) with the pattern used by other functions:

```typescript
// Verify admin
const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
  global: { headers: { Authorization: authHeader } },
});
const { data: { user }, error: userError } = await anonClient.auth.getUser();
if (userError || !user) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const { data: isAdmin } = await supabase.rpc("is_admin", {
  check_user_id: user.id,
});
```

## Files changed
- **`supabase/functions/backfill-page-seo/index.ts`** — Replace `getClaims` with `getUser`, use `user.id` instead of `claims.claims.sub`

