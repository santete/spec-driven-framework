# Keystone

**Spec is the source of truth. Code is derived.**

Keystone is a governed software production pipeline built on [Claude Code](https://claude.ai/claude-code). You write specs — structured Markdown with YAML frontmatter — and the pipeline generates production-grade code with full observability, tests, design documents, and atomic commits. Every artifact traces back to the spec that created it.

```
/init → /brd-intake → /spec-change (S0→S8) → Production Code + Tests + Commit
```

## Why Keystone?

In traditional development, docs and code diverge after the first commit. Keystone inverts this:

| Traditional | Keystone |
|---|---|
| Docs describe intent, code describes reality | Spec **is** reality, code is derived |
| "What does this code implement?" → read everything | Bi-directional traceability per spec ID |
| Change a requirement → manually find affected code | Semantic diff → automatic impact analysis |
| PM writes doc, engineer interprets → drift | PM writes spec, pipeline generates → no drift |
| AI generates code with no governance | 10 quality gates must pass before any commit |
| Observability bolted on later | Tracing, logging, metrics built into every generated file |

## Features at a Glance

- **9-station governed pipeline** with 10 quality gates (G0-G9)
- **BRD-to-code**: PO writes plain Markdown → pipeline generates production code
- **5 tech stacks**: TypeScript, Python, .NET 8, Go, Java Spring
- **Production-grade observability**: OpenTelemetry tracing, structured logging, Prometheus metrics
- **Full traceability**: every file links back to the spec that created it
- **Semantic diff**: field-level change detection with additive/breaking/cosmetic classification
- **LLM-governed**: Claude generates code, deterministic CLI validates everything
- **Anti-hallucination**: provenance headers, schema validation, drift detection
- **Interactive dashboard**: per-station checklist showing exactly what passed/failed

## How It Works

### Step 1: Initialize Project

```bash
/init --name my-api --stack web-service-ts-fastify
```

Choose from 5 production stacks:

| Stack | Language | HTTP | ORM | Test | Observability |
|-------|----------|------|-----|------|---------------|
| `web-service-ts-fastify` | TypeScript | Fastify | Drizzle | Vitest | pino + OTel + prom-client |
| `web-service-python-fastapi` | Python | FastAPI | SQLAlchemy | pytest | structlog + OTel + prometheus_client |
| `web-service-dotnet-minimal` | C# | ASP.NET | EF Core | xUnit | Serilog + OTel.NET + prometheus-net |
| `web-service-go-chi` | Go | Chi | sqlc | go test | slog + OTel Go + client_golang |
| `web-service-java-spring` | Java | Spring Boot | JPA | JUnit 5 | SLF4J + OTel agent + Micrometer |

### Step 2: Import Requirements

```bash
/brd-intake docs/brd/payment-refund.md
```

```
╔══════════════════════════════════════════════════════════════╗
║  📋 BRD INTAKE — Gate 0                                    ║
╚══════════════════════════════════════════════════════════════╝

🎯 FEATURE (1)
   ☐ FEAT-REFUND: "Payment Refund Flow"

📝 REQUIREMENT (4)
   ☐ REQ-REFUND-001 [must]: "Customer requests refund" — 3 AC
   ☐ REQ-REFUND-002 [must]: "Refund eligibility validation" — 4 AC
   ☐ REQ-REFUND-003 [must]: "Admin approve/reject" — 4 AC
   ☐ REQ-REFUND-004 [should]: "Notifications" — 2 AC

🗃️ ENTITY (1)
   ☐ ENT-REFUND-REQUEST: "RefundRequest" — 9 fields, 5 invariants

⚡ NFR (1)
   ☐ NFR-REFUND-001: "API latency" — p95 < 300ms

✅ S0 INTAKE QC: PASS
```

### Step 3: Run Pipeline

```bash
/spec-change --title "Payment refund flow"
```

9 stations execute sequentially:

```
S0  Intake QC         Validate specs (IQ1-IQ8 + SR1-SR9)        ✅
S1  Spec Graph        Build relation graph, detect cycles         ✅
S2  Traceability      Create trace index (spec → code mapping)   ✅
S3  Governance        Lint + ADR validation + semver check        ✅
S4  Impact Analysis   Semantic diff, classify changes             ✅
S5  SDD Design        LLM generates Software Design Documents    ✅
S6  Production        LLM generates code + tests + observability  ✅
S7  Verification      G5 tests + G6 trace + G7 drift + G8 cost   ✅
S8  Delivery          Pre-commit G0-G9 check + atomic commit     ✅
```

**If any gate fails, the pipeline stops.** No partial commits. No broken code in main.

### Step 4: View Dashboard

```bash
/dashboard
```

```
╔══════════════════════════════════════════════════════════════╗
║  KEYSTONE PIPELINE DASHBOARD                                ║
╚══════════════════════════════════════════════════════════════╝

✅ S0 — Intake QC (0.1s)
   ☑ Schema validation (SR4)
   ☑ Unique IDs (SR1)
   ☑ Completeness (IQ1)
   ☑ Clarity — no TBD/TODO (IQ2)
   ☑ All relations resolve (IQ4)
   ☑ PROJECT present (IQ8)

✅ S5 — SDD Design
   ☑ SDD-COMP-FEAT-AUTH → covers [FEAT-AUTH, REQ-AUTH-001]
   ☑ Observability section: logging + tracing + metrics
   ☑ All approved: yes

✅ S6 — Production
   ☑ Implementation files: 3 (service + schema + lib/observability)
   ☑ Test files: 1
   ☑ Provenance headers: all present
   ☑ Structured logging: included
   ☑ OpenTelemetry tracing: included

✅ S7 — Verification
   ☑ G5: All generated tests passed
   ☑ G6: Trace index consistent
   ☑ G7: No spec-code drift
   ☑ G8: Token cost within budget

✅ S8 — Delivery
   ☑ Commit: a66eb579
   ☑ G9: auto-pass (additive change)

🎉 Pipeline complete — all 9 stations passed.
```

## Key Differentiators

### 1. Spec-Driven, Not Prompt-Driven

Most AI coding tools are prompt-driven: "build me a login page." Keystone is **spec-driven**: you define structured requirements with acceptance criteria, entity models, and relations. The pipeline enforces quality at every step.

### 2. Production-Grade Observability (Built-in)

Every generated service includes observability from day one — not bolted on later:

| Pillar | What's generated | Standard |
|--------|-----------------|----------|
| **Logging** | Structured JSON logs with action/entity/actor/result | pino / structlog / Serilog / slog |
| **Tracing** | Span per HTTP handler, DB query, external call | OpenTelemetry + W3C Trace Context |
| **Metrics** | RED metrics (rate/error/duration) + business counters | Prometheus exposition format |
| **Health** | `/health` (liveness) + `/ready` (readiness) | Kubernetes-compatible |
| **Errors** | RFC 7807 responses with `trace_id` for correlation | Error → log → trace linkage |

PII is automatically redacted from logs (passwords, tokens, secrets).

### 3. Full Traceability

Every generated file has a provenance header:
```typescript
// @keystone-owner    REQ-AUTH-001
// @spec-version      1.2.0
// @sdd-source        SDD-COMP-FEAT-AUTH
// @generated-by      keystone@0.0.1
// @run-id            run-2026-06-05-001
```

Change a spec → the pipeline knows exactly which files to regenerate. No guessing.

### 4. 10 Quality Gates (Not YOLO)

| Gate | Station | What it checks |
|------|---------|---------------|
| G0 | S0 | Spec quality: IQ1-IQ8 + SR1-SR9 |
| G1 | S3 | Spec lint (deep structural rules) |
| G2 | S3 | ADR present for non-cosmetic changes |
| G_SDD | S5 | SDD approved with matching run ID |
| G3 | S6 | Impact report actions all resolved |
| G4 | S6 | All spec IDs have code, no stubs |
| G5 | S7 | Generated tests pass |
| G6 | S7 | Trace index + ownership consistent |
| G7 | S7 | No spec-code drift |
| G8 | S7 | Token cost within budget |
| G9 | S8 | Breaking changes require reviewer approval |

### 5. LLM as Worker, Not as Authority

Claude generates SDD designs and code, but the **CLI validates everything deterministically**:
- S5: LLM generates SDD → CLI validates schema + approval status
- S6: LLM generates code → CLI validates provenance headers + file ownership
- S7: CLI runs tests, checks trace consistency, detects drift
- S8: CLI re-verifies all gates before committing

The LLM proposes. The pipeline disposes.

### 6. BRD-to-Code Pipeline

Non-technical stakeholders write business requirements in plain Markdown. The pipeline converts them end-to-end:

```
BRD (plain Markdown)
  → /brd-intake (Gate 0: parse + validate)
    → Structured Specs (status: draft)
      → PO reviews + approves
        → /spec-change (S0→S8)
          → Code + Tests + Observability + Commit
```

No "lost in translation" between requirements and implementation.

### 7. Semantic Diff (Not Line Diff)

S4 analyzes changes at the **field level**, not line level:

- Added a new acceptance criterion → `additive`
- Removed a required field from entity → `breaking`
- Changed title/description only → `cosmetic`
- Breaking changes require ADR + reviewer approval (G2 + G9)

### 8. Anti-Hallucination

- **Provenance headers** link every file to its source spec
- **Schema validation** (Ajv) catches invalid frontmatter
- **Drift detection** (G7) catches spec-code misalignment
- **Hallucination Risk Score** (`/halluc-score`) — 7-signal composite score
- **Rework budgets** prevent infinite LLM retry loops

## Spec Format

```yaml
---
id: REQ-AUTH-001
type: requirement
title: "Email + password login"
version: 1.0.0
status: approved
priority: must
relations:
  refines: [FEAT-AUTH]
  depends_on: [ENT-USER]
acceptance_criteria:
  - id: AC-AUTH-001-01
    given: "user registered with valid email"
    when: "submit correct email + password"
    then: "return valid session token, status 200"
---
```

7 artifact types: `project` | `feature` | `requirement` | `entity` | `nfr` | `api` | `schema`

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) >= 22
- [Claude Code](https://claude.ai/claude-code) CLI

### Setup

```bash
git clone https://github.com/santete/spec-driven-framework.git
cd spec-driven-framework
npm install
```

### Your First Project

```bash
# 1. Pick your tech stack
/init --name my-api --stack web-service-ts-fastify

# 2. Import a BRD (or write specs manually)
/brd-intake docs/brd/your-feature.md

# 3. Review generated specs, change status: draft → approved

# 4. Run the pipeline
/spec-change --title "Your first feature"

# 5. View results
/dashboard
```

### Bootstrap Mode (No LLM)

Run the pipeline with template-based generation for testing:

```bash
KEYSTONE_BOOTSTRAP=1 npx tsx src/keystone/cli/spec-change.ts --title "test" --dry-run
```

### Run Tests

```bash
npm test              # vitest run (136 tests)
npm run typecheck     # tsc --noEmit
```

## Architecture

```
specs/                           # Input: structured spec artifacts
  project.md                     #   Stack profile + observability config
  auth/                          #   Domain: authentication
    FEAT-AUTH.md                 #     Feature definition
    REQ-AUTH-001.md              #     Requirement + acceptance criteria
    ENT-USER.md                  #     Entity (data model + invariants)
  order/                         #   Domain: orders
  ...

src/keystone/                    # Framework engine
  cli/                           #   CLI: init, spec-change, brd-intake, dashboard, ...
  intake/                        #   S0: 8 intake checks (IQ1-IQ8)
  lint/                          #   4 lint rules (SR1, SR3, SR4, SR6)
  orchestrator/                  #   State machine + runner + store
  spec/                          #   Spec loader + JSON Schema validator
  stations/                      #   S1-S8 handlers (9 station implementations)

.claude/
  agents/                        #   LLM subagent prompts
    sdd-designer.md              #     S5: generates SDD with observability section
    keystone-implementer.md      #     S6: generates code with logging/tracing/metrics
    keystone-test-author.md      #     S6: generates tests from acceptance criteria
    brd-parser.md                #     Gate 0: parses BRD → spec artifacts
    md-to-spec.md                #     Prose → structured spec converter
  commands/                      #   Slash commands
  hooks/                         #   Pre/post tool hooks + metrics

.trace/                          #   Traceability index (spec → code → test)
specs/spec-schema.json           #   JSON Schema 2020-12 for spec validation
```

## Validated Results

| Metric | Result |
|--------|--------|
| Pipeline stability | 50 consecutive additive changes, 0 failures |
| Auto-commit success rate (M2) | 100% |
| Spec-code drift | 0 incidents |
| Quality gates | G0-G9 all pass on every run |
| Test coverage | 136 tests across 18 files |
| Stacks supported | 5 (TypeScript, Python, .NET, Go, Java) |
| Hallucination Risk Score | 0.15 (GREEN) |

## Commands

| Command | Description |
|---------|-------------|
| `/init` | Setup wizard — pick tech stack, generate PROJECT |
| `/brd-intake <file>` | Gate 0 — convert BRD → structured specs |
| `/spec-change --title "..."` | Run 9-station pipeline (S0→S8) |
| `/dashboard` | Rich per-station checklist view |
| `/md2spec <file>` | Convert prose Markdown → spec |
| `/keystone:status` | Pipeline run status |
| `/keystone:resume` | Resume blocked pipeline |
| `/keystone:abort` | Abort current run |
| `/halluc-score` | 7-signal hallucination risk assessment |
| `/metrics` | Framework health metrics (9 metrics, 7-day window) |
| `/verify` | Run full verification pipeline |

## Contributing

Keystone is open source. Contributions welcome.

1. Fork the repo
2. Create a feature branch
3. Write specs first (in `specs/`), then implement
4. Run `npm test` and `npm run typecheck`
5. Submit a PR

## License

MIT
