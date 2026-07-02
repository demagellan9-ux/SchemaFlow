# Frontend Architecture — SchemaFlow

## Overview

The frontend is a Next.js 15 App Router application served on Vercel. It owns UI state, schema mapping UX, job monitoring, and file upload orchestration. It never performs ETL or writes directly to PostgreSQL.

---

## Directory Structure

```
frontend/
├── app/
│   ├── layout.tsx                  # Root layout — fonts, Providers wrapper
│   ├── globals.css                 # shadcn/ui CSS variable tokens
│   ├── page.tsx                    # Root redirect → /dashboard
│   └── dashboard/
│       ├── layout.tsx              # AppShell wrapper for all dashboard routes
│       ├── page.tsx                # Overview — stat cards + recent activity
│       ├── projects/
│       │   ├── page.tsx            # Project list
│       │   └── [projectId]/
│       │       └── page.tsx        # Project detail (uploads, schema, jobs)
│       ├── uploads/page.tsx        # Upload dropzone placeholder
│       ├── schemas/page.tsx        # Schema list placeholder
│       ├── jobs/
│       │   ├── page.tsx            # Job list
│       │   └── [jobId]/page.tsx    # Job status + per-file progress
│       └── settings/page.tsx       # Account preferences placeholder
├── components/
│   ├── ui/                         # shadcn/ui primitives (source-owned)
│   │   ├── button.tsx
│   │   ├── badge.tsx
│   │   ├── card.tsx
│   │   ├── separator.tsx
│   │   ├── toast.tsx
│   │   └── toaster.tsx
│   ├── shared/                     # Cross-feature reusable components
│   │   ├── AppShell.tsx            # Sidebar + TopNav + content + footer
│   │   ├── Sidebar.tsx             # Navigation links with active state
│   │   ├── TopNav.tsx              # Header with breadcrumbs + user avatar
│   │   ├── Breadcrumbs.tsx         # Dynamic breadcrumbs from pathname
│   │   ├── PageHeader.tsx          # Title + description + actions slot
│   │   ├── EmptyState.tsx          # Icon + title + description + CTA
│   │   ├── LoadingSpinner.tsx      # Spinner (sm/md/lg) + PageLoader
│   │   ├── StatusBadge.tsx         # Unified status → badge variant mapping
│   │   ├── ConfirmDialog.tsx       # Radix confirm dialog with destructive variant
│   │   ├── DataTable.tsx           # TanStack Table wrapper (loading/empty states)
│   │   ├── FileDropzone.tsx        # Drag-and-drop placeholder (active Phase 7)
│   │   ├── StatCard.tsx            # Dashboard metric card with icon
│   │   ├── Providers.tsx           # QueryClient + ErrorBoundary + Toaster
│   │   └── ErrorBoundary.tsx       # Class component error boundary
│   └── features/
│       └── dashboard/
│           └── RecentActivity.tsx  # Activity placeholder
├── hooks/
│   ├── useToast.ts                 # Module-level toast state store
│   ├── useJobStatus.ts             # Polls job until terminal status
│   └── useFileUpload.ts            # Presign → PUT → confirm mutation
├── lib/
│   └── api/
│       ├── client.ts               # apiFetch<T> wrapper + ApiRequestError
│       ├── projects.ts             # CRUD for projects
│       ├── uploads.ts              # presign, confirm, list, get
│       ├── schemas.ts              # CRUD for schemas
│       ├── mappings.ts             # get, save, auto-map
│       ├── transformations.ts      # registry, list, get, save
│       └── jobs.ts                 # create, get, list, files, export
└── types/
    ├── project.ts
    ├── upload.ts
    ├── schema.ts
    ├── mapping.ts
    ├── transformation.ts
    └── job.ts
```

---

## Routing Strategy

All authenticated views live under `/dashboard`. The `dashboard/layout.tsx` wraps every child in `AppShell`, which renders the sidebar navigation and top bar. Detail routes use Next.js dynamic segments (`[projectId]`, `[jobId]`).

Auth-gated route groups (`(auth)/`) and login pages are implemented in Phase 7 (Supabase Auth).

---

## Component Conventions

| Pattern | Rule |
|---|---|
| Server vs Client | Server Components by default; `"use client"` only for state, effects, or browser APIs |
| One responsibility | If a component fetches data AND renders it, split into a container and a display component |
| Feature scoping | `components/features/<name>/` — may import from `shared/` and `ui/`; never from sibling features |
| Styling | Tailwind utility classes only; no inline styles; no CSS modules |
| shadcn/ui | Primitives in `components/ui/` are source-owned; extend via composition wrappers, never edit primitives directly |

---

## Data Fetching

### Client-side (interactive pages)

All client-side requests go through `apiFetch<T>()` from `lib/api/client.ts`, never raw `fetch`. Each domain has a typed service module in `lib/api/`.

```typescript
// Always import domain functions, never apiFetch directly in components
import { listProjects } from "@/lib/api/projects";

const { data } = useQuery({
  queryKey: ["projects"],
  queryFn: () => listProjects(),
});
```

### Auth header injection

`apiFetch` does not inject auth headers in Phase 6. Phase 7 adds a Supabase session interceptor that attaches `Authorization: Bearer <jwt>` before each request.

### Mutation invalidation

All mutations invalidate the relevant `queryKey` on success via `useQueryClient().invalidateQueries(...)`.

---

## Upload Flow

The frontend never sends binary data to FastAPI.

```
1. useFileUpload.mutate(file)
   → POST /api/v1/uploads/presign        (get upload_id + presigned_url)
   → PUT <presigned_url> (binary)        (direct to Supabase Storage)
   → POST /api/v1/uploads/confirm        (trigger structural slice extraction)
```

The `useFileUpload` hook in `hooks/useFileUpload.ts` encapsulates this three-step flow as a single `useMutation`.

---

## Job Status Polling

`useJobStatus(jobId)` polls `GET /api/v1/jobs/:jobId` every 3 seconds while the job is in a non-terminal state (`queued` or `running`). Polling stops automatically when status reaches `completed`, `completed_with_errors`, or `failed`.

---

## State Management

- **No global state library.** TanStack Query is the primary state layer.
- **URL state** for shareable UI (active project, selected tab).
- **`useReducer`** over multiple `useState` calls when a component manages more than three related values.
- **Column mapper state** is a plain `Record<sourceCol, destCol | null>` — serialized directly to JSON for the save-mapping API call.

---

## Preview Table Constraint

TanStack Table (`DataTable.tsx`) enforces a **100-row hard limit** on all preview renders. The backend only delivers 100 rows in `slice_data.rows`; the frontend must not paginate beyond this slice.

---

## Error Handling

- `ApiRequestError` (from `lib/api/client.ts`) carries `status` and a typed `body: ApiError`.
- All `useMutation` error states surface via toast (using `useToast`) or an inline message — never silently swallowed.
- `ErrorBoundary.tsx` wraps the Providers tree to catch unhandled render errors globally.

---

## Theming

CSS custom properties are defined in `app/globals.css` using HSL values. Tailwind references them via `hsl(var(--token))` mappings in `tailwind.config.ts`. Dark mode is class-based (`darkMode: ["class"]`). No hardcoded color values in components.

---

## Extension Points for Phase 7+

| Phase | What extends here |
|---|---|
| Phase 7 | Supabase Auth — add `(auth)/login` route group, server-side session validation in `dashboard/layout.tsx`, auth header injection in `apiFetch` |
| Phase 7 | `FileDropzone.tsx` — enable file selection and wire to `useFileUpload` |
| Phase 8 | Schema editor — add `features/schema/` components using `lib/api/schemas.ts` and `lib/api/mappings.ts` |
| Phase 9 | Column mapper — visual drag-to-map UI using `lib/api/mappings.ts` and `AutoMapResponse` |
| Phase 9 | Transformation builder — chainable rule UI using `lib/api/transformations.ts` registry |
| Phase 10 | Job file list — per-file status panel in `jobs/[jobId]/page.tsx` using `listJobFiles` |
| Phase 10 | Export trigger — download button wired to `createExport` + `getExport` polling |
