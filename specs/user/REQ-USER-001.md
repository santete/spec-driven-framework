---
id: REQ-USER-001
type: requirement
title: "Xem hồ sơ cá nhân"
version: 1.0.0
status: approved
priority: must
relations:
  refines: [FEAT-USER]
  depends_on: [ENT-USER]
acceptance_criteria:
  - id: AC-USER-001-01
    given: "user đã đăng nhập"
    when: "gọi GET /users/me"
    then: "trả về thông tin user (id, email, status), status 200"
---
# REQ-USER-001 — View profile
