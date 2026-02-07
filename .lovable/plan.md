
# Credits System Implementation Plan

## Overview
Implement a **goodwill credits system** that allows admins to assign free letter generation credits to users as a customer service gesture. Credits expire after 30 days and users can hold a maximum of 2 credits at any time.

## Business Rules
- Maximum 2 credits per user at any time (enforced at database and application level)
- Credits expire 30 days after being granted
- One credit = one free letter (equivalent to PDF + Edit Access, valued at $14.99)
- Credits are used instead of payment during checkout
- Only admins can grant credits

---

## Architecture Overview

```text
+------------------+       +-------------------+       +------------------+
|   Admin Panel    |  -->  |   user_credits    |  <--  |  PricingModal    |
| (Grant Credits)  |       |     (table)       |       |  (Use Credits)   |
+------------------+       +-------------------+       +------------------+
         |                         |                          |
         v                         v                          v
+------------------+       +-------------------+       +------------------+
| UserDetailModal  |       | Database Trigger  |       | redeem-credit    |
| (View + Assign)  |       | (Enforce max 2)   |       | (Edge Function)  |
+------------------+       +-------------------+       +------------------+
```

---

## Implementation Steps

### Phase 1: Database Schema

**Create `user_credits` table:**
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Reference to auth.users |
| `granted_by` | uuid | Admin who granted the credit |
| `granted_at` | timestamp | When the credit was granted |
| `expires_at` | timestamp | 30 days from granted_at |
| `used_at` | timestamp | When the credit was redeemed (null if unused) |
| `purchase_id` | uuid | Links to letter_purchases when redeemed |
| `reason` | text | Optional note from admin |
| `status` | text | 'active', 'used', 'expired' |

**Database Validation:**
- A BEFORE INSERT trigger will check if user already has 2 or more active/unexpired credits
- If limit exceeded, the insert is rejected with an error

**RLS Policies:**
- Admins can INSERT (grant credits)
- Admins can SELECT all credits
- Users can SELECT their own credits
- No UPDATE or DELETE allowed (immutable audit trail)

---

### Phase 2: Admin UI Changes

**UserDetailModal Enhancements:**
- Add a "Credits" section showing:
  - Current active credits count (0, 1, or 2)
  - List of credit history (granted, used, expired)
  - "Grant Credit" button (disabled if user has 2 active credits)

**Grant Credit Dialog:**
- Optional reason field for documentation
- Confirmation message explaining 30-day expiry
- Success/error toast feedback

**AdminUsers Table:**
- Add a "Credits" column showing active credit count per user
- Visual indicator (badge) when user has credits available

---

### Phase 3: User-Facing UI Changes

**PricingModal Updates:**
- Check if user has active (non-expired, unused) credits
- If credits available, show a third option: "Use 1 Credit (Free)"
- Display credit expiration date
- Credit option should be visually prominent

**Dashboard Updates:**
- Add a "Credits" card in the sidebar showing:
  - Number of available credits
  - Expiration dates for each credit
  - Link to browse templates

---

### Phase 4: Credit Redemption Flow

**New Edge Function: `redeem-credit`**
- Validates user has an active credit
- Marks the oldest credit as 'used'
- Creates a letter_purchase record with amount_cents = 0
- Links the credit to the purchase
- Generates the letter documents (PDF/DOCX)
- Returns success with download URLs

**Modified Flow:**
1. User clicks "Use 1 Credit" in PricingModal
2. Frontend calls `redeem-credit` edge function
3. Edge function validates and processes
4. User is redirected to success page with their letter

---

### Phase 5: Expiration Handling

**Approach:** 
- Credits are checked for expiry at query time using `WHERE expires_at > NOW()`
- No background job needed - expired credits are simply excluded from active count
- Optional: A scheduled function could mark expired credits as 'expired' for cleaner data

---

## Technical Details

### Database Migration SQL (Summary)
```sql
-- Create user_credits table
-- Add trigger to enforce max 2 active credits per user
-- Create RLS policies for admin and user access
```

### Files to Create
| File | Purpose |
|------|---------|
| `src/hooks/useUserCredits.ts` | Hook to fetch/manage user credits |
| `src/components/admin/users/GrantCreditDialog.tsx` | Admin dialog for granting credits |
| `src/components/admin/users/UserCreditsSection.tsx` | Credits display in UserDetailModal |
| `src/components/dashboard/CreditsCard.tsx` | User dashboard credits display |
| `supabase/functions/redeem-credit/index.ts` | Edge function for credit redemption |

### Files to Modify
| File | Changes |
|------|---------|
| `src/components/letter/PricingModal.tsx` | Add credit usage option |
| `src/components/admin/users/UserDetailModal.tsx` | Add credits section + grant button |
| `src/pages/admin/AdminUsers.tsx` | Add credits column to table |
| `src/pages/Dashboard.tsx` | Add credits card to sidebar |

---

## Security Considerations

1. **Admin-only granting:** RLS policy ensures only admins can INSERT credits
2. **Immutable records:** No UPDATE/DELETE policies for audit trail
3. **Server-side validation:** Edge function double-checks credit validity before redemption
4. **User ownership:** Users can only view/use their own credits
5. **Rate limiting:** One credit per redemption call, validated server-side

---

## User Experience Flow

**Admin granting credit:**
1. Admin opens user detail modal
2. Sees current credit status (0/2 available)
3. Clicks "Grant Credit"
4. Optionally adds reason
5. Confirms - credit is added with 30-day expiry

**User using credit:**
1. User generates letter as normal
2. Clicks "Generate Letter"
3. PricingModal shows "Use 1 Credit (Free)" option
4. User clicks credit option
5. Letter is generated and user redirected to success page
6. Credit marked as used

---

## Edge Cases Handled

- User tries to use expired credit: Rejected at query level
- Admin tries to grant 3rd credit: Rejected by database trigger
- User with no account tries to use credit: Requires authentication
- Credit used for both PDF options: Always grants PDF + Edit Access equivalent
