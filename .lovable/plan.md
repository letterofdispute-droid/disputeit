
# Fix: Enable Manual Identity Linking

## The Problem

The error message "Manual linking is disabled" is coming directly from Supabase's GoTrue authentication server. It is **not a code bug** — it is a missing configuration setting.

When `supabase.auth.linkIdentity()` is called, Supabase checks whether manual identity linking is permitted. By default, it is **disabled**. Since the `supabase/config.toml` file has no `[auth]` section at all, this setting has never been turned on, so every attempt to link Google fails immediately before even redirecting to Google.

## The Fix: One Line in config.toml

Add an `[auth]` block to `supabase/config.toml` with two settings:

```toml
[auth]
enable_manual_linking = true
```

This single change unlocks the `linkIdentity()` API call for all users.

## What `enable_manual_linking` Does

It allows authenticated users to call `supabase.auth.linkIdentity()` to connect additional OAuth providers (Google, Apple) to their existing account. Without it, the call is rejected server-side before it ever reaches Google.

## Why the Code Changes Were Correct but Didn't Help

The previous fixes to `useAuth.tsx`, `oauthTokenHandler.ts`, and `LinkedAccountsCard.tsx` all correctly handle the **redirect flow** after Google approval. But the user never got that far — the error fires immediately when the button is clicked, before any redirect happens, because Supabase rejects the `linkIdentity()` call at the server level.

## Files to Change

| File | Change |
|---|---|
| `supabase/config.toml` | Add `[auth]` section with `enable_manual_linking = true` |

That's the only change needed. The code fixes from the previous plan remain correct and will work properly once this setting is enabled.
