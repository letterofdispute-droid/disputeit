

# Replace Connect Button with Auto-Linking Guidance

## What Changes

Replace the "Connect" button on the Google row with a disabled state and a helpful tooltip/message explaining that users should sign out and sign back in with Google using the same email to automatically link their accounts.

## File: `src/components/settings/LinkedAccountsCard.tsx`

### Changes:
1. **Remove the `handleLinkGoogle` function** and the `isLinking` state (no longer needed)
2. **Remove the `useEffect` for detecting return from Google linking** (no longer needed)
3. **Remove imports** for `linkGoogle` from `useAuth` and `Link2`/`Loader2` where only used for linking
4. **Replace the Connect button** (lines 212-225) with a informational message:

```tsx
<div className="flex flex-col items-end gap-1">
  <Badge variant="outline" className="text-xs text-muted-foreground">Not connected</Badge>
  <p className="text-xs text-muted-foreground max-w-[200px] text-right">
    Sign in with Google using your account email to link automatically
  </p>
</div>
```

5. **Update the bottom help text** (line 230-232) to reinforce:
```
"To link your Google account, sign out and sign back in using 'Continue with Google' with the same email address. Your accounts will merge automatically."
```

## Why This Works

- Automatic identity linking is enabled by default in Lovable Cloud
- When a user clicks "Continue with Google" on the login page and the Google account email matches an existing email/password account, Lovable Cloud merges the identities server-side
- After that merge, the user's `identities` array will contain both `email` and `google`, so `hasGoogle` flips to `true` and the card shows "Connected"
- No manual `linkIdentity()` call is needed

## Files Changed

| File | Change |
|---|---|
| `src/components/settings/LinkedAccountsCard.tsx` | Replace Connect button with auto-link guidance message, remove linking logic |

