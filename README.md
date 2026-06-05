# Keystone

**Spec is the source of truth. Code is derived.**

Keystone is a governed software production pipeline built on [Claude Code](https://claude.ai/claude-code). You write specs — structured Markdown with YAML frontmatter — and the pipeline generates code, tests, design documents, and atomic commits. Every artifact traces back to the spec that created it.

```
BRD (PO writes) → Gate 0 → Specs → S0→S8 Pipeline → Code + Tests + Commit
```

## Why Keystone?

In traditional development, docs and code diverge after the first commit. Keystone inverts this:

| Traditional | Keystone |
|---|---|
| Docs describe intent, code describes reality | Spec **is** reality, code is derived |
| "What does this code implement?" → read everything | Bi-directional traceability per spec ID |
| Change a requirement → manually find affected code | Semantic diff → automatic impact analysis |
| PM writes doc, engineer interprets → drift | PM writes spec, pipeline generates → no drift |

## How It Works

### 9-Station Production Pipeline

Every spec change flows through 9 sequential stations, each with entry/exit quality gates:

```
S0  Intake QC         Validate specs (IQ1-IQ8 + SR1-SR9)
S1  Spec Graph        Build relation graph, detect cycles
S2  Traceability      Create/update trace index (spec → code mapping)
S3  Governance        Lint + ADR validation + semver check
S4  Impact Analysis   Semantic diff, classify: additive/breaking/cosmetic
S5  SDD Design        Generate Software Design Documents (LLM)
S6  Production        Generate code + tests from SDDs (LLM)
S7  Verification      Gate G5 (tests pass) + G6 (trace) + G7 (no drift) + G8 (cost)
S8  Delivery          Pre-commit G0-G9 check + atomic git commit
```

**If any gate fails, the pipeline stops.** No partial commits. No broken code in main.

### BRD Intake (Gate 0)

POs write Business Requirements Documents in plain Markdown. The `/brd-intake` command converts them into structured specs:

```bash
/brd-intake docs/brd/payment-refund.md
```

Output:
```
📋 BRD INTAKE — Gate 0

🎯 FEATURE (1)
   ☐ FEAT-REFUND: "Payment Refund Flow"

📝 REQUIREMENT (4)
   ☐ REQ-REFUND-001 [must]: "Customer requests refund" — 3 AC
   ☐ REQ-REFUND-002 [must]: "Refund eligibility validation" — 4 AC

🗃️ ENTITY (1)
   ☐ ENT-REFUND-REQUEST: "RefundRequest" — 9 fields, 5 invariants

✅ S0 INTAKE QC: PASS
```

### Spec Format

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

7 artifact types: `project`, `feature`, `requirement`, `entity`, `nfr`, `api`, `schema`.

### Multi-Stack Support

Keystone generates code for multiple stacks based on your `PROJECT` profile:

| Profile | Status |
|---|---|
| `web-service-ts-fastify` | TypeScript + Fastify + Drizzle + Zod + Vitest |
| `web-service-python-fastapi` | Python + FastAPI + SQLAlchemy + Pydantic + pytest |

### Dashboard

```bash
/dashboard
```

```
✅ S0 — Intake QC (0.1s)
   ☑ Schema validation (SR4)
   ☑ Unique IDs (SR1)
   ☑ Completeness (IQ1)
   ...

✅ S5 — SDD Design
   ☑ SDD-COMP-FEAT-AUTH → covers [FEAT-AUTH, REQ-AUTH-001]
   ☑ All approved: yes

✅ S6 — Production
   ☑ Implementation files: 2
   ☑ Test files: 1
   ☑ Provenance headers: all present

✅ S7 — Verification
   ☑ G5: All generated tests passed
   ☑ G6: Trace consistent
   ☑ G7: No drift
   ☑ G8: Cost OK

🎉 Pipeline complete — all 9 stations passed.
```

## Key Differentiators

### 1. Spec-Driven, Not Prompt-Driven

Most AI coding tools are prompt-driven: "build me a login page." Keystone is **spec-driven**: you define structured requirements with acceptance criteria, entity models, and relations. The pipeline enforces quality at every step.

### 2. Full Traceability

Every generated file has a provenance header:
```typescript
// @keystone-owner    REQ-AUTH-001
// @spec-version      1.2.0
// @sdd-source        SDD-COMP-FEAT-AUTH
// @generated-by      keystone@0.0.1
// @run-id            run-2026-06-05-001
```

Every file traces back to the spec ID that created it. Change the spec → the pipeline knows exactly which code to regenerate.

### 3. Governed Pipeline (Not YOLO)

- **10 quality gates** (G0-G9) that must all pass before any commit
- **Rework budgets** (K_self per station, K_global per run) prevent infinite loops
- **Semantic diff** classifies changes as additive/breaking/cosmetic
- **Breaking changes** require reviewer approval (G9)
- **Drift detection** catches spec-code misalignment

### 4. LLM as Worker, Not as Authority

The LLM (Claude) generates SDD designs and code, but the **CLI validates everything deterministically**:
- S5: LLM generates SDD → CLI validates schema + approval
- S6: LLM generates code → CLI validates provenance + ownership
- S7: CLI runs tests, checks trace consistency, detects drift
- S8: CLI verifies all gates before committing

The LLM proposes. The pipeline disposes.

### 5. BRD-to-Code Pipeline

Non-technical stakeholders (PMs, BAs) write business requirements in plain Markdown. The pipeline converts them end-to-end:

```
BRD (plain Markdown) → /brd-intake → Structured Specs → /spec-change → Code + Tests + Commit
```

No "lost in translation" between requirements and implementation.

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

### Run the Pipeline

```bash
# 1. Check all specs pass intake QC
npx tsx src/keystone/cli/s0.ts

# 2. Run full pipeline (bootstrap mode — no LLM, template-based)
KEYSTONE_BOOTSTRAP=1 npx tsx src/keystone/cli/spec-change.ts --title "Initial setup" --dry-run

# 3. Run full pipeline with LLM (inside Claude Code session)
/spec-change --title "Add login flow"

# 4. View dashboard
/dashboard

# 5. Convert a BRD into specs
/brd-intake docs/brd/your-feature.md
```

### Run Tests

```bash
npm test              # vitest run
npm run typecheck     # tsc --noEmit
```

## Architecture

```
specs/                        # Input: structured spec artifacts
  project.md                  # Stack profile (1 per repo)
  auth/
    FEAT-AUTH.md              # Feature
    REQ-AUTH-001.md           # Requirement + acceptance criteria
    ENT-USER.md              # Entity (data model)
  ...

src/keystone/                 # Framework source
  cli/                        # CLI entry points
  intake/                     # S0: Intake QC checks (IQ1-IQ8)
  lint/                       # Spec lint rules (SR1-SR9)
  orchestrator/               # State machine + runner
  spec/                       # Spec loader + validator
  stations/                   # S1-S8 station handlers

.claude/
  agents/                     # Subagent prompts (sdd-designer, implementer, etc.)
  commands/                   # Slash commands (/spec-change, /brd-intake, etc.)
  hooks/                      # Pre/post tool hooks

.trace/                       # Traceability (spec → code mapping)
specs/spec-schema.json        # JSON Schema for spec validation
```

## Validated Results

| Metric | Result |
|--------|--------|
| Pipeline stability | 50 consecutive additive changes, 0 failures |
| Auto-commit success rate (M2) | 100% |
| Spec-code drift | 0 incidents |
| Quality gates | G0-G9 all pass on every run |
| Test coverage | 136 tests across 18 files |
| Stacks supported | TypeScript + Python |

## Commands

| Command | Description |
|---------|-------------|
| `/brd-intake <file>` | Convert BRD → structured specs (Gate 0) |
| `/spec-change --title "..."` | Run 9-station pipeline (S0→S8) |
| `/dashboard` | Rich per-station checklist view |
| `/md2spec <file>` | Convert prose Markdown → spec |
| `/keystone:status` | Pipeline status |
| `/keystone:resume` | Resume blocked pipeline |
| `/keystone:abort` | Abort current run |
| `/halluc-score` | Hallucination risk assessment |
| `/metrics` | Framework health metrics |

## Contributing

Keystone is open source. Contributions welcome.

1. Fork the repo
2. Create a feature branch
3. Write specs first (in `specs/`), then implement
4. Run `npm test` and `npm run typecheck`
5. Submit a PR

## License

MIT
