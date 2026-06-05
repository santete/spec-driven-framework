---
id: REQ-REG-001
type: requirement
title: "Đăng ký bằng email"
version: 1.0.0
status: approved
priority: must
relations:
  refines: [FEAT-REG]
  depends_on: [ENT-USER]
acceptance_criteria:
  - id: AC-REG-001-01
    given: "email chưa tồn tại trong hệ thống"
    when: "gọi POST /auth/register với email + password"
    then: "tạo user mới, trả về user info, status 201"
  - id: AC-REG-001-02
    given: "email đã tồn tại"
    when: "gọi POST /auth/register với email trùng"
    then: "trả về lỗi, status 409 Conflict"
---
# REQ-REG-001 — Email registration
