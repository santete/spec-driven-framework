---
description: Resume a blocked /spec-change run from its current station (PRD §7.3)
argument-hint: "[--json]"
---

# /keystone:resume

Tiếp tục run đang `blocked`. Bật lại `in_progress`, chạy lại trạm hiện tại, drive pipeline đến halt tiếp theo.

## Cách dùng

```bash
/keystone:resume
/keystone:resume --json
```

## Thực thi

```bash
npx tsx src/keystone/cli/resume.ts $ARGUMENTS
```

## Khi nào dùng

- Sau khi customer trả lời G_SDD ở S5.
- Sau khi blocker S0 đã được customer fix tại spec.
- Sau khi reviewer approve breaking change ở G9.

## Exit code

- 0 — run đạt `done`.
- 1 — vẫn halted (`blocked` lần nữa, `failed`, hoặc `aborted`).
- 2 — script error / run đã ở trạng thái terminal (`done`/`aborted`/`failed`) không thể resume.
- 3 — không có run nào để resume.
