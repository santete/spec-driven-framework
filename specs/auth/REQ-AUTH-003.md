---
id: REQ-AUTH-003
type: requirement
title: "Refresh token"
version: 1.0.0
status: approved
priority: should
relations:
  refines: [FEAT-AUTH]
  depends_on: [ENT-SESSION]
acceptance_criteria:
  - id: AC-AUTH-003-01
    given: "user có refresh token hợp lệ"
    when: "gọi POST /auth/refresh"
    then: "trả về access token mới, status 200"
---
# REQ-AUTH-003 — Refresh token
