# ─────────────────────────────────────────────────────────────────
# PDMS Home-Spital — Frontend (Next.js) Multi-Stage Dockerfile
# Build-Kontext: Monorepo-Root (pdms-home-spital/)
# Stages: deps → build → production
# Ziel: Standalone-Output, minimales Image, Non-Root
#
# Build: docker build -t pdms-web:prod -f frontend/Dockerfile .
# ─────────────────────────────────────────────────────────────────

# ═══ Stage 1: Dependencies ═══════════════════════════════════════
FROM node:22-alpine AS deps

RUN corepack enable
WORKDIR /app

# Nur Frontend-Lockfile + Package-Manifest kopieren (Docker-Cache)
COPY frontend/package.json frontend/pnpm-lock.yaml* ./

# Shared-Types Package (Monorepo-Dependency)
COPY packages/ ./packages/

RUN pnpm install --frozen-lockfile || pnpm install

# Shared-Types Symlink
RUN mkdir -p /app/node_modules/@pdms && \
    ln -sf /app/packages/shared-types /app/node_modules/@pdms/shared-types

# ═══ Stage 2: Build ══════════════════════════════════════════════
FROM node:22-alpine AS build

RUN corepack enable
WORKDIR /app

# Dependencies aus Stage 1
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages

# Symlink wiederherstellen (weg nach COPY)
RUN mkdir -p /app/node_modules/@pdms && \
    ln -sf /app/packages/shared-types /app/node_modules/@pdms/shared-types

# Frontend-Quellcode kopieren
COPY frontend/ ./

# Next.js Standalone Build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npx next build

# ═══ Stage 3: Production ═════════════════════════════════════════
FROM node:22-alpine AS production

# Labels (OCI-Standard)
LABEL org.opencontainers.image.title="PDMS Web" \
    org.opencontainers.image.description="PDMS Home-Spital Next.js Frontend" \
    org.opencontainers.image.vendor="PDMS Home-Spital" \
    org.opencontainers.image.version="0.1.0"

WORKDIR /app

# Non-Root User (IEC 62304 / nDSG Compliance)
RUN addgroup --system --gid 1001 pdms && \
    adduser --system --uid 1001 --ingroup pdms pdms

# Standalone-Output aus Build-Stage kopieren
COPY --from=build --chown=pdms:pdms /app/.next/standalone ./
COPY --from=build --chown=pdms:pdms /app/.next/static ./.next/static
COPY --from=build --chown=pdms:pdms /app/public ./public

# Umgebungsvariablen
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Als Non-Root ausführen
USER pdms

EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget -qO- http://localhost:3000/ || exit 1

# Next.js Standalone Server starten
CMD ["node", "server.js"]
