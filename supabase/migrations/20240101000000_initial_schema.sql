-- Migration: initial_schema
-- Creates all core tables, indexes, RLS policies, and triggers.
-- Rollback: DROP TABLE job_files, jobs, transformations, mappings, schemas, uploads, projects, users CASCADE;

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "moddatetime";

-- Reference full schema in supabase/schema.sql
-- TODO: Copy table DDL here from schema.sql when executing against Supabase
