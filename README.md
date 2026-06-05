# Artisans Verification Portal

A verification platform where skilled artisans across Ghana apply for professional verification, and administrators review, approve, or reject those applications in real time.

## Architecture

```
src/
  components/
    layout/
      AdminLayout.tsx      # Sidebar + header shell for admin pages
      PublicLayout.tsx      # Nav + footer shell for public pages
    ui/
      ErrorBoundary.tsx     # React error boundary with retry UI
      FileUpload.tsx        # Drag-and-drop file upload component
      FraudIndicators.tsx   # Fraud risk tag display
      StatusBadge.tsx       # Status + level badges
      StepIndicator.tsx     # Multi-step form progress bar
  lib/
    constants.ts            # Trade categories, regions, emoji maps, rejection templates
    stats.ts                # Live stats computed from Supabase
    supabase.ts             # Supabase client with env validation
  pages/
    LandingPage.tsx         # Public landing page with live stats
    ApplyPage.tsx           # 6-step application form with file uploads
    StatusPage.tsx          # Application status tracker with realtime updates
    admin/
      AdminDashboard.tsx    # Overview cards + recent applications
      ApplicationDetail.tsx # Full detail view with approve/reject/request-info
      ApplicationsTable.tsx # Filterable, searchable applications list
      AuditLogPage.tsx      # Immutable audit trail
  App.tsx                   # Client-side routing with hash-based navigation
  types/index.ts            # TypeScript interfaces for all domain objects
  index.css                 # Tailwind layers + component classes + warm palette
```

## Tech Stack

- **Frontend:** React 18 + TypeScript, Vite
- **Styling:** Tailwind CSS with a warm color system (terracotta, Kente gold, off-white)
- **Backend:** Supabase (PostgreSQL, Storage, Realtime)
- **Icons:** Lucide React

## Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

The app will throw a clear error at startup if these are missing.

## Getting Started

```bash
npm install
npm run dev      # Start dev server
npm run build    # Production build
```

## Database Schema

### Tables

| Table | Purpose |
|---|---|
| `worker_verifications` | Core application records with status lifecycle |
| `verification_documents` | Uploaded file metadata + storage URLs |
| `verification_references` | Professional references per application |
| `verification_audit_logs` | Immutable trail of all admin actions |
| `admin_users` | Admin profiles (linked to Supabase Auth) |

### Storage

| Bucket | Purpose | Max Size | Accepted Types |
|---|---|---|---|
| `verification-docs` | ID photos, selfies, certificates, portfolios | 10 MB | JPEG, PNG, PDF |

### Status Lifecycle

```
pending -> under_review -> approved
                       \-> rejected
                       \-> more_info_requested -> (applicant re-uploads) -> under_review
```

## Admin Access

There is no visible "Admin" button in the public navigation. Admin access is intentionally hidden to prevent casual users from stumbling into the admin panel. Access it through:

1. **Footer logo triple-click** — Click the Artisans brand in the footer 3 times quickly (within 1.2 seconds)
2. **Hidden lock icon** — An invisible lock icon next to the copyright text in the footer. It appears at 40% opacity on hover and is also keyboard-accessible via Tab + Enter
3. **Direct URL** — Navigate to `#/portal/admin`

## Realtime

Both the admin `ApplicationDetail` page and the public `StatusPage` subscribe to Supabase Realtime channels. When an admin approves or rejects an application, the status badge, timeline, and audit log update instantly on both sides without a page refresh.

---

## Migrating Away from Supabase

The app is structured so that Supabase is accessed through a single file (`src/lib/supabase.ts`) and the Supabase JS client. To switch to your own backend:

### Step 1: Replace the client

Replace `src/lib/supabase.ts` with your own API client. The rest of the code imports `supabase` from this file, so this is the only file that needs to change for the data layer.

```typescript
// src/lib/supabase.ts — replace with your own API
export const api = {
  from: (table: string) => ({
    select: (cols?: string) => ({ ... }),
    insert: (data: any) => ({ ... }),
    update: (data: any) => ({ ... }),
    delete: () => ({ ... }),
  }),
  storage: {
    from: (bucket: string) => ({
      upload: (path: string, file: File) => ({ ... }),
      getPublicUrl: (path: string) => ({ ... }),
    }),
  },
  channel: (name: string) => ({
    on: (event: string, config: any, callback: Function) => ({ ... }),
    subscribe: (callback: Function) => ({ ... }),
  }),
  removeChannel: (channel: any) => {},
};
```

### Step 2: Migrate the database

Run the schema DDL from the migration files in `supabase/migrations/` against your own PostgreSQL instance. The SQL is standard PostgreSQL and does not use any Supabase-specific extensions.

Key things your database needs:
- `gen_random_uuid()` (provided by `pgcrypto` or `uuid-ossp` extensions)
- `jsonb` column type (standard in PostgreSQL 9.4+)
- Row Level Security is optional — if you handle auth in your API layer, you can remove the RLS policies

### Step 3: Replace Storage

The `verification-docs` bucket stores uploaded files. Replace with:
- **S3 / R2 / GCS** — change the upload logic in `ApplyPage.tsx` (the `uploadDocumentFile` function) to call your storage API
- **Local filesystem** — if self-hosting, save files to disk and serve via your web server
- Update `verification_documents.file_url` to point to your new storage URLs

### Step 4: Replace Realtime

Supabase Realtime is used for live status updates. Alternatives:
- **WebSocket server** — emit events when the admin updates a verification, listen on the frontend
- **Server-Sent Events** — simpler unidirectional push from server to client
- **Polling** — the StatusPage already has a refresh button; add a `setInterval` call as a fallback

The realtime code lives in:
- `src/pages/admin/ApplicationDetail.tsx` — admin-side subscription
- `src/pages/StatusPage.tsx` — artisan-side subscription

Both use the same pattern: `supabase.channel(...).on('postgres_changes', ...).subscribe()`. Replace with your own subscription mechanism.

### Step 5: Remove Supabase dependency

```bash
npm uninstall @supabase/supabase-js
```

Delete `src/lib/supabase.ts` and update all imports to use your new API client.

---

## Color System

| Token | Hex | Usage |
|---|---|---|
| `surface-base` | `#FFF8F0` | Page backgrounds (warm off-white) |
| `primary` | `#C15A3D` | Buttons, links, active states (terracotta) |
| `primary-dark` | `#8B3A2A` | Hover states |
| `gold-500` | `#E6A017` | Kente gold — accents, warnings, badges |
| `success` | `#16A34A` | Approved states |
| `error` | `#DC2626` | Rejected states, validation errors |

Full palette defined in `tailwind.config.js`.
