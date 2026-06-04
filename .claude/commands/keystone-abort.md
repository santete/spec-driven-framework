---
description: Abort current /spec-change run (PRD §7.3)
argument-hint: "[--purge] [--json]"
---

# /keystone:abort

Hủy run hiện tại.

Mặc định: đặt `status=aborted`, giữ file `.keystone/run-state.json` cho forensics (PRD §10.5). `--purge`: xóa hẳn file.

## Cách dùng

```bash
/keystone:abort           # mark aborted, keep file
/keystone:abort --purge   # delete state file entirely
```

## Thực thi

```bash
npx tsx src/keystone/cli/abort.ts $ARGUMENTS
```

## Exit code

- 0 — abort thành công (kể cả khi đã terminal).
- 3 — không có run nào để abort.
- 2 — script error.
