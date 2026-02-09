# PDMS Home-Spital — Architektur

## 6-Schichten Architektur

```
┌─────────────────────────────────┐
│ 1. Presentation Layer           │  Next.js 15 · React 19 · shadcn/ui
├─────────────────────────────────┤
│ 2. API Gateway                  │  Nginx Reverse Proxy
├─────────────────────────────────┤
│ 3. Application Layer            │  FastAPI Router · JWT Auth · RBAC
├─────────────────────────────────┤
│ 4. Domain Layer                 │  Services · Business-Logik · Events
├─────────────────────────────────┤
│ 5. Infrastructure Layer         │  SQLAlchemy · Keycloak · RabbitMQ
├─────────────────────────────────┤
│ 6. Data Layer                   │  PostgreSQL · TimescaleDB · Valkey
└─────────────────────────────────┘
```

## Kommunikation

- **Frontend → Backend**: REST API (TanStack Query + fetch)
- **Realtime**: WebSocket (Vitals + Alarms)
- **Async Events**: RabbitMQ (Domain Events)
- **Caching**: Valkey (Session, Rate-Limit)
- **Auth**: Keycloak OIDC (JWT, PKCE, RBAC)

## Datenfluss: Vitaldaten

```
Gerät/Eingabe → POST /api/v1/vitals
              → VitalService.record()
              → INSERT vital_signs (TimescaleDB)
              → AlarmService.check_thresholds()
              → RabbitMQ: VitalRecorded
              → WebSocket: Push an Frontend
```
