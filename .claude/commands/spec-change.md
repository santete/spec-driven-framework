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

## Thực thi — Phase 1 orchestration flow

Phase 1 sử dụng **blocked→subagent→resume** pattern cho S5/S6.
CLI chạy deterministic stations. Claude launches subagents cho LLM-driven stations.

### Step 1 — Start run (S0→S4)

```bash
npx tsx src/keystone/cli/spec-change.ts $ARGUMENTS
```

Nếu exit code = 0 → tất cả stations passed (bootstrap/test mode).
Nếu exit code = 1 → check run state:

```bash
npx tsx src/keystone/cli/status.ts --json
```

### Step 2 — Handle blocked states

Nếu `status = "blocked"` tại station:

**Blocked at S5 (SDD Design)**:
1. Read `.keystone/impact-report.json` để biết affected spec IDs
2. Launch **sdd-designer** subagent:
   ```
   Agent(subagent_type="implementer", prompt="
     You are the sdd-designer for Keystone.
     Read .claude/agents/sdd-designer.md for your full instructions.
     Read .keystone/impact-report.json for affected IDs.
     Read specs/ for the spec artifacts.
     Read specs/project.md for the stack profile.
     Generate SDD files to specs/sdd/.
     Use run_id from the impact report for customer_approval.approval_run_id.
   ")
   ```
3. After subagent completes, resume:
   ```bash
   npx tsx src/keystone/cli/resume.ts --json
   ```
4. S5 handler validates SDDs → pass/reject

**Blocked at S6 (Production)**:
1. Launch **keystone-implementer** subagent:
   ```
   Agent(subagent_type="implementer", prompt="
     You are the keystone-implementer.
     Read .claude/agents/keystone-implementer.md for instructions.
     Read specs/sdd/ for approved SDDs.
     Read specs/ for spec artifacts.
     Read .keystone/impact-report.json for affected IDs and run_id.
     Generate implementation files to src/generated/.
   ")
   ```
2. Launch **keystone-test-author** subagent:
   ```
   Agent(subagent_type="tester", prompt="
     You are the keystone-test-author.
     Read .claude/agents/keystone-test-author.md for instructions.
     Read specs/ for acceptance criteria.
     Read src/generated/ for the implementation to test.
     Read .keystone/impact-report.json for run_id.
     Generate test files to tests/generated/.
   ")
   ```
3. After both complete, resume:
   ```bash
   npx tsx src/keystone/cli/resume.ts --json
   ```
4. S6 handler validates code + provenance → pass/reject

### Step 3 — Continue (S7→S8)

After S5/S6 pass, pipeline continues:
- S7 runs verification gates (G5-G8)
- S8 runs delivery (G0-G9 + atomic commit)

If S7/S8 fail, check run state and fix accordingly.

### Step 4 — Final status

```bash
npx tsx src/keystone/cli/status.ts
```

## Bootstrap mode (tests / no-LLM)

Set `KEYSTONE_BOOTSTRAP=1` to use template-based generation (Phase 0 M4 behavior).
S5/S6 will template-generate files instead of blocking.

Tests (vitest) automatically use bootstrap mode via `VITEST=true` env var.

## Exit code

- 0 — run đạt `done` (S0–S8 đều xanh).
- 1 — run halted (`blocked` / `failed` / `aborted`).
- 2 — script error / từ chối start.

## Tracking

- `/keystone:status` — tiến độ
- `/keystone:resume` — tiếp sau unblock
- `/keystone:abort` — hủy run
