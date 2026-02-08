
# Update Email Functions to Use Verified Domain

## Problem
All email edge functions are configured to send from `noreply@letterofdispute.com`, but only `mail.letterofdispute.com` is verified in Resend (free plan limitation). This causes all emails to fail with a domain verification error.

## Solution
Update the "from" address in all 4 email edge functions to use the verified subdomain: `noreply@mail.letterofdispute.com`

---

## Files to Update

| File | Current "from" Address | New "from" Address |
|------|------------------------|-------------------|
| `supabase/functions/send-purchase-email/index.ts` | `noreply@letterofdispute.com` | `noreply@mail.letterofdispute.com` |
| `supabase/functions/send-contact-email/index.ts` | `noreply@letterofdispute.com` | `noreply@mail.letterofdispute.com` |
| `supabase/functions/send-admin-email/index.ts` | `noreply@letterofdispute.com` | `noreply@mail.letterofdispute.com` |
| `supabase/functions/send-credit-email/index.ts` | `noreply@letterofdispute.com` | `noreply@mail.letterofdispute.com` |

---

## Changes per File

### 1. send-purchase-email/index.ts (Line 78)
```typescript
// Before
from: "Letter of Dispute <noreply@letterofdispute.com>",

// After
from: "Letter of Dispute <noreply@mail.letterofdispute.com>",
```

### 2. send-contact-email/index.ts (Lines 50 & 78)
```typescript
// Before (two locations)
from: "Letter of Dispute <noreply@letterofdispute.com>",

// After
from: "Letter of Dispute <noreply@mail.letterofdispute.com>",
```

### 3. send-admin-email/index.ts (Line 68)
```typescript
// Before
from: "Letter of Dispute <noreply@letterofdispute.com>",

// After
from: "Letter of Dispute <noreply@mail.letterofdispute.com>",
```

### 4. send-credit-email/index.ts (Line 131)
```typescript
// Before
from: "Letter of Dispute <noreply@letterofdispute.com>",

// After
from: "Letter of Dispute <noreply@mail.letterofdispute.com>",
```

---

## After Implementation

Once deployed, I will test the contact form to verify emails are delivered successfully with the new sender address.
