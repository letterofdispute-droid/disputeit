
# Plan: Comprehensive Self-Sufficient Admin Dashboard

## Overview
Transform the existing admin panel into a complete, mobile-first e-commerce dashboard that provides full control over all aspects of the website - users, orders/payments, refunds, content, analytics, and settings. This ensures you can operate the site independently of any external platform.

## Current State Analysis

### What Already Exists
| Feature | Status | Notes |
|---------|--------|-------|
| User Management | Basic | Can view, suspend, grant/revoke admin |
| Blog Management | Complete | CRUD, bulk actions, AI generation |
| Page Management | Complete | Hierarchical pages |
| Analytics | Basic | Page views, template views, funnel |
| Settings | Basic | Site name, email, pricing |
| SEO Command | Complete | Content planning, queue, links |

### What's Missing for Full Independence
| Feature | Priority | Description |
|---------|----------|-------------|
| Orders/Payments Dashboard | High | View all purchases, payment status, order details |
| Refund Management | High | Process refunds directly via Stripe |
| User Detail View | High | Full user profile with purchase history |
| Delete Users | High | Remove users from the system |
| Revenue Analytics | High | Sales metrics, revenue trends, MRR |
| Export Data | Medium | CSV export for users, orders, analytics |
| Email Users | Medium | Send emails to individual users |
| System Health | Medium | Storage usage, API status, database stats |

---

## Implementation Plan

### Phase 1: Orders & Payments Dashboard (New Page)

Create `/admin/orders` with comprehensive order management:

**Stats Cards (Mobile: Stacked, Desktop: Grid)**
- Total Revenue (all time and period)
- Completed Orders
- Pending Orders  
- Refunded Amount

**Orders Table**
- Customer email
- Template name
- Purchase type (PDF Only / PDF + Edit)
- Amount
- Status (pending/completed/refunded)
- Payment date
- Actions (View, Refund)

**Filters**
- Date range picker
- Status filter
- Search by email/template

**Order Detail Modal**
- Full order information
- Stripe payment intent ID (clickable to Stripe)
- Customer details
- Letter content preview
- Refund button with confirmation

### Phase 2: Refund Processing

Create Edge Function `process-refund`:
```typescript
// Takes: order_id, reason (optional)
// Uses Stripe SDK to issue refund
// Updates letter_purchases.status to 'refunded'
// Logs refund event in analytics_events
```

**Refund UI:**
- Confirmation dialog with reason selection
- Full refund or partial amount input
- Success/error feedback
- Automatic status update in table

### Phase 3: Enhanced User Management

**User Detail Page/Modal**
- Profile information (editable)
- Purchase history with links to orders
- Account activity timeline
- Letters created
- Login history (requires new tracking)

**Delete User Flow**
- Confirmation dialog with data deletion warning
- Option to anonymize vs. hard delete
- Cascade handling (what happens to their orders)
- Edge function for secure deletion

**Email User**
- Simple compose form
- Pre-built templates (welcome, support, refund confirmation)
- Send via Resend API (already configured)

### Phase 4: Revenue Analytics Enhancement

Add to existing Analytics page or create new `/admin/revenue`:

**Key Metrics**
- Daily/Weekly/Monthly Revenue
- Average Order Value
- Conversion Rate (views → purchases)
- Revenue by Template Category
- Revenue by Purchase Type (PDF vs Editable)

**Charts**
- Revenue over time (line chart)
- Revenue by category (pie chart)
- Purchase type breakdown (bar chart)

### Phase 5: Data Export

**Export Options**
- Users CSV (email, name, plan, created_at, status)
- Orders CSV (all fields, date range)
- Analytics CSV (events, date range)
- Blog Posts CSV (for backup)

**Implementation**
- Edge function generates CSV
- Returns download URL (temporary signed URL)
- Progress indicator for large exports

### Phase 6: System Dashboard

Create system health overview on main dashboard or settings:

**Database Stats**
- Row counts per table
- Storage bucket usage
- Recent database errors (from logs)

**API Health**
- Stripe connection status
- Resend email status
- Edge function status

---

## Mobile-First Design Principles

All new components will follow these patterns:

```text
+------------------------------------+
| Orders & Payments          [Menu]  |  <- Sticky header
+------------------------------------+
| ┌──────────────────────────────┐   |
| │  $1,499.00                   │   |  <- Stats cards
| │  Total Revenue               │   |     STACKED on mobile
| └──────────────────────────────┘   |
| ┌──────────────────────────────┐   |
| │  2                           │   |
| │  Completed Orders            │   |
| └──────────────────────────────┘   |
+------------------------------------+
| [Search...]                        |  <- Filters
| [Status ▼] [Date Range ▼]          |     STACKED buttons
+------------------------------------+
| Order #abc123                      |  <- Card-based list
| john@example.com                   |     on mobile
| PDF + Edit • $14.99 • Completed    |
| [View Details]  [Refund]           |     STACKED actions
+------------------------------------+
```

**Key Mobile Patterns:**
- All action buttons stacked vertically (not side-by-side)
- Cards instead of tables on mobile
- Bottom sheet modals for detail views
- Sticky headers with hamburger menu
- Touch-friendly button sizes (min 44px)

---

## Database Changes

### New Table: `refund_logs`
Track all refund operations:

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| purchase_id | uuid | FK to letter_purchases |
| amount_cents | integer | Refund amount |
| reason | text | Refund reason |
| stripe_refund_id | text | Stripe refund ID |
| processed_by | uuid | Admin who processed |
| created_at | timestamp | When refunded |

### Modify `letter_purchases`
Add column: `refunded_at` (timestamp, nullable)
Add column: `refund_reason` (text, nullable)

---

## Navigation Update

Update `AdminLayout.tsx` sidebar:

```typescript
const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/admin/orders', icon: CreditCard, label: 'Orders' },        // NEW
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/seo', icon: Target, label: 'SEO Command' },
  { href: '/admin/blog', icon: FileText, label: 'Blog Posts' },
  { href: '/admin/pages', icon: FileStack, label: 'Pages' },
  { href: '/admin/templates', icon: ScrollText, label: 'Templates SEO' },
  { href: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
];
```

---

## Files to Create

| File | Description |
|------|-------------|
| `src/pages/admin/AdminOrders.tsx` | Orders & payments dashboard |
| `src/components/admin/orders/OrdersTable.tsx` | Responsive orders table/cards |
| `src/components/admin/orders/OrderDetailModal.tsx` | Full order detail view |
| `src/components/admin/orders/RefundDialog.tsx` | Refund confirmation |
| `src/components/admin/orders/OrderStats.tsx` | Revenue stats cards |
| `src/components/admin/orders/OrderFilters.tsx` | Date/status/search filters |
| `src/components/admin/users/UserDetailModal.tsx` | User profile with history |
| `src/components/admin/users/DeleteUserDialog.tsx` | Delete confirmation |
| `src/components/admin/users/EmailUserDialog.tsx` | Email compose form |
| `src/components/admin/export/ExportButton.tsx` | CSV export trigger |
| `supabase/functions/process-refund/index.ts` | Stripe refund processing |
| `supabase/functions/delete-user/index.ts` | Secure user deletion |
| `supabase/functions/export-data/index.ts` | CSV generation |
| `supabase/functions/send-admin-email/index.ts` | Admin email sending |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/admin/AdminLayout.tsx` | Add Orders nav item |
| `src/App.tsx` | Add /admin/orders route |
| `src/pages/admin/AdminUsers.tsx` | Add detail view, delete, email |
| `src/pages/admin/AdminDashboard.tsx` | Add revenue summary widget |
| `src/pages/admin/AdminAnalytics.tsx` | Add revenue metrics section |

---

## Estimated Scope

| Phase | Components | Effort |
|-------|------------|--------|
| Phase 1: Orders Dashboard | 6 files | Large |
| Phase 2: Refund Processing | 2 files + edge fn | Medium |
| Phase 3: User Enhancements | 4 files + edge fn | Medium |
| Phase 4: Revenue Analytics | 2 files | Small |
| Phase 5: Data Export | 2 files + edge fn | Medium |
| Phase 6: System Dashboard | 1 file | Small |

---

## Security Considerations

- All admin operations protected by RLS + `is_admin()` check
- Edge functions verify admin status before processing
- Refund operations logged for audit trail
- User deletion requires double confirmation
- Sensitive data (Stripe IDs) only visible to admins

---

## Summary

This plan creates a comprehensive, self-sufficient admin dashboard that:

1. **Orders & Payments** - Full visibility and control over all transactions
2. **Refund Processing** - Issue refunds directly without leaving the dashboard
3. **Enhanced Users** - Complete user lifecycle management including deletion
4. **Revenue Analytics** - Business metrics to understand performance
5. **Data Export** - Backup and analyze data independently
6. **Mobile-First** - Stacked layouts, touch-friendly, works on any device

You'll have complete control over the website operations without depending on external dashboards or platforms.
