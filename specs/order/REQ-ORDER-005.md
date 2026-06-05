---
id: REQ-ORDER-005
type: requirement
title: "Order flow step 5"
version: 1.0.0
status: approved
priority: should
relations:
  refines: [FEAT-ORDER]
  depends_on: [ENT-USER]
acceptance_criteria:
  - id: AC-ORDER-005-01
    given: "user đã đăng nhập"
    when: "thực hiện order action 5"
    then: "trả về kết quả, status 200"
---
# REQ-ORDER-005
