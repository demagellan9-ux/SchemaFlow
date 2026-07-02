-- =============================================================================
-- Migration: complete_schema
-- Replaces the initial stub migration with the full Phase 3 database design.
-- Rollback: DROP TABLE IF EXISTS audit_logs, exports, job_files, jobs,
--           transformations, mappings, schemas, uploads, projects, users CASCADE;
-- =============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "moddatetime";

-- =============================================================================
-- users
-- =============================================================================
CREATE TABLE users (
  id            UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT        CHECK (char_length(display_name) <= 100),
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_self_read_write" ON users
  FOR ALL USING (auth.uid() = id);

-- =============================================================================
-- projects
-- =============================================================================
CREATE TABLE projects (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  description   TEXT        CHECK (char_length(description) <= 500),
  status        TEXT        NOT NULL DEFAULT 'active'
                              CHECK (status IN ('active', 'archived')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX projects_user_id_idx ON projects (user_id);
CREATE INDEX projects_status_idx  ON projects (user_id, status);

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects_user_isolation" ON projects
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- uploads
-- =============================================================================
CREATE TABLE uploads (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id           UUID        NOT NULL REFERENCES users(id),
  filename          TEXT        NOT NULL CHECK (char_length(filename) BETWEEN 1 AND 255),
  original_filename TEXT        NOT NULL CHECK (char_length(original_filename) BETWEEN 1 AND 255),
  storage_path      TEXT        NOT NULL,
  mime_type         TEXT,
  file_extension    TEXT        CHECK (file_extension IN ('xlsx', 'xls', 'csv')),
  size_bytes        BIGINT      CHECK (size_bytes > 0),
  status            TEXT        NOT NULL DEFAULT 'pending'
                                  CHECK (status IN ('pending', 'confirmed', 'sliced', 'error')),
  slice_data        JSONB,
  error_message     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX uploads_project_id_idx ON uploads (project_id);
CREATE INDEX uploads_user_id_idx    ON uploads (user_id);
CREATE INDEX uploads_status_idx     ON uploads (project_id, status);

CREATE TRIGGER uploads_updated_at
  BEFORE UPDATE ON uploads
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "uploads_user_isolation" ON uploads
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- schemas
-- =============================================================================
CREATE TABLE schemas (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id       UUID        NOT NULL REFERENCES users(id),
  name          TEXT        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  description   TEXT        CHECK (char_length(description) <= 500),
  definition    JSONB       NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX schemas_project_id_idx ON schemas (project_id);
CREATE INDEX schemas_user_id_idx    ON schemas (user_id);

CREATE TRIGGER schemas_updated_at
  BEFORE UPDATE ON schemas
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

ALTER TABLE schemas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "schemas_user_isolation" ON schemas
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- mappings
-- =============================================================================
CREATE TABLE mappings (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id     UUID        NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
  schema_id     UUID        NOT NULL REFERENCES schemas(id) ON DELETE CASCADE,
  user_id       UUID        NOT NULL REFERENCES users(id),
  mapping_data  JSONB       NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (upload_id, schema_id)
);

CREATE INDEX mappings_upload_id_idx  ON mappings (upload_id);
CREATE INDEX mappings_schema_id_idx  ON mappings (schema_id);
CREATE INDEX mappings_user_id_idx    ON mappings (user_id);

CREATE TRIGGER mappings_updated_at
  BEFORE UPDATE ON mappings
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

ALTER TABLE mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mappings_user_isolation" ON mappings
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- transformations
-- =============================================================================
CREATE TABLE transformations (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_id     UUID        NOT NULL REFERENCES schemas(id) ON DELETE CASCADE,
  user_id       UUID        NOT NULL REFERENCES users(id),
  dest_column   TEXT        NOT NULL CHECK (char_length(dest_column) BETWEEN 1 AND 255),
  rules         JSONB       NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (schema_id, dest_column)
);

CREATE INDEX transformations_schema_id_idx ON transformations (schema_id);
CREATE INDEX transformations_user_id_idx   ON transformations (user_id);

CREATE TRIGGER transformations_updated_at
  BEFORE UPDATE ON transformations
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

ALTER TABLE transformations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transformations_user_isolation" ON transformations
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- jobs
-- =============================================================================
CREATE TABLE jobs (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID        NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  user_id          UUID        NOT NULL REFERENCES users(id),
  schema_id        UUID        NOT NULL REFERENCES schemas(id) ON DELETE RESTRICT,
  status           TEXT        NOT NULL DEFAULT 'queued'
                                 CHECK (status IN (
                                   'queued', 'running', 'completed',
                                   'completed_with_errors', 'failed'
                                 )),
  total_files      INTEGER     NOT NULL DEFAULT 0 CHECK (total_files >= 0),
  completed_files  INTEGER     NOT NULL DEFAULT 0 CHECK (completed_files >= 0),
  failed_files     INTEGER     NOT NULL DEFAULT 0 CHECK (failed_files >= 0),
  errors           JSONB,
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX jobs_user_id_idx    ON jobs (user_id);
CREATE INDEX jobs_project_id_idx ON jobs (project_id);
CREATE INDEX jobs_schema_id_idx  ON jobs (schema_id);
CREATE INDEX jobs_active_idx     ON jobs (user_id, created_at DESC)
  WHERE status IN ('queued', 'running');
CREATE INDEX jobs_status_idx     ON jobs (status)
  WHERE status IN ('queued', 'running');

CREATE TRIGGER jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jobs_user_isolation" ON jobs
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- job_files
-- =============================================================================
CREATE TABLE job_files (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id          UUID        NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  upload_id       UUID        NOT NULL REFERENCES uploads(id) ON DELETE RESTRICT,
  status          TEXT        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  error_stage     TEXT,
  error_detail    TEXT,
  rows_processed  INTEGER     CHECK (rows_processed >= 0),
  rows_failed     INTEGER     CHECK (rows_failed >= 0),
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (job_id, upload_id)
);

CREATE INDEX job_files_job_id_idx    ON job_files (job_id);
CREATE INDEX job_files_upload_id_idx ON job_files (upload_id);
CREATE INDEX job_files_active_idx    ON job_files (job_id, status)
  WHERE status IN ('pending', 'running');

CREATE TRIGGER job_files_updated_at
  BEFORE UPDATE ON job_files
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

ALTER TABLE job_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "job_files_user_isolation" ON job_files
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = job_files.job_id
        AND jobs.user_id = auth.uid()
    )
  );

-- =============================================================================
-- exports
-- =============================================================================
CREATE TABLE exports (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id        UUID        NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  user_id       UUID        NOT NULL REFERENCES users(id),
  storage_path  TEXT        NOT NULL,
  format        TEXT        NOT NULL CHECK (format IN ('csv', 'xlsx')),
  size_bytes    BIGINT      CHECK (size_bytes > 0),
  row_count     INTEGER     CHECK (row_count >= 0),
  status        TEXT        NOT NULL DEFAULT 'available'
                              CHECK (status IN ('available', 'expired', 'deleted')),
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX exports_job_id_idx   ON exports (job_id);
CREATE INDEX exports_user_id_idx  ON exports (user_id);
CREATE INDEX exports_expiry_idx   ON exports (expires_at)
  WHERE status = 'available';

CREATE TRIGGER exports_updated_at
  BEFORE UPDATE ON exports
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

ALTER TABLE exports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exports_user_isolation" ON exports
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- audit_logs
-- Append-only. No updated_at trigger. actor_id is a soft reference.
-- =============================================================================
CREATE TABLE audit_logs (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id       UUID,
  action         TEXT        NOT NULL CHECK (char_length(action) BETWEEN 1 AND 100),
  resource_type  TEXT        NOT NULL CHECK (resource_type IN (
                               'project', 'upload', 'schema', 'mapping',
                               'transformation', 'job', 'export', 'user'
                             )),
  resource_id    UUID,
  payload        JSONB,
  ip_address     INET,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX audit_logs_resource_idx ON audit_logs (resource_type, resource_id, created_at DESC);
CREATE INDEX audit_logs_actor_idx    ON audit_logs (actor_id, created_at DESC);
CREATE INDEX audit_logs_created_idx  ON audit_logs (created_at DESC);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_logs_user_read" ON audit_logs
  FOR SELECT USING (auth.uid() = actor_id);
