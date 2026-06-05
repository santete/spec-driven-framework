---
id: SDD-COMP-FEAT-HEALTH
type: sdd
title: "Component design for FEAT-HEALTH"
version: 1.0.0
status: approved
derived_from:
  spec_ids: [FEAT-HEALTH, REQ-HEALTH-001]
components:
  - name: HealthService
    layer: service
    module: src/generated/health/services/
    responsibilities:
      - "Check database connectivity via Drizzle query"
      - "Compute process uptime in milliseconds"
      - "Read application version from package.json"
      - "Return structured health status (ok or degraded)"
    depends: []
    ownership_id: REQ-HEALTH-001
  - name: HealthController
    layer: controller
    module: src/generated/health/controllers/
    responsibilities:
      - "Register GET /health route on Fastify instance"
      - "Call HealthService and map result to HTTP response"
      - "Return HTTP 200 for ok status (AC-HEALTH-001-01)"
      - "Return HTTP 503 for degraded status (AC-HEALTH-001-02)"
    depends: [HealthService]
    ownership_id: REQ-HEALTH-001
  - name: HealthSchema
    layer: service
    module: src/generated/health/schemas/
    responsibilities:
      - "Define Zod schema for health response (ok variant)"
      - "Define Zod schema for health response (degraded variant)"
      - "Export inferred TypeScript types"
    depends: []
    ownership_id: REQ-HEALTH-001
risks:
  - "DB connectivity check adds latency to health endpoint; monitoring tools polling at high frequency could create unnecessary DB load"
  - "If Drizzle connection pool is exhausted, health check itself may hang rather than returning degraded status promptly"
customer_approval:
  approved_by: auto
  approval_run_id: "run-2026-06-05-120340"
  approved_at: "2026-06-05T12:03:40Z"
---

# SDD-COMP-FEAT-HEALTH -- Component Design for Health Check

## 1. Architecture overview

The health check feature consists of three components following the feature-folder layout defined in `specs/project.md#codegen_conventions.module_layout`:

```
src/generated/health/
  controllers/   -- HealthController (Fastify route)
  services/      -- HealthService (business logic)
  schemas/       -- HealthSchema (Zod validation)
```

**HealthController** registers `GET /health` on the Fastify instance. It delegates to **HealthService** which performs a lightweight DB connectivity check (a simple `SELECT 1` via Drizzle) and gathers uptime/version metadata. **HealthSchema** defines Zod schemas for both response variants, providing runtime validation and TypeScript type inference.

No authentication is required on this endpoint -- it is intended for load balancers and monitoring tools.

## 2. Data flow

### 2.1 Happy path (AC-HEALTH-001-01)

```
Client --> GET /health
  --> HealthController.handle()
    --> HealthService.check()
      --> Drizzle: SELECT 1  (verify DB connectivity)
      --> process.uptime() * 1000  (uptime_ms)
      --> read version from package.json
      --> return { status: 'ok', uptime_ms, version }
    --> HTTP 200, body: { status: 'ok', uptime_ms: number, version: string }
```

### 2.2 Degraded path (AC-HEALTH-001-02)

```
Client --> GET /health
  --> HealthController.handle()
    --> HealthService.check()
      --> Drizzle: SELECT 1  --> throws/times out
      --> catch error
      --> return { status: 'degraded', error: error.message }
    --> HTTP 503, body: { status: 'degraded', error: string }
```

## 3. Component details

### 3.1 HealthSchema

Defines two Zod schemas:

- **HealthOkSchema**: `{ status: z.literal('ok'), uptime_ms: z.number(), version: z.string() }`
- **HealthDegradedSchema**: `{ status: z.literal('degraded'), error: z.string() }`
- **HealthResponseSchema**: `z.discriminatedUnion('status', [HealthOkSchema, HealthDegradedSchema])`

Exports inferred types: `HealthOkResponse`, `HealthDegradedResponse`, `HealthResponse`.

### 3.2 HealthService

Single method: `check(): Promise<HealthResponse>`

Logic:
1. Try executing `SELECT 1` via the Drizzle `db` instance (imported from shared DB module).
2. On success: return `{ status: 'ok', uptime_ms: Math.floor(process.uptime() * 1000), version }` where `version` is read from `package.json`.
3. On failure (any exception from DB call): return `{ status: 'degraded', error: <error message string> }`.

The DB check should have a reasonable timeout (e.g., 3 seconds) to avoid hanging when the database is unresponsive. This timeout can be enforced via `AbortSignal.timeout()` or a `Promise.race` pattern.

### 3.3 HealthController

Registers a single Fastify route:

- **Method**: GET
- **Path**: `/health`
- **Auth**: none
- **Handler**: calls `HealthService.check()`, then:
  - If `result.status === 'ok'` --> reply with HTTP 200 and JSON body
  - If `result.status === 'degraded'` --> reply with HTTP 503 and JSON body

The response schema should be registered with Fastify's schema validation using the Zod schemas (via `zod-to-json-schema` or Fastify's native Zod support per stack conventions).

## 4. Acceptance criteria mapping

| AC ID             | Component          | Behavior                                                         |
|-------------------|--------------------|------------------------------------------------------------------|
| AC-HEALTH-001-01  | HealthService      | DB query succeeds --> returns `{ status: 'ok', uptime_ms, version }` |
| AC-HEALTH-001-01  | HealthController   | Maps ok result to HTTP 200 JSON response                         |
| AC-HEALTH-001-02  | HealthService      | DB query fails --> catches error, returns `{ status: 'degraded', error }` |
| AC-HEALTH-001-02  | HealthController   | Maps degraded result to HTTP 503 JSON response                   |

## 5. Error handling

| Scenario                  | HTTP Status | Response body                              |
|---------------------------|-------------|---------------------------------------------|
| All systems operational   | 200         | `{ status: "ok", uptime_ms: N, version: "X.Y.Z" }` |
| DB unreachable / timeout  | 503         | `{ status: "degraded", error: "<message>" }` |

Note: The health endpoint does NOT use the RFC 7807 error format (`specs/project.md#codegen_conventions.error_format`) because health responses have their own schema defined by the acceptance criteria. RFC 7807 applies to application-level errors on business endpoints.

## 6. Open questions

- (none)
