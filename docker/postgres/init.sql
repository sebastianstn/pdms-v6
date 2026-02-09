-- PostgreSQL Init Script
-- Wird beim ersten Start automatisch ausgeführt

-- 1. Keycloak-Datenbank
CREATE DATABASE keycloak;

-- 2. Extensions für PDMS
\c pdms;
CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS pgaudit;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 3. pgAudit Konfiguration
ALTER SYSTEM SET pgaudit.log = 'write, ddl';
ALTER SYSTEM SET pgaudit.log_catalog = 'off';
ALTER SYSTEM SET pgaudit.log_parameter = 'on';
SELECT pg_reload_conf();

-- Hinweis: TimescaleDB Hypertable wird nach Alembic Migration erstellt
-- SELECT create_hypertable('vital_sign', 'recorded_at');
