---
id: REQ-ORDER-003
type: requirement
title: "Order flow step 3"
version: 1.0.0
status: approved
priority: should
relations:
  refines: [FEAT-ORDER]
  depends_on: [ENT-USER]
acceptance_criteria:
  - id: AC-ORDER-003-01
    given: "user đã đăng nhập"
    when: "thực hiện order action 3"
    then: "trả về kết quả, status 200"
---
# REQ-ORDER-003
