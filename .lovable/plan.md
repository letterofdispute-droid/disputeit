

# Plan: Temporary Edge Function to Retrieve Service Role Key

Create a simple edge function `get-service-key` that reads `SUPABASE_SERVICE_ROLE_KEY` from the environment and returns it. This is a temporary utility for migration only — delete it immediately after use.

## Implementation

- Create `supabase/functions/get-service-key/index.ts` — returns `Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")` as JSON
- Add `[functions.get-service-key]` with `verify_jwt = false` to `supabase/config.toml`
- No auth check needed since this is temporary, but you should delete it right after copying the key

## Security Warning

This function exposes the most privileged key in your project. Copy the key, then immediately ask me to delete the function.

