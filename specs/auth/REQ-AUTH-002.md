---
id: REQ-AUTH-002
type: requirement
title: "Đăng xuất và thu hồi token"
version: 1.0.0
status: approved
priority: must
relations:
  refines: [FEAT-AUTH]
  depends_on: [ENT-USER]
acceptance_criteria:
  - id: AC-AUTH-002-01
    given: "user đã đăng nhập với session token hợp lệ"
    when: "gọi POST /auth/logout"
    then: "thu hồi token, trả về status 200"
  - id: AC-AUTH-002-02
    given: "user gọi API với token đã bị thu hồi"
    when: "gửi request bất kỳ"
    then: "trả về status 401 Unauthorized"
---

# REQ-AUTH-002 — Đăng xuất

Cho phép user đăng xuất bằng cách thu hồi session token hiện tại.
