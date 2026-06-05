---
id: REQ-NOTIF-003
type: requirement
title: "Notification rule 3"
version: 1.0.0
status: approved
priority: could
relations:
  refines: [FEAT-NOTIF]
  depends_on: [ENT-USER]
acceptance_criteria:
  - id: AC-NOTIF-003-01
    given: "event xảy ra"
    when: "notification rule 3 match"
    then: "gửi notification, status 200"
---
# REQ-NOTIF-003
