import { useState } from "react";

// ─── DOCKER COMPOSE DATA ────────────────────────────

const COMPOSE_VERSION = "3.9";

const SERVICES = [
  {
    id: "postgres",
    name: "postgres",
    label: "PostgreSQL 16 + TimescaleDB",
    icon: "🗄️",
    color: "cyan",
    image: "timescale/timescaledb:latest-pg16",
    ports: ["5432:5432"],
    desc: "Primäre Datenbank mit TimescaleDB für Vitaldaten-Zeitreihen und pgAudit für Compliance-Logging.",
    category: "Datenbank",
    env: [
      { key: "POSTGRES_DB", value: "pdms", desc: "Datenbankname" },
      { key: "POSTGRES_USER", value: "pdms_user", desc: "Datenbank-Benutzer" },
      { key: "POSTGRES_PASSWORD", value: "${POSTGRES_PASSWORD:-pdms_secret_2026}", desc: "Passwort (aus .env)" },
      { key: "POSTGRES_INITDB_ARGS", value: "--auth-host=scram-sha-256", desc: "Sichere Auth-Methode" },
    ],
    volumes: [
      { host: "pgdata", container: "/var/lib/postgresql/data", desc: "Persistente Daten" },
      { host: "./postgres/init.sql", container: "/docker-entrypoint-initdb.d/01-init.sql", desc: "Extensions + Schema Setup" },
    ],
    healthcheck: {
      test: 'pg_isready -U pdms_user -d pdms',
      interval: "10s",
      timeout: "5s",
      retries: 5,
    },
    networks: ["pdms-net"],
    depends_on: [],
    notes: "TimescaleDB Extension wird via init.sql aktiviert. pgAudit ebenfalls.",
  },
  {
    id: "keycloak",
    name: "keycloak",
    label: "Keycloak 24",
    icon: "🔐",
    color: "red",
    image: "quay.io/keycloak/keycloak:24.0",
    ports: ["8080:8080"],
    desc: "Identity & Access Management — OAuth 2.0 + PKCE, MFA (TOTP), 3 Realm-Rollen, JWT mit Custom Claims.",
    category: "Auth",
    command: "start-dev --import-realm",
    env: [
      { key: "KC_DB", value: "postgres", desc: "PostgreSQL als Backend" },
      { key: "KC_DB_URL", value: "jdbc:postgresql://postgres:5432/keycloak", desc: "DB-Verbindung" },
      { key: "KC_DB_USERNAME", value: "pdms_user", desc: "DB-Benutzer" },
      { key: "KC_DB_PASSWORD", value: "${POSTGRES_PASSWORD:-pdms_secret_2026}", desc: "DB-Passwort" },
      { key: "KC_HOSTNAME", value: "localhost", desc: "Hostname für Tokens" },
      { key: "KC_HOSTNAME_PORT", value: "8080", desc: "Port" },
      { key: "KC_HTTP_ENABLED", value: "true", desc: "HTTP für Dev" },
      { key: "KC_HEALTH_ENABLED", value: "true", desc: "Health Endpoint" },
      { key: "KEYCLOAK_ADMIN", value: "admin", desc: "Admin-Benutzer" },
      { key: "KEYCLOAK_ADMIN_PASSWORD", value: "${KC_ADMIN_PASSWORD:-admin}", desc: "Admin-Passwort" },
    ],
    volumes: [
      { host: "./keycloak/realm-export.json", container: "/opt/keycloak/data/import/pdms-realm.json", desc: "Realm: 3 Rollen, 2 Clients, MFA" },
    ],
    healthcheck: {
      test: 'curl -fsS http://localhost:8080/health/ready || exit 1',
      interval: "15s",
      timeout: "5s",
      retries: 10,
      start_period: "30s",
    },
    networks: ["pdms-net"],
    depends_on: ["postgres"],
    notes: "Realm-Export enthält pdms_arzt, pdms_pflege, pdms_admin Rollen + pdms-web (public) und pdms-api (confidential) Clients.",
  },
  {
    id: "valkey",
    name: "valkey",
    label: "Valkey 9 (Redis-Fork)",
    icon: "⚡",
    color: "rose",
    image: "valkey/valkey:9-alpine",
    ports: ["6379:6379"],
    desc: "In-Memory Cache & Pub/Sub — Session-Cache, Rate-Limiting, WebSocket Pub/Sub für Echtzeit-Alarme.",
    category: "Cache",
    command: "valkey-server --save 60 1 --loglevel warning --maxmemory 128mb --maxmemory-policy allkeys-lru",
    env: [],
    volumes: [
      { host: "valkeydata", container: "/data", desc: "Persistenz (RDB Snapshots)" },
    ],
    healthcheck: {
      test: 'valkey-cli ping | grep -q PONG',
      interval: "10s",
      timeout: "3s",
      retries: 5,
    },
    networks: ["pdms-net"],
    depends_on: [],
    notes: "Valkey 9 ist der Community-Fork von Redis. 100% kompatibel mit Redis-Clients. Alpine-Image: nur ~30 MB.",
  },
  {
    id: "rabbitmq",
    name: "rabbitmq",
    label: "RabbitMQ 3.13",
    icon: "🐰",
    color: "amber",
    image: "rabbitmq:3.13-management-alpine",
    ports: ["5672:5672", "15672:15672"],
    desc: "Message Broker für Domain Events — VitalRecorded, AlarmTriggered, MedicationPrescribed. Management UI auf Port 15672.",
    category: "Messaging",
    env: [
      { key: "RABBITMQ_DEFAULT_USER", value: "pdms", desc: "Benutzer" },
      { key: "RABBITMQ_DEFAULT_PASS", value: "${RABBITMQ_PASSWORD:-pdms_rabbit_2026}", desc: "Passwort (aus .env)" },
      { key: "RABBITMQ_DEFAULT_VHOST", value: "pdms", desc: "Virtual Host" },
    ],
    volumes: [
      { host: "rabbitmqdata", container: "/var/lib/rabbitmq", desc: "Queue-Persistenz" },
    ],
    healthcheck: {
      test: 'rabbitmq-diagnostics -q check_running',
      interval: "15s",
      timeout: "10s",
      retries: 5,
      start_period: "20s",
    },
    networks: ["pdms-net"],
    depends_on: [],
    notes: "Management-Plugin (Port 15672) für Queue-Monitoring. Domain Events: vital.recorded, alarm.triggered, medication.prescribed.",
  },
  {
    id: "api",
    name: "api",
    label: "FastAPI Backend",
    icon: "🐍",
    color: "emerald",
    image: null,
    build: { context: "../apps/api", dockerfile: "Dockerfile" },
    ports: ["8000:8000"],
    desc: "REST + FHIR R4 + WebSocket API — 60 Endpoints, DDD-Architektur, Pydantic v2, SQLAlchemy 2.0.",
    category: "App",
    command: "uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload",
    env: [
      { key: "DATABASE_URL", value: "postgresql+asyncpg://pdms_user:${POSTGRES_PASSWORD:-pdms_secret_2026}@postgres:5432/pdms", desc: "Async DB-Verbindung" },
      { key: "KEYCLOAK_URL", value: "http://keycloak:8080", desc: "Keycloak (intern)" },
      { key: "KEYCLOAK_REALM", value: "pdms-home-spital", desc: "Realm-Name" },
      { key: "KEYCLOAK_CLIENT_ID", value: "pdms-api", desc: "Confidential Client" },
      { key: "KEYCLOAK_CLIENT_SECRET", value: "${KC_API_SECRET:-dev-secret}", desc: "Client Secret" },
      { key: "VALKEY_URL", value: "redis://valkey:6379/0", desc: "Valkey-Verbindung (redis:// Protokoll)" },
      { key: "RABBITMQ_URL", value: "amqp://pdms:${RABBITMQ_PASSWORD:-pdms_rabbit_2026}@rabbitmq:5672/pdms", desc: "RabbitMQ-Verbindung" },
      { key: "CORS_ORIGINS", value: '["http://localhost:3000"]', desc: "Erlaubte CORS Origins" },
      { key: "LOG_LEVEL", value: "DEBUG", desc: "Logging Level (Dev)" },
      { key: "ENVIRONMENT", value: "development", desc: "Umgebung" },
    ],
    volumes: [
      { host: "../apps/api/src", container: "/app/src", desc: "Hot-Reload (Source Code)" },
    ],
    healthcheck: {
      test: 'curl -fsS http://localhost:8000/health || exit 1',
      interval: "10s",
      timeout: "5s",
      retries: 5,
      start_period: "15s",
    },
    networks: ["pdms-net"],
    depends_on: ["postgres", "keycloak", "valkey", "rabbitmq"],
    notes: "Hot-Reload via Volume-Mount + --reload Flag. Wartet auf alle Infrastruktur-Services.",
  },
  {
    id: "web",
    name: "web",
    label: "Next.js 15 Frontend",
    icon: "⚛️",
    color: "violet",
    image: null,
    build: { context: "../apps/web", dockerfile: "Dockerfile.dev" },
    ports: ["3000:3000"],
    desc: "React 19 + Next.js 15 App Router — shadcn/ui, TanStack Query, nuqs URL-State, Tailwind CSS.",
    category: "App",
    command: "pnpm dev",
    env: [
      { key: "NEXT_PUBLIC_API_URL", value: "http://localhost:8000/api/v1", desc: "API Base URL (Browser)" },
      { key: "NEXT_PUBLIC_WS_URL", value: "ws://localhost:8000/ws", desc: "WebSocket URL (Browser)" },
      { key: "NEXT_PUBLIC_KC_URL", value: "http://localhost:8080", desc: "Keycloak URL (Browser)" },
      { key: "NEXT_PUBLIC_KC_REALM", value: "pdms-home-spital", desc: "Keycloak Realm" },
      { key: "NEXT_PUBLIC_KC_CLIENT", value: "pdms-web", desc: "Public Client (PKCE)" },
    ],
    volumes: [
      { host: "../apps/web/src", container: "/app/src", desc: "Hot-Reload (Source Code)" },
      { host: "../apps/web/public", container: "/app/public", desc: "Statische Assets" },
    ],
    healthcheck: {
      test: 'curl -fsS http://localhost:3000 || exit 1',
      interval: "10s",
      timeout: "5s",
      retries: 5,
      start_period: "20s",
    },
    networks: ["pdms-net"],
    depends_on: ["api"],
    notes: "Turbopack für schnelleren Dev-Server. NEXT_PUBLIC_ Variablen sind im Browser sichtbar.",
  },
  {
    id: "nginx",
    name: "nginx",
    label: "Nginx Reverse Proxy",
    icon: "🌐",
    color: "slate",
    image: "nginx:1.27-alpine",
    ports: ["80:80", "443:443"],
    desc: "Reverse Proxy — Routing: / → Web, /api → FastAPI, /auth → Keycloak. TLS mit mkcert (dev) / Let's Encrypt (prod).",
    category: "Proxy",
    env: [],
    volumes: [
      { host: "./nginx/nginx.conf", container: "/etc/nginx/nginx.conf:ro", desc: "Nginx Config" },
      { host: "./nginx/ssl", container: "/etc/nginx/ssl:ro", desc: "TLS-Zertifikate" },
    ],
    healthcheck: {
      test: 'curl -fsS http://localhost/health || exit 1',
      interval: "10s",
      timeout: "3s",
      retries: 5,
    },
    networks: ["pdms-net"],
    depends_on: ["web", "api", "keycloak"],
    notes: "Optional für Dev (direkt via Ports möglich). Pflicht für Staging/Prod.",
  },
];

const VOLUMES = [
  { name: "pgdata", desc: "PostgreSQL Daten (Patientendaten, Audit-Logs)", size: "~500 MB–5 GB" },
  { name: "valkeydata", desc: "Valkey RDB Snapshots (Sessions, Cache)", size: "~10–50 MB" },
  { name: "rabbitmqdata", desc: "RabbitMQ Queue-Daten (Domain Events)", size: "~10–100 MB" },
];

const NETWORKS = [
  { name: "pdms-net", driver: "bridge", desc: "Internes Netzwerk — alle Services kommunizieren hier" },
];

const INIT_SQL = `-- PostgreSQL Init Script (docker/postgres/init.sql)
-- Wird beim ersten Start automatisch ausgeführt

-- 1. Keycloak-Datenbank
CREATE DATABASE keycloak;

-- 2. Extensions für PDMS
\\c pdms;
CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS pgaudit;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- Volltextsuche

-- 3. pgAudit Konfiguration
ALTER SYSTEM SET pgaudit.log = 'write, ddl';
ALTER SYSTEM SET pgaudit.log_catalog = 'off';
ALTER SYSTEM SET pgaudit.log_parameter = 'on';
SELECT pg_reload_conf();

-- 4. TimescaleDB Hypertable (nach Alembic Migration)
-- CREATE TABLE vital_sign (...);
-- SELECT create_hypertable('vital_sign', 'time');`;

const NGINX_CONF = `# Nginx Config (docker/nginx/nginx.conf)
events { worker_connections 1024; }

http {
  upstream web    { server web:3000; }
  upstream api    { server api:8000; }
  upstream auth   { server keycloak:8080; }

  server {
    listen 80;
    server_name localhost;
    # Redirect zu HTTPS in Prod
    # return 301 https://\\$host\\$request_uri;

    # Health Check
    location /health { return 200 'ok'; }

    # Frontend (Next.js)
    location / {
      proxy_pass http://web;
      proxy_http_version 1.1;
      proxy_set_header Upgrade \\$http_upgrade;
      proxy_set_header Connection "upgrade";
    }

    # API (FastAPI)
    location /api/ {
      proxy_pass http://api;
      proxy_set_header X-Real-IP \\$remote_addr;
      proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;
    }

    # WebSocket (Vitals + Alarms)
    location /ws/ {
      proxy_pass http://api;
      proxy_http_version 1.1;
      proxy_set_header Upgrade \\$http_upgrade;
      proxy_set_header Connection "upgrade";
      proxy_read_timeout 86400;
    }

    # Keycloak (Auth)
    location /auth/ {
      proxy_pass http://auth;
      proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto \\$scheme;
    }
  }
}`;

const ENV_EXAMPLE = `# .env.example — Umgebungsvariablen für Docker Compose
# Kopiere zu .env und passe Werte an

# ─── PostgreSQL ───────────────────
POSTGRES_PASSWORD=pdms_secret_2026

# ─── Keycloak ─────────────────────
KC_ADMIN_PASSWORD=admin
KC_API_SECRET=dev-secret

# ─── RabbitMQ ─────────────────────
RABBITMQ_PASSWORD=pdms_rabbit_2026

# ─── App Settings ─────────────────
LOG_LEVEL=DEBUG
ENVIRONMENT=development`;

const DOCKER_COMPOSE_YAML = `# docker/docker-compose.yml
# PDMS Home-Spital — Development Stack
# Start: docker compose up -d

version: "${COMPOSE_VERSION}"

services:
  # ─── DATENBANK ────────────────────────
  postgres:
    image: timescale/timescaledb:latest-pg16
    container_name: pdms-postgres
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: pdms
      POSTGRES_USER: pdms_user
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD:-pdms_secret_2026}
      POSTGRES_INITDB_ARGS: "--auth-host=scram-sha-256"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./postgres/init.sql:/docker-entrypoint-initdb.d/01-init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U pdms_user -d pdms"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - pdms-net

  # ─── AUTH ─────────────────────────────
  keycloak:
    image: quay.io/keycloak/keycloak:24.0
    container_name: pdms-keycloak
    restart: unless-stopped
    command: start-dev --import-realm
    ports:
      - "8080:8080"
    environment:
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://postgres:5432/keycloak
      KC_DB_USERNAME: pdms_user
      KC_DB_PASSWORD: \${POSTGRES_PASSWORD:-pdms_secret_2026}
      KC_HOSTNAME: localhost
      KC_HOSTNAME_PORT: 8080
      KC_HTTP_ENABLED: true
      KC_HEALTH_ENABLED: true
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: \${KC_ADMIN_PASSWORD:-admin}
    volumes:
      - ./keycloak/realm-export.json:/opt/keycloak/data/import/pdms-realm.json
    healthcheck:
      test: ["CMD-SHELL", "curl -fsS http://localhost:8080/health/ready || exit 1"]
      interval: 15s
      timeout: 5s
      retries: 10
      start_period: 30s
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - pdms-net

  # ─── CACHE ───────────────────────────
  valkey:
    image: valkey/valkey:9-alpine
    container_name: pdms-valkey
    restart: unless-stopped
    command: >
      valkey-server
        --save 60 1
        --loglevel warning
        --maxmemory 128mb
        --maxmemory-policy allkeys-lru
    ports:
      - "6379:6379"
    volumes:
      - valkeydata:/data
    healthcheck:
      test: ["CMD", "valkey-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
    networks:
      - pdms-net

  # ─── MESSAGING ───────────────────────
  rabbitmq:
    image: rabbitmq:3.13-management-alpine
    container_name: pdms-rabbitmq
    restart: unless-stopped
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: pdms
      RABBITMQ_DEFAULT_PASS: \${RABBITMQ_PASSWORD:-pdms_rabbit_2026}
      RABBITMQ_DEFAULT_VHOST: pdms
    volumes:
      - rabbitmqdata:/var/lib/rabbitmq
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "-q", "check_running"]
      interval: 15s
      timeout: 10s
      retries: 5
      start_period: 20s
    networks:
      - pdms-net

  # ─── BACKEND ─────────────────────────
  api:
    build:
      context: ../apps/api
      dockerfile: Dockerfile
    container_name: pdms-api
    restart: unless-stopped
    command: >
      uvicorn src.main:app
        --host 0.0.0.0
        --port 8000
        --reload
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql+asyncpg://pdms_user:\${POSTGRES_PASSWORD:-pdms_secret_2026}@postgres:5432/pdms
      KEYCLOAK_URL: http://keycloak:8080
      KEYCLOAK_REALM: pdms-home-spital
      KEYCLOAK_CLIENT_ID: pdms-api
      KEYCLOAK_CLIENT_SECRET: \${KC_API_SECRET:-dev-secret}
      VALKEY_URL: redis://valkey:6379/0
      RABBITMQ_URL: amqp://pdms:\${RABBITMQ_PASSWORD:-pdms_rabbit_2026}@rabbitmq:5672/pdms
      CORS_ORIGINS: '["http://localhost:3000"]'
      LOG_LEVEL: DEBUG
      ENVIRONMENT: development
    volumes:
      - ../apps/api/src:/app/src
    healthcheck:
      test: ["CMD-SHELL", "curl -fsS http://localhost:8000/health || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 15s
    depends_on:
      postgres:
        condition: service_healthy
      keycloak:
        condition: service_healthy
      valkey:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    networks:
      - pdms-net

  # ─── FRONTEND ────────────────────────
  web:
    build:
      context: ../apps/web
      dockerfile: Dockerfile.dev
    container_name: pdms-web
    restart: unless-stopped
    command: pnpm dev
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000/api/v1
      NEXT_PUBLIC_WS_URL: ws://localhost:8000/ws
      NEXT_PUBLIC_KC_URL: http://localhost:8080
      NEXT_PUBLIC_KC_REALM: pdms-home-spital
      NEXT_PUBLIC_KC_CLIENT: pdms-web
    volumes:
      - ../apps/web/src:/app/src
      - ../apps/web/public:/app/public
    healthcheck:
      test: ["CMD-SHELL", "curl -fsS http://localhost:3000 || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 20s
    depends_on:
      api:
        condition: service_healthy
    networks:
      - pdms-net

  # ─── REVERSE PROXY ──────────────────
  nginx:
    image: nginx:1.27-alpine
    container_name: pdms-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    healthcheck:
      test: ["CMD-SHELL", "curl -fsS http://localhost/health || exit 1"]
      interval: 10s
      timeout: 3s
      retries: 5
    depends_on:
      - web
      - api
      - keycloak
    networks:
      - pdms-net

# ─── VOLUMES ───────────────────────────
volumes:
  pgdata:
    driver: local
  valkeydata:
    driver: local
  rabbitmqdata:
    driver: local

# ─── NETWORKS ──────────────────────────
networks:
  pdms-net:
    driver: bridge`;

// ─── HELPERS ────────────────────────────────────────

const COLOR_MAP = {
  cyan: { bg: "bg-cyan-500/10", border: "border-cyan-500/30", text: "text-cyan-400", dot: "bg-cyan-500", badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
  red: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400", dot: "bg-red-500", badge: "bg-red-500/20 text-red-300 border-red-500/30" },
  rose: { bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-400", dot: "bg-rose-500", badge: "bg-rose-500/20 text-rose-300 border-rose-500/30" },
  amber: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", dot: "bg-amber-500", badge: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", dot: "bg-emerald-500", badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  violet: { bg: "bg-violet-500/10", border: "border-violet-500/30", text: "text-violet-400", dot: "bg-violet-500", badge: "bg-violet-500/20 text-violet-300 border-violet-500/30" },
  slate: { bg: "bg-slate-500/10", border: "border-slate-500/30", text: "text-slate-400", dot: "bg-slate-500", badge: "bg-slate-500/20 text-slate-300 border-slate-500/30" },
};

// ─── COMPONENTS ─────────────────────────────────────

function ServiceCard({ service, isActive, onClick }) {
  const c = COLOR_MAP[service.color];
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border p-3 transition-all ${
        isActive ? `${c.bg} ${c.border} ring-1 ${c.border}` : "bg-slate-800/40 border-slate-700 hover:border-slate-500"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{service.icon}</span>
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-bold truncate ${isActive ? c.text : "text-slate-300"}`}>{service.label}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-slate-600">{service.category}</span>
            <span className="text-xs text-slate-700">·</span>
            <span className="text-xs text-slate-600">{service.ports?.[0]}</span>
          </div>
        </div>
        {service.depends_on.length > 0 && (
          <span className="text-xs text-slate-600 bg-slate-800 rounded px-1.5 py-0.5">{service.depends_on.length} deps</span>
        )}
      </div>
    </button>
  );
}

function ServiceDetail({ service }) {
  const [tab, setTab] = useState("overview");
  const c = COLOR_MAP[service.color];

  return (
    <div>
      {/* Header */}
      <div className={`rounded-xl ${c.bg} border ${c.border} p-4 mb-4`}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{service.icon}</span>
          <div>
            <h2 className="font-black text-white text-lg">{service.label}</h2>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <code className={c.text}>{service.image || `build: ${service.build?.context}`}</code>
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-400">{service.desc}</p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {service.ports?.map((p) => (
            <span key={p} className={`text-xs px-2 py-0.5 rounded border ${c.badge}`}>:{p.split(":")[0]}</span>
          ))}
          {service.depends_on.map((d) => (
            <span key={d} className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">→ {d}</span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-3 flex-wrap">
        {[
          { id: "overview", label: "Übersicht" },
          ...(service.env.length > 0 ? [{ id: "env", label: `Env (${service.env.length})` }] : []),
          { id: "volumes", label: `Volumes (${service.volumes?.length || 0})` },
          { id: "health", label: "Healthcheck" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tab === t.id ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "overview" && (
        <div className="space-y-3">
          <div className="rounded-lg bg-slate-800 border border-slate-700 p-3">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Container</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-slate-500">Name:</span> <code className="text-cyan-400">pdms-{service.name}</code></div>
              <div><span className="text-slate-500">Image:</span> <code className="text-emerald-400">{service.image || "Dockerfile"}</code></div>
              <div><span className="text-slate-500">Ports:</span> <code className="text-amber-400">{service.ports?.join(", ") || "—"}</code></div>
              <div><span className="text-slate-500">Network:</span> <code className="text-violet-400">pdms-net</code></div>
            </div>
            {service.command && (
              <div className="mt-2">
                <span className="text-xs text-slate-500">Command:</span>
                <code className="text-xs text-cyan-300 bg-slate-950 px-2 py-1 rounded block mt-1 overflow-x-auto">{service.command}</code>
              </div>
            )}
          </div>
          {service.notes && (
            <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-3 text-xs text-amber-300/80">
              💡 {service.notes}
            </div>
          )}
        </div>
      )}

      {tab === "env" && (
        <div className="space-y-1.5">
          {service.env.map((e, i) => (
            <div key={i} className="rounded-lg bg-slate-800 border border-slate-700 p-2.5 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <code className="text-xs font-bold text-emerald-400 min-w-48 flex-shrink-0">{e.key}</code>
              <code className="text-xs text-slate-300 flex-1 overflow-x-auto bg-slate-950 px-2 py-0.5 rounded">{e.value}</code>
              <span className="text-xs text-slate-500 flex-shrink-0">{e.desc}</span>
            </div>
          ))}
        </div>
      )}

      {tab === "volumes" && (
        <div className="space-y-1.5">
          {(service.volumes || []).map((v, i) => (
            <div key={i} className="rounded-lg bg-slate-800 border border-slate-700 p-3">
              <div className="flex items-center gap-2 text-sm">
                <code className="text-cyan-400 text-xs">{v.host}</code>
                <span className="text-slate-600">→</span>
                <code className="text-emerald-400 text-xs">{v.container}</code>
              </div>
              <p className="text-xs text-slate-500 mt-1">{v.desc}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "health" && service.healthcheck && (
        <div className="rounded-lg bg-slate-800 border border-slate-700 p-3 space-y-2">
          <div>
            <span className="text-xs text-slate-500">Test:</span>
            <code className="text-xs text-cyan-300 bg-slate-950 px-2 py-1 rounded block mt-1">{service.healthcheck.test}</code>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
            <div><span className="text-xs text-slate-500">Interval:</span> <span className="text-xs text-white">{service.healthcheck.interval}</span></div>
            <div><span className="text-xs text-slate-500">Timeout:</span> <span className="text-xs text-white">{service.healthcheck.timeout}</span></div>
            <div><span className="text-xs text-slate-500">Retries:</span> <span className="text-xs text-white">{service.healthcheck.retries}</span></div>
            {service.healthcheck.start_period && (
              <div><span className="text-xs text-slate-500">Start:</span> <span className="text-xs text-white">{service.healthcheck.start_period}</span></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ArchDiagram() {
  const layers = [
    { label: "Browser", items: ["http://localhost:80"], color: "slate" },
    { label: "Nginx Reverse Proxy", items: ["/ → :3000", "/api → :8000", "/ws → :8000", "/auth → :8080"], color: "slate" },
    { label: "Apps", items: ["Next.js 15 (:3000)", "FastAPI (:8000)"], color: "violet" },
    { label: "Infra", items: ["PostgreSQL+TimescaleDB (:5432)", "Keycloak 24 (:8080)", "Valkey 9 (:6379)", "RabbitMQ (:5672)"], color: "cyan" },
    { label: "Volumes", items: ["pgdata", "valkeydata", "rabbitmqdata"], color: "amber" },
  ];

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
      <h3 className="font-bold text-white text-sm mb-4">Architektur — Netzwerk-Topologie</h3>
      <div className="space-y-2">
        {layers.map((l, i) => {
          const c = COLOR_MAP[l.color];
          return (
            <div key={i}>
              <div className={`rounded-lg border ${c.border} ${c.bg} p-3`}>
                <div className={`text-xs font-bold ${c.text} uppercase tracking-wide mb-2`}>{l.label}</div>
                <div className="flex flex-wrap gap-2">
                  {l.items.map((item, j) => (
                    <span key={j} className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700 font-mono">{item}</span>
                  ))}
                </div>
              </div>
              {i < layers.length - 1 && (
                <div className="flex justify-center py-1">
                  <span className="text-slate-600 text-sm">↕</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-4 rounded-lg bg-slate-800 border border-slate-700 p-3">
        <div className="text-xs font-bold text-slate-500 mb-2">Docker Network: pdms-net (bridge)</div>
        <p className="text-xs text-slate-500">Alle Services kommunizieren über das interne pdms-net. Nur die definierten Ports sind nach aussen erreichbar.</p>
      </div>
    </div>
  );
}

function CodeView({ title, code, lang }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/60 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-700">
        <span className="text-sm font-bold text-white">{title}</span>
        <button
          onClick={() => { navigator.clipboard?.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="text-xs text-slate-500 hover:text-white px-2 py-1 rounded bg-slate-700"
        >
          {copied ? "✓ Kopiert" : "Kopieren"}
        </button>
      </div>
      <pre className="p-4 text-xs text-slate-300 overflow-x-auto leading-relaxed font-mono" style={{ maxHeight: "500px" }}>
        {code}
      </pre>
    </div>
  );
}

function ResourceStats() {
  const resources = [
    { name: "PostgreSQL + TimescaleDB", ram: "256 MB", cpu: "Gering", disk: "~500 MB" },
    { name: "Keycloak 24 (JVM)", ram: "512 MB", cpu: "Mittel", disk: "~200 MB" },
    { name: "Valkey 9", ram: "128 MB", cpu: "Minimal", disk: "~10 MB" },
    { name: "RabbitMQ", ram: "256 MB", cpu: "Gering", disk: "~100 MB" },
    { name: "FastAPI (Python)", ram: "128 MB", cpu: "Gering", disk: "~150 MB" },
    { name: "Next.js 15 (Node)", ram: "256 MB", cpu: "Mittel", disk: "~300 MB" },
    { name: "Nginx", ram: "16 MB", cpu: "Minimal", disk: "~20 MB" },
  ];
  const totalRam = "~1.5 GB";

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
      <h3 className="font-bold text-white text-sm mb-3">💻 Ressourcen-Verbrauch (Dev)</h3>
      <div className="space-y-1">
        {resources.map((r, i) => (
          <div key={i} className="flex items-center gap-3 text-xs py-1.5 border-b border-slate-800 last:border-0">
            <span className="text-slate-300 flex-1">{r.name}</span>
            <span className="text-cyan-400 w-16 text-right">{r.ram}</span>
            <span className="text-amber-400 w-14 text-right">{r.cpu}</span>
            <span className="text-slate-500 w-16 text-right">{r.disk}</span>
          </div>
        ))}
        <div className="flex items-center gap-3 text-xs pt-2 font-bold">
          <span className="text-white flex-1">Total</span>
          <span className="text-cyan-400 w-16 text-right">{totalRam}</span>
          <span className="text-amber-400 w-14 text-right">—</span>
          <span className="text-slate-400 w-16 text-right">~1.3 GB</span>
        </div>
      </div>
      <p className="text-xs text-slate-600 mt-2">Empfehlung: MacBook mit mind. 8 GB RAM oder Linux mit 4 GB + Swap.</p>
    </div>
  );
}

// ─── MAIN ───────────────────────────────────────────

export default function PDMSDockerCompose() {
  const [activeService, setActiveService] = useState("postgres");
  const [view, setView] = useState("services");

  const service = SERVICES.find((s) => s.id === activeService);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-950/90 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1.5 h-8 rounded-full bg-cyan-500" />
            <div>
              <h1 className="text-lg font-black text-white">PDMS Docker Compose</h1>
              <p className="text-xs text-slate-500">7 Services · Dev-Umgebung komplett · docker compose up -d</p>
            </div>
            <div className="ml-auto flex gap-1.5">
              {["7 Services", "3 Volumes", "1 Network", "~1.5 GB RAM"].map((b) => (
                <span key={b} className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-cyan-400 border border-slate-700 hidden sm:inline-block">{b}</span>
              ))}
            </div>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {[
              { id: "services", label: "Services", icon: "🐳" },
              { id: "yaml", label: "docker-compose.yml", icon: "📄" },
              { id: "init", label: "init.sql", icon: "🗄️" },
              { id: "nginx", label: "nginx.conf", icon: "🌐" },
              { id: "env", label: ".env.example", icon: "🔑" },
              { id: "arch", label: "Architektur", icon: "🏗️" },
              { id: "resources", label: "Ressourcen", icon: "💻" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setView(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  view === t.id ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                <span className="mr-1">{t.icon}</span>{t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4">
        {view === "services" && (
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="lg:w-64 flex-shrink-0 space-y-1.5">
              {SERVICES.map((s) => (
                <ServiceCard key={s.id} service={s} isActive={activeService === s.id} onClick={() => setActiveService(s.id)} />
              ))}
            </div>
            <div className="flex-1 min-w-0">
              {service && <ServiceDetail service={service} />}
            </div>
          </div>
        )}

        {view === "yaml" && <CodeView title="docker/docker-compose.yml" code={DOCKER_COMPOSE_YAML} lang="yaml" />}
        {view === "init" && <CodeView title="docker/postgres/init.sql" code={INIT_SQL} lang="sql" />}
        {view === "nginx" && <CodeView title="docker/nginx/nginx.conf" code={NGINX_CONF} lang="nginx" />}
        {view === "env" && <CodeView title=".env.example" code={ENV_EXAMPLE} lang="bash" />}
        {view === "arch" && <ArchDiagram />}
        {view === "resources" && <ResourceStats />}
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4 text-center">
        <p className="text-xs text-slate-700">PDMS Home-Spital · Docker Compose v1.0 · 7 Services · Stand Februar 2026</p>
      </div>
    </div>
  );
}
