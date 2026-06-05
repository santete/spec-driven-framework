---
id: REQ-USER-002
type: requirement
title: "Cập nhật hồ sơ"
version: 1.0.0
status: approved
priority: should
relations:
  refines: [FEAT-USER]
  depends_on: [ENT-USER]
acceptance_criteria:
  - id: AC-USER-002-01
    given: "user đã đăng nhập"
    when: "gọi PATCH /users/me với display_name mới"
    then: "cập nhật thành công, trả về user updated, status 200"
---
# REQ-USER-002 — Update profile
