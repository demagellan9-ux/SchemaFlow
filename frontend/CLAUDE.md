# Frontend Layer — SchemaFlow

> Global rules are in the root `CLAUDE.md`. This file adds frontend-specific guidance only.

---

## Responsibilities

The frontend owns:
- File upload UX (streams files to Supabase Storage, not to FastAPI)
- Schema discovery display (worksheets, detected headers, column profiles)
- Visual column mapper (source → destination mapping with confidence scores)
- Transformation configuration UI (chainable rule builder)
- Job monitoring dashboard (status polling, progress, error surfacing)
- Export trigger and download

The frontend **never**:
- Parses spreadsheet content
- Executes transformations
- Writes directly to PostgreSQL

---

## Project Structure

```
frontend/
  app/                  # Next.js App Router pages and layouts
    (auth)/             # Auth-gated route group
    api/                # Route handlers (thin proxies to FastAPI only)
  components/
    ui/                 # shadcn/ui primitives — never modified directly
    features/           # Feature-scoped composite components
    shared/             # Cross-feature reusable components
  lib/
    api/                # Typed fetch wrappers for FastAPI endpoints
    supabase/           # Supabase client (browser + server)
    utils/              # Pure utility functions (no side effects)
  hooks/                # Custom React hooks
  types/                # Shared TypeScript interfaces and zod schemas
```

---

## Component Rules

- **One component, one responsibility.** If a component handles both data fetching and rendering, split it.
- **Server Components by default.** Opt into `"use client"` only when state, effects, or browser APIs are required.
- **Feature components** live under `components/features/<feature-name>/`. They may import from `components/shared/` and `components/ui/` but never from sibling feature folders.
- **No inline styles.** Use Tailwind utility classes exclusively.
- **shadcn/ui components** are source-owned (in `components/ui/`). Extend via composition wrappers — never edit the primitive files directly.

---

## Data Fetching

- Use **TanStack Query** (`useQuery`, `useMutation`) for all client-side data fetching.
- Server Components fetch directly using the server Supabase client or route handlers.
- API route handlers (`app/api/`) are thin proxies — they forward requests to FastAPI and return the response. They contain no business logic.
- All FastAPI request/response shapes must have a corresponding TypeScript interface in `types/`.

---

## Forms

- Use **React Hook Form** with **zod** for all user input forms.
- Define the zod schema in `types/` and import it into the form component.
- Never use uncontrolled inputs outside of React Hook Form.

---

## Preview Tables

- Use **TanStack Table** for all tabular data display.
- **Hard limit: 100 rows maximum** in any preview table. Never render full dataset contents.
- Virtualize rows if the preview slice exceeds 50 rows.
- Column widths are user-resizable; persist width preferences in `localStorage`.

---

## Column Mapper UI

- Display source columns and destination columns in two parallel panels.
- Show RapidFuzz confidence scores (0–100) as visual indicators on each mapping.
- Allow drag-to-map, click-to-select, and auto-map (highest-confidence) actions.
- Unmatched destination columns are visually flagged, not silently ignored.
- Mapping state is a plain object `Record<sourceCol, destCol>` — serialize directly to JSON for API submission.

---

## State Management

- **No global state library** (no Redux, Zustand, Jotai) unless a feature genuinely requires cross-tree shared state that TanStack Query cannot serve.
- Prefer URL state (search params) for shareable UI state (selected tab, active project ID).
- Prefer `useReducer` over multiple `useState` calls when a component manages more than three related state values.

---

## Error Handling

- All `useMutation` error states must be surfaced via a visible UI element (toast or inline error message).
- Never swallow errors silently (`catch (() => {})`).
- Per-file batch errors from FastAPI must be displayed per-file, not as a single aggregate failure.

---

## TypeScript

- `strict: true` is enforced. No `any` types without a `// reason:` comment on the same line.
- Use `satisfies` for config objects to preserve inference while enforcing shape.
- Prefer `type` over `interface` for data shapes; use `interface` for extensible contracts (component props, API clients).
