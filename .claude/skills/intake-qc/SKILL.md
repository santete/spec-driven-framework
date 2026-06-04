---
name: intake-qc
description: S0 Intake QC — kiểm tra nguyên liệu spec đạt chuẩn (SR1–SR9 + IQ1–IQ8) trước khi pipeline đi tiếp. PRD §9.0.
---

# Skill: intake-qc (S0)

## Trách nhiệm

Trạm đầu tiên của dây chuyền 9 trạm. Đảm bảo nguyên liệu spec đạt chuẩn (PRD §9.0). Rớt cổng G0 → trả Customer kèm `intake-report.json` (§10.5), pipeline pause.

## Khi nào kích hoạt

- Tự động ở đầu mỗi `/spec-change` run (M3 sẽ wire vào state machine).
- Thủ công qua slash command `/keystone:S0` (xem `.claude/commands/keystone-S0.md`).

## Cách thực thi

Toàn bộ logic là **deterministic TS code** (không LLM-driven ở Phase 0):

```bash
npx tsx src/keystone/cli/s0.ts [--dry-run] [--json]
```

Source: `src/keystone/intake/runner.ts` + `src/keystone/lint/runner.ts`.

## Phạm vi M2 hiện tại

| Rule | Hiện thực | Ghi chú |
|---|---|---|
| SR1 unique ID | ✅ | |
| SR2 ID immutable | ⏸ M3+ (cần baseline) | |
| SR3 no orphan refs | ✅ | |
| SR4 schema valid | ✅ | Ajv 8 + JSON Schema 2020-12 |
| SR5 OpenAPI ref | ⏸ M4 | Khi có spec API/SCHEMA đầu tiên |
| SR6 must has AC | ✅ | |
| SR7–SR9 evolution | ⏸ M3+ | Cần history |
| IQ1 completeness | ✅ | REQ/FEAT/ENT/API/SDD |
| IQ2 clarity | ✅ | G/W/T + token TBD/TODO/??? |
| IQ3 feasibility | 🟡 partial | Chỉ resolve depends_on; invariant/NFR contradiction → M3+ |
| IQ4 resolvability | ✅ | ID refs |
| IQ5 semver consistency | ⏸ M4 | Cần semantic-diff |
| IQ6 NFR measurability | ✅ | |
| IQ7 project compat | 🟡 partial | HTTP method; ORM/validation compat → M4 |
| IQ8 PROJECT present | ✅ | SR10 + SR20 |

## Cưỡng chế hooks

`PreToolUse` hook chặn Write/Edit vào `src/generated/`, `tests/generated/`, `tests/adversarial/`, runtime state `.keystone/*`, generated trace files. Logic ở `.claude/hooks/pre-tool-use.ts`, test fixture HR1 ở `.claude/hooks/__tests__/`.

## Liên kết

- PRD §9.0 — FR-INTAKE-01..07
- PRD §10.5 — intake report schema
- PRD §10.8 — feedback template (M3 sẽ áp dụng `PROJECT.feedback_style`)
- PRD §7.5.2 S0 — EQC-S0 / XQC-S0
