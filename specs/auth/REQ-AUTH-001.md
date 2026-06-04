---
id: REQ-AUTH-001
type: requirement
title: "Đăng nhập bằng email + mật khẩu"
version: 1.2.0
status: approved
owner: team-identity
created: "2026-05-01"
updated: "2026-06-04"
tags: [auth, security]
priority: must
relations:
  refines: [FEAT-AUTH]
  depends_on: [ENT-USER]
acceptance_criteria:
  - id: AC-AUTH-001-01
    given: "user đã đăng ký với email hợp lệ"
    when:  "submit đúng email + mật khẩu"
    then:  "trả về session token hợp lệ, status 200"
  - id: AC-AUTH-001-02
    given: "user nhập sai mật khẩu 5 lần"
    when:  "submit lần thứ 6"
    then:  "khóa tài khoản tạm thời, status 429"
---

# REQ-AUTH-001 — Đăng nhập email/password

## Rationale

Đăng nhập là entry point cho mọi chức năng cần xác thực downstream. Phase 1 chỉ hỗ trợ email + mật khẩu; OAuth/SSO/MFA hoãn phase sau.

## Bối cảnh

- Spec cấp trên: `FEAT-AUTH`
- Entity phụ thuộc: `ENT-USER` (cần `email`, `password_hash`, `status`, `failed_login_count`, `locked_until`)

## Hành vi

- Endpoint nhận `email` + `password`; trả `session_token` (JWT) khi đúng.
- Sau 5 lần sai mật khẩu liên tiếp, tài khoản bị khóa tạm thời (AC-AUTH-001-02). Status 429 + header `Retry-After`.
- Mật khẩu so khớp qua argon2id verify; timing-safe.

## Test sinh từ AC

AC-AUTH-001-01 và AC-AUTH-001-02 sẽ sinh thành test Vitest + supertest ở S6 (Production). Adversarial-tester (R8) đồng thời sinh test độc lập từ rationale + AC (không thấy code, không thấy SDD).
