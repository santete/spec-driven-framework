---
description: Start a new spec change run — walks pipeline S0→S8 (PRD §7.3)
argument-hint: "--title \"<text>\" [--rationale \"<text>\"] [--spec <path>] [--dry-run] [--json]"
---

# /spec-change

Skill orchestrator — entrypoint cho mọi thay đổi spec (PRD §7.3).

Mọi spec edit (thêm/sửa/xóa) phải đi qua đây. Không có đường merge khác (Hiến pháp §1).

## Cách dùng

```bash
/spec-change --title "Thêm flow OTP" --spec specs/auth/REQ-AUTH-002.md
/spec-change --title "Tinh chỉnh AC" --dry-run        # mô phỏng, không ghi state
/spec-change --title "x" --rationale "Y" --json       # output machine-readable
```

## Thực thi

```bash
npx tsx src/keystone/cli/spec-change.ts $ARGUMENTS
```

## Ràng buộc

- `--title` bắt buộc.
- Nếu `.keystone/run-state.json` đang `in_progress` hoặc `blocked` → CLI từ chối. Phải `/keystone:resume` hoặc `/keystone:abort` trước.
- Khi không `--dry-run`: ghi `.keystone/run-state.json` + `.keystone/intake-report.json`.

## Exit code

- 0 — run đạt `done` (S0–S8 đều xanh).
- 1 — run halted (`blocked` / `failed` / `aborted`).
- 2 — script error / từ chối start.

## Phase 0 M3 phạm vi

- S0 dùng intake-qc thực (M2).
- S1–S8 vẫn là stub auto-skip — sẽ thay bằng impl thật ở M4 (semantic-diff, sdd-designer, codegen, adversarial-test, …).

Theo dõi tiến độ: `/keystone:status`. Tiếp tục sau khi unblock: `/keystone:resume`. Hủy: `/keystone:abort`.
