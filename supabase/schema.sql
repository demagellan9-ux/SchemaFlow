-- SchemaFlow — Full Database Schema
-- This file is the canonical reference. Migrations in /migrations/ are the deployment mechanism.
-- See supabase/CLAUDE.md for design rules and data-modeling/SKILL.md for JSONB type specs.

-- ============================================================
-- Extensions
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "moddatetime";

-- ============================================================
-- Users (mirrors auth.users)
-- ============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_self_access" ON users
  FOR ALL USING (auth.uid() = id);

-- ============================================================
-- Projects
-- ============================================================
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  description TEXT CHECK (char_length(description) <= 500),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX projects_user_id_idx ON projects (user_id);

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects_user_isolation" ON projects
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- Uploads
-- ============================================================
CREATE TABLE uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  size_bytes BIGINT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sliced', 'mapped', 'error')),
  slice_data JSONB,  -- SliceData: { version, worksheet, header_row_index, columns, rows[100] }
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX uploads_project_id_idx ON uploads (project_id);
CREATE INDEX uploads_user_id_idx ON uploads (user_id);

CREATE TRIGGER uploads_updated_at
  BEFORE UPDATE ON uploads
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "uploads_user_isolation" ON uploads
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- Schemas (destination schema definitions)
-- ============================================================
CREATE TABLE schemas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  definition JSONB NOT NULL,  -- SchemaDefinition: { version, columns: DestinationColumn[] }
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX schemas_project_id_idx ON schemas (project_id);

CREATE TRIGGER schemas_updated_at
  BEFORE UPDATE ON schemas
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

ALTER TABLE schemas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "schemas_user_isolation" ON schemas
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- Mappings (source→destination column mappings per upload)
-- ============================================================
CREATE TABLE mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
  schema_id UUID NOT NULL REFERENCES schemas(id),
  user_id UUID NOT NULL REFERENCES users(id),
  mapping_data JSONB NOT NULL,  -- MappingData: { version, entries: MappingEntry[] }
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX mappings_upload_id_idx ON mappings (upload_id);

CREATE TRIGGER mappings_updated_at
  BEFORE UPDATE ON mappings
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

ALTER TABLE mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mappings_user_isolation" ON mappings
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- Transformations (ordered rules per destination column)
-- ============================================================
CREATE TABLE transformations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_id UUID NOT NULL REFERENCES schemas(id) ON DELETE CASCADE,
  dest_column TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  rules JSONB NOT NULL,  -- TransformationRuleSet: { version, rules: TransformationRule[] }
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (schema_id, dest_column)
);

CREATE INDEX transformations_schema_id_idx ON transformations (schema_id);

CREATE TRIGGER transformations_updated_at
  BEFORE UPDATE ON transformations
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

ALTER TABLE transformations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transformations_user_isolation" ON transformations
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- Jobs
-- ============================================================
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  user_id UUID NOT NULL REFERENCES users(id),
  schema_id UUID NOT NULL REFERENCES schemas(id),
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'completed', 'completed_with_errors', 'failed')),
  output_path TEXT,
  errors JSONB,  -- JobErrors: { files: FileError[] }
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX jobs_user_id_idx ON jobs (user_id);
CREATE INDEX jobs_project_id_idx ON jobs (project_id);
CREATE INDEX jobs_status_idx ON jobs (status) WHERE status IN ('queued', 'running');

CREATE TRIGGER jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jobs_user_isolation" ON jobs
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- Job Files (per-file status within a batch)
-- ============================================================
CREATE TABLE job_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  upload_id UUID NOT NULL REFERENCES uploads(id),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  error_detail TEXT,
  rows_processed INTEGER,
  rows_failed INTEGER,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX job_files_job_id_idx ON job_files (job_id);
CREATE INDEX job_files_status_idx ON job_files (status) WHERE status IN ('pending', 'running');

CREATE TRIGGER job_files_updated_at
  BEFORE UPDATE ON job_files
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

ALTER TABLE job_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "job_files_user_isolation" ON job_files
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM jobs WHERE jobs.id = job_files.job_id AND jobs.user_id = auth.uid()
    )
  );
