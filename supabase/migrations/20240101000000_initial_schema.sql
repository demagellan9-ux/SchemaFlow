-- Migration: initial_schema
-- Creates all core tables, indexes, RLS policies, and update triggers.
-- Rollback: DROP TABLE job_files, jobs, transformations, mappings, schemas, uploads, projects, users CASCADE;

-- ── Extensions ────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "moddatetime";

-- ── Tables ────────────────────────────────────────────────────────────────────

-- users: mirrors auth.users, extended profile only
CREATE TABLE users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- projects: user-scoped containers for a consolidation task
CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- uploads: one row per uploaded spreadsheet; binary lives in Storage
CREATE TABLE uploads (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id),
  filename     TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  size_bytes   BIGINT,
  status       TEXT NOT NULL DEFAULT 'pending',  -- pending | uploaded | sliced | error
  slice_data   JSONB,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- schemas: destination schema definition
CREATE TABLE schemas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id),
  name        TEXT NOT NULL,
  definition  JSONB NOT NULL DEFAULT '{"version": 1, "columns": []}',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- mappings: source→destination column mapping per upload
CREATE TABLE mappings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id    UUID NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
  schema_id    UUID NOT NULL REFERENCES schemas(id),
  user_id      UUID NOT NULL REFERENCES users(id),
  mapping_data JSONB NOT NULL DEFAULT '{"version": 1, "entries": []}',
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- transformations: ordered rules per destination column
CREATE TABLE transformations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_id   UUID NOT NULL REFERENCES schemas(id) ON DELETE CASCADE,
  dest_column TEXT NOT NULL,
  rules       JSONB NOT NULL DEFAULT '{"version": 1, "rules": []}',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- jobs: ETL batch execution records
CREATE TABLE jobs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id),
  user_id      UUID NOT NULL REFERENCES users(id),
  schema_id    UUID NOT NULL REFERENCES schemas(id),
  status       TEXT NOT NULL DEFAULT 'queued',  -- queued | running | completed | completed_with_errors | failed
  output_path  TEXT,
  errors       JSONB,
  started_at   TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- job_files: per-file status within a batch job
CREATE TABLE job_files (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id          UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  upload_id       UUID NOT NULL REFERENCES uploads(id),
  status          TEXT NOT NULL DEFAULT 'pending',  -- pending | running | completed | failed
  error_detail    TEXT,
  rows_processed  INTEGER,
  rows_failed     INTEGER,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX projects_user_id_idx ON projects (user_id);
CREATE INDEX projects_created_at_idx ON projects (created_at DESC);

CREATE INDEX uploads_project_id_idx ON uploads (project_id);
CREATE INDEX uploads_user_id_idx ON uploads (user_id);
CREATE INDEX uploads_status_idx ON uploads (status);

CREATE INDEX schemas_project_id_idx ON schemas (project_id);

CREATE INDEX mappings_upload_id_idx ON mappings (upload_id);
CREATE INDEX mappings_schema_id_idx ON mappings (schema_id);

CREATE INDEX transformations_schema_id_idx ON transformations (schema_id);

CREATE INDEX jobs_project_id_idx ON jobs (project_id);
CREATE INDEX jobs_user_id_idx ON jobs (user_id);
CREATE INDEX jobs_status_idx ON jobs (status);
CREATE INDEX jobs_active_idx ON jobs (user_id, created_at DESC)
  WHERE status IN ('queued', 'running');

CREATE INDEX job_files_job_id_idx ON job_files (job_id);
CREATE INDEX job_files_status_idx ON job_files (status)
  WHERE status IN ('pending', 'running');

-- ── Updated-at triggers ───────────────────────────────────────────────────────

CREATE TRIGGER set_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON uploads
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON schemas
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON mappings
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON transformations
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON job_files
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- ── Row-Level Security ────────────────────────────────────────────────────────

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transformations ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_files ENABLE ROW LEVEL SECURITY;

-- users: own row only
CREATE POLICY "users_own_row" ON users
  FOR ALL USING (auth.uid() = id);

-- projects: own rows only
CREATE POLICY "projects_user_isolation" ON projects
  FOR ALL USING (auth.uid() = user_id);

-- uploads: own rows only
CREATE POLICY "uploads_user_isolation" ON uploads
  FOR ALL USING (auth.uid() = user_id);

-- schemas: own rows only
CREATE POLICY "schemas_user_isolation" ON schemas
  FOR ALL USING (auth.uid() = user_id);

-- mappings: own rows only
CREATE POLICY "mappings_user_isolation" ON mappings
  FOR ALL USING (auth.uid() = user_id);

-- transformations: via schema ownership
CREATE POLICY "transformations_via_schema" ON transformations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM schemas
      WHERE schemas.id = transformations.schema_id
        AND schemas.user_id = auth.uid()
    )
  );

-- jobs: own rows only
CREATE POLICY "jobs_user_isolation" ON jobs
  FOR ALL USING (auth.uid() = user_id);

-- job_files: via job ownership
CREATE POLICY "job_files_via_job" ON job_files
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = job_files.job_id
        AND jobs.user_id = auth.uid()
    )
  );

-- ── Storage buckets (run via Supabase dashboard or CLI) ───────────────────────
-- INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('exports', 'exports', false);
