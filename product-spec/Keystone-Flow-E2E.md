# Keystone — Sơ đồ flow end-to-end

> Tài liệu phụ trợ cho `PRD-Keystone.md` (v0.8.1). Mô tả luồng chạy đầy đủ của một spec-change run, từ lúc Customer sửa spec đến khi atomic commit + post-delivery monitor armed.
>
> Đối chiếu chi tiết: §7 (9 trạm S0–S8), §9 (functional requirements), §12 (gates G0–G9), §18.5 (slash command catalog).

---

## 1. Sơ đồ end-to-end

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CUSTOMER (Spec Author)                              │
│         sửa file YAML trong spec/  →  gõ  /spec-change                       │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  S0 · INTAKE QC          skill: intake-qc     agent: intake-inspector        │
│  ─────────────────────────────────────────────────────────────────────────   │
│  IC: spec diff + PROJECT artifact                                            │
│  EQC: ≥1 spec file thay đổi, PROJECT tồn tại                                 │
│  Process: chạy IQ1–IQ8  +  SR1–SR9                                           │
│  XQC: G0 (0 lỗi IQ, spec coherent với PROJECT profile)                       │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                          ┌────────┴────────┐
                       G0 fail           G0 pass
                          │                 │
                          ▼                 ▼
              ┌──────────────────┐   ┌──────────────────────────────────┐
              │ customer-liaison │   │  S1 · SPEC  (agent: spec-indexer)│
              │ sinh intake-     │   │  load spec → build AST           │
              │ report →         │   │  XQC: spec object hợp lệ         │
              │ PR comment       │   └──────────────┬───────────────────┘
              │ → PAUSE          │                  ▼
              └────────┬─────────┘   ┌──────────────────────────────────┐
                       │             │  S2 · TRACE                      │
                       │             │  cập nhật trace index từ         │
                       │             │  ownership.yaml + spec           │
                       │             │  XQC: index nhất quán            │
                       │             └──────────────┬───────────────────┘
                       │                            ▼
                       │             ┌──────────────────────────────────┐
                       │             │  S3 · GOVERNANCE                 │
                       │             │  spec-lint full SR1–SR9          │
                       │             │  check ADR + semver bump         │
                       │             │  XQC: G1 (lint) + G2 (ADR)       │
                       │             └──────────────┬───────────────────┘
                       │                            ▼
                       │             ┌──────────────────────────────────┐
                       │             │  S4 · IMPACT (agent:             │
                       │             │  impact-analyzer)                │
                       │             │  semantic diff theo ID           │
                       │             │  → impact_report                 │
                       │             │  XQC: report tạo, ≥1 ID ảnh      │
                       │             │       hưởng                      │
                       │             └──────────────┬───────────────────┘
                       │                            ▼
                       │             ┌──────────────────────────────────┐
                       │             │  S5 · SDD DESIGN                 │
                       │             │  agent: sdd-designer             │
                       │             │  sinh SDD từ (spec ∩ PROJECT)    │
                       │             │  agent: customer-liaison         │
                       │             │  trình bày SDD cho Customer      │
                       │             └──────────────┬───────────────────┘
                       │                            ▼
                       │             ┌────────── G_SDD ──────────┐
                       │             │  Customer quyết định       │
                       │             │  /keystone:S5:approve      │
                       │             │  /keystone:S5:reject       │
                       │             │     --category=<...>       │
                       │             │  /keystone:S5:request-     │
                       │             │     change                 │
                       │             └────┬──────┬──────────┬─────┘
                       │                  │      │          │
                       │              approve  reject  request-change
                       │                  │      │          │
                       │   ┌──────────────┘      │          │ (retry, không
                       │   │                     ▼          │  tính K_self)
                       │   │           ┌──── route theo ────┤
                       │   │           │  reject_reason.    │
                       │   │           │  category          │
                       │   │           │                    │
                       │   │     spec-misalignment → S0     │
                       │   │     impact-misanalysis → S4    │
                       │   │     design-quality → retry S5  │
                       │   │     customer-changed-mind →    │
                       │   │       retry S5                 │
                       │   │                                │
                       │   │     ↳ K_customer_reject_s5 vượt│
                       │   │       → pause                  │
                       │   │         awaiting-reviewer-     │
                       │   │         triage  (4-path:       │
                       │   │         route-to-spec /        │
                       │   │         reviewer-takeover /    │
                       │   │         declare-infeasible /   │
                       │   │         reset-budget)          │
                       │   ▼                                │
                       │   ┌────────────────────────────────┴───────────┐
                       │   │  S6 · PRODUCTION  (per-ID transaction)     │
                       │   │  ─ song song ─                             │
                       │   │  ┌────────────┐ ┌──────────┐ ┌──────────┐ │
                       │   │  │ implementer│ │test-     │ │adversari-│ │
                       │   │  │            │ │author    │ │al-tester │ │
                       │   │  └─────┬──────┘ └────┬─────┘ └────┬─────┘ │
                       │   │        └────────────┴────────────┘        │
                       │   │  hook PreToolUse chặn write ngoài         │
                       │   │  ownership của ID đang xử lý              │
                       │   │  XQC: G4 (codegen complete, 0 stub,       │
                       │   │       file trong ownership)               │
                       │   └──────────────┬─────────────────────────────┘
                       │                  ▼
                       │   ┌──────────────────────────────────┐
                       │   │  S7 · VERIFICATION               │
                       │   │  Chạy G5 + G6 + G7 + G8          │
                       │   │  ┌─────────────────────────────┐│
                       │   │  │ G5 acceptance + adversarial ││
                       │   │  │    + regression + snapshot  ││
                       │   │  │ G6 trace consistent (0      ││
                       │   │  │    orphan, ownership ↔      ││
                       │   │  │    index ↔ SDD)             ││
                       │   │  │ G7 no drift (code khớp idx) ││
                       │   │  │ G8 cost ≤ NFR-COST-01/02    ││
                       │   │  └─────────────────────────────┘│
                       │   └──┬───────────────────────────────┘
                       │      │
                       │   ┌──┴──────────┐
                       │ fail            pass
                       │   │             │
                       │   ▼             ▼
                       │ ┌─────────┐ ┌──────────────────────────────────┐
                       │ │ giữ     │ │  S8 · DELIVERY                   │
                       │ │ workdir │ │  pre-commit hook chạy lại        │
                       │ │ + report│ │  G0–G9 lần cuối                  │
                       │ │ gate    │ │                                  │
                       │ │ nào fail│ │  G9 breaking check:              │
                       │ │ → escal-│ │   - additive/cosmetic → auto     │
                       │ │ ate     │ │   - breaking → reviewer approve  │
                       │ │ theo    │ │     trên PR (mặc định ON)        │
                       │ │ category│ │                                  │
                       │ └─────────┘ │  ▼ pass tất cả                   │
                       │             │  ATOMIC COMMIT (1 commit gồm:    │
                       │             │    spec + ADR + SDD + code +     │
                       │             │    test + trace + ownership)     │
                       │             └──────────────┬───────────────────┘
                       │                            ▼
                       │             ┌──────────────────────────────────┐
                       │             │  POST-DELIVERY MONITOR           │
                       │             │  · drift-check định kỳ           │
                       │             │  · cost monitor                  │
                       │             │  · alert nếu code lệch index     │
                       │             └──────────────┬───────────────────┘
                       │                            │
                       └────────────────────────────┴─→ kết thúc run
```

---

## 2. Bảng tóm tắt các vòng rework

| Loop | Khi nào kích hoạt | Đích quay về |
|---|---|---|
| **G0 fail** | Spec vào không đạt IQ1–IQ8 hoặc SR1–SR9 | Customer (PAUSE, intake-report) |
| **EQC fail tại bất kỳ trạm** | Nguyên liệu trạm trước rò lỗi qua Exit QC của nó | Trạm liền trước (đệ quy tới khi đạt) |
| **XQC fail self ≤ K_self** | Output trạm này lỗi nhẹ, còn budget self-retry | Self-retry trạm hiện tại |
| **XQC fail self > K_self** | Vượt budget retry | Trạm phù hợp với `fail_category` |
| **G_SDD reject** | Customer reject SDD ở S5 | S0/S4/S5 theo `reject_reason.category` |
| **K_customer_reject_s5 vượt** | Reject lặp lại quá ngưỡng | Reviewer triage (4-path workflow §9.4.5 FR-SDD-09) |
| **G5–G8 fail (S7)** | Test/trace/drift/cost fail | Giữ workdir + escalate theo gate (không tự retry) |
| **G9 fail (S8)** | Breaking thiếu reviewer approval | Đợi reviewer approve PR |
| **Pre-escalate** | Cùng `reject_reason.category` ≥ 2 lần liên tiếp | Escalate ngay ở reject 2 (không đợi vượt K) |

---

## 3. Cổng kiểm soát theo trạm (đối chiếu §12)

| Trạm | Gate evaluate | Vị trí |
|---|---|---|
| **S0 Intake QC** | G0 | Exit |
| **S1 Spec** | — | (chỉ EQC/XQC nội bộ) |
| **S2 Trace** | — | (chỉ EQC/XQC nội bộ) |
| **S3 Governance** | G1, G2 | Exit |
| **S4 Impact** | — | (chỉ EQC/XQC nội bộ) |
| **S5 SDD Design** | G_SDD | Exit (Customer approve) |
| **S6 Production** | G3 (entry), G4 (exit) | |
| **S7 Verification** | G5, G6, G7, G8 | Process |
| **S8 Delivery** | G9; pre-commit rerun G0–G9 | Entry + Exit |

---

## 4. Ba điểm chạm con người (HITL)

```
Customer ──────► sửa spec/, gõ /spec-change,
                 đọc S0 feedback report,
                 duyệt G_SDD: approve / reject --category / request-change

Reviewer ──────► duyệt PR breaking (G9),
                 triage khi K_customer_reject_s5 vượt:
                   /keystone:S5:route-to-spec
                   /keystone:S5:reviewer-takeover
                   /keystone:S5:declare-infeasible
                   /keystone:rework:reset

Maintainer ────► budget reset (NFR-COST),
                 INCIDENT review (G8 cost over, R-* incidents),
                 PROJECT profile certification (§15.4 PG1–PG5)
```

Còn lại **toàn bộ** pipeline chạy tự động qua skills + agents + hooks của Claude Code (§7.2 ánh xạ primitive).

---

## 5. Bộ slash command thường dùng (trích §18.5)

| Lệnh | Mục đích |
|---|---|
| `/spec-change` | Entry point duy nhất cho mọi spec-change run |
| `/keystone:S0:report` | Xem intake feedback report khi G0 fail |
| `/keystone:S5:approve` | Customer approve SDD (G_SDD pass) |
| `/keystone:S5:reject --category=<...>` | Customer reject SDD (bắt buộc category) |
| `/keystone:S5:request-change` | Yêu cầu sửa SDD (không tính K_self) |
| `/keystone:S5:route-to-spec` | Reviewer: vấn đề ở spec, đẩy về S0 |
| `/keystone:S5:reviewer-takeover` | Reviewer: tự viết SDD thay sdd-designer |
| `/keystone:S5:declare-infeasible` | Reviewer: tuyên bố không thể thực hiện |
| `/keystone:rework:status` | Xem rework log hiện tại của run |
| `/keystone:rework:reset` | Reset budget K sau reviewer triage |

---

*Tham chiếu chuẩn: xem `PRD-Keystone.md` v0.8.1.*
