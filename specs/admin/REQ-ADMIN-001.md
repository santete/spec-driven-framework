---
id: REQ-ADMIN-001
type: requirement
title: "Admin function 1"
version: 1.0.0
status: approved
priority: should
relations:
  refines: [FEAT-ADMIN]
  depends_on: [ENT-USER]
acceptance_criteria:
  - id: AC-ADMIN-001-01
    given: "admin đã đăng nhập"
    when: "thực hiện admin action 1"
    then: "trả về kết quả, status 200"
---
# REQ-ADMIN-001
