---
id: REQ-NOTIF-001
type: requirement
title: "Notification rule 1"
version: 1.0.0
status: approved
priority: could
relations:
  refines: [FEAT-NOTIF]
  depends_on: [ENT-USER]
acceptance_criteria:
  - id: AC-NOTIF-001-01
    given: "event xảy ra"
    when: "notification rule 1 match"
    then: "gửi notification, status 200"
---
# REQ-NOTIF-001
