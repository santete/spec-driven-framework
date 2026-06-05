---
description: "Rich pipeline dashboard — per-station checklist with details (PRD §18.5)"
---

# /dashboard

Show detailed pipeline dashboard with per-station checklists.

```bash
npx tsx src/keystone/cli/dashboard.ts
```

Shows for each station:
- S0: IQ1-IQ8 + SR1-SR9 checklist
- S1: nodes, edges, cycles
- S2: trace entries created/updated
- S3: lint violations, ADR, semver
- S4: classification, changes, affected IDs
- S5: SDDs generated, approval status
- S6: implementation + test files, provenance, ownership
- S7: G5-G8 gate results
- S8: pre-commit gates, commit SHA, verdict
