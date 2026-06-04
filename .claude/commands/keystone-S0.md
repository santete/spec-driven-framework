---
description: Run S0 Intake QC on the current working spec set (PRD §9.0)
argument-hint: "[--dry-run] [--json]"
---

# /keystone:S0

Trạm S0 — Intake QC. Kiểm tra nguyên liệu spec đạt chuẩn (PRD §9.0).

Phase 0 M2 phạm vi: chạy spec-lint SR1, SR3, SR4, SR6 + intake checks IQ1, IQ2, IQ3, IQ4, IQ6, IQ7, IQ8 trên toàn bộ `specs/`. (IQ5 cần baseline diff → M4.)

## Cách dùng

```bash
/keystone:S0              # full run, ghi .keystone/intake-report.json
/keystone:S0 --dry-run    # phân tích, không ghi file, không khởi pipeline
/keystone:S0 --json       # output JSON thuần (machine-readable)
```

## Thực thi

Chạy lệnh sau từ repo root:

```bash
npx tsx src/keystone/cli/s0.ts $ARGUMENTS
```

## Output

- Verdict: `pass` (G0 đạt) hoặc `reject` (có blocker).
- Mỗi item: `spec_path`, `id`, `criterion` (SR/IQ code), `severity`, `field`, `message`, `suggestion`.
- Exit code 0 = pass hoặc `--dry-run`, 1 = reject, 2 = script error.

## Gì tiếp theo

- Pass → pipeline có thể tiến vào S1 (Spec). M3 sẽ kết nối qua state machine.
- Reject → Customer sửa spec theo `suggestion` rồi chạy lại. Khi state machine có ở M3, dùng `/keystone:S0:resume <run-id>`.
