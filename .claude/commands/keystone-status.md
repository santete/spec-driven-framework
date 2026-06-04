---
description: Dashboard — show current /spec-change run state (PRD §18.5)
argument-hint: "[--json]"
---

# /keystone:status

Read-only dashboard. In ra trạng thái run hiện tại từ `.keystone/run-state.json`.

## Cách dùng

```bash
/keystone:status            # bảng text gọn
/keystone:status --json     # JSON thuần
```

## Thực thi

```bash
npx tsx src/keystone/cli/status.ts $ARGUMENTS
```

## Output

- `spec_change`, `run_id`, `status`, `current_station`, `started_at`, `updated_at`.
- Lưới 9 trạm: ✓ pass · skipped ✗ reject ⏸ blocked → đang chạy.
- `last_report`: artifact gần nhất (ví dụ `.keystone/intake-report.json`).
- `rework_global`: bộ đếm tổng so với `k_global` từ PROJECT (mặc định 5).

## Exit code

- 0 — đọc thành công.
- 3 — không có run nào (`.keystone/run-state.json` không tồn tại).
- 2 — script error.
