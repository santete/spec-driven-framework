# Keystone Framework — Hiến pháp

> **Spec là nguồn sự thật duy nhất. Code là artifact dẫn xuất.**
> Mọi thay đổi đều có thể truy nguyên, có version, có phân tích tác động, và được kiểm chứng tự động trước khi commit.

## Nguồn sự thật

- **Tài liệu PRD đầy đủ:** [`product-spec/PRD-Keystone.md`](./product-spec/PRD-Keystone.md) (v0.8.1, 1948 dòng). Mọi quyết định kiến trúc, schema, governance đều ở đây.
- **Spec artifacts** ở `specs/`.
- **Code dẫn xuất** ở `src/generated/`. **Test dẫn xuất** ở `tests/generated/` và `tests/adversarial/`.
- **Runtime state** ở `.keystone/` — do máy sinh, cấm sửa tay.
- **Trace index** ở `.trace/index.json` + ownership ở `.trace/ownership.yaml`.

## Nguyên tắc bất biến

1. **Mọi thay đổi spec đi qua `/spec-change`** (skill orchestrator §7.3 PRD). Không có đường merge khác.
2. **Không sửa tay file trong `src/generated/`, `tests/generated/`, `tests/adversarial/`, `.trace/`, `.keystone/` (runtime).** Hook `PreToolUse` (Phase 0 M2) sẽ enforce.
3. **ID ổn định** theo grammar §8.1: `<TYPE>-<DOMAIN>[-<NNN>]`. ID không tái dùng, không xóa — chỉ deprecate / supersede / retire.
4. **Trace index do máy sinh.** Cấm merge thủ công; conflict → regenerate từ git state + ownership manifest.
5. **Auto-commit chỉ xảy ra khi G0–G9 đều xanh** (§12 PRD). `breaking` → cần reviewer approval (G9, mặc định ON).

## 9 trạm sản xuất (S0–S8)

| # | Trạm | Output gate |
|---|---|---|
| S0 | Intake QC | G0 — IQ1–IQ8 + SR1–SR9 |
| S1 | Spec | (no gate, build SpecGraph) |
| S2 | Traceability | (consistency check) |
| S3 | Governance | G1 lint + G2 ADR |
| S4 | Impact | impact report |
| S5 | SDD Design | G_SDD — customer approve |
| S6 | Production | G3 impact resolved + G4 codegen complete |
| S7 | Verification | G5 tests + G6 trace + G7 no-drift + G8 cost |
| S8 | Delivery | G9 breaking review + atomic commit |

## Phase hiện tại

**Phase 0 — Scaffold.** Mục tiêu: pipeline E2E chạy 1 spec mẫu (`REQ-AUTH-001`), G0–G9 xanh, auto-commit thành công. Chi tiết: PRD §15.1.

### Milestone Phase 0

- **M1 — Foundation:** package.json, tsconfig, spec-schema, sample specs, Vitest sanity. *← hiện tại*
- **M2 — Static stations (S0–S3):** spec-lint, intake-qc, trace, ownership, hooks PreToolUse/PostToolUse + Vitest fixture.
- **M3 — Orchestrator + dashboard:** `/spec-change` state machine, `/keystone:status`, resume/abort.
- **M4 — LLM stations + auto-commit:** semantic-diff, sdd-designer/review, codegen, adversarial-test, pre-commit G0–G9, 1 spec change → auto-commit (S5 customer touchpoint auto-approve trong test mode).

## Workflow entrypoint (sẽ ship ở M3/M4)

- Skill orchestrator: `/spec-change`
- Dashboard: `/keystone:status`
- Customer touchpoint: `/keystone:S0:*`, `/keystone:S5:*` (§18.5 PRD)

## Cưỡng chế

Instructions trong file này chỉ tuân theo ~80%. Mọi ràng buộc **cứng** (chặn sửa code dẫn xuất, chặn ID không hợp lệ, chặn commit khi gate fail) **phải đặt ở hooks** trong `.claude/settings.json` + `.claude/hooks/*.ts` — không đặt ở prompt (PRD §7.2).

## Stack hiện thực framework

TypeScript + Node 22 + Vitest + Ajv 8 + gray-matter + yaml + tsx. Target default profile: `web-service-ts-fastify` (PRD §15.2).
