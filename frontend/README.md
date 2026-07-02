# SchemaFlow — Frontend

Next.js 15 application (App Router). Provides the SchemaFlow UI: file uploads, schema building, column mapping, transformation configuration, job monitoring, and export.

## Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS + shadcn/ui
- **Data fetching:** TanStack Query
- **Tables:** TanStack Table (100-row hard limit)
- **Forms:** React Hook Form + zod
- **Auth:** Supabase Auth via `@supabase/ssr`

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
FASTAPI_URL=http://localhost:8000
```

## Development

Deployed remotely via Vercel. No local Node.js runtime is required to edit source files. To run locally for development:

```bash
npm install
npm run dev
```

## Key Conventions

- Frontend never parses spreadsheet content — uploads go directly to Supabase Storage via presigned URLs.
- All API calls route through `app/api/v1/` proxy handlers → FastAPI.
- Preview tables render at most 100 rows.
- See `frontend/CLAUDE.md` for full layer guidance.
