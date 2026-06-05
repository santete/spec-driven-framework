---
description: "Convert free-form Markdown prose into structured Keystone spec artifacts (Phase 3)"
argument-hint: "<path-to-prose.md>"
---

# /md2spec

Convert prose Markdown (PM/BA viết) → structured spec artifacts (YAML frontmatter).

## Cách dùng

```bash
/md2spec docs/requirements/payment-refund.md
/md2spec specs/_drafts/new-feature-idea.md
```

## Flow

### Step 1 — Launch md-to-spec subagent

```
Agent(subagent_type="implementer", prompt="
  You are the md-to-spec converter for Keystone.
  Read .claude/agents/md-to-spec.md for your full instructions.
  Read the prose file: <path-to-prose.md>
  Read specs/spec-schema.json for valid frontmatter fields.
  Read specs/ for existing specs (avoid ID collisions, resolve relations).
  Read specs/project.md for domain context.
  Convert the prose into structured spec file(s) under specs/<domain>/.
  Set status: draft (user must approve).
")
```

### Step 2 — Validate converted specs

```bash
npx tsx src/keystone/cli/md2spec.ts --source <path-to-prose.md>
```

This runs S0 intake QC on all specs (including new drafts) and reports:
- Generated spec IDs, types, titles
- TODOs needing user clarification
- Intake QC pass/fail

### Step 3 — User confirmation

If intake passes:
1. User reviews generated specs
2. Changes `status: draft` → `status: approved`
3. Runs `/spec-change` to process through full pipeline

If intake fails:
1. Show blockers to user
2. Either fix manually or re-run subagent with clarifications

## Example

Input (`docs/ideas/otp-login.md`):
```markdown
# OTP Login

Users should be able to login using a one-time password sent to their email.
When the user enters their email, we send a 6-digit code that expires in 5 minutes.
If they enter the correct code, they get a session token.
If the code is wrong 3 times, we block that email for 15 minutes.
```

Output (`specs/auth/REQ-AUTH-OTP.md`):
```yaml
---
id: REQ-AUTH-OTP
type: requirement
title: "Đăng nhập bằng OTP qua email"
version: 1.0.0
status: draft
priority: should
relations:
  refines: [FEAT-AUTH]
  depends_on: [ENT-USER]
acceptance_criteria:
  - id: AC-AUTH-OTP-01
    given: "user nhập email hợp lệ"
    when: "gọi POST /auth/otp/request"
    then: "gửi mã OTP 6 chữ số qua email, hết hạn sau 5 phút"
  - id: AC-AUTH-OTP-02
    given: "user có mã OTP hợp lệ chưa hết hạn"
    when: "gọi POST /auth/otp/verify với mã đúng"
    then: "trả về session token, status 200"
  - id: AC-AUTH-OTP-03
    given: "user nhập sai OTP 3 lần"
    when: "gọi POST /auth/otp/verify lần thứ 4"
    then: "block email 15 phút, status 429"
---
```
